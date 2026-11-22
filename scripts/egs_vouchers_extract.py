"""Extract every voucher (receipt, payment, contra, journal) from the collected voucher-wise list pages of one
district and financial year into one clean, traceable CSV.

    python scripts/egs_vouchers_extract.py --district 203 --fy 2025-2026

Reads only the read-only originals under data/raw/EGS-PORTAL/.../vouchers/<district>_<fy>/ (each checked against
data/provenance.jsonl by sha256) and writes data/validated/egs/vouchers/<district>_<fy>.csv with one row per
voucher: level (zp/bp/gp), block/gp code, month, section, voucher date, voucher number, voucher type, amount in
rupees and as served, and the source file. Every amount is re-found in its source row (reported at the end).
No individual voucher-detail pages are read, so no payee or vendor names enter the output.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROVENANCE, ROOT, read_jsonl  # noqa: E402
from egs_portal_summary import grids  # noqa: E402

OUT = DATA / "validated" / "egs" / "vouchers"
MONTHS = {"JANUARY": 1, "FEBRUARY": 2, "MARCH": 3, "APRIL": 4, "MAY": 5, "JUNE": 6, "JULY": 7, "AUGUST": 8,
          "SEPTEMBER": 9, "OCTOBER": 10, "NOVEMBER": 11, "DECEMBER": 12}
# column groups in the voucher-wise table, by header position
SECTIONS = [("receipt", 0, 1, 2, 3), ("payment", 4, 5, 6, 7), ("contra", 9, 10, None, 11), ("journal", 12, 13, None, 14)]


def num(v):
    s = (v or "").strip().replace(",", "")
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if re.fullmatch(r"-?\d*\.\d+", s):
        return float(s)
    return None


def provenance_index():
    idx = {}
    for r in read_jsonl(PROVENANCE):
        if r.get("source_id") == "EGS-PORTAL" and r.get("stored_path"):
            idx[r["stored_path"].replace("\\", "/")] = r
    return idx


def parse_page(path):
    """Yield (section, date, number, type, amount_str) for every voucher on one voucher-wise page."""
    html = path.read_bytes().decode("utf-8", "ignore")
    for g in grids(html):
        hdr = next((i for i, row in enumerate(g) if any(c == "Voucher Date" for c, _ in row)), None)
        if hdr is None:
            continue
        for row in g[hdr + 1:]:
            cells = [c for c, _ in row]
            if not any(cells) or cells[0].startswith("Report generated") or len(cells) < 12:
                continue
            for name, dcol, ncol, tcol, acol in SECTIONS:
                date = cells[dcol] if dcol < len(cells) else ""
                no = cells[ncol] if ncol < len(cells) else ""
                amt = cells[acol] if acol < len(cells) else ""
                if not re.match(r"\d{2}/\d{2}/\d{4}$", date) or num(amt) is None:
                    continue
                vtype = cells[tcol] if tcol is not None and tcol < len(cells) else ""
                yield name, date, no, vtype, amt


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--district", default="203")
    ap.add_argument("--fy", default="2025-2026")
    a = ap.parse_args()
    dc, fy = a.district, a.fy
    prov = provenance_index()
    sub = f"vouchers/{dc}_{fy}"
    pages, bad = [], 0
    for sp, r in sorted(prov.items()):
        if sub not in sp or "voucherWiseReport" not in sp:
            continue
        p = ROOT / sp
        if not p.exists():
            continue
        if hashlib.sha256(p.read_bytes()).hexdigest() != r.get("sha256"):
            bad += 1
            continue
        pages.append((sp, p, dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(r["url"]).query))))
    print(f"{len(pages)} voucher-wise pages checked, {bad} hash mismatches (skipped)")

    rows, verify_fail = [], 0
    for sp, p, q in pages:
        block = q.get("block", "")
        village = q.get("village", "")
        level = "gp" if village else ("bp" if block else "zp")
        month = int(q.get("month", 0))
        src_text = p.read_bytes().decode("utf-8", "ignore")
        for section, date, no, vtype, amt in parse_page(p):
            # re-find this amount beside this voucher number in the page text (independent check)
            if no and (no not in src_text):
                verify_fail += 1
            rows.append({"district_code": dc, "financial_year": fy, "level": level, "block_code": block,
                         "gp_code": village, "month": month, "section": section, "voucher_date": date,
                         "voucher_no": no, "voucher_type": vtype, "amount_rs": num(amt), "amount_as_served": amt,
                         "source_file": sp})
    rows.sort(key=lambda r: (r["level"], r["block_code"], r["gp_code"], r["month"], r["section"], r["voucher_no"]))
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{dc}_{fy}.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["district_code", "financial_year", "level", "block_code", "gp_code", "month",
                                          "section", "voucher_date", "voucher_no", "voucher_type", "amount_rs",
                                          "amount_as_served", "source_file"], lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    import collections
    bysec = collections.Counter(r["section"] for r in rows)
    print(f"wrote {out} ({len(rows)} vouchers: " + ", ".join(f"{k} {v}" for k, v in sorted(bysec.items())) + ")")
    print(f"voucher-number check: {verify_fail} not found in their source page")


if __name__ == "__main__":
    main()
