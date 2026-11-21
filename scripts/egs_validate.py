"""Task 5: profile, validate and standardise the Bihar eGramSwaraj tables.

    python scripts/egs_validate.py            # full run -> data/validated/egs/
    python scripts/egs_validate.py --check    # run again and confirm the outputs are byte-identical

Inputs (read only): data/clean/egs/*.csv (the preliminary tables of Task 4), the originals they cite
under data/raw/EGS-PORTAL/ (re-read to verify values and to recover codes from the pages' own links),
getMobileData JSON for the code lists, data/provenance.jsonl, and config/egs_field_definitions.csv.

Outputs (data/validated/egs/):
  <dataset>.csv                    the clean table, unchanged columns + record_id, provenance (URL, sha256),
                                   validated codes with their status, receipts definition, validation flags
  supplementary_auditonline/       AuditOnline kept apart from the core eGramSwaraj data
  data_dictionary.csv              every dataset and field: meaning, level, years, unit, type, source, limits
  dataset_profile.csv, field_profile.csv
  validation_checks.csv            every check run: what was tested, how many records, PASS/WARNING/FAIL/...
  validation_exceptions.csv        every record that did not pass a check
  financial_reconciliation.csv     child-sum vs parent comparisons with dates, definitions and tolerance
  accounting_snapshot_comparison.csv
  geographic_reference.csv         districts, blocks and GPs with codes, names seen, parents, evidence
  unmatched_geographic_records.csv GP rows without a verified code, and how each of the 102 was settled
  gp_counts_by_year.csv            GP counts by source and year (AuditOnline as a separate column)
  administrative_indicators.csv    representative, profile, GPDP and geo-tagging checks
  historical_comparability.csv     indicator x year: unit, definition, dates, coverage, classification
  data_quality_summary.csv         the consolidated issue register
  logs/validation_run.json, logs/validation_run.log

Never writes to data/raw or data/clean. Never sets a missing value to 0, never guesses a code, and
never adjusts a value to make a total match.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import difflib
import fnmatch
import json
import re
import statistics
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROVENANCE, ROOT, read_jsonl  # noqa: E402
from egs_validate_lib import (FAIL, NOT_TESTABLE, PASS, UNRESOLVED, WARNING, Registers, fmt, fnum,  # noqa: E402
                              grouping, norm_name, norm_text, num, page_rows, page_text, read_csv,
                              rows_labelled, sha256, write_csv)

CLEAN = DATA / "clean" / "egs"
OUT = DATA / "validated" / "egs"
DEFS = ROOT / "config" / "egs_field_definitions.csv"
STATE_CODE = "10"

DATASETS = ["state_year_summary", "district_finance", "block_finance", "gp_finance", "district_scheme_finance",
            "monthly_finance", "monthly_vouchers", "district_accounting_status", "block_accounting_status",
            "gp_accounting_status", "gp_year_book_closed", "state_indicators", "audit_gp"]
SUPPLEMENTARY = {"audit_gp"}
LEVEL = {"state_year_summary": "state", "district_finance": "district", "block_finance": "block",
         "gp_finance": "gram panchayat", "district_scheme_finance": "district (and state row)",
         "monthly_finance": "zilla parishad or block panchayat body x month",
         "monthly_vouchers": "district or block x month", "district_accounting_status": "district",
         "block_accounting_status": "block", "gp_accounting_status": "gram panchayat",
         "gp_year_book_closed": "gram panchayat", "state_indicators": "state", "audit_gp": "gram panchayat"}
KEYS = {"state_year_summary": ["financial_year", "tier"],
        "district_finance": ["financial_year", "district"],
        "block_finance": ["financial_year", "district_code", "block"],
        "gp_finance": ["financial_year", "block_code", "gp_name_as_served"],
        "district_scheme_finance": ["financial_year", "scheme_code", "district", "tier"],
        "monthly_finance": ["financial_year", "entity", "entity_code", "month"],
        "monthly_vouchers": ["financial_year", "entity", "entity_code", "month"],
        "district_accounting_status": ["financial_year", "district"],
        "block_accounting_status": ["financial_year", "district_code", "block"],
        "gp_accounting_status": ["financial_year", "block_code", "gp_name_as_served"],
        "gp_year_book_closed": ["financial_year", "block_code", "gp_code"],
        "state_indicators": ["endpoint", "query", "field", "source_file"],
        "audit_gp": ["financial_year", "gp_code"]}
AMOUNT = re.compile(r"(_cr|_rs)$")
TIERS = ("zp", "bp", "gp")
YES_NO = {"yes", "no"}
LOG = []


def log(msg):
    LOG.append(msg)
    print(msg, flush=True)


def is_total(row, dataset):
    for k in ("district", "block", "gp_name_as_served"):
        if k in row and norm_text(row[k]).lower() == "total":
            return True
    return False


def gen_date(s):
    m = re.search(r"([A-Z][a-z]+ \d{1,2}, \d{4})", s or "")
    if not m:
        return None
    try:
        return dt.datetime.strptime(m.group(1), "%B %d, %Y").date()
    except ValueError:
        return None


def gen_ts(s):
    m = re.search(r"([A-Z][a-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2} [AP]M)", s or "")
    if not m:
        return None
    try:
        return dt.datetime.strptime(m.group(1), "%B %d, %Y %I:%M %p")
    except ValueError:
        return None


def ts_span(values):
    ts = sorted({x for x in (gen_ts(v) for v in values) if x})
    if not ts:
        return ""
    f = "%Y-%m-%d %H:%M"
    return ts[0].strftime(f) if ts[0] == ts[-1] else f"{ts[0].strftime(f)} to {ts[-1].strftime(f)}"


def date_span(values):
    ds = sorted({d for d in (gen_date(v) for v in values) if d})
    if not ds:
        return ""
    return ds[0].isoformat() if ds[0] == ds[-1] else f"{ds[0].isoformat()} to {ds[-1].isoformat()}"


def src(row):
    return ROOT / (row.get("source_file") or "").split(" ")[0]


# ====================================================================== phase 1: inputs, provenance, raw integrity
def load_inputs():
    T = {}
    for d in DATASETS:
        p = CLEAN / f"{d}.csv"
        T[d] = read_csv(p) if p.exists() else None
    return T


def provenance_index():
    idx = {}
    for r in read_jsonl(PROVENANCE):
        if r.get("source_id") in ("EGS-PORTAL", "EGS-AO") and r.get("stored_path"):
            sp = r["stored_path"].replace("\\", "/")
            if sp not in idx or (r.get("retrieved_at_ist") or "") > (idx[sp].get("retrieved_at_ist") or ""):
                idx[sp] = r
    return idx


def raw_state(prov):
    """sha256 of every EGS-PORTAL / EGS-AO original listed in provenance, and mismatches vs the record."""
    state, bad, missing = {}, [], 0
    for sp, r in sorted(prov.items()):
        p = ROOT / sp
        if not p.exists():
            missing += 1
            continue
        h = sha256(p)
        state[sp] = h
        if h != r.get("sha256"):
            bad.append(sp)
    return state, bad, missing


# ====================================================================== workstream A: profiling + dictionary
def infer_type(values):
    vals = [v for v in values if v not in ("", None)]
    if not vals:
        return "empty"
    if all(re.fullmatch(r"-?\d+", v) for v in vals):
        return "integer"
    if all(re.fullmatch(r"-?\d+(\.\d+)?", v) for v in vals):
        return "decimal"
    if set(v.lower() for v in vals) <= YES_NO:
        return "yes/no"
    if all(re.fullmatch(r"\d{4}-\d{4}", v) for v in vals):
        return "financial year"
    return "text"


def profile(T, R):
    ds_rows, fld_rows = [], []
    for d in DATASETS:
        rows = T[d]
        if rows is None:
            R.check(f"A0-{d}", "A", d, "", LEVEL[d], "", "dataset present in data/clean/egs", 0, 0, NOT_TESTABLE,
                    "file missing")
            continue
        cols = [c for c in rows[0].keys() if not c.startswith("_")] if rows else []
        full = collections.Counter(tuple(r[c] for c in cols) for r in rows)
        dup_full = sum(n - 1 for n in full.values() if n > 1)
        key = KEYS[d]
        kc = collections.Counter(tuple(r.get(k, "") for k in key) for r in rows)
        dup_key = {k: n for k, n in kc.items() if n > 1}
        fys = sorted({r.get("financial_year", "") for r in rows if r.get("financial_year")})
        files = {r.get("source_file") or r.get("source_files") for r in rows}
        totals = sum(is_total(r, d) for r in rows)
        ds_rows.append({"dataset": d, "level": LEVEL[d], "rows": len(rows), "columns": len(cols),
                        "financial_years": " ".join(fys), "source_files": len(files),
                        "portal_total_rows": totals, "exact_duplicate_rows": dup_full,
                        "key": "+".join(key), "duplicate_keys": len(dup_key),
                        "report_generated_on": date_span([r.get("report_generated_on", "") for r in rows]),
                        "retrieved": _retr_span(rows),
                        "role": "supplementary (AuditOnline)" if d in SUPPLEMENTARY else "core eGramSwaraj"})
        R.check(f"A1-{d}", "A", d, "+".join(key), LEVEL[d], " ".join(fys),
                "rows sharing the dataset key (key duplicates) and fully identical rows", len(rows),
                len(dup_key) + dup_full, PASS if not dup_key and not dup_full else WARNING,
                f"{len(dup_key)} duplicated keys, {dup_full} identical rows")
        for (k, n) in sorted(dup_key.items())[:200]:
            R.exc(f"A1-{d}", d, k[0] if key[0] == "financial_year" else "", "|".join(k), "+".join(key), n, 1,
                  WARNING, "key appears more than once")
        for c in cols:
            vals = [r[c] for r in rows]
            nn = [v for v in vals if v != ""]
            t = infer_type(vals)
            nums = [float(v) for v in nn if t in ("integer", "decimal")]
            fld_rows.append({"dataset": d, "field": c, "type": t, "rows": len(vals), "non_empty": len(nn),
                             "empty": len(vals) - len(nn), "distinct": len(set(nn)),
                             "min": fmt(min(nums)) if nums else "", "max": fmt(max(nums)) if nums else "",
                             "zero_values": sum(1 for x in nums if x == 0),
                             "negative_values": sum(1 for x in nums if x < 0),
                             "example": next((v for v in nn if v not in ("0", "0.0")), nn[0] if nn else "")[:80]})
    return ds_rows, fld_rows


def _retr_span(rows):
    ds = sorted({(r.get("retrieved_at_ist") or "")[:10] for r in rows if r.get("retrieved_at_ist")})
    if not ds:
        return ""
    return ds[0] if ds[0] == ds[-1] else f"{ds[0]} to {ds[-1]}"


def dictionary(T, fld_rows, added):
    defs = read_csv(DEFS)
    dset = {r["dataset"]: r for r in defs if r["field_pattern"] == "#dataset"}
    fdefs = [r for r in defs if r["field_pattern"] != "#dataset"]
    prof = {(r["dataset"], r["field"]): r for r in fld_rows}
    out = []
    for d in DATASETS:
        rows = T[d] or []
        if not rows:
            continue
        cols = [c for c in rows[0].keys() if not c.startswith("_")] + [c for c, _ in added.get(d, [])]
        meta = dset.get(d, {})
        fys = sorted({r.get("financial_year", "") for r in rows if r.get("financial_year")})
        for c in cols:
            f = next((x for x in fdefs if x["dataset"] in (d, "*") and fnmatch.fnmatch(c, x["field_pattern"])
                      and x["dataset"] == d), None) or \
                next((x for x in fdefs if x["dataset"] == "*" and fnmatch.fnmatch(c, x["field_pattern"])), None)
            add = dict(added.get(d, [])).get(c)
            p = prof.get((d, c), {})
            fy_cov = " ".join(sorted({r.get("financial_year", "") for r in rows if r.get(c) not in ("", None)
                                      and r.get("financial_year")})) if c in rows[0] else " ".join(fys)
            out.append({"dataset": d, "portal_report": meta.get("definition_evidence", ""),
                        "dataset_description": meta.get("description", ""), "field": c,
                        "description": add or (f or {}).get("description", "") or "NOT DOCUMENTED",
                        "administrative_level": LEVEL[d], "financial_years": fy_cov,
                        "unit": "" if add else (f or {}).get("unit", ""), "data_type": p.get("type", "derived"),
                        "non_empty": p.get("non_empty", ""), "empty": p.get("empty", ""),
                        "source_reference": "validated layer (egs_validate.py)" if add else
                        (f or {}).get("definition_evidence", ""),
                        "report_generated_on": date_span([r.get("report_generated_on", "") for r in rows]),
                        "known_limitations": "; ".join(x for x in ((f or {}).get("limitation", ""),
                                                                    meta.get("limitation", "") if c == cols[0] else "")
                                                       if x),
                        "role": "supplementary (AuditOnline)" if d in SUPPLEMENTARY else "core eGramSwaraj"})
    return out


# ====================================================================== workstream C (first): geography
FALLBACK_DECODED = []


def load_json(sp):
    """JSON as served. A few getMobileData responses are not UTF-8 (a cp1252 non-breaking space in a name):
    those are decoded as cp1252 and listed in FALLBACK_DECODED, never silently skipped."""
    b = (ROOT / sp).read_bytes()
    try:
        return json.loads(b)
    except UnicodeDecodeError:
        if sp not in FALLBACK_DECODED:
            FALLBACK_DECODED.append(sp)
        return json.loads(b.decode("cp1252"))


def api_lists(prov):
    """Code lists from getMobileData JSON: districts, blocks (with district), GPs (with block), by FY."""
    D, B, G = {}, {}, {}
    for sp, r in sorted(prov.items()):
        u = r.get("url") or ""
        if "getMobileData" not in u or not sp.endswith(".json"):
            continue
        try:
            data = load_json(sp)
        except (ValueError, OSError):
            continue
        parts = urllib.parse.urlsplit(u).path.split("/")
        ep, fy = (parts[2], parts[3]) if len(parts) > 3 else ("", "")
        for x in data if isinstance(data, list) else []:
            if not isinstance(x, dict) or x.get("code") is None:
                continue
            code, name = str(x["code"]), str(x.get("name") or "").strip()
            if ep == "getYearBookClosedDistrictWise" and parts[4] == STATE_CODE:
                e = D.setdefault(code, {"names": set(), "years": set(), "src": set()})
            elif ep == "getYearBookClosedBlockWise" and parts[4] == STATE_CODE:
                e = B.setdefault(code, {"names": set(), "years": set(), "src": set(), "parents": set()})
                e["parents"].add(parts[6])
            elif ep == "getYearBookClosedGPWise" and parts[4] == STATE_CODE:
                e = G.setdefault(code, {"names": set(), "years": set(), "src": set(), "parents": set(),
                                        "by_year": {}, "rows": []})
                e["rows"].append((fy, parts[5], x, sp))
                e["parents"].add(parts[5])
                e["by_year"][fy] = parts[5]
            else:
                continue
            e["names"].add(name)
            e["years"].add(fy)
            e["src"].add(sp)
    return D, B, G


def link_code(path, label, fd_prefixes, anywhere=False):
    """Code in the link of the row labelled `label` on the original page. Returns (code, note)."""
    rows = rows_labelled(path, label, anywhere)
    codes = set()
    for r in rows:
        for fd, name in r["links"]:
            if any(fd.startswith(p) for p in fd_prefixes) and re.fullmatch(r"\d+", name or ""):
                codes.add(name)
    if not rows:
        return "", "label not found on page"
    if len(codes) == 1:
        return codes.pop(), ""
    if not codes:
        return "", "row has no code link"
    return "", "ambiguous: several codes " + " ".join(sorted(codes))


def geography(T, prov, R):
    D, B, G = api_lists(prov)
    log(f"getMobileData lists: {len(D)} districts, {len(B)} blocks, {len(G)} GPs")
    geo = {"D": D, "B": B, "G": G, "dist_by_norm": {}}
    for c, e in D.items():
        for n in e["names"]:
            geo["dist_by_norm"].setdefault(norm_name(n), set()).add(c)

    # --- district codes for district-level tables (exact normalised name match to the API list + page link)
    for d, fd in (("district_finance", ("ExpenditureReport",)), ("district_accounting_status", ("SummaryReport",)),
                  ("district_scheme_finance", ("district",))):
        for r in T[d] or []:
            if is_total(r, d) or r.get("district", "").startswith("BIHAR"):
                r["_district_code"], r["_geo_status"], r["_geo_evidence"] = "", "not applicable (total/state row)", ""
                continue
            c_name = geo["dist_by_norm"].get(norm_name(r["district"]), set())
            c_link, note = link_code(src(r), r["district"], fd + ("ExpFY", "FinancialYear"))
            if c_link and c_name and c_link in c_name:
                r["_district_code"], r["_geo_status"] = c_link, "verified (page link = code list name)"
            elif c_link and c_link in D:
                r["_district_code"], r["_geo_status"] = c_link, "verified (page link)"
            elif len(c_name) == 1:
                r["_district_code"], r["_geo_status"] = next(iter(c_name)), "name match only"
            else:
                r["_district_code"], r["_geo_status"] = "", "unresolved"
            r["_geo_evidence"] = note
    # --- block codes for block-level tables, from the district page's own row links
    for d, fd in (("block_finance", ("ExpenditureReport", "ExpFY")), ("block_accounting_status",
                                                                       ("SummaryReport", "FinancialYear"))):
        for r in T[d] or []:
            if is_total(r, d):
                r["_block_code"], r["_geo_status"], r["_geo_evidence"] = "", "not applicable (portal total row)", ""
                continue
            c, note = link_code(src(r), r["block"], fd)
            dcode = r.get("district_code", "")
            if c and c in B and dcode in B[c]["parents"]:
                r["_block_code"], r["_geo_status"] = c, "verified (page link; code list puts it in this district)"
            elif c and c in B:
                r["_block_code"], r["_geo_status"] = c, "conflict: code list puts block in district " + \
                    " ".join(sorted(B[c]["parents"]))
            elif c:
                r["_block_code"], r["_geo_status"] = c, "page link only (code not in getMobileData block list)"
            else:
                cands = [k for k, e in B.items() if dcode in e["parents"] and
                         norm_name(r["block"]) in {norm_name(n) for n in e["names"]}]
                r["_block_code"] = cands[0] if len(cands) == 1 else ""
                r["_geo_status"] = "name match only (no page link)" if len(cands) == 1 else "unresolved"
            r["_geo_evidence"] = note

    # --- GP codes from the village pages' row links
    unmatched = []
    for d, fd in (("gp_finance", ("ExpFY",)), ("gp_accounting_status", ("FinancialYear",))):
        for r in T[d] or []:
            prelim = r.get("gp_code", "")
            if is_total(r, d):
                r["_gp_code"], r["_geo_status"], r["_geo_evidence"] = "", "not applicable (portal total row)", ""
                continue
            c, note = link_code(src(r), r["gp_name_as_served"], fd)
            blk, fy = r.get("block_code", ""), r["financial_year"]
            in_list = c in G and (G[c]["by_year"].get(fy) == blk or (fy not in G[c]["by_year"] and blk in G[c]["parents"]))
            if c and in_list and (not prelim or prelim == c):
                st = "verified (page link and code list agree)" if prelim else "resolved by page link (code list agrees)"
            elif c and c in G and not in_list:
                st = "conflict: code list puts GP in block " + G[c]["by_year"].get(fy, " ".join(sorted(G[c]["parents"])))
            elif c and prelim and prelim != c:
                st = "conflict: page link differs from preliminary name match"
            elif c:
                st = "page link only (code not in getMobileData list for this block and year)"
            elif prelim:
                st = "name match only (no page link)"
            else:
                st = "unresolved"
            r["_gp_code"] = c if (c and not st.startswith("conflict")) else ("" if st.startswith("conflict") else prelim)
            r["_geo_status"], r["_geo_evidence"] = st, note
            if not prelim or not st.startswith(("verified", "name match only")):
                cands, assess = [], ""
                if not r["_gp_code"]:
                    pool = {k: e for k, e in G.items() if e["by_year"].get(fy) == blk}
                    exact = sorted({k for k, e in pool.items() for n in e["names"]
                                    if norm_name(n) == norm_name(r["gp_name_as_served"])})
                    if len(exact) == 1:
                        k = exact[0]
                        yrs = sorted(y for y, _ in ((fy2, None) for fy2 in G[k]["years"]))
                        assess = (f"probable: name equals the spelling that the code list gives code {k} in another "
                                  f"year ({', '.join(yrs)}), same block; NOT assigned (name evidence only)")
                    elif len(exact) > 1:
                        assess = "ambiguous: several codes in this block carry this name; NOT assigned"
                    else:
                        assess = "no exact name in this block's code list; NOT assigned"
                    scored = sorted(((difflib.SequenceMatcher(None, norm_name(r["gp_name_as_served"]),
                                                              norm_name(n)).ratio(), k, n)
                                     for k, e in pool.items() for n in e["names"]), reverse=True)[:3]
                    cands = [f"{k} {n} ({s:.2f})" for s, k, n in scored]
                unmatched.append({"dataset": d, "financial_year": fy, "district_code": r.get("district_code", ""),
                                  "block_code": blk, "block": r.get("block", ""),
                                  "gp_name_as_served": r["gp_name_as_served"], "preliminary_gp_code": prelim,
                                  "page_link_code": c, "validated_gp_code": r["_gp_code"], "status": st,
                                  "page_note": note, "candidates_not_assigned": "; ".join(cands),
                                  "candidate_assessment": assess,
                                  "source_file": r.get("source_file", "")})
    return geo, sorted(unmatched, key=lambda x: (x["dataset"], x["financial_year"], x["block_code"],
                                                 x["gp_name_as_served"]))


def geo_checks(T, geo, unmatched, R):
    D, B, G = geo["D"], geo["B"], geo["G"]
    # C1 block -> district consistency between code list and report URLs
    url_parent = {}
    for d in ("block_finance", "block_accounting_status"):
        for r in T[d] or []:
            if r.get("_block_code"):
                url_parent.setdefault(r["_block_code"], set()).add(r["district_code"])
    multi = {b: e["parents"] for b, e in B.items() if len(e["parents"]) > 1}
    disagree = {b: (url_parent[b], B[b]["parents"]) for b in url_parent if b in B and not url_parent[b] <= B[b]["parents"]}
    R.check("C1", "C", "geographic_reference", "block_code->district_code", "block", "all",
            "each block code sits under one district in getMobileData, and the report URLs agree", len(B),
            len(multi) + len(disagree), PASS if not multi and not disagree else FAIL,
            f"{len(multi)} blocks under several districts; {len(disagree)} URL/code-list disagreements")
    for b, (u, a) in sorted(disagree.items()):
        R.exc("C1", "block_finance", "", b, "district_code", " ".join(sorted(u)), " ".join(sorted(a)), FAIL,
              "report URL and code list disagree on the block's district")
    # C2 GP -> block
    gp_multi = {g: e for g, e in G.items() if len(set(e["by_year"].values())) > 1}
    R.check("C2", "C", "geographic_reference", "gp_code->block_code", "gram panchayat", "2020-2021 2024-2025",
            "a GP code is under the same block in every year it is listed", len(G), len(gp_multi),
            PASS if not gp_multi else WARNING, f"{len(gp_multi)} GP codes listed under different blocks in different years")
    for g, e in sorted(gp_multi.items()):
        R.exc("C2", "gp_year_book_closed", "", g, "block_code", json.dumps(e["by_year"], sort_keys=True), "one block",
              WARNING, "GP code appears under different blocks in different years (administrative change or "
              "reporting difference; not determined)")
    # C3 status counts on GP tables
    for d in ("gp_finance", "gp_accounting_status"):
        rows = [r for r in T[d] or [] if not is_total(r, d)]
        st = collections.Counter(r["_geo_status"].split(":")[0].split(" (")[0] for r in rows)
        bad = sum(n for k, n in st.items() if not k.startswith(("verified", "resolved")))
        R.check(f"C3-{d}", "C", d, "gp_code", "gram panchayat", "2020-2021 2024-2025",
                "GP code taken from the row's own link on the original page and confirmed in the getMobileData "
                "list of the same block and year; preliminary name-matched code compared", len(rows), bad,
                PASS if bad == 0 else (FAIL if any(k.startswith("conflict") for k in st) else WARNING),
                "; ".join(f"{k}: {n}" for k, n in sorted(st.items())))
        for r in rows:
            if r["_geo_status"].startswith("conflict"):
                R.exc(f"C3-{d}", d, r["financial_year"], f"{r['block_code']}|{r['gp_name_as_served']}", "gp_code",
                      r.get("gp_code", ""), r["_geo_status"], FAIL, "not assigned", r["source_file"])
    # C4 the 102 preliminary unmatched GP finance rows
    prelim_unmatched = [u for u in unmatched if u["dataset"] == "gp_finance" and not u["preliminary_gp_code"]]
    still = [u for u in prelim_unmatched if not u["validated_gp_code"]]
    R.check("C4", "C", "gp_finance", "gp_code", "gram panchayat", "2020-2021 2024-2025",
            "GP finance rows left without a code by the preliminary name match: settled only by a code printed in "
            "the same source page (row link) that the code list confirms", len(prelim_unmatched), len(still),
            PASS if not still else UNRESOLVED,
            f"{len(prelim_unmatched) - len(still)} resolved by page link, {len(still)} unresolved (candidates listed, "
            f"not assigned; {sum(1 for u in still if u['candidate_assessment'].startswith('probable'))} have one "
            "exact-name candidate from another year's code list)")
    # C5 names: duplicates within block, variants per code
    dup_in_block, variants = 0, 0
    by_block = collections.defaultdict(list)
    for g, e in G.items():
        for fy, b in e["by_year"].items():
            by_block[(fy, b)].append(g)
        if len({norm_name(n) for n in e["names"]}) > 1:
            variants += 1
            R.exc("C5", "geographic_reference", "", g, "gp_name", " | ".join(sorted(e["names"])), "one name",
                  WARNING, "same GP code, different names across years")
    for (fy, b), codes in sorted(by_block.items()):
        names = collections.Counter(norm_name(next(iter(sorted(G[c]["names"])))) for c in codes)
        for n, k in names.items():
            if k > 1:
                dup_in_block += 1
                R.exc("C5", "geographic_reference", fy, b, "gp_name", n, "unique within block", WARNING,
                      f"{k} GP codes share this name in one block; codes must be used, not names")
    R.check("C5", "C", "geographic_reference", "gp_name", "gram panchayat", "2020-2021 2024-2025",
            "GP names: same code with different names across years; same name for different codes in one block",
            len(G), dup_in_block + variants, PASS if not (dup_in_block or variants) else WARNING,
            f"{variants} codes with name variants; {dup_in_block} duplicated names within a block")
    # C6 district / block status summary
    for d, col in (("district_finance", "_district_code"), ("district_accounting_status", "_district_code"),
                   ("block_finance", "_block_code"), ("block_accounting_status", "_block_code")):
        rows = [r for r in T[d] or [] if not r["_geo_status"].startswith("not applicable")]
        st = collections.Counter(r["_geo_status"].split(" (")[0].split(":")[0] for r in rows)
        bad = sum(n for k, n in st.items() if not k.startswith("verified"))
        R.check(f"C6-{d}", "C", d, col.strip("_"), LEVEL[d], "all",
                "code from the row's link on the original page, checked against the getMobileData list "
                "(district for blocks)", len(rows), bad, PASS if bad == 0 else WARNING,
                "; ".join(f"{k}: {n}" for k, n in sorted(st.items())))
        for r in rows:
            if not r["_geo_status"].startswith("verified"):
                R.exc(f"C6-{d}", d, r["financial_year"], r.get("district") or r.get("block"), col.strip("_"),
                      r.get(col, ""), "verified code", WARNING if r.get(col) else UNRESOLVED, r["_geo_status"],
                      r["source_file"])


def geo_reference(geo, T):
    D, B, G = geo["D"], geo["B"], geo["G"]
    out = [{"level": "state", "code": STATE_CODE, "name": "Bihar", "names_seen": "Bihar | BIHAR", "parent_level": "",
            "parent_code": "", "district_code": "", "years_seen": "", "code_source": "eGramSwaraj report URLs (state=10)",
            "status": "verified"}]
    for c, e in sorted(D.items(), key=lambda x: int(x[0])):
        out.append({"level": "district", "code": c, "name": sorted(e["names"])[-1], "names_seen": " | ".join(sorted(e["names"])),
                    "parent_level": "state", "parent_code": STATE_CODE, "district_code": c,
                    "years_seen": " ".join(sorted(e["years"])), "code_source": "getMobileData DistrictWise",
                    "status": "verified"})
    url_blocks = collections.defaultdict(set)
    for d in ("block_finance", "block_accounting_status"):
        for r in T[d] or []:
            if r.get("_block_code"):
                url_blocks[r["_block_code"]].add(r["district_code"])
    for c, e in sorted(B.items(), key=lambda x: int(x[0])):
        par = sorted(e["parents"])
        ok = len(par) == 1 and url_blocks.get(c, set(par)) <= set(par)
        out.append({"level": "block", "code": c, "name": sorted(e["names"])[-1], "names_seen": " | ".join(sorted(e["names"])),
                    "parent_level": "district", "parent_code": " ".join(par), "district_code": " ".join(par),
                    "years_seen": " ".join(sorted(e["years"])),
                    "code_source": "getMobileData BlockWise" + (" + report page links" if c in url_blocks else ""),
                    "status": "verified" if ok else "check: several or conflicting parents"})
    blk_parent = {c: sorted(e["parents"])[0] for c, e in B.items() if len(e["parents"]) == 1}
    for c, e in sorted(G.items(), key=lambda x: int(x[0])):
        par = sorted(set(e["by_year"].values()))
        out.append({"level": "gram panchayat", "code": c, "name": sorted(e["names"])[-1],
                    "names_seen": " | ".join(sorted(e["names"])), "parent_level": "block", "parent_code": " ".join(par),
                    "district_code": " ".join(sorted({blk_parent.get(p, "") for p in par})),
                    "years_seen": " ".join(sorted(e["years"])), "code_source": "getMobileData GPWise",
                    "status": "verified" if len(par) == 1 else "check: listed under different blocks by year"})
    return out


def gp_counts(T, geo, prov):
    """GP counts per FY from every source that states one (no source is preferred)."""
    by = collections.defaultdict(dict)
    for r in T["state_year_summary"] or []:
        if r["tier"] == "gp":
            by[r["financial_year"]]["state_year_summary.panchayats"] = r["panchayats"]
            by[r["financial_year"]]["state_year_summary.generated"] = (gen_date(r["report_generated_on"]) or "").__str__()
    for r in T["district_accounting_status"] or []:
        if is_total(r, "") or not r.get("gps"):
            continue
        k = by[r["financial_year"]]
        k["district_accounting_status.sum_gps"] = k.get("district_accounting_status.sum_gps", 0) + int(float(r["gps"]))
    for d in ("gp_finance", "gp_accounting_status", "gp_year_book_closed"):
        for fy in sorted({r["financial_year"] for r in T[d] or []}):
            rows = [r for r in T[d] if r["financial_year"] == fy and not is_total(r, d)]
            by[fy][f"{d}.rows"] = len(rows)
    for sp, r in prov.items():
        u = r.get("url") or ""
        m = re.search(r"getYearBookClosedDistrictWise/(\d{4}-\d{4})/10/GP$", u)
        if m and sp.endswith(".json"):
            try:
                data = json.loads((ROOT / sp).read_bytes())
                by[m.group(1)]["getMobileData.district_totalcount_sum"] = sum(int(x.get("totalcount") or 0)
                                                                            for x in data)
            except (ValueError, OSError):
                pass
    for r in T["audit_gp"] or []:
        k = by[r["financial_year"]]
        k["SUPPLEMENTARY_auditonline.gp_rows"] = k.get("SUPPLEMENTARY_auditonline.gp_rows", 0) + 1
    cols = sorted({c for v in by.values() for c in v})
    rows = [{"financial_year": fy, **{c: by[fy].get(c, "") for c in cols}} for fy in sorted(by)]
    return ["financial_year"] + cols, rows


def restore_skipped_api_rows(T, geo, prov, R):
    """getMobileData GP lists that egs_clean.py could not decode (not UTF-8) were left out of
    gp_year_book_closed. Their rows are added to the validated table, marked row_origin, from the original."""
    have = {(r["financial_year"], r["gp_code"]) for r in T["gp_year_book_closed"] or []}
    for r in T["gp_year_book_closed"] or []:
        r["_origin"] = "data/clean/egs"
    added = []
    for code, e in sorted(geo["G"].items()):
        for fy, blk, x, sp in e["rows"]:
            if sp in FALLBACK_DECODED and (fy, code) not in have:
                added.append({"financial_year": fy, "block_code": blk,
                              "block": sorted(geo["B"].get(blk, {}).get("names", {""}))[-1], "gp_code": code,
                              "gp_name": str(x.get("name") or ""), "totalcount": str(x.get("totalcount", "")),
                              "count_closed": str(x.get("count", "")), "source_file": sp,
                              "_origin": "added in validation: original not UTF-8, skipped by egs_clean.py",
                              "_rid": f"gp_year_book_closed:{fy}|{blk}|{code}"})
    T["gp_year_book_closed"] = sorted((T["gp_year_book_closed"] or []) + added,
                                      key=lambda r: (r["financial_year"], r["block_code"], r["gp_code"]))
    R.check("P2", "G", "getMobileData JSON", "encoding", "all", "", "every getMobileData response decodes as UTF-8; "
            "those that do not are decoded as cp1252 (a non-breaking space byte in a name), listed, and their GP rows "
            "restored to the validated gp_year_book_closed", len(FALLBACK_DECODED) or 1, len(FALLBACK_DECODED),
            PASS if not FALLBACK_DECODED else WARNING,
            f"{len(FALLBACK_DECODED)} files: " + " ".join(sorted(FALLBACK_DECODED)) + f"; {len(added)} GP rows restored")
    for sp in sorted(FALLBACK_DECODED):
        R.exc("P2", "gp_year_book_closed", "", sp, "encoding", "cp1252", "UTF-8", WARNING,
              "response not UTF-8; skipped by egs_clean.py; rows restored in the validated layer", sp)


# ====================================================================== workstream B: financial validation
FIN_FIELDS = {
    "state_year_summary": ["panchayats", "panchayats_with_vouchers", "receipt_vouchers", "payment_vouchers",
                           "receipt_amount_rs", "payment_amount_rs", "with_month_book_closed", "with_year_book_closed"],
    "district_finance": [f"{t}_{m}" for t in TIERS for m in ("ob_plus_receipts_cr", "payments_cr", "receipts_rs",
                                                             "payments_rs")],
    "block_finance": [f"{t}_{m}" for t in TIERS for m in ("ob_plus_receipts_cr", "payments_cr", "receipts_rs",
                                                          "payments_rs")],
    "gp_finance": ["receipts_rs", "payments_rs"],
    "district_scheme_finance": ["rv", "pv", "cv", "jv", "receipts_rs", "payments_rs"],
    "monthly_finance": ["receipts_rs", "receipt_cancellation_rs", "ob_cancellation_rs", "payments_rs",
                        "payment_cancellation_rejected_rs"],
    "monthly_vouchers": ["receipts", "payments", "contra", "journal"],
}
LABEL_COL = {"state_year_summary": None, "district_finance": "district", "block_finance": "block",
             "gp_finance": "gp_name_as_served", "district_scheme_finance": "district", "monthly_finance": "month",
             "monthly_vouchers": "month", "district_accounting_status": "district", "block_accounting_status": "block",
             "gp_accounting_status": "gp_name_as_served"}
VOUCH = re.compile(r"(RV|PV|CV|JV)-(\d+)")


def row_values(r):
    vals = []
    for c in r["cells"][1:]:
        n = num(c)
        if n is not None:
            vals.append(float(n))
        lead = re.match(r"\s*(\d+)\s*/", c)
        if lead:
            vals.append(float(lead.group(1)))
        vals += [float(x) for _, x in VOUCH.findall(c)]
    return vals


def verify_against_source(T, R, flags):
    """B1/D2: every stored value is re-found in the same row of the original page."""
    for d, fields in list(FIN_FIELDS.items()) + [
            ("district_accounting_status", [c for c in (T["district_accounting_status"] or [{}])[0] if
                                            re.search(r"(_rv|_pv|_cv|_jv|^bps|^gps)", c) and c != "gps_with_vouchers"]),
            ("block_accounting_status", [c for c in (T["block_accounting_status"] or [{}])[0] if
                                         re.search(r"(_rv|_pv|_cv|_jv|^gps)", c)]),
            ("gp_accounting_status", ["rv", "pv", "cv", "jv"])]:
        rows = T[d] or []
        n_ok = n_missing = n_bad = n_vals = 0
        for r in rows:
            label = "BIHAR" if d == "state_year_summary" else r[LABEL_COL[d]]
            if d == "district_scheme_finance" and label.startswith("BIHAR"):
                label = "Bihar"
            cand = rows_labelled(src(r), label, anywhere=d in ("state_year_summary", "district_scheme_finance"))
            want = [(c, fnum(r[c])) for c in fields if c in r and fnum(r[c]) is not None]
            if d == "state_year_summary":  # one row per tier in the source row; values sit in tier blocks
                cand = [c for c in cand if c["cells"]]
            n_vals += len(want)
            if not cand:
                n_missing += 1
                flags[(d, id(r))].add("B1")
                R.exc("B1", d, r.get("financial_year", ""), r.get("_rid", ""), "(row)", label, "row on page",
                      FAIL, "row label not found on the original page", r.get("source_file", ""))
                continue
            got = [v for c in cand for v in row_values(c)]
            bad = [(c, v) for c, v in want if not any(abs(v - g) <= 1e-6 * max(1, abs(g)) for g in got)]
            if bad:
                n_bad += 1
                flags[(d, id(r))].add("B1")
                for c, v in bad:
                    R.exc("B1", d, r.get("financial_year", ""), r.get("_rid", ""), c, fmt(v), "a value in the same "
                          "row of the original page", FAIL, "stored value not found in source row", r.get("source_file", ""))
            else:
                n_ok += 1
            for c in [c for c in r if c.endswith("_as_served") and r[c]]:
                look = rows_labelled(src(r), "Opening Balance") if c == "opening_balance_as_served" else cand
                if not any(r[c] == cell for x in look for cell in x["cells"]):
                    flags[(d, id(r))].add("B1")
                    R.exc("B1", d, r.get("financial_year", ""), r.get("_rid", ""), c, r[c], "identical cell text",
                          FAIL, "as-served text not found verbatim in the source row", r.get("source_file", ""))
        ws = "D" if "accounting" in d else "B"
        R.check(f"{ws}1-{d}" if ws == "B" else f"D2-{d}", ws, d, ", ".join(fields)[:200], LEVEL[d], "all",
                "every stored value re-read from the same row of the cited original page (independent HTML reader; "
                "rowspan ignored) and matched exactly; as-served text matched verbatim", len(rows), n_missing + n_bad,
                PASS if not (n_missing or n_bad) else FAIL,
                f"{n_ok} rows verified ({n_vals} values); {n_missing} rows not found on page; {n_bad} rows with a "
                "value not found")


def format_checks(T, R, flags):
    """B2: Indian number formats parse to the stored number."""
    for d in ("state_year_summary", "gp_finance", "district_scheme_finance", "monthly_finance"):
        rows = T[d] or []
        pairs = [(c, c.replace("_as_served", "_rs") if not c.startswith("opening") else "opening_balance_rs")
                 for c in (rows[0] if rows else {}) if c.endswith("_as_served") and c != "gp_name_as_served"]
        pairs = [(a, "receipt_amount_rs" if a == "receipt_amount_as_served" else
                  "payment_amount_rs" if a == "payment_amount_as_served" else b) for a, b in pairs]
        kinds, bad, tested = collections.Counter(), 0, 0
        for r in rows:
            for a, b in pairs:
                if not r.get(a):
                    if r.get(b):
                        bad += 1
                        R.exc("B2", d, r.get("financial_year", ""), r.get("_rid", ""), b, r[b], "as-served text",
                              FAIL, "number without its as-served text")
                    continue
                tested += 1
                kinds[grouping(r[a])] += 1
                n = num(r[a])
                if n is None or fnum(r[b]) is None or abs(float(n) - fnum(r[b])) > 1e-6:
                    bad += 1
                    flags[(d, id(r))].add("B2")
                    R.exc("B2", d, r.get("financial_year", ""), r.get("_rid", ""), b, r.get(b), r[a], FAIL,
                          "parsed number differs from as-served text")
        R.check(f"B2-{d}", "B", d, ", ".join(a for a, _ in pairs), LEVEL[d], "all",
                "as-served text present for every parsed amount, and commas-removed text equals the stored number",
                tested, bad, PASS if not bad else FAIL,
                "digit grouping seen: " + ", ".join(f"{k or 'empty'} {v}" for k, v in sorted(kinds.items())))
        if kinds.get("other"):
            R.check(f"B2b-{d}", "B", d, "*_as_served", LEVEL[d], "all", "unrecognised digit grouping", tested,
                    kinds["other"], WARNING)


def unit_checks(T, R, flags):
    """B3: cr columns filled only where the page prints '(Cr)'; rs columns only where it does not."""
    for d in ("district_finance", "block_finance"):
        bad = tested = 0
        cache = {}
        for r in T[d] or []:
            sf = r["source_file"]
            if sf not in cache:
                cache[sf] = "(Cr)" in page_text(ROOT / sf)
            has_cr = any(r[f"{t}_ob_plus_receipts_cr"] or r[f"{t}_payments_cr"] for t in TIERS)
            has_rs = any(r[f"{t}_receipts_rs"] or r[f"{t}_payments_rs"] for t in TIERS)
            tested += 1
            if (has_cr and not cache[sf]) or (has_rs and cache[sf]) or (has_cr and has_rs):
                bad += 1
                flags[(d, id(r))].add("B3")
                R.exc("B3", d, r["financial_year"], r["_rid"], "unit", "cr" if has_cr else "rs",
                      "page heading unit", FAIL, "unit columns do not match the page headings", sf)
        R.check(f"B3-{d}", "B", d, "*_cr / *_rs", LEVEL[d], "all",
                "Rs crore columns filled only when the source page prints '(Cr)' headings, rupee columns only when "
                "it does not, never both in one row", tested, bad, PASS if not bad else FAIL)


def missing_and_ranges(T, R, flags):
    """B5/B6: empty values by field and year (classified), negatives, unusually large amounts."""
    for d in ("district_finance", "block_finance", "gp_finance", "state_year_summary", "district_scheme_finance",
              "monthly_finance"):
        rows = T[d] or []
        fields = [c for c in FIN_FIELDS[d] if AMOUNT.search(c)]
        empty_unexpected = 0
        for r in rows:
            layout_cr = any(r.get(f"{t}_ob_plus_receipts_cr") for t in TIERS) if d in ("district_finance",
                                                                                     "block_finance") else None
            for c in fields:
                if r.get(c, "") != "":
                    continue
                if layout_cr is not None and (c.endswith("_cr") != bool(layout_cr)):
                    continue  # the other layout's column: not applicable
                if d in ("district_finance", "block_finance") and c.startswith("zp_") and d == "block_finance":
                    continue  # block pages carry BP and GP tiers only
                empty_unexpected += 1
                R.exc("B5", d, r.get("financial_year", ""), r.get("_rid", ""), c, "", "a value", WARNING,
                      "empty in the source layout where a value is expected (left empty, not 0)", r.get("source_file", ""))
        R.check(f"B5-{d}", "B", d, ", ".join(fields), LEVEL[d], "all",
                "empty amount cells, excluding columns that the year's layout does not have (not applicable) and the "
                "ZP tier on block pages", len(rows), empty_unexpected, PASS if not empty_unexpected else WARNING,
                "empty values are kept empty; never set to 0")
        neg = big = 0
        groups = collections.defaultdict(list)
        for r in rows:
            if is_total(r, d):
                continue
            for c in fields:
                v = fnum(r.get(c))
                if v is None:
                    continue
                if v < 0:
                    neg += 1
                    flags[(d, id(r))].add("B6")
                    R.exc("B6", d, r.get("financial_year", ""), r.get("_rid", ""), c, fmt(v), ">= 0", WARNING,
                          "negative amount", r.get("source_file", ""))
                groups[(r.get("financial_year", ""), r.get("tier", ""), r.get("entity", ""), c)].append((v, r))
        for g, vals in sorted(groups.items(), key=lambda x: x[0]):
            xs = sorted(v for v, _ in vals if v > 0)  # many zeros (inactive months) would make any payment look large
            if len(xs) < 20:
                continue
            q1, q3 = xs[len(xs) // 4], xs[(3 * len(xs)) // 4]
            med = statistics.median(xs)
            limit = q3 + 10 * (q3 - q1)
            for v, r in vals:
                if v > limit and v > 50 * max(med, 1):
                    big += 1
                    flags[(d, id(r))].add("B6")
                    R.exc("B6", d, g[0], r.get("_rid", ""), g[3], fmt(v), f"<= {fmt(limit)} (Q3 + 10 x IQR)",
                          WARNING, "unusually large compared with the same year, field and tier; not changed",
                          r.get("source_file", ""))
        R.check(f"B6-{d}", "B", d, ", ".join(fields), LEVEL[d], "all",
                "negative amounts; amounts above Q3 + 10 x IQR and 50 x the median of the non-zero values of the same "
                "year, field and tier (portal total rows excluded)", len(rows), neg + big, PASS if not (neg or big) else WARNING,
                f"{neg} negative, {big} unusually large (listed for review, values unchanged)")


def totals_check(T, R):
    for d in ("district_finance", "block_finance", "gp_finance", "district_accounting_status",
              "block_accounting_status", "gp_accounting_status"):
        rows = T[d] or []
        tot = [r for r in rows if is_total(r, d)]
        coded = [r for r in tot if r.get("_gp_code") or r.get("_block_code") or r.get("_district_code")]
        R.check(f"B7-{d}", "B", d, LABEL_COL.get(d, ""), LEVEL[d], "all",
                "rows printed by the portal as 'Total' are flagged is_portal_total=yes and carry no geographic code, "
                "so they are not counted as individual units", len(rows), len(coded), PASS if not coded else FAIL,
                f"{len(tot)} portal total rows flagged")


# ---------------------------------------------------------------------- reconciliation
def dec_of(*strs):
    """Fewest decimals among the printed values (CSV text): the coarsest rounding sets the tolerance."""
    ds = [len(s.split(".")[1]) if "." in s else 0 for s in strs if s not in ("", None)]
    return min(ds) if ds else 3


def tol(unit, n_children, children_unit, dec=3):
    """Print precision: one unit of the last printed decimal for a single printed parent (the portal may round
    or truncate), with a floor of Rs 10 (0.000001 crore) because the block statement's crore figures differ from
    the exact rupee sums by a few rupees in the 7th decimal; half a unit per printed value when printed values
    are summed."""
    if unit == "cr":
        return (max(10 ** -dec, 1e-6) if children_unit == "rs" else 0.5 * 10 ** -dec * (n_children + 1)) + 1e-9
    if unit == "count":
        return 0
    return 0.005 * (n_children + 1) + 1e-6


def recon_row(R, recs, cid, dataset, fy, child_level, parent_level, unit_id, measure, child_sum, n, parent,
              unit, child_unit, child_gen, parent_gen, definitions, compatible, source, dec=3):
    if parent is None or child_sum is None:
        st, diff, t = NOT_TESTABLE, "", ""
    else:
        cs = child_sum / 1e7 if (unit == "cr" and child_unit == "rs") else child_sum
        diff = cs - parent
        t = tol(unit, n, child_unit, dec)
        same_snapshot = bool(child_gen) and child_gen == parent_gen and " to " not in child_gen
        if abs(diff) <= t:
            st = PASS
        elif not compatible:
            st = WARNING
        elif not same_snapshot:
            st = WARNING  # generated at different times: a data change cannot be told apart from an inconsistency
        else:
            st = FAIL
    rec = {"check_id": cid, "dataset": dataset, "financial_year": fy, "child_level": child_level,
           "parent_level": parent_level, "unit_id": unit_id, "measure": measure, "children": n,
           "child_sum": fmt(child_sum / 1e7 if (unit == "cr" and child_unit == "rs" and child_sum is not None)
                            else child_sum), "parent_value": fmt(parent), "unit": "Rs crore" if unit == "cr" else
           ("count" if unit == "count" else "Rs"), "difference": fmt(diff) if diff != "" else "",
           "tolerance": fmt(t) if t != "" else "", "child_generated_on": child_gen, "parent_generated_on": parent_gen,
           "definitions": definitions, "definitions_compatible": "yes" if compatible else "no", "status": st,
           "source": source}
    recs.append(rec)
    if st in (FAIL, WARNING):
        R.exc(cid, dataset, fy, unit_id, measure, rec["child_sum"], rec["parent_value"], st,
              f"difference {rec['difference']} {rec['unit']}; " + (definitions if not compatible else
              "same report snapshot" if st == FAIL else f"reports generated at different times ({child_gen} / "
              f"{parent_gen})"), source)
    return st


def gsum(rows, c):
    vals = [fnum(r.get(c)) for r in rows]
    vals = [v for v in vals if v is not None]
    return (sum(vals) if vals else None), len(vals)


def gd(rows):
    """Generation time(s) of the rows' reports, to the minute."""
    return ts_span([r.get("report_generated_on", "") for r in rows])


def reconcile(T, R):
    recs = []
    gp = [r for r in T["gp_finance"] or []]
    by_block = collections.defaultdict(list)
    for r in gp:
        by_block[(r["financial_year"], r["block_code"])].append(r)
    dist_fin = {(r["financial_year"], r["_district_code"]): r for r in T["district_finance"] or [] if r["_district_code"]}
    dist_tot = {r["financial_year"]: r for r in T["district_finance"] or [] if is_total(r, "")}
    block_fin = {(r["financial_year"], r["_block_code"]): r for r in T["block_finance"] or [] if r["_block_code"]}
    # R1 GP rows vs the village page's own Total row
    for (fy, b), rows in sorted(by_block.items()):
        kids = [r for r in rows if not is_total(r, "")]
        tot = [r for r in rows if is_total(r, "")]
        for m in ("receipts_rs", "payments_rs"):
            s, n = gsum(kids, m)
            recon_row(R, recs, "R1", "gp_finance", fy, "gram panchayat", "block (village page Total row)", b, m, s, n,
                      fnum(tot[0][m]) if tot else None, "rs", "rs", gd(kids), gd(tot),
                      "same page, same columns", True, kids[0]["source_file"] if kids else "")
    # R2 GP rows vs district statement (gp tier) and R3 vs block statement (gp tier)
    by_dist = collections.defaultdict(list)
    for r in gp:
        if not is_total(r, ""):
            by_dist[(r["financial_year"], r["district_code"])].append(r)
    for (fy, dcode), kids in sorted(by_dist.items()):
        p = dist_fin.get((fy, dcode))
        for m_child, (m_cr, m_rs) in (("receipts_rs", ("gp_ob_plus_receipts_cr", "gp_receipts_rs")),
                                      ("payments_rs", ("gp_payments_cr", "gp_payments_rs"))):
            s, n = gsum(kids, m_child)
            if p is not None and p.get(m_cr):
                pv, unit, defs, comp = fnum(p[m_cr]), "cr", ("village page 'Receipts' vs district 'OB + Receipts (Cr)'"
                                                           if "receipts" in m_child else
                                                           "village page 'Payments' vs district 'Payments (Cr)'"), \
                    "payments" in m_child
            elif p is not None:
                pv, unit, defs, comp = fnum(p.get(m_rs)), "rs", "same labels ('Receipts'/'Payments') on both pages", True
            else:
                pv, unit, defs, comp = None, "rs", "district row not available", False
            recon_row(R, recs, "R2", "gp_finance", fy, "gram panchayat", "district (gp tier)", dcode, m_child, s, n, pv,
                      unit, "rs", gd(kids), gd([p]) if p else "", defs, comp, p["source_file"] if p else "",
                      dec_of(p.get(m_cr, "")) if p else 3)
    for (fy, b), rows in sorted(by_block.items()):
        kids = [r for r in rows if not is_total(r, "")]
        p = block_fin.get((fy, b))
        for m_child, (m_cr, m_rs) in (("receipts_rs", ("gp_ob_plus_receipts_cr", "gp_receipts_rs")),
                                      ("payments_rs", ("gp_payments_cr", "gp_payments_rs"))):
            s, n = gsum(kids, m_child)
            if p is not None and p.get(m_cr):
                pv, unit, comp = fnum(p[m_cr]), "cr", "payments" in m_child
                defs = "village 'Receipts' vs block 'OB + Receipts (Cr)'" if comp is False else \
                    "village 'Payments' vs block 'Payments (Cr)'"
            elif p is not None:
                pv, unit, comp, defs = fnum(p.get(m_rs)), "rs", True, "same labels on both pages"
            else:
                pv, unit, comp, defs = None, "rs", False, "block row not available"
            recon_row(R, recs, "R3", "gp_finance", fy, "gram panchayat", "block (gp tier)", b, m_child, s, n, pv, unit,
                      "rs", gd(kids), gd([p]) if p else "", defs, comp, p["source_file"] if p else "",
                      dec_of(p.get(m_cr, "")) if p else 3)
    # R4/R5 block statement vs district statement; R6 districts vs district Total
    by_bd = collections.defaultdict(list)
    for r in T["block_finance"] or []:
        by_bd[(r["financial_year"], r["district_code"])].append(r)
    for (fy, dcode), rows in sorted(by_bd.items()):
        kids = [r for r in rows if not is_total(r, "")]
        tot = [r for r in rows if is_total(r, "")]
        p = dist_fin.get((fy, dcode))
        for t in ("bp", "gp"):
            for m in ("ob_plus_receipts_cr", "payments_cr", "receipts_rs", "payments_rs"):
                c = f"{t}_{m}"
                s, n = gsum(kids, c)
                if s is None:
                    continue
                unit = "cr" if c.endswith("_cr") else "rs"
                dd = dec_of(*[k[c] for k in kids], p.get(c, "") if p else "", tot[0].get(c, "") if tot else "")
                recon_row(R, recs, "R4", "block_finance", fy, "block", "district", dcode, c, s, n,
                          fnum(p.get(c)) if p else None, unit, unit, gd(kids), gd([p]) if p else "",
                          "same columns", True, p["source_file"] if p else "", dd)
                recon_row(R, recs, "R5", "block_finance", fy, "block", "district (block page Total row)", dcode, c, s, n,
                          fnum(tot[0].get(c)) if tot else None, unit, unit, gd(kids), gd(tot), "same page, same columns",
                          True, kids[0]["source_file"] if kids else "", dd)
    for fy in sorted({r["financial_year"] for r in T["district_finance"] or []}):
        kids = [r for r in T["district_finance"] if r["financial_year"] == fy and not is_total(r, "")]
        tot = dist_tot.get(fy)
        for t in TIERS:
            for m in ("ob_plus_receipts_cr", "payments_cr", "receipts_rs", "payments_rs"):
                c = f"{t}_{m}"
                s, n = gsum(kids, c)
                if s is None:
                    continue
                unit = "cr" if c.endswith("_cr") else "rs"
                recon_row(R, recs, "R6", "district_finance", fy, "district", "state (district page Total row)", "10", c,
                          s, n, fnum(tot.get(c)) if tot else None, unit, unit, gd(kids), gd([tot]) if tot else "",
                          "same page, same columns", True, tot["source_file"] if tot else "",
                          dec_of(*[k[c] for k in kids], tot.get(c, "") if tot else ""))
    # R7 GP / district totals vs State & Year Wise Summary
    ss = {(r["financial_year"], r["tier"]): r for r in T["state_year_summary"] or []}
    for fy in sorted({r["financial_year"] for r in gp}):
        kids = [r for r in gp if r["financial_year"] == fy and not is_total(r, "")]
        p = ss.get((fy, "gp"))
        for mc, mp, lab in (("receipts_rs", "receipt_amount_rs", "'Receipts' (village pages) vs 'Receipt Amount (In Rs.)'"),
                            ("payments_rs", "payment_amount_rs", "'Payments' vs 'Payment Amount (In Rs.)'")):
            s, n = gsum(kids, mc)
            recon_row(R, recs, "R7", "gp_finance", fy, "gram panchayat", "state (State & Year Wise Summary)", "10", mc,
                      s, n, fnum(p[mp]) if p else None, "rs", "rs", gd(kids), gd([p]) if p else "", lab, True,
                      p["source_file"] if p else "")
    for fy, tot in sorted(dist_tot.items()):
        for t in TIERS:
            p = ss.get((fy, t))
            if not p:
                continue
            for mc_cr, mc_rs, mp, recv in ((f"{t}_ob_plus_receipts_cr", f"{t}_receipts_rs", "receipt_amount_rs", True),
                                           (f"{t}_payments_cr", f"{t}_payments_rs", "payment_amount_rs", False)):
                if tot.get(mc_cr):
                    cv, unit, comp = fnum(tot[mc_cr]), "cr", not recv
                    defs = ("district 'OB + Receipts (Cr)' vs summary 'Receipt Amount (In Rs.)': opening balance "
                            "included on one side only" if recv else "'Payments (Cr)' vs 'Payment Amount (In Rs.)'")
                    pv = fnum(p[mp]) / 1e7 if fnum(p[mp]) is not None else None
                    recon_row(R, recs, "R8", "district_finance", fy, "state (district page Total)", "state (summary)",
                              f"10/{t}", mc_cr, cv, 1, pv, "cr", "cr", gd([tot]), gd([p]), defs, comp, p["source_file"],
                              dec_of(tot[mc_cr]))
                elif tot.get(mc_rs):
                    recon_row(R, recs, "R8", "district_finance", fy, "state (district page Total)", "state (summary)",
                              f"10/{t}", mc_rs, fnum(tot[mc_rs]), 1, fnum(p[mp]), "rs", "rs", gd([tot]), gd([p]),
                              "'Receipts'/'Payments' vs 'Receipt/Payment Amount (In Rs.)'", True, p["source_file"])
    # R9 scheme districts vs Bihar state row
    sch = collections.defaultdict(list)
    for r in T["district_scheme_finance"] or []:
        sch[(r["financial_year"], r["scheme_code"], r["tier"])].append(r)
    for (fy, s_code, t), rows in sorted(sch.items()):
        kids = [r for r in rows if not r["district"].startswith("BIHAR") and not is_total(r, "")]
        st = [r for r in rows if r["district"].startswith("BIHAR")]
        if not kids or not st:
            continue
        for m in ("receipts_rs", "payments_rs", "rv", "pv", "cv", "jv"):
            s, n = gsum(kids, m)
            unit = "count" if m in ("rv", "pv", "cv", "jv") else "rs"
            recon_row(R, recs, "R9", "district_scheme_finance", fy, "district", "state (all-states scheme page)",
                      f"{s_code}/{t}", m, s, n, fnum(st[0].get(m)), unit, unit, gd(kids), gd(st),
                      "same columns on both pages", True, st[0]["source_file"])
    # R10 month-wise statement vs annual statement of the same body (exploratory formulas)
    mon = collections.defaultdict(list)
    for r in T["monthly_finance"] or []:
        mon[(r["financial_year"], r["entity"], r["entity_code"])].append(r)
    for (fy, ent, code), rows in sorted(mon.items()):
        p = dist_fin.get((fy, code)) if ent == "zp" else block_fin.get((fy, code))
        if p is None:
            continue
        ob = fnum(rows[0]["opening_balance_rs"])
        rec, _ = gsum(rows, "receipts_rs")
        rc, _ = gsum(rows, "receipt_cancellation_rs")
        oc, _ = gsum(rows, "ob_cancellation_rs")
        pay, _ = gsum(rows, "payments_rs")
        pc, _ = gsum(rows, "payment_cancellation_rejected_rs")
        if p.get(f"{ent}_ob_plus_receipts_cr"):
            target_r, target_p, unit = fnum(p[f"{ent}_ob_plus_receipts_cr"]), fnum(p[f"{ent}_payments_cr"]), "cr"
            fa = (ob or 0) + (rec or 0)
            fb = fa - (rc or 0) - (oc or 0)
            labels = ("OB + sum(Receipts)", "OB + sum(Receipts - Receipt Cancellation - OB Cancellation)")
        else:
            target_r, target_p, unit = fnum(p.get(f"{ent}_receipts_rs")), fnum(p.get(f"{ent}_payments_rs")), "rs"
            fa, fb = (rec or 0), (rec or 0) - (rc or 0)
            labels = ("sum(Receipts)", "sum(Receipts - Receipt Cancellation)")
        dd = dec_of(p.get(f"{ent}_ob_plus_receipts_cr", "")) if unit == "cr" else 3
        best = None
        for f, lab in ((fa, labels[0]), (fb, labels[1])):
            if target_r is not None and abs((f / 1e7 if unit == "cr" else f) - target_r) <= tol(unit, 1, "rs", dd):
                best = (f, lab)
                break
        f, lab = best or (fa, labels[0] + " (no tested formula matched)")
        recon_row(R, recs, "R10", "monthly_finance", fy, "month", "annual statement (same body)", f"{ent}/{code}",
                  "receipts: " + lab, f, len(rows), target_r, unit, "rs", gd(rows), gd([p]),
                  "month-wise columns vs annual statement; cancellation columns are not defined on the page", False,
                  p["source_file"], dd)
        best = None
        for f, labp in ((pay or 0, "sum(Payments)"), ((pay or 0) - (pc or 0), "sum(Payments - Payment Cancellation/Rejected)")):
            if target_p is not None and abs((f / 1e7 if unit == "cr" else f) - target_p) <= tol(unit, 1, "rs", dd):
                best = (f, labp)
                break
        f, labp = best or (pay or 0, "sum(Payments) (no tested formula matched)")
        recon_row(R, recs, "R10", "monthly_finance", fy, "month", "annual statement (same body)", f"{ent}/{code}",
                  "payments: " + labp, f, len(rows), target_p, unit, "rs", gd(rows), gd([p]),
                  "month-wise columns vs annual statement", False, p["source_file"], dd)
    # summarise per check
    for cid, what in (("R1", "GP rows sum to the village page's own Total row"),
                      ("R2", "GP rows of a district sum to the district statement's Village Panchayat column"),
                      ("R3", "GP rows of a block sum to the block statement's Village Panchayat column"),
                      ("R4", "block rows of a district sum to the district statement row"),
                      ("R5", "block rows sum to the block page's own Total row"),
                      ("R6", "district rows sum to the district page's Total row"),
                      ("R7", "2020-21 / 2024-25 GP rows sum to the State & Year Wise Summary"),
                      ("R8", "district page Total vs State & Year Wise Summary, per tier"),
                      ("R9", "scheme district rows sum to Bihar's row on the all-states scheme page"),
                      ("R10", "month-wise statement of a ZP / BP body vs its annual statement")):
        rs = [x for x in recs if x["check_id"] == cid]
        c = collections.Counter(x["status"] for x in rs)
        st = FAIL if c[FAIL] else WARNING if c[WARNING] else PASS if c[PASS] else NOT_TESTABLE
        R.check(cid, "B", rs[0]["dataset"] if rs else "", "receipts / payments", "", " ".join(sorted({x["financial_year"]
                for x in rs})), what + " (tolerance = print rounding; snapshot dates and definitions recorded)",
                len(rs), c[FAIL] + c[WARNING] + c[NOT_TESTABLE], st,
                ", ".join(f"{k} {v}" for k, v in sorted(c.items())))
    return recs


# ====================================================================== workstream D: accounting status
def accounting(T, geo, prov, R):
    comp = []
    # D1 domains
    for d in ("district_accounting_status", "block_accounting_status", "gp_accounting_status"):
        rows = T[d] or []
        yn = [c for c in (rows[0] if rows else {}) if re.search(r"(entered_masters|entered_opening_balance|"
                                                                 r"day_book_closed|month_book_closed|year_book_closed)$", c)
              and not c.startswith(("gps_", "bps_"))]
        cnt = [c for c in (rows[0] if rows else {}) if re.search(r"(^gps|^bps|_rv$|_pv$|_cv$|_jv$|^rv$|^pv$|^cv$|^jv$)", c)]
        values = collections.Counter(r[c] for r in rows for c in yn)
        bad_yn = sum(n for v, n in values.items() if v.lower() not in YES_NO and v != "")
        empty_yn = values.get("", 0)
        bad_cnt = sum(1 for r in rows for c in cnt if r[c] != "" and (fnum(r[c]) is None or fnum(r[c]) < 0 or
                                                                    fnum(r[c]) != int(fnum(r[c]))))
        R.check(f"D1-{d}", "D", d, ", ".join(yn), LEVEL[d], "all",
                "closure/entry fields hold only 'yes' or 'no' (empty kept empty); counts are whole numbers >= 0",
                len(rows), bad_yn + bad_cnt, PASS if not (bad_yn or bad_cnt) else FAIL,
                "values seen: " + ", ".join(f"{k or 'empty'} {v}" for k, v in sorted(values.items())) +
                f"; {empty_yn} empty status cells")
    # D3 plausibility
    for d in ("district_accounting_status", "block_accounting_status"):
        rows = [r for r in T[d] or [] if not is_total(r, d)]
        bad = 0
        for r in rows:
            for base in ("gps", "bps"):
                tot = fnum(r.get(base))
                for c in [c for c in r if c.startswith(base + "_with")]:
                    v = fnum(r[c])
                    if tot is not None and v is not None and v > tot:
                        bad += 1
                        R.exc("D3", d, r["financial_year"], r["_rid"], c, fmt(v), f"<= {base} ({fmt(tot)})", FAIL,
                              "more Panchayats at a stage than Panchayats in the unit", r["source_file"])
        R.check(f"D3-{d}", "D", d, "gps_with_*, bps_with_*", LEVEL[d], "all",
                "number of Panchayats at each stage is not above the number of Panchayats in the unit", len(rows), bad,
                PASS if not bad else FAIL)
    seq_bad = 0
    for r in T["gp_accounting_status"] or []:
        if r["year_book_closed"] == "yes" and r["month_book_closed"] == "no":
            seq_bad += 1
    R.check("D3-gp_accounting_status", "D", "gp_accounting_status", "year_book_closed, month_book_closed",
            "gram panchayat", "2020-2021 2024-2025",
            "observation: year book closed while month book is shown not closed (the portal does not state that one "
            "implies the other, so this is not a failure)", len(T["gp_accounting_status"] or []), seq_bad,
            PASS if not seq_bad else WARNING)
    # D4 GP -> block aggregation
    blocks = {(r["financial_year"], r["_block_code"]): r for r in T["block_accounting_status"] or [] if r["_block_code"]}
    by = collections.defaultdict(list)
    for r in T["gp_accounting_status"] or []:
        by[(r["financial_year"], r["block_code"])].append(r)
    pairs = [("entered_masters", "gps_with_master_entry"), ("entered_opening_balance", "gps_with_opening_balance"),
             ("day_book_closed", "gps_with_day_book_closed"), ("month_book_closed", "gps_with_month_book_closed"),
             ("year_book_closed", "gps_with_year_book_closed")]
    n = bad = snap = 0
    for (fy, b), rows in sorted(by.items()):
        p = blocks.get((fy, b))
        if not p:
            continue
        same = ts_span([x["report_generated_on"] for x in rows]) == ts_span([p["report_generated_on"]])
        checks = [(gp_f, sum(1 for x in rows if x[gp_f] == "yes"), fnum(p[bl_f])) for gp_f, bl_f in pairs]
        checks += [("gps", len(rows), fnum(p["gps"]))]
        checks += [(v, sum(fnum(x[v]) or 0 for x in rows), fnum(p[f"gp_{v}"])) for v in ("rv", "pv", "cv", "jv")]
        for f, s, pv in checks:
            n += 1
            if pv is None or s != pv:
                if same:
                    bad += 1
                else:
                    snap += 1
                R.exc("D4", "gp_accounting_status", fy, b, f, fmt(s), fmt(pv), FAIL if same else WARNING,
                      "GP rows do not add up to the block summary" + (" (same generation time)" if same else
                      f" (generated at different times: GP page {ts_span([x['report_generated_on'] for x in rows])}, "
                      f"block page {ts_span([p['report_generated_on']])})"), p["source_file"])
    R.check("D4", "D", "gp_accounting_status", "yes counts, gps, rv/pv/cv/jv", "gram panchayat -> block",
            "2020-2021 2024-2025", "count of 'yes' and voucher sums over a block's GP rows equal the block summary's "
            "gps_with_* and gp_rv/pv/cv/jv", n, bad + snap, FAIL if bad else WARNING if snap else PASS,
            f"{bad} differences between reports generated at the same minute, {snap} between reports generated at "
            "different times")
    # D4b block -> district aggregation
    dist = {(r["financial_year"], r["_district_code"]): r for r in T["district_accounting_status"] or [] if r["_district_code"]}
    byd = collections.defaultdict(list)
    for r in T["block_accounting_status"] or []:
        if not is_total(r, ""):
            byd[(r["financial_year"], r["district_code"])].append(r)
    n = bad = snap = 0
    for (fy, dc), rows in sorted(byd.items()):
        p = dist.get((fy, dc))
        if not p:
            continue
        same = ts_span([x["report_generated_on"] for x in rows]) == ts_span([p["report_generated_on"]])
        checks = [(c, sum(fnum(x[c]) or 0 for x in rows), fnum(p.get(c))) for c in
                  ("gps", "gps_with_master_entry", "gps_with_opening_balance", "gps_with_day_book_closed",
                   "gps_with_month_book_closed", "gps_with_year_book_closed", "gp_rv", "gp_pv", "gp_cv", "gp_jv")]
        checks += [("bps", len(rows), fnum(p.get("bps")))]
        checks += [(f"bps_with_{s}", sum(1 for x in rows if x[f"bp_{f}"] == "yes"), fnum(p.get(f"bps_with_{s}")))
                   for f, s in (("entered_masters", "master_entry"), ("entered_opening_balance", "opening_balance"),
                                ("day_book_closed", "day_book_closed"), ("month_book_closed", "month_book_closed"),
                                ("year_book_closed", "year_book_closed"))]
        for f, s, pv in checks:
            if pv is None:
                continue
            n += 1
            if s != pv:
                if same:
                    bad += 1
                else:
                    snap += 1
                R.exc("D4b", "block_accounting_status", fy, dc, f, fmt(s), fmt(pv), FAIL if same else WARNING,
                      "block rows do not add up to the district summary" + (" (same generation time)" if same else
                      " (generated at different times)"),
                      p["source_file"])
    R.check("D4b", "D", "block_accounting_status", "gps*, bps*, gp_rv..jv", "block -> district", "all",
            "block rows of a district add up to the district summary (GP counts, voucher counts, BP 'yes' counts)",
            n, bad + snap, FAIL if bad else WARNING if snap else PASS,
            f"{bad} differences between reports generated at the same minute, {snap} between reports generated at "
            "different times")
    # D5 static village summary vs getMobileData (per GP), and state-level year-book figures
    api = {(r["financial_year"], r["gp_code"]): r for r in T["gp_year_book_closed"] or []}
    n = diff = 0
    for r in T["gp_accounting_status"] or []:
        g = r.get("_gp_code")
        if not g or (r["financial_year"], g) not in api:
            continue
        a = api[(r["financial_year"], g)]
        n += 1
        api_closed = "yes" if fnum(a["count_closed"]) and fnum(a["count_closed"]) >= 1 else "no"
        if api_closed != r["year_book_closed"]:
            diff += 1
            R.exc("D5", "gp_accounting_status", r["financial_year"], g, "year_book_closed", r["year_book_closed"],
                  api_closed, WARNING, f"static page generated {gen_date(r['report_generated_on'])} vs getMobileData "
                  f"retrieved {(prov.get(a['source_file'], {}).get('retrieved_at_ist') or '')[:10]}", r["source_file"])
    R.check("D5", "D", "gp_accounting_status", "year_book_closed", "gram panchayat", "2020-2021 2024-2025",
            "per GP: year book closed on the static Village Wise Summary vs getMobileData count (matched by "
            "validated GP code); a difference is a snapshot difference, not an error", n, diff,
            PASS if not diff else WARNING, f"{diff} GPs differ")
    for fy in sorted({r["financial_year"] for r in T["state_year_summary"] or []}):
        s = next((r for r in T["state_year_summary"] if r["financial_year"] == fy and r["tier"] == "gp"), None)
        da = [r for r in T["district_accounting_status"] or [] if r["financial_year"] == fy and r["_district_code"]]
        ga = [r for r in T["gp_accounting_status"] or [] if r["financial_year"] == fy and not is_total(r, "")]
        ay = [r for r in T["gp_year_book_closed"] or [] if r["financial_year"] == fy]
        drill = [r for r in T["state_indicators"] or [] if r["endpoint"].startswith("getYearBookDrill") and
                 fy in r["query"] and r["field"] in ("vpcount", "vptcount")]
        dv = {r["field"]: r["value"] for r in drill}
        comp.append({"financial_year": fy,
                     "state_summary_gps": s["panchayats"] if s else "", "state_summary_gps_year_book_closed":
                     s["with_year_book_closed"] if s else "", "state_summary_generated": gd([s]) if s else "",
                     "district_summary_sum_gps": sum(fnum(r["gps"]) or 0 for r in da) if da else "",
                     "district_summary_sum_year_book_closed": sum(fnum(r["gps_with_year_book_closed"]) or 0 for r in da)
                     if da else "", "district_summary_generated": gd(da),
                     "village_summary_gps": len(ga) if ga else "",
                     "village_summary_year_book_closed": sum(1 for r in ga if r["year_book_closed"] == "yes") if ga else "",
                     "village_summary_generated": gd(ga),
                     "getMobileData_gp_rows": len(ay) if ay else "",
                     "getMobileData_closed": sum(fnum(r["count_closed"]) or 0 for r in ay) if ay else "",
                     "getMobileData_retrieved": _retr_span([{"retrieved_at_ist": prov.get(r["source_file"], {})
                                                             .get("retrieved_at_ist", "")} for r in ay]) if ay else "",
                     "getYearBookDrill_vptcount": dv.get("vptcount", ""), "getYearBookDrill_vpcount": dv.get("vpcount", ""),
                     "note": "figures from different snapshots are listed side by side; differences are not errors"})
    for row in comp:  # whole counts as whole numbers
        for k, v in row.items():
            if isinstance(v, float) and v.is_integer():
                row[k] = int(v)
    R.check("D5b", "D", "accounting_snapshot_comparison", "year book closed", "state", "all",
            "state-level year-book closure from the summary, district summaries, village summaries, getMobileData and "
            "getYearBookDrill listed with generation / retrieval dates", len(comp), 0, PASS,
            "see accounting_snapshot_comparison.csv")
    return comp


# ====================================================================== workstream E: administrative indicators
def administrative(T, R):
    rows = T["state_indicators"] or []
    cap = collections.defaultdict(dict)
    srcs = collections.defaultdict(set)
    conflicts = 0
    for r in rows:
        k = (r["endpoint"], r["query"])
        if r["field"] in cap[k] and cap[k][r["field"]] != r["value"]:
            conflicts += 1
            R.exc("E4", "state_indicators", "", "|".join(k), r["field"], r["value"], cap[k][r["field"]], WARNING,
                  "the same request captured twice with different values")
        cap[k][r["field"]] = r["value"]
        srcs[k].add(r["source_file"])
    dup = sum(len(v) - 1 for v in srcs.values())
    R.check("E4", "E", "state_indicators", "all", "state", "",
            "the same endpoint and query captured from several pages: values identical", len(cap), conflicts,
            PASS if not conflicts else WARNING, f"{dup} repeated captures; kept, values compared")
    out = []

    def add(ind, k, val, expected, st, note):
        out.append({"indicator": ind, "endpoint": k[0], "query": k[1], "value": val, "expected_or_compared": expected,
                    "status": st, "note": note})

    tiers = {"ElectedStateReportZp.do": ("zperCount", "zpCount", "Zilla Parishad"),
             "ElectedStateReportBp.do": ("bperCount", "bpCount", "Block Panchayat"),
             "ElectedStateReportGp.do": ("gperCount", "gpCount", "Gram Panchayat")}
    ss = {(r["financial_year"], r["tier"]): r for r in T["state_year_summary"] or []}
    n_sum = bad_sum = 0
    for k, v in sorted(cap.items()):
        ep = k[0]
        if ep in tiers:
            tot_f, cnt_f, lab = tiers[ep]
            parts = [fnum(v.get(x)) for x in ("maleCount", "femaleCount", "otherCount")]
            tot = fnum(v.get(tot_f))
            n_sum += 1
            ok = None not in parts and tot is not None and sum(parts) == tot
            bad_sum += not ok
            add(f"{lab} elected representatives: male + female + other = total", k,
                f"{fmt(parts[0])} + {fmt(parts[1])} + {fmt(parts[2])}", fmt(tot), PASS if ok else FAIL,
                "gender of elected representatives only; not population gender")
            fy = "2026-2027" if "year=2026" in k[1] else ""
            tier = {"Zilla Parishad": "zp", "Block Panchayat": "bp", "Gram Panchayat": "gp"}[lab]
            s = ss.get((fy, tier))
            add(f"{lab}s represented vs State & Year Wise Summary {fy}", k, v.get(cnt_f, ""),
                s["panchayats"] if s else "", WARNING if not s or s["panchayats"] != v.get(cnt_f) else PASS,
                "request parameter year=2026; the response does not state the reference year or date, so the match "
                "to FY 2026-27 is an assumption")
        elif ep == "gpProfileStateReport.do":
            c, g, u = fnum(v.get("count")), fnum(v.get("gpCount")), fnum(v.get("updatedGpCount"))
            add("GPs with profile <= GPs", k, fmt(c), fmt(g), PASS if c is not None and g and c <= g else FAIL,
                "profile completion count only; no population or household field in the response")
            add("GPs with updated profile <= GPs with profile", k, fmt(u), fmt(c),
                PASS if u is not None and c is not None and u <= c else WARNING, "")
        elif ep in ("gpdpUploadStateReport.do", "bpPlanUploadStateReport.do", "zpPlanUpdateStateReport.do"):
            base = {"gpdpUploadStateReport.do": "gpCount", "bpPlanUploadStateReport.do": "bpCount",
                    "zpPlanUpdateStateReport.do": "zpCount"}[ep]
            c, g = fnum(v.get("count")), fnum(v.get(base))
            add(f"plans uploaded <= {base}", k, fmt(c), fmt(g), PASS if c is not None and g and c <= g else FAIL,
                "upload status only; plan contents and approved amounts are not in the response")
        elif ep == "ongoingActivityStateReport.do":
            c, g = fnum(v.get("count")), fnum(v.get("gpCount"))
            add("GPs with ongoing activity <= GPs", k, fmt(c), fmt(g), PASS if c is not None and g and c <= g else FAIL, "")
        elif ep == "geoTaggingStateReport.do":
            g, tg, c = fnum(v.get("gpCount")), fnum(v.get("totalGpCount")), fnum(v.get("count"))
            add("GPs with geo-tagging <= total GPs", k, fmt(g), fmt(tg), PASS if g is not None and tg and g <= tg else FAIL,
                f"'count' = {fmt(c)} is a count of geo-tagged items, not GPs")
    R.check("E1", "E", "state_indicators", "maleCount+femaleCount+otherCount", "state", "year=2026",
            "male + female + other elected representatives equal the reported total, per tier", n_sum, bad_sum,
            PASS if n_sum and not bad_sum else (NOT_TESTABLE if not n_sum else FAIL))
    for ind_prefix, cid, what in (("GPs with profile", "E5", "profile counts consistent"),
                                  ("plans uploaded", "E6", "GPDP upload counts not above Panchayat counts"),
                                  ("GPs with geo-tagging", "E7", "geo-tagged GPs not above total GPs"),
                                  ("GPs with ongoing", "E7b", "GPs with ongoing activity not above GPs"),
                                  ("Gram Panchayat elected", "E1b", "per-tier totals"),
                                  ("Zilla Parishads represented", "E2", "Panchayats represented vs summary count"),
                                  ("Block Panchayats represented", "E2", "Panchayats represented vs summary count"),
                                  ("Gram Panchayats represented", "E2", "Panchayats represented vs summary count")):
        rs = [x for x in out if x["indicator"].startswith(ind_prefix)]
        if not rs or cid == "E1b":
            continue
        c = collections.Counter(x["status"] for x in rs)
        R.check(f"{cid}-{ind_prefix[:20]}", "E", "state_indicators", ind_prefix, "state", "", what, len(rs),
                c[FAIL] + c[WARNING], FAIL if c[FAIL] else WARNING if c[WARNING] else PASS)
    # E8 no population fields anywhere in the captured JSON
    keys = set()
    for p in sorted((DATA / "raw" / "EGS-PORTAL").glob("*/egramswaraj.gov.in/xhr/**/*.json")):
        try:
            d = json.loads(p.read_bytes())
        except (ValueError, OSError):
            continue
        stack = [d]
        while stack:
            x = stack.pop()
            if isinstance(x, dict):
                keys |= set(x)
                stack += list(x.values())
            elif isinstance(x, list):
                stack += x
    pop = sorted(k for k in keys if re.search(r"(?i)popul|household|census|\bsc\b|\bst\b|scst|sc_|st_count|caste", k))
    R.check("E8", "E", "state_indicators", "population / household / SC-ST", "all", "",
            f"field names in all {len(keys)} distinct keys of the browser-built report JSON searched for population, "
            "household, census, SC/ST or caste", len(keys), 0, NOT_TESTABLE if not pop else WARNING,
            "no such field found: population cannot be validated because it was not collected" if not pop else
            "fields found: " + ", ".join(pop))
    return out


# ====================================================================== workstream F: historical comparability
def historical(T, prov):
    out = []

    def add(dataset, indicator, fy, rows, level, unit, definition, value_state, cls, limits):
        out.append({"dataset": dataset, "indicator": indicator, "financial_year": fy, "administrative_level": level,
                    "unit": unit, "definition_as_printed": definition, "report_generated_on": gd(rows),
                    "retrieved": _retr_span(rows), "records": len(rows), "value_state": value_state,
                    "comparability": cls, "limitations": limits})

    cur = "2026-2027"
    for r in sorted(T["state_year_summary"] or [], key=lambda x: (x["financial_year"], x["tier"])):
        fy = r["financial_year"]
        nv = fnum(r["panchayats_with_vouchers"])
        state = ("zero: not recorded in eGramSwaraj (no Panchayat had vouchers)" if nv == 0 else
                 "recorded (year in progress)" if fy == cur else "recorded")
        for ind, c in (("receipt amount", "receipt_amount_rs"), ("payment amount", "payment_amount_rs"),
                       ("year book closed", "with_year_book_closed")):
            gen = gen_date(r["report_generated_on"])
            add("state_year_summary", f"{r['tier']} {ind}", fy, [r], "state", "Rs" if c.endswith("_rs") else "count",
                {"receipt_amount_rs": "Receipt Amount (In Rs.)", "payment_amount_rs": "Payment Amount (In Rs.)",
                 "with_year_book_closed": "Total No of … with Year Book Closed"}[c], state,
                "Comparable only with conditions" if nv else "Not directly comparable",
                ("snapshot generated " + gd([r]) + ("; generated before the FY ended" if gen and
                 gen < dt.date(int(fy[5:]), 3, 31) else "") + ("; 0 = not recorded, not zero spending" if nv == 0 else "")))
    for d, level in (("district_finance", "district"), ("block_finance", "block")):
        for fy in sorted({r["financial_year"] for r in T[d] or []}):
            rows = [r for r in T[d] if r["financial_year"] == fy and not is_total(r, d)]
            for t in TIERS if d == "district_finance" else ("bp", "gp"):
                cr = [r for r in rows if r[f"{t}_ob_plus_receipts_cr"]]
                rs = [r for r in rows if r[f"{t}_receipts_rs"]]
                allzero = rs and all(fnum(r[f"{t}_receipts_rs"]) == 0 and fnum(r[f"{t}_payments_rs"]) == 0 for r in rs)
                if cr:
                    add(d, f"{t} receipts", fy, cr, level, "Rs crore", "OB + Receipts (Cr)",
                        "recorded (year in progress)" if fy == cur else "recorded", "Comparable only with conditions",
                        "includes opening balance; comparable with other years from 2021-22 only; snapshot dates differ")
                    add(d, f"{t} payments", fy, cr, level, "Rs crore", "Payments (Cr)",
                        "recorded (year in progress)" if fy == cur else "recorded", "Comparable only with conditions",
                        "unit changes from Rs to Rs crore in 2021-22; snapshot dates differ")
                elif rs:
                    add(d, f"{t} receipts", fy, rs, level, "Rs", "Receipts",
                        "zero: not recorded in eGramSwaraj" if allzero else "recorded", "Not directly comparable",
                        "'Receipts' up to 2020-21 vs 'OB + Receipts (Cr)' from 2021-22: different definitions"
                        + ("; all zero before Bihar used eGramSwaraj" if allzero else ""))
                    add(d, f"{t} payments", fy, rs, level, "Rs", "Payments",
                        "zero: not recorded in eGramSwaraj" if allzero else "recorded",
                        "Not directly comparable" if allzero else "Comparable only with conditions",
                        "same label as 'Payments (Cr)' but different unit; convert Rs to crore before comparing"
                        + ("; all zero before Bihar used eGramSwaraj" if allzero else ""))
                else:
                    add(d, f"{t} receipts/payments", fy, rows, level, "", "", "missing: empty in the source", "Not enough "
                        "evidence to determine comparability", "no values printed")
    for fy in sorted({r["financial_year"] for r in T["gp_finance"] or []}):
        rows = [r for r in T["gp_finance"] if r["financial_year"] == fy and not is_total(r, "")]
        for m in ("receipts", "payments"):
            add("gp_finance", f"gp {m}", fy, rows, "gram panchayat", "Rs", m.capitalize() + " (village page)",
                "recorded", "Comparable only with conditions",
                "only 2020-21 and 2024-25 collected; 2020-21 was Bihar's first year in eGramSwaraj (payments Rs 0.21 "
                "crore in total), so 2020-21 is not a normal year; GP universe differs (8,387 vs 8,053 rows)")
    for d, level in (("district_accounting_status", "district"), ("block_accounting_status", "block"),
                     ("gp_accounting_status", "gram panchayat")):
        for fy in sorted({r["financial_year"] for r in T[d] or []}):
            rows = [r for r in T[d] if r["financial_year"] == fy]
            add(d, "accounting stages and voucher counts", fy, rows, level, "count / yes-no",
                "Entered Masters, Opening Balance, Vouchers (RV/PV/CV/JV), Day/Month/Year Book Closed",
                "recorded (year in progress)" if fy == cur else "recorded", "Comparable only with conditions",
                "closure status depends on the snapshot date; earlier files generated by PRIASoft / accountingonline")
    for fy in sorted({r["financial_year"] for r in T["district_scheme_finance"] or []}):
        rows = [r for r in T["district_scheme_finance"] if r["financial_year"] == fy]
        add("district_scheme_finance", "scheme receipts / payments", fy, rows, "district / state", "Rs",
            "Receipts (In Rs.), Payments (In Rs.)", "recorded", "Comparable only with conditions",
            "schemes listed for Bihar vary by year (OWN, XVFC, FFC); not listed = not available, not zero")
    for fy in sorted({r["financial_year"] for r in T["monthly_finance"] or []}):
        rows = [r for r in T["monthly_finance"] if r["financial_year"] == fy]
        add("monthly_finance", "monthly receipts / payments of a body", fy, rows, "ZP / BP body", "Rs",
            "Receipts, Receipt Cancellation, OB Cancellation, Payments, Payment Cancellation/Rejected",
            "recorded (year in progress)" if fy == cur else "recorded", "Comparable only with conditions",
            "BP pages only for 2020-21 and 2024-25; cancellation columns undefined")
    for r in [x for x in T["state_indicators"] or [] if x["endpoint"].startswith("Elected")][:1]:
        add("state_indicators", "elected representatives by gender", "year=2026",
            [x for x in T["state_indicators"] if x["endpoint"].startswith("Elected")], "state", "count",
            "maleCount, femaleCount, otherCount", "recorded", "Not enough evidence to determine comparability",
            "one reference point only; no earlier year collected")
    for ep in ("gpdpUploadStateReport.do", "gpProfileStateReport.do", "geoTaggingStateReport.do",
               "ongoingActivityStateReport.do"):
        rows = [x for x in T["state_indicators"] or [] if x["endpoint"] == ep]
        for q in sorted({x["query"] for x in rows}):
            add("state_indicators", ep.replace("StateReport.do", "").replace(".do", ""), q, [x for x in rows if
                x["query"] == q], "state", "count", ep, "recorded", "Comparable only with conditions" if
                len({x["query"] for x in rows}) > 1 else "Not enough evidence to determine comparability",
                "live JSON at retrieval time; no generation date")
    return out


# ====================================================================== standardised (validated) tables
ADDED = {
    "record_id": "Stable identifier: dataset, financial year and key fields",
    "is_portal_total": "yes = row printed by the portal as 'Total' (an aggregate, not a unit); no otherwise",
    "source_url": "Original report URL (from data/provenance.jsonl)",
    "source_sha256": "sha256 of the original file, as recorded in provenance and re-checked by this run",
    "district_code_validated": "District code confirmed by the row's link on the original page and/or the "
                               "getMobileData list (blank when unresolved)",
    "block_code_validated": "Block code from the row's own link on the original page, confirmed in the getMobileData "
                            "block list of the same district (blank when unresolved)",
    "gp_code_validated": "GP code from the row's own link on the original page, confirmed in the getMobileData list "
                         "of the same block and year; otherwise the preliminary exact-name match (see gp_code_status)",
    "geo_status": "How the code was established: verified / resolved by page link / name match only / page link "
                  "only / conflict / unresolved / not applicable",
    "geo_evidence": "Note on the page lookup (e.g. 'row has no code link')",
    "receipts_definition": "Definition and unit of the receipts figures in this row, as printed by the portal",
    "row_origin": "data/clean/egs, or 'added in validation' for rows the preliminary step could not decode",
    "validation_status": "Worst result of the row-level checks: PASS, WARNING, FAIL (see validation_flags)",
    "validation_flags": "IDs of the checks this row did not pass (see validation_checks.csv / validation_exceptions.csv)",
}


def receipts_definition(d, r):
    if d in ("district_finance", "block_finance"):
        if any(r.get(f"{t}_ob_plus_receipts_cr") for t in TIERS):
            return "OB + Receipts (Cr), Payments (Cr): Rs crore, opening balance included in receipts"
        if any(r.get(f"{t}_receipts_rs") for t in TIERS):
            return "Receipts, Payments: Rs (unit not printed; values in rupees and paise)"
        return "no amounts printed"
    if d == "gp_finance":
        return "Receipts, Payments (village page): Rs; unit and opening-balance treatment not printed"
    if d == "state_year_summary":
        return "Receipt Amount (In Rs.), Payment Amount (In Rs.)"
    if d == "district_scheme_finance":
        return "Receipts (In Rs.), Payments (In Rs.) for one scheme"
    if d == "monthly_finance":
        return "Month-wise Receipts / Payments (Rs) of one Panchayat body"
    return ""


def validated_tables(T, prov, flags, R):
    sev = {}
    for e in R.exceptions:
        k = (e["dataset"], e["record"])
        rank = {FAIL: 3, UNRESOLVED: 2, WARNING: 1}.get(e["status"], 0)
        prev = sev.get(k, (0, set()))
        sev[k] = (max(prev[0], rank), prev[1] | {e["check_id"]})
    added = {}
    for d in DATASETS:
        rows = T[d]
        if not rows:
            continue
        cols = list(rows[0].keys())
        cols = [c for c in cols if not c.startswith("_")]
        extra = ["record_id", "is_portal_total", "source_url", "source_sha256"]
        if d in ("district_finance", "district_accounting_status", "district_scheme_finance"):
            extra += ["district_code_validated", "geo_status", "geo_evidence"]
        if d in ("block_finance", "block_accounting_status"):
            extra += ["block_code_validated", "geo_status", "geo_evidence"]
        if d in ("gp_finance", "gp_accounting_status"):
            extra += ["gp_code_validated", "geo_status", "geo_evidence"]
        if d == "gp_year_book_closed":
            extra += ["row_origin"]
        if d in ("district_finance", "block_finance", "gp_finance", "state_year_summary", "district_scheme_finance",
                 "monthly_finance"):
            extra += ["receipts_definition"]
        extra += ["validation_status", "validation_flags"]
        added[d] = [(c, ADDED[c]) for c in extra]
        out = []
        for r in rows:
            sp = (r.get("source_file") or r.get("source_files") or "").split(" ")[0]
            p = prov.get(sp, {})
            rank, ids = sev.get((d, r["_rid"]), (0, set()))
            if r.get("_origin", "").startswith("added"):
                rank, ids = max(rank, 1), ids | {"P2"}
            ids = ids | flags.get((d, id(r)), set())
            rank = max(rank, 3 if any(i.startswith(("B1", "B2", "B3")) for i in flags.get((d, id(r)), set())) else 0)
            o = {c: r[c] for c in cols}
            o.update({"record_id": r["_rid"], "is_portal_total": "yes" if is_total(r, d) else "no",
                      "source_url": p.get("url", ""), "source_sha256": p.get("sha256", ""),
                      "district_code_validated": r.get("_district_code", ""),
                      "block_code_validated": r.get("_block_code", ""), "gp_code_validated": r.get("_gp_code", ""),
                      "geo_status": r.get("_geo_status", ""), "geo_evidence": r.get("_geo_evidence", ""),
                      "receipts_definition": receipts_definition(d, r), "row_origin": r.get("_origin", ""),
                      "validation_status": {3: FAIL, 2: UNRESOLVED, 1: WARNING}.get(rank, PASS),
                      "validation_flags": " ".join(sorted(ids))})
            out.append(o)
        sub = OUT / ("supplementary_auditonline" if d in SUPPLEMENTARY else "")
        write_csv(sub / f"{d}.csv", cols + extra, out)
    return added


# ====================================================================== issue register
def issues(R, T, unmatched, recs, comp):
    def chk(cid):
        return [c for c in R.checks if c["check_id"] == cid or c["check_id"].startswith(cid + "-")]

    def st(cid):
        cs = chk(cid)
        order = [FAIL, UNRESOLVED, WARNING, NOT_TESTABLE, PASS]
        return next((s for s in order if any(c["status"] == s for c in cs)), NOT_TESTABLE)

    def cnt(cid):
        return sum(int(c["records_not_passing"] or 0) for c in chk(cid))

    gp_fy = sorted({r["financial_year"] for r in T["gp_finance"] or []})
    unres = [u for u in unmatched if u["dataset"] == "gp_finance" and not u["validated_gp_code"]]
    prelim = [u for u in unmatched if u["dataset"] == "gp_finance" and not u["preliminary_gp_code"]]
    R.issue("gp_finance", "all", "gram panchayat", " ".join(gp_fy), "coverage",
            "GP-level finance collected only for " + " and ".join(gp_fy) + "; other years exist on the portal "
            "(egs_bihar.py --deep-years all)", "", "Medium", "data/clean/egs/gp_finance.csv", "Recorded; follow-up "
            "collection proposed", UNRESOLVED)
    R.issue("gp_finance", "gp_code", "gram panchayat", " ".join(gp_fy), "geographic identifier",
            f"{len(prelim)} GP finance rows had no code after the preliminary name match; {len(prelim) - len(unres)} "
            f"now carry the code printed in their own row link on the source page (confirmed in the code list); "
            f"{len(unres)} remain unresolved", len(unres), "Medium" if unres else "Low",
            "unmatched_geographic_records.csv", "Codes taken only from the source page; candidates listed, not assigned",
            UNRESOLVED if unres else "PASS")
    R.issue("tiedExpenditure (XVFC Tied Component Expenditure Report)", "all", "state", "", "not collected",
            "Report headings captured but no values: the 'Report Type' selection was not made in the automated run",
            "", "Medium", "data/raw/EGS-PORTAL/2026-11-22/egramswaraj.gov.in/rendered/tiedExpenditure__bihar.html",
            "Follow-up collection (no CAPTCHA)", NOT_TESTABLE)
    R.issue("state_indicators (Elected representatives)", "district drill-down", "district", "year=2026",
            "not collected", "District-level elected-representative counts not captured: the automated drill-down "
            "opened another state", "", "Low", "xhr/ElectedRepresentativeReportBp/ElectedStateZpWiseBpCount.do__*.json "
            "(stateCode=35)", "Follow-up collection", NOT_TESTABLE)
    R.issue("all", "population, households, SC/ST", "all", "", "not available",
            "No population, household or SC/ST field in any examined open report or captured JSON (check E8)", "",
            "High", "validation_checks.csv E8", "No such fields created", NOT_TESTABLE)
    R.issue("CAPTCHA-protected forms", "all", "all", "", "access restriction",
            "39 of 59 report forms offering Bihar have a CAPTCHA (cash book, ledger, vendor, physical and financial "
            "progress, GPDP action plans, Know Your Panchayat / profile reports); not collected, not bypassed", 39,
            "High", "data/egs_explore/2026-11-20/form_results.jsonl", "Manual viewing only (egs_bihar.py --steps manual)",
            NOT_TESTABLE)
    R.issue("state_indicators (GPDP upload)", "count", "state", "2024-2025 2026-2027", "definition",
            "GPDP upload status is available; plan contents and approved amounts are not", "", "Medium",
            "administrative_indicators.csv", "Upload status kept as status only", WARNING)
    R.issue("district_finance, block_finance", "balances", "all", "", "not available",
            "Unspent / closing balances are not printed in the open statements; OB + Receipts minus Payments is not "
            "published as a balance and was not derived", "", "Medium", "TASK4_REPORT.md section 4",
            "Not derived", NOT_TESTABLE)
    R.issue("district_finance, block_finance", "receipts", "district, block", "2020-2021 / 2021-2022",
            "definition change", "'Receipts' (Rs) up to 2020-21 and 'OB + Receipts (Cr)' from 2021-22 are different "
            "definitions; kept in separate columns, never combined", "", "High", "historical_comparability.csv",
            "receipts_definition column added", WARNING)
    R.issue("all static reports", "report_generated_on", "all", "all", "snapshot",
            "Each report is a dated snapshot; the same FY appears with different generation dates in different "
            "reports (e.g. State & Year Wise Summary 2024-25 generated 23 Oct 2024)", "", "High",
            "historical_comparability.csv; financial_reconciliation.csv", "Dates carried on every row", WARNING)
    R.issue("state_year_summary", "all amounts", "state", "2012-2013 … 2019-2020", "zero vs not recorded",
            "Bihar rows are 0 before 2020-21 because accounts were not kept in eGramSwaraj; 0 here means not "
            "recorded, not zero spending", "", "High", "historical_comparability.csv", "Classified as 'not recorded'",
            WARNING)
    R.issue("gp_finance", "receipts_rs", "gram panchayat", " ".join(gp_fy), "definition",
            "Village pages print 'Receipts' without unit or opening-balance note; GP sums equal the district "
            "'OB + Receipts (Cr)' (check R2), which suggests opening balance is included, but the page does not say so",
            "", "Medium", "financial_reconciliation.csv R2", "Documented; values unchanged", WARNING)
    if FALLBACK_DECODED:
        R.issue("gp_year_book_closed", "all", "gram panchayat", "2020-2021 2024-2025", "extraction (preliminary step)",
                f"{len(FALLBACK_DECODED)} getMobileData GP lists are not UTF-8 (cp1252 non-breaking space in a name) "
                "and were silently skipped by egs_clean.py, so their GPs were missing from gp_year_book_closed and from "
                "the preliminary name matching", len(FALLBACK_DECODED), "Medium", "validation_checks.csv P2",
                "Decoded as cp1252 and rows restored (row_origin) in the validated layer; egs_clean.py should be fixed "
                "in a later step", WARNING)
    nm = sum(1 for r in T["gp_finance"] or [] if r.get("_geo_status", "").startswith("name match only"))
    R.issue("gp_finance, gp_accounting_status", "gp_code", "gram panchayat", "mainly 2020-2021", "geographic identifier",
            f"{nm} GP finance rows have no code link on the source page (most 2020-21 village pages link only a few "
            "GPs); their code comes from an exact name match within the same block and year (not verified by the page)",
            nm, "Low", "geo_status = 'name match only' in the validated tables", "Kept and labelled", WARNING)
    empty_blocks = sorted({(x["financial_year"], x["unit_id"]) for x in recs if x["check_id"] == "R1" and
                           x["status"] == NOT_TESTABLE})
    if empty_blocks:
        R.issue("gp_finance", "all", "block", " ".join(sorted({f for f, _ in empty_blocks})), "coverage",
                "Village wise statement lists no GP rows (only a Total row) for block(s) " +
                ", ".join(b for _, b in empty_blocks) + "; this explains part of the GP count difference "
                "(8,053 GP rows vs 8,054 Panchayats in 2024-25)", len(empty_blocks), "Low",
                "financial_reconciliation.csv R1 (NOT TESTABLE)", "Recorded", UNRESOLVED)
    for cid, ds, cat, desc in (("B1", "finance tables", "extraction", "stored values re-found in the source row"),
                               ("B2", "as-served columns", "number format", "Indian-format text parses to the stored number"),
                               ("B3", "district/block finance", "unit", "Rs vs Rs crore columns match page headings"),
                               ("B5", "finance tables", "missing values", "empty amounts where the layout expects a value"),
                               ("B6", "finance tables", "range", "negative or unusually large amounts"),
                               ("R2", "gp_finance", "reconciliation", "GP rows vs district statement"),
                               ("R3", "gp_finance", "reconciliation", "GP rows vs block statement"),
                               ("R4", "block_finance", "reconciliation", "block rows vs district statement"),
                               ("R6", "district_finance", "reconciliation", "district rows vs district Total"),
                               ("R7", "gp_finance", "reconciliation", "GP rows vs State & Year Wise Summary"),
                               ("R8", "district_finance", "reconciliation", "district Total vs State & Year Wise Summary"),
                               ("R9", "district_scheme_finance", "reconciliation", "scheme districts vs state row"),
                               ("R10", "monthly_finance", "reconciliation", "month-wise vs annual statement"),
                               ("C2", "geographic_reference", "geographic identifier", "GP under different blocks by year"),
                               ("C5", "geographic_reference", "naming", "name variants / duplicate names"),
                               ("C6", "district/block tables", "geographic identifier", "district/block codes"),
                               ("D4", "gp_accounting_status", "aggregation", "GP rows vs block summary"),
                               ("D4b", "block_accounting_status", "aggregation", "block rows vs district summary"),
                               ("D5", "gp_accounting_status", "snapshot", "static vs getMobileData year-book closure")):
        s = st(cid)
        if s in (PASS, NOT_TESTABLE) and cnt(cid) == 0:
            continue
        R.issue(ds, "", "", "", cat, f"{desc}: {cnt(cid)} records not passing (status {s})", cnt(cid),
                "High" if s == FAIL else "Medium" if s in (WARNING, UNRESOLVED) else "Low",
                f"validation_checks.csv {cid}; validation_exceptions.csv", "Listed for investigation; values unchanged",
                s)


# ====================================================================== main
def run():
    LOG.clear()
    R = Registers()
    prov = provenance_index()
    log(f"provenance: {len(prov)} EGS-PORTAL / EGS-AO originals listed")
    before, bad_before, missing = raw_state(prov)
    R.check("P0", "G", "data/raw/EGS-PORTAL, EGS-AO", "sha256", "all", "",
            "sha256 of every original listed in provenance equals the recorded hash (before validation)", len(before),
            len(bad_before), PASS if not bad_before else FAIL, f"{missing} listed files not present in this checkout")
    T = load_inputs()
    for d in DATASETS:
        for i, r in enumerate(T[d] or []):
            r["_rid"] = f"{d}:" + "|".join(r.get(k, "") for k in KEYS[d] if k != "source_file") + \
                        (f"#{i}" if d == "state_indicators" else "")
    # rows whose key repeats get a suffix so record_id stays unique
    for d in DATASETS:
        seen = collections.Counter()
        for r in T[d] or []:
            seen[r["_rid"]] += 1
            if seen[r["_rid"]] > 1:
                r["_rid"] += f"#{seen[r['_rid']]}"
    for d in DATASETS:
        if T[d] is not None:
            src_bad = [r for r in T[d] if r.get("source_file") and r["source_file"].split(" ")[0] not in prov]
            R.check(f"P1-{d}", "G", d, "source_file", LEVEL[d], "", "every row cites an original listed in provenance",
                    len(T[d]), len(src_bad), PASS if not src_bad else FAIL)
    log("phase 2: profiling")
    ds_prof, fld_prof = profile(T, R)
    log("phase 3: geography")
    geo, unmatched = geography(T, prov, R)
    geo_checks(T, geo, unmatched, R)
    restore_skipped_api_rows(T, geo, prov, R)
    flags = collections.defaultdict(set)
    log("phase 3: financial validation")
    verify_against_source(T, R, flags)
    format_checks(T, R, flags)
    unit_checks(T, R, flags)
    missing_and_ranges(T, R, flags)
    totals_check(T, R)
    recs = reconcile(T, R)
    log("phase 3: accounting, administrative, historical")
    comp = accounting(T, geo, prov, R)
    admin = administrative(T, R)
    hist = historical(T, prov)
    log("phase 4: validated tables")
    added = validated_tables(T, prov, flags, R)
    issues(R, T, unmatched, recs, comp)
    log("phase 5: reports")
    write_csv(OUT / "dataset_profile.csv", list(ds_prof[0].keys()), ds_prof)
    write_csv(OUT / "field_profile.csv", list(fld_prof[0].keys()), fld_prof)
    dd = dictionary(T, fld_prof, added)
    write_csv(OUT / "data_dictionary.csv", list(dd[0].keys()), dd)
    undocumented = [x for x in dd if x["description"] == "NOT DOCUMENTED"]
    R.check("A2", "A", "data_dictionary", "description", "all", "", "every field of every dataset has a description, "
            "unit and source reference", len(dd), len(undocumented), PASS if not undocumented else FAIL,
            ", ".join(f"{x['dataset']}.{x['field']}" for x in undocumented)[:300])
    write_csv(OUT / "geographic_reference.csv", ["level", "code", "name", "names_seen", "parent_level", "parent_code",
                                                 "district_code", "years_seen", "code_source", "status"],
              geo_reference(geo, T))
    write_csv(OUT / "unmatched_geographic_records.csv", list(unmatched[0].keys()) if unmatched else ["dataset"],
              unmatched)
    cols, rows = gp_counts(T, geo, prov)
    write_csv(OUT / "gp_counts_by_year.csv", cols, rows)
    write_csv(OUT / "financial_reconciliation.csv", list(recs[0].keys()), recs)
    write_csv(OUT / "accounting_snapshot_comparison.csv", list(comp[0].keys()), comp)
    write_csv(OUT / "administrative_indicators.csv", list(admin[0].keys()), admin)
    write_csv(OUT / "historical_comparability.csv", list(hist[0].keys()), hist)
    after, bad_after, _ = raw_state(prov)
    changed = sorted(k for k in before if before[k] != after.get(k))
    R.check("P9", "G", "data/raw/EGS-PORTAL, EGS-AO", "sha256", "all", "",
            "every original has the same sha256 after validation as before (raw files not modified)", len(after),
            len(changed) + len(bad_after), PASS if not changed and not bad_after else FAIL)
    write_csv(OUT / "validation_checks.csv", list(R.checks[0].keys()), R.checks)
    R.exceptions.sort(key=lambda e: (e["check_id"], e["dataset"], e["financial_year"], str(e["record"]), e["field"]))
    write_csv(OUT / "validation_exceptions.csv", list(R.exceptions[0].keys()), R.exceptions)
    write_csv(OUT / "data_quality_summary.csv", list(R.issues[0].keys()), R.issues)
    summary = collections.Counter(c["status"] for c in R.checks)
    log("checks: " + ", ".join(f"{k} {v}" for k, v in sorted(summary.items())) +
        f"; exceptions {len(R.exceptions)}; issues {len(R.issues)}")
    return summary


def output_hashes():
    return {str(p.relative_to(ROOT)): sha256(p) for p in sorted(OUT.rglob("*.csv"))}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="run twice and confirm byte-identical outputs")
    a = ap.parse_args()
    started = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    inputs = {str(p.relative_to(ROOT)): sha256(p) for p in sorted(CLEAN.glob("*.csv"))}
    inputs[str(DEFS.relative_to(ROOT))] = sha256(DEFS)
    summary = run()
    h1 = output_hashes()
    repeat = None
    if a.check:
        log("--check: second run")
        run()
        h2 = output_hashes()
        diff = sorted(k for k in set(h1) | set(h2) if h1.get(k) != h2.get(k))
        repeat = {"identical": not diff, "differing_files": diff}
        log("second run identical" if not diff else f"second run differs: {diff}")
    (OUT / "logs").mkdir(parents=True, exist_ok=True)
    (OUT / "logs" / "validation_run.json").write_text(json.dumps(
        {"started_utc": started, "script": "scripts/egs_validate.py", "inputs_sha256": inputs,
         "check_status_counts": dict(sorted(summary.items())), "outputs_sha256": h1, "repeat_run": repeat},
        indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "logs" / "validation_run.log").write_text("\n".join(LOG) + "\n", encoding="utf-8")
    if repeat and not repeat["identical"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
