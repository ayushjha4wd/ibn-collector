#!/usr/bin/env python3
"""Describe what was collected: one row per valid original, plus run statistics.

Reads only the logs and data/processed (never changes data/raw) and writes:
  data/analysis/files.csv     one row per valid original: period covered, pages or
                              sheets, tables found, pages with no text (likely
                              scanned), how often "Bihar" appears, dates
  data/analysis/summary.json  per-source totals, file types, every collection run's
                              outcome, failures grouped by cause, duplicate files

Run after collect.py, flag.py, extract.py and verify.py.
"""
from __future__ import annotations

import collections
import csv
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, EXTRACTIONS, PROCESSED, PROVENANCE, ROOT, flagged, load_manifest, read_jsonl  # noqa: E402

OUT = DATA / "analysis"
PAGE_TYPES = (".html", ".htm", ".aspx")
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


def period_of(name: str) -> str:
    """Best guess at the period a file covers, from its name only."""
    n = name.replace("_", "-")
    m = re.search(r"(?i)\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*(20\d\d|\d\d)\b", n)
    if m:
        y = m.group(2)
        y = int(y) if len(y) == 4 else 2000 + int(y)
        return f"{y}-{MONTHS[m.group(1).lower()]:02d}"
    m = re.search(r"(20\d\d)-(20\d\d|\d\d)(?!\d)", n)
    if m:
        a, b = int(m.group(1)), m.group(2)
        b = int(b) if len(b) == 4 else 2000 + int(b)
        if b == a + 1:
            return f"FY {a}-{str(b)[2:]}"
    m = re.search(r"(?<!\d)(20\d\d|19\d\d)(?!\d)", n)
    return m.group(1) if m else ""


def kind_of(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext in PAGE_TYPES:
        return "page"
    return {".pdf": "pdf", ".xlsx": "excel", ".xls": "excel", ".csv": "csv"}.get(ext, ext.lstrip(".") or "other")


def classify_error(err: str) -> str:
    e = err or ""
    if "expired" in e:
        return "TLS certificate expired"
    if "local issuer" in e:
        return "TLS certificate chain incomplete"
    if "reset by peer" in e or "502" in e:
        return "Connection refused or reset (outside India)"
    if "403" in e and "Tunnel" in e:
        return "Host not allowed by this environment's network"
    if "HTTP 404" in e:
        return "Page not found (HTTP 404)"
    if "control characters" in e:
        return "Malformed link on the portal page"
    if "timed out" in e.lower():
        return "Timed out"
    return "Other: " + e[:60]


def main():
    manifest = {r["source_id"]: r for r in load_manifest(ROOT / "config" / "manifest.csv")}
    prov = read_jsonl(PROVENANCE)
    bad = flagged()
    saved = [r for r in prov if r.get("status") in {"saved", "manual"}]
    valid = [r for r in saved if r["stored_path"] not in bad]
    extr = {}
    for r in read_jsonl(EXTRACTIONS):
        if r.get("status") in {"ok", "not_extracted"}:
            extr[r["raw_sha256"]] = r

    rows = []
    for r in sorted(valid, key=lambda r: (r["source_id"], r["stored_path"])):
        path, kind = r["stored_path"], kind_of(r["stored_path"])
        out = PROCESSED / r["source_id"] / r["sha256"][:12]
        pages = sheets = tables = empty = bihar = 0
        if out.exists():
            for f in out.rglob("*"):
                if not f.is_file() or f.name == "extraction.json":
                    continue
                text = f.read_text(encoding="utf-8", errors="replace")
                bihar += len(re.findall(r"(?i)bihar", text))
                if f.parent.name == "tables":
                    tables += 1
                elif f.parent.name == "sheets":
                    sheets += 1
                elif f.name.startswith("page_"):
                    pages += 1
                    empty += len(text.strip()) < 20
        rows.append({
            "source_id": r["source_id"], "file": Path(path).name, "kind": kind,
            "period": period_of(Path(path).name), "bytes": r.get("bytes"),
            "pages": pages or "", "pages_without_text": empty if kind == "pdf" else "",
            "sheets": sheets or "", "tables_found": tables if kind in ("pdf", "page") else "",
            "bihar_mentions": bihar if out.exists() else "",
            "extracted": "yes" if r["sha256"] in extr else "no",
            "downloaded_at_ist": r.get("retrieved_at_ist") or r.get("obtained_on"),
            "server_last_modified": (r.get("headers") or {}).get("last-modified", ""),
            "sha256": r["sha256"], "stored_path": path,
            "source_url": r.get("final_url") or r.get("url"),
        })

    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "files.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)

    per_source = {}
    for sid, m in manifest.items():
        rs = [x for x in rows if x["source_id"] == sid]
        data = [x for x in rs if x["kind"] != "page"]
        periods = sorted({x["period"] for x in data if x["period"]})
        per_source[sid] = {
            "title": m["title"], "mode": m["mode"], "priority": m["priority"],
            "data_files": len(data), "page_snapshots": len(rs) - len(data),
            "bytes": sum(int(x["bytes"] or 0) for x in data),
            "kinds": dict(collections.Counter(x["kind"] for x in data)),
            "pdf_pages": sum(int(x["pages"] or 0) for x in data if x["kind"] == "pdf"),
            "pdf_pages_without_text": sum(int(x["pages_without_text"] or 0) for x in data if x["kind"] == "pdf"),
            "pdf_tables_found": sum(int(x["tables_found"] or 0) for x in data if x["kind"] == "pdf"),
            "excel_sheets": sum(int(x["sheets"] or 0) for x in data if x["kind"] == "excel"),
            "bihar_mentions": sum(int(x["bihar_mentions"] or 0) for x in data),
            "files_mentioning_bihar": sum(1 for x in data if (x["bihar_mentions"] or 0)),
            "period_first": periods[0] if periods else "", "period_last": periods[-1] if periods else "",
            "flagged_invalid": sum(1 for r in saved if r["source_id"] == sid and r["stored_path"] in bad),
        }

    runs = collections.OrderedDict()
    for r in prov:
        rid = r.get("run_id")
        if rid and r.get("status") not in {"invalid"}:
            runs.setdefault(rid, collections.Counter())[r["status"]] += 1
    last_run = next(reversed(runs)) if runs else None
    last = [r for r in prov if r.get("run_id") == last_run]
    last_errors = collections.defaultdict(set)
    for r in last:
        if r["status"] in {"error", "blocked"}:
            last_errors[classify_error(r.get("error", "")) if r["status"] == "error" else "Bot check or HTML served for a file"].add(r["source_id"])

    by_hash = collections.defaultdict(list)
    for x in rows:
        by_hash[x["sha256"]].append(f'{x["source_id"]}/{x["file"]}')
    dupes = [v for v in by_hash.values() if len(v) > 1]

    data_rows = [x for x in rows if x["kind"] != "page"]
    summary = {
        "valid_originals": len(rows), "data_files": len(data_rows),
        "data_bytes": sum(int(x["bytes"] or 0) for x in data_rows),
        "page_snapshots": len(rows) - len(data_rows),
        "flagged_invalid": len([r for r in saved if r["stored_path"] in bad]),
        "kinds": dict(collections.Counter(x["kind"] for x in data_rows)),
        "pdf_pages": sum(int(x["pages"] or 0) for x in data_rows if x["kind"] == "pdf"),
        "pdf_pages_without_text": sum(int(x["pages_without_text"] or 0) for x in data_rows if x["kind"] == "pdf"),
        "pdf_tables_found": sum(int(x["tables_found"] or 0) for x in data_rows if x["kind"] == "pdf"),
        "excel_sheets": sum(int(x["sheets"] or 0) for x in data_rows if x["kind"] == "excel"),
        "not_extracted": [x["stored_path"] for x in rows if x["extracted"] != "yes"],
        "duplicate_files": dupes,
        "runs": {k: dict(v) for k, v in runs.items()},
        "last_run": last_run,
        "last_run_failures_by_cause": {k: sorted(v) for k, v in last_errors.items()},
        "per_source": per_source,
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{len(rows)} valid originals ({len(data_rows)} data files) described in {(OUT / 'files.csv').relative_to(ROOT)}")
    print(f"Summary written to {(OUT / 'summary.json').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
