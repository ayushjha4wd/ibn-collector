"""Clean, analysis-ready tables for Bihar from the eGramSwaraj and AuditOnline originals.

    python scripts/egs_clean.py

Reads only the read-only originals recorded in data/provenance.jsonl (each file's sha256 is
re-checked) and writes data/clean/egs/:

  state_year_summary.csv        Bihar row of the State & Year Wise Summary, one row per FY x tier
  district_finance.csv          District wise Receipt and Payment (OB + Receipts, Payments; Rs crore)
  block_finance.csv             Block wise Receipt and Payment (Rs crore)
  gp_finance.csv                Village wise Receipt and Payment: every GP, Receipts and Payments (Rs)
  district_scheme_finance.csv   Scheme-wise district statement: voucher counts, Receipts, Payments (Rs)
  monthly_finance.csv           Month-wise receipts/payments of the ZP (district page) or BP (block page)
  monthly_vouchers.csv          Month-wise voucher counts (Receipts/Payments/Contra/Journal)
  district_accounting_status.csv, block_accounting_status.csv, gp_accounting_status.csv
  gp_year_book_closed.csv       getMobileData: GP year book closed (count of closed of totalcount)
  audit_gp.csv                  AuditOnline per GP: audit dates, schemes, report generated, observations
  state_indicators.csv          Bihar state rows of the browser-built reports (elected representatives
                                by gender, profile, GPDP upload, geo-tagging ...), long format
  bihar_egramswaraj_clean.xlsx  all of the above, one sheet each
  README.md                     rules and column notes

Rules: originals are never changed; every row names its source file and the report's own
"generated on" date; an empty cell stays empty (never 0); a value that is not a clean number is
left empty in the number column and kept verbatim in a *_as_served column; when the same report URL
was saved on several days the latest copy is used. No personal names or contact details are kept
(GP names are names of places).
"""
from __future__ import annotations

import collections
import csv
import hashlib
import json
import re
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROVENANCE, ROOT, read_jsonl  # noqa: E402
from egs_portal_summary import family, grids  # noqa: E402

OUT = DATA / "clean" / "egs"
TIER = {"Zilla Panchayat": "zp", "Block Panchayat & Equivalent": "bp", "Village Panchayat & Equivalent": "gp"}
# Up to 2020-21 the statements print "Receipts" / "Payments" in rupees; from 2021-22 "OB + Receipts (Cr)" /
# "Payments (Cr)" in crore. Both are kept, each in its own column; a column the page does not have stays empty.
FIN = [f"{t}_{m}" for t in ("zp", "bp", "gp") for m in ("ob_plus_receipts_cr", "payments_cr", "receipts", "payments")]
LABELS = {"District", "Block", "Village Panchayat & Equivalent", "Month", "S.No.", "State"}


# ---------------------------------------------------------------- helpers
def num(v):
    """'3,861,03,59,497.17' -> 38610359497.17 ; '' -> '' ; anything else -> ''"""
    s = (v or "").strip().replace(",", "")
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if re.fullmatch(r"-?\d*\.\d+", s):
        return float(s)
    return ""


def slug(s):
    s = s.replace("OB + Receipts", "ob_plus_receipts").replace("(Cr)", "cr").replace("(In Rs.)", "rs")
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s.lower())).strip("_")


def norm(name):
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


VOUCH = re.compile(r"RV-(\d+)\D+PV-(\d+)\D+CV-(\d+)\D+JV-(\d+)")


def vouchers(v):
    m = VOUCH.search(v or "")
    lead = re.match(r"\s*(\d+)\s*/", v or "")
    return (int(lead.group(1)) if lead else ""), *(tuple(int(x) for x in m.groups()) if m else ("", "", "", ""))


def originals(source):
    """Latest verified copy per URL: {url: (rec, path)}"""
    best = {}
    for r in read_jsonl(PROVENANCE):
        if r.get("source_id") != source or not r.get("stored_path"):
            continue
        p = ROOT / r["stored_path"].replace("\\", "/")
        if not p.exists():
            continue
        u = r.get("url") or ""
        if u in best and best[u][0].get("retrieved_at_ist", "") >= r.get("retrieved_at_ist", ""):
            continue
        best[u] = (r, p)
    out, bad = {}, 0
    for u, (r, p) in best.items():
        if hashlib.sha256(p.read_bytes()).hexdigest() != r.get("sha256"):
            bad += 1
            continue
        out[u] = (r, p)
    print(f"{source}: {len(out)} latest verified originals ({bad} hash mismatches skipped)")
    return out


def table(html):
    """Main data table of a report page -> (caption, generated_on, columns, rows). Rows are lists of
    strings aligned to columns; consecutive duplicate rows (rowspan padding) are dropped."""
    gs = grids(html)
    caption = " ".join(dict.fromkeys(c for g in gs for row in g for c, _ in row
                                     if "Financial Year:-" in c or c.startswith("Scheme:-")))
    gen = re.search(r"Report generated through eGramSwaraj\s*\([^)]*\)\s*on\s*([^<\n]+)", html)
    best = None
    for g in gs:
        rows = [[c for c, _ in r] for r in g]
        start = next((i for i, r in enumerate(rows) if r and r[0] in LABELS), None)
        if start is None:
            continue
        label = rows[start][0]
        heads, i = [], start
        while i < len(rows) and rows[i][0] == label:
            heads.append(rows[i])
            i += 1
        width = max(len(h) for h in heads)
        cols = [" > ".join(dict.fromkeys(h[k] for h in heads if k < len(h) and h[k])) for k in range(width)]
        data, prev = [], None
        for r in rows[i:]:
            if len(set(r)) <= 1 and len(r) < width or len({c for c in r if c}) <= 1:
                if data:
                    break
                continue
            if r == prev:
                continue
            prev = r
            data.append(r + [""] * (width - len(r)))
        if data and (best is None or len(data) > len(best[3])):
            best = (caption, gen.group(1).strip() if gen else "", cols, data)
    return best


def write(name, header, rows, sheets):
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    sheets.append((name[:-4][:31], header, rows))
    print(f"wrote {name} ({len(rows)} rows)")


# ---------------------------------------------------------------- main
def main():
    sheets = []
    egs = originals("EGS-PORTAL")

    # code lists from getMobileData (names and codes of districts, blocks, GPs)
    dist_names, block_names, gp_codes = {}, {}, collections.defaultdict(dict)
    api_gp_rows = []
    for u, (r, p) in egs.items():
        if "getMobileData" not in u or p.suffix != ".json":
            continue
        try:
            d = json.loads(p.read_bytes())
        except ValueError:
            continue
        parts = urllib.parse.urlsplit(u).path.split("/")
        ep = parts[2] if len(parts) > 2 else ""
        for x in d if isinstance(d, list) else []:
            if not isinstance(x, dict):
                continue
            if ep == "getYearBookClosedDistrictWise":
                dist_names[x.get("code")] = x.get("name")
            elif ep == "getYearBookClosedBlockWise":
                block_names[x.get("code")] = x.get("name")
            elif ep == "getYearBookClosedGPWise":
                fy, blk = parts[3], int(parts[5])
                gp_codes[(fy, blk)][norm(x.get("name"))] = x.get("code")
                api_gp_rows.append([fy, blk, block_names.get(blk, ""), x.get("code"), x.get("name"),
                                    x.get("totalcount", ""), x.get("count", ""), r["stored_path"].replace("\\", "/")])
    district_codes = set(dist_names)

    T = collections.defaultdict(list)
    for u, (r, p) in sorted(egs.items()):
        if "FileRedirect.jsp" not in u or p.suffix != ".html":
            continue
        fam, fy, rest, name = family(u)
        code = name.replace(".html", "")
        segs = [s for s in rest.split("/") if s] if rest else []  # the portal writes "3287//10" in scheme links
        html = p.read_bytes().decode("utf-8", "ignore")
        src = r["stored_path"].replace("\\", "/")
        meta = [r.get("retrieved_at_ist", ""), src]

        if fam == "priasoftOverview" and name.startswith("statewiseClosureReport"):
            t = table(html)
            if not t:
                continue
            cap, gen, cols, rows = t
            fy = re.search(r"(\d{4}-\d{4})", name).group(1)
            for row in rows:
                if row[0].strip().upper() != "BIHAR" and (len(row) < 2 or row[1].strip().upper() != "BIHAR"):
                    continue
                by = collections.defaultdict(dict)
                for c, v in zip(cols, row):
                    tier = next((TIER[k] for k in TIER if c.startswith(k)), None)
                    if tier:
                        by[tier][c.split(" > ", 1)[-1]] = v
                for tier, vals in by.items():
                    g = lambda key: next((v for k, v in vals.items() if key.lower() in k.lower()), "")  # noqa: E731
                    T["state"].append([fy, tier, num(g("Total No of")), num(g("with Vouchers")),
                                       num(g("Receipt Vouchers")), num(g("Payment Vouchers")),
                                       num(g("Receipt Amount")), num(g("Payment Amount")),
                                       num(g("Month Book Closed")), num(g("with Year Book Closed")),
                                       g("Receipt Amount"), g("Payment Amount"), gen] + meta)
            continue
        if segs[:1] != ["10"] and not (fam == "SchemeWiseExpenditureReport" and len(segs) in (1, 2)
                                       and segs[1:2] in ([], ["10"])):
            continue
        t = table(html)
        if not t:
            continue
        cap, gen, cols, rows = t

        if fam == "ExpenditureReport":
            level = "district" if len(segs) == 1 else ("block" if code == segs[1] else "gp")
            for row in rows:
                if level == "gp":
                    blk = int(code)
                    gcode = gp_codes.get((fy, blk), {}).get(norm(row[0]), "")
                    T["gp_fin"].append([fy, int(segs[1]), dist_names.get(int(segs[1]), ""), blk,
                                        block_names.get(blk, ""), gcode, row[0], num(row[1]), num(row[2]),
                                        row[1], row[2], gen] + meta)
                else:
                    vals = {slug(f"{TIER.get(c.split(' > ')[0], c.split(' > ')[0])}_{c.split(' > ')[-1]}"): v
                            for c, v in zip(cols[1:], row[1:])}
                    key = "dist_fin" if level == "district" else "block_fin"
                    dcode = "" if level == "district" else int(segs[1])
                    T[key].append([fy, dcode, row[0]] + [num(vals.get(k, "")) for k in FIN] + [gen] + meta)
        elif fam == "SchemeWiseExpenditureReport":
            sch = segs[0]
            sname = re.search(r"Scheme:-\s*(.+?)(?:\s+Financial Year|$)", cap)
            if len(segs) == 1:  # all-states page: keep only Bihar's row, labelled as the state total
                rows = [[ "BIHAR (state row)"] + row[1:] for row in rows if row[0].strip().upper() == "BIHAR"]
            for row in rows:
                for tier_name, tier in TIER.items():
                    idx = {c.split(" > ")[-1]: k for k, c in enumerate(cols) if c.startswith(tier_name)}
                    if not idx:
                        continue
                    g = lambda h: row[idx[h]] if h in idx and idx[h] < len(row) else ""  # noqa: E731
                    T["scheme"].append([fy, sch, sname.group(1).strip() if sname else "", row[0], tier,
                                        num(g("RV")), num(g("PV")), num(g("CV")), num(g("JV")),
                                        num(g("Receipts (In Rs.)")), num(g("Payments (In Rs.)")),
                                        g("Receipts (In Rs.)"), g("Payments (In Rs.)"), gen] + meta)
        elif fam == "ExpFY":
            entity = "zp" if int(code) in district_codes else "bp"
            ob = next((c for g in grids(html) for row in g if row and row[0][0] == "Opening Balance"
                       for c, _ in row[1:] if c != "Opening Balance"), "")
            for row in rows:
                if not re.match(r"[A-Z][a-z]+, \d{4}$", row[0]):
                    continue
                vals = dict(zip(cols, row))
                T["month_fin"].append([fy, entity, int(code), (dist_names if entity == "zp" else block_names).get(int(code), ""),
                                       row[0], num(ob), num(vals.get("Receipts", "")),
                                       num(vals.get("Receipt Cancellation", "")), num(vals.get("OB Cancellation", "")),
                                       num(vals.get("Payments", "")), num(vals.get("Payment Cancellation/Rejected", "")),
                                       ob, gen] + meta)
        elif fam == "FinancialYear":
            entity = "district" if int(code) in district_codes else "block"
            for row in rows:
                if not re.match(r"[A-Z][a-z]+, \d{4}$", row[0]):
                    continue
                vals = dict(zip(cols, row))
                T["month_vch"].append([fy, entity, int(code),
                                       (dist_names if entity == "district" else block_names).get(int(code), ""), row[0]]
                                      + [num(vals.get(k, "")) for k in ("Receipts", "Payments", "Contra", "Journal")]
                                      + [gen] + meta)
        elif fam == "SummaryReport":
            level = "district" if len(segs) == 1 else ("block" if code == segs[1] else "gp")
            for row in rows:
                vals = dict(zip(cols, row))
                if level == "gp":
                    blk = int(code)
                    v = vouchers(vals.get("Entered Vouchers", ""))
                    T["gp_acc"].append([fy, int(segs[1]), dist_names.get(int(segs[1]), ""), blk, block_names.get(blk, ""),
                                        gp_codes.get((fy, blk), {}).get(norm(row[0]), ""), row[0],
                                        vals.get("Entered Masters", ""), vals.get("Entered Opening Balance", ""),
                                        vals.get("Day Book Closed", ""), vals.get("Month Book Closed", ""),
                                        vals.get("Year Book Closed", ""), *v[1:], gen] + meta)
                    continue
                own = "zp" if level == "district" else "bp"
                own_name = "Zilla Panchayat" if own == "zp" else "Block Panchayat & Equivalent"
                o = lambda h: vals.get(f"{own_name} > {h}", "")  # noqa: E731
                gpv = lambda h: vals.get(f"Village Panchayat & Equivalent > Total No of Village Panchayats{h}", "")  # noqa: E731
                ov = vouchers(o("Entered Vouchers"))
                gv = vouchers(gpv(" with Vouchers"))
                rowout = [fy, "" if level == "district" else int(segs[1]), row[0],
                          o("Entered Masters"), o("Entered Opening Balance"), *ov[1:], o("Day Book Closed"),
                          o("Month Book Closed"), o("Year Book Closed")]
                if level == "district":
                    b = lambda h: vals.get(f"Block Panchayat & Equivalent > Total No of Block Panchayats{h}", "")  # noqa: E731
                    bv = vouchers(b(" with Vouchers"))
                    rowout = [fy, row[0], o("Entered Masters"), o("Entered Opening Balance"), *ov[1:],
                              o("Day Book Closed"), o("Month Book Closed"), o("Year Book Closed"),
                              num(b("")), num(b(" with Master Entry")), num(b(" with Opening Balance Entry")),
                              bv[0], *bv[1:], num(b(" with Day Book Closed")), num(b(" with Month Book Closed")),
                              num(b(" with Year Book Closed"))]
                rowout += [num(gpv("")), num(gpv(" with Master Entry")), num(gpv(" with Opening Balance Entry")),
                           gv[0], *gv[1:], num(gpv(" with Day Book Closed")), num(gpv(" with Month Book Closed")),
                           num(gpv(" with Year Book Closed")), gen] + meta
                T["dist_acc" if level == "district" else "block_acc"].append(rowout)

    M = ["report_generated_on", "retrieved_at_ist", "source_file"]
    write("state_year_summary.csv", ["financial_year", "tier", "panchayats", "panchayats_with_vouchers",
          "receipt_vouchers", "payment_vouchers", "receipt_amount_rs", "payment_amount_rs",
          "with_month_book_closed", "with_year_book_closed", "receipt_amount_as_served", "payment_amount_as_served"]
          + M, sorted(T["state"]), sheets)
    fin6 = FIN
    fin_head = [c + "_rs" if c.endswith(("_receipts", "_payments")) else c for c in fin6]
    by_norm = {norm(n): c for c, n in dist_names.items()}
    write("district_finance.csv", ["financial_year", "district_code", "district"] + fin_head + M,
          [[r[0], by_norm.get(norm(r[2]), "")] + r[2:] for r in sorted(T["dist_fin"])], sheets)
    write("block_finance.csv", ["financial_year", "district_code", "block"] + fin_head + M, sorted(T["block_fin"]),
          sheets)
    write("gp_finance.csv", ["financial_year", "district_code", "district", "block_code", "block", "gp_code",
          "gp_name_as_served", "receipts_rs", "payments_rs", "receipts_as_served", "payments_as_served"] + M,
          sorted(T["gp_fin"], key=lambda r: (r[0], r[1], r[3], r[6])), sheets)
    write("district_scheme_finance.csv", ["financial_year", "scheme_code", "scheme", "district", "tier", "rv", "pv",
          "cv", "jv", "receipts_rs", "payments_rs", "receipts_as_served", "payments_as_served"] + M,
          sorted(T["scheme"], key=lambda r: (r[0], int(r[1]), r[3], r[4])), sheets)
    write("monthly_finance.csv", ["financial_year", "entity", "entity_code", "entity_name", "month",
          "opening_balance_rs", "receipts_rs", "receipt_cancellation_rs", "ob_cancellation_rs", "payments_rs",
          "payment_cancellation_rejected_rs", "opening_balance_as_served"] + M, T["month_fin"], sheets)
    write("monthly_vouchers.csv", ["financial_year", "entity", "entity_code", "entity_name", "month", "receipts",
          "payments", "contra", "journal"] + M, T["month_vch"], sheets)
    vch = ["rv", "pv", "cv", "jv"]
    tail = ["gps", "gps_with_master_entry", "gps_with_opening_balance", "gps_with_vouchers"] + [f"gp_{x}" for x in vch] \
        + ["gps_with_day_book_closed", "gps_with_month_book_closed", "gps_with_year_book_closed"] + M
    write("district_accounting_status.csv", ["financial_year", "district", "zp_entered_masters",
          "zp_entered_opening_balance"] + [f"zp_{x}" for x in vch] + ["zp_day_book_closed", "zp_month_book_closed",
          "zp_year_book_closed", "bps", "bps_with_master_entry", "bps_with_opening_balance", "bps_with_vouchers"]
          + [f"bp_{x}" for x in vch] + ["bps_with_day_book_closed", "bps_with_month_book_closed",
          "bps_with_year_book_closed"] + tail, sorted(T["dist_acc"]), sheets)
    write("block_accounting_status.csv", ["financial_year", "district_code", "block", "bp_entered_masters",
          "bp_entered_opening_balance"] + [f"bp_{x}" for x in vch] + ["bp_day_book_closed", "bp_month_book_closed",
          "bp_year_book_closed"] + tail, sorted(T["block_acc"]), sheets)
    write("gp_accounting_status.csv", ["financial_year", "district_code", "district", "block_code", "block",
          "gp_code", "gp_name_as_served", "entered_masters", "entered_opening_balance", "day_book_closed",
          "month_book_closed", "year_book_closed"] + vch + M,
          sorted(T["gp_acc"], key=lambda r: (r[0], r[1], r[3], r[6])), sheets)
    write("gp_year_book_closed.csv", ["financial_year", "block_code", "block", "gp_code", "gp_name",
          "totalcount", "count_closed", "source_file"], sorted(api_gp_rows, key=lambda r: (r[0], r[1], str(r[4]))),
          sheets)

    # ---- AuditOnline per GP
    ao = originals("EGS-AO")
    aud = collections.defaultdict(dict)
    for u, (r, p) in ao.items():
        if r.get("geo_level") != "gp" or p.suffix != ".json":
            continue
        try:
            d = json.loads(p.read_bytes())
        except ValueError:
            continue
        fy, e = r.get("financial_year"), r.get("endpoint")
        blk = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(u).query) or (r.get("params") or {}).items()).get("blockCode", "")
        for x in d if isinstance(d, list) else []:
            code = x.get("auditeeCode") or x.get("code")
            if code is None:
                continue
            a = aud[(fy, code)]
            a.setdefault("block_code", blk)
            a.setdefault("name", x.get("auditeeName") or x.get("name"))
            a.setdefault("src", set()).add(r["stored_path"])
            if e == "centerLevelByYearAndBlock.htm":
                a.update(plan="yes", start=x.get("auditStartDate", ""), end=x.get("auditEndDate", ""),
                         schemes=x.get("schemeName", ""))
            elif e == "gpWithAuditReportGeneratedDetail.htm":
                a["report"] = x.get("count", "")
            elif e == "observationCountGPReport.htm":
                a["obs"] = x.get("count", "")
            elif e == "auditSettlementReportLevelWise.htm":
                a["settle"] = x.get("auditSettlementReportCount", "")
    write("audit_gp.csv", ["financial_year", "block_code", "gp_code", "gp_name", "in_audit_plan", "audit_start",
          "audit_end", "grant_streams_audited", "audit_report_generated", "audit_observations",
          "settlement_reports", "source_files"],
          [[fy, a.get("block_code", ""), code, a.get("name", ""), a.get("plan", ""), a.get("start", ""),
            a.get("end", ""), a.get("schemes", ""), a.get("report", ""), a.get("obs", ""), a.get("settle", ""),
            " ".join(sorted(a["src"]))] for (fy, code), a in sorted(aud.items(), key=lambda k: (k[0][0], str(k[0][1])))],
          sheets)

    # ---- browser-built reports: Bihar state rows (aggregates only)
    ind = []
    for u, (r, p) in egs.items():
        if r.get("step") != "xhr" or p.suffix != ".json":
            continue
        try:
            d = json.loads(p.read_bytes())
        except ValueError:
            continue
        rows = d if isinstance(d, list) else []
        for x in rows:
            if not isinstance(x, dict):
                continue
            sc = x.get("stateCode", x.get("statecode", x.get("code")))
            nm = str(x.get("stateName") or x.get("statenameenglish") or x.get("name") or "")
            if str(sc) != "10" and nm.lower() != "bihar":
                continue
            for k, v in x.items():
                if v is None or k in ("srNo", "stateCode", "statecode", "code", "stateName", "statenameenglish",
                                      "name", "level", "gender") or k.lower().endswith(("name", "code")):
                    continue
                ind.append([r.get("report", ""), urllib.parse.urlsplit(u).path.strip("/"),
                            urllib.parse.urlsplit(u).query, k, v, r.get("retrieved_at_ist", ""),
                            r["stored_path"].replace("\\", "/")])
    write("state_indicators.csv", ["report_page", "endpoint", "query", "field", "value", "retrieved_at_ist",
          "source_file"], sorted(ind, key=lambda r: (r[1], r[2], r[3])), sheets)

    # ---- workbook
    from openpyxl import Workbook
    wb = Workbook(write_only=True)
    for name, header, rows in sheets:
        ws = wb.create_sheet(name)
        ws.append(header)
        for row in rows:
            ws.append(row)
    wb.save(OUT / "bihar_egramswaraj_clean.xlsx")
    print("wrote bihar_egramswaraj_clean.xlsx")


if __name__ == "__main__":
    main()
