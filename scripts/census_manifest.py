#!/usr/bin/env python3
"""Build config/manifest_census.csv: Bihar's Census 2011 files from the Census NADA catalogue.

censusindia.gov.in loads its table pages with JavaScript, but the catalogue behind
them (NADA) has a public JSON API. This script asks it for:

  BR-DM-02  Census 2011 tables whose title names Bihar (Primary Census Abstract,
            houselisting, SC/ST, workers, migration, fertility and the rest)
  BR-DM-03  District Census Handbooks 2011 for Bihar (Parts A and B per district)

For each catalogue entry it lists the downloads on its "related materials" page and
checks each one's file name and size. It keeps machine-readable files (xls, xlsx,
csv, zip), drops exact repeats (the 82 MB state village file is linked from every
handbook page), and writes one "file" row per download. Then run:

  python scripts/collect.py --manifest config/manifest_census.csv

Add --with-pdf to include the PDF versions too (about 500 MB more, mostly the same
figures as the spreadsheets).
"""
from __future__ import annotations

import argparse
import csv
import http.cookiejar
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, TOOL_VERSION  # noqa: E402

BASE = "https://censusindia.gov.in/nada/index.php"
UA = {"User-Agent": f"Mozilla/5.0 (compatible; {TOOL_VERSION}; India By Numbers public-data collector)"}
KEEP = re.compile(r"(?i)\.(xlsx?|csv|zip)$")
KEEP_PDF = re.compile(r"(?i)\.(xlsx?|csv|zip|pdf)$")
FIELDS = ["source_id", "title", "mode", "url", "link_pattern", "max_files", "priority", "notes"]


def opener():
    return urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl.create_default_context()),
                                       urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def search(op, query: str, year_from: int, year_to: int) -> list[dict]:
    rows, page = [], 1
    while True:
        q = urllib.parse.urlencode({"sk": query, "from": year_from, "to": year_to, "ps": 300, "page": page})
        with op.open(urllib.request.Request(f"{BASE}/api/catalog/search?{q}", headers=UA), timeout=120) as r:
            got = json.load(r)["result"]["rows"]
        rows += got
        if len(got) < 300:
            return rows
        page += 1


def downloads(op, study_id: str, delay: float) -> list[tuple[str, str, int]]:
    """(url, filename, bytes) for each download on a study's related-materials page."""
    with op.open(urllib.request.Request(f"{BASE}/catalog/{study_id}/related-materials", headers=UA),
                 timeout=120) as r:
        html = r.read().decode("utf-8", "replace")
    out = []
    for url in sorted(set(re.findall(r'href="([^"]*/catalog/\d+/download/\d+)"', html))):
        time.sleep(delay)
        with op.open(urllib.request.Request(url, headers=UA, method="HEAD"), timeout=120) as h:
            cd = h.headers.get("content-disposition", "")
            m = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)', cd)
            out.append((url, urllib.parse.unquote(m.group(1)) if m else "", int(h.headers.get("content-length") or 0)))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(ROOT / "config" / "manifest_census.csv"))
    ap.add_argument("--with-pdf", action="store_true", help="also keep PDF versions")
    ap.add_argument("--delay", type=float, default=0.3, help="seconds between requests")
    ap.add_argument("--limit", type=int, help="stop after this many catalogue entries (for testing)")
    ap.add_argument("--groups", default="tables,handbooks",
                    help="comma list of: tables (BR-DM-02), handbooks (BR-DM-03), "
                         "srs (BR-DM-05, SRS Statistical Reports; PDF only, so PDFs are kept)")
    args = ap.parse_args(argv)
    groups = set(args.groups.split(","))
    keep = KEEP_PDF if args.with_pdf or groups == {"srs"} else KEEP
    op = opener()

    studies = []
    if "tables" in groups:
        tables = [r for r in search(op, "bihar", 2011, 2011)
                  if re.search(r"(?i)\bbihar\b", r["title"]) and not r["idno"].lower().startswith("tender")]
        studies += [("BR-DM-02", r) for r in sorted(tables, key=lambda r: r["idno"])]
        print(f"{len(tables)} Census 2011 tables naming Bihar")
    if "handbooks" in groups:
        handbooks = [r for r in search(op, "district census handbook", 2011, 2016)
                     if r["idno"].startswith("DH_2011_10") and re.search(r"(?i)bihar", r["title"])]
        studies += [("BR-DM-03", r) for r in sorted(handbooks, key=lambda r: r["idno"])]
        print(f"{len(handbooks)} District Census Handbooks")
    if "srs" in groups:
        srs = [r for r in search(op, "SRS statistical report", 1990, 2100) if r["idno"].startswith("SRS_STAT_")]
        studies += [("BR-DM-05", r) for r in sorted(srs, key=lambda r: r["idno"])]
        print(f"{len(srs)} SRS Statistical Reports")
    if args.limit:
        studies = studies[:args.limit]

    rows, seen, skipped = [], set(), 0
    for i, (sid, s) in enumerate(studies, 1):
        try:
            files = downloads(op, s["id"], args.delay)
        except Exception as e:  # one bad page should not stop the listing
            print(f"  ! {s['idno']}: {type(e).__name__}: {e}")
            continue
        for url, name, size in files:
            if not keep.search(name):
                skipped += 1
                continue
            if (name, size) in seen:  # same file linked from several pages
                continue
            seen.add((name, size))
            rows.append({"source_id": sid, "title": f"{s['idno']}: {s['title']}"[:300], "mode": "file", "url": url,
                         "link_pattern": "", "max_files": "", "priority": "2",
                         "notes": f"{name}; {size / 1e6:.1f} MB; catalogue page {BASE}/catalog/{s['id']}"})
        if i % 50 == 0:
            print(f"  {i}/{len(studies)} catalogue entries, {len(rows)} files so far")

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    total = sum(float(r["notes"].split("; ")[1].split()[0]) for r in rows)
    print(f"Wrote {len(rows)} files ({total:.0f} MB) to {args.out}; "
          f"{skipped} PDF or other files left out" + ("" if args.with_pdf else " (add --with-pdf to keep PDFs)"))


if __name__ == "__main__":
    main()
