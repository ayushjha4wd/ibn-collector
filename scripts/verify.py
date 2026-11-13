#!/usr/bin/env python3
"""Check that every original file in data/raw is still exactly as downloaded.

Recomputes sha256 for each file recorded in data/provenance.jsonl and reports
files that are missing, modified, or present in data/raw but never logged.
Exit code 1 if anything is wrong. Also writes data/inventory.csv: one row per
original file with its source, URL and download date.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROVENANCE, RAW, ROOT, flagged, read_jsonl, sha256_file  # noqa: E402


def main():
    recs = [r for r in read_jsonl(PROVENANCE) if r.get("status") in {"saved", "manual"}]
    logged = {r["stored_path"]: r for r in recs}
    bad = flagged()
    problems = []
    for path, r in logged.items():
        p = ROOT / path
        if not p.exists():
            problems.append(("missing", path))
        elif sha256_file(p) != r["sha256"]:
            problems.append(("modified", path))
    files = [p for p in RAW.rglob("*") if p.is_file()] if RAW.exists() else []
    on_disk = {str(p.relative_to(ROOT)) for p in files if not p.name.startswith(".part-")}
    for path in sorted(on_disk - set(logged)):
        problems.append(("unlogged", path))
    for p in files:
        if p.name.startswith(".part-"):  # left by a crash or kill; safe to delete
            problems.append(("partial", str(p.relative_to(ROOT))))

    inv = DATA / "inventory.csv"
    with open(inv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["source_id", "stored_path", "sha256", "bytes", "source_url", "parent_page",
                    "downloaded_at_utc", "downloaded_at_ist", "obtained_on (manual)", "method", "http_last_modified",
                    "valid", "flag_reason"])
        for r in sorted(recs, key=lambda r: (r["source_id"], r["stored_path"])):
            fl = bad.get(r["stored_path"])
            w.writerow([r["source_id"], r["stored_path"], r["sha256"], r.get("bytes"),
                        r.get("final_url") or r.get("url"), r.get("parent_url"),
                        r.get("retrieved_at_utc"), r.get("retrieved_at_ist"), r.get("obtained_on"),
                        "manual" if r["status"] == "manual" else "download",
                        (r.get("headers") or {}).get("last-modified"),
                        "no" if fl else "yes", fl["reason"] if fl else ""])

    n_bad = sum(p in bad for p in logged)
    print(f"Checked {len(logged)} original files ({len(logged) - n_bad} valid, {n_bad} flagged invalid); "
          f"inventory written to {inv.relative_to(ROOT)}")
    for kind, path in problems:
        print(f"  {kind.upper():>9}: {path}")
    print("All originals intact." if not problems else f"{len(problems)} problem(s) found.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
