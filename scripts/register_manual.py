#!/usr/bin/env python3
"""Add files you downloaded by hand to data/raw with full provenance.

Use for sources behind logins, forms, captchas or JavaScript (manifest mode
"manual", or "blocked" records in the provenance log). Each file is copied
byte-for-byte (your copy is left alone), made read-only, hashed and logged
in data/provenance.jsonl. Files that are actually HTML bot-check pages are
refused.

One file:
  python scripts/register_manual.py --source-id BR-DM-01 \\
      --file ~/Downloads/caste_survey_report.pdf \\
      --url "https://example.gov.in/report.pdf" \\
      --obtained-on 2026-11-13 --note "Tabled in Bihar assembly, Nov 2023"

A whole folder (all files directly inside it, e.g. RBI tables saved from a browser):
  python scripts/register_manual.py --source-id BR-PF-14 --dir ~/Downloads/rbi_handbook \\
      --url "https://rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States" \\
      --obtained-on 2026-11-13 --note "Saved from browser; site blocks scripts with a CAPTCHA"
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (PROVENANCE, RAW, ROOT, TOOL_VERSION, append_jsonl, known_hashes,  # noqa: E402
                    make_read_only, now_stamps, problem_with, safe_name, sha256_file)


def register_one(src: Path, args) -> str:
    digest = sha256_file(src)
    seen = known_hashes(args.source_id)
    if digest in seen:
        return f"already registered  {src.name} -> {seen[digest]}"
    why = problem_with(src, args.url or src.name, is_page=src.suffix.lower() in (".html", ".htm"))
    if why:
        return f"REFUSED (not a real file)  {src.name}: {why[:100]}"
    day_dir = RAW / args.source_id / args.obtained_on
    day_dir.mkdir(parents=True, exist_ok=True)
    base = safe_name(src.name)
    stem, dot, ext = base.rpartition(".")
    target, n = day_dir / base, 1
    while target.exists():
        target = day_dir / (f"{stem}__{n}.{ext}" if dot else f"{base}__{n}")
        n += 1
    shutil.copy2(src, target)
    if sha256_file(target) != digest:
        target.unlink()
        return f"REFUSED (copy check failed)  {src.name}"
    make_read_only(target)
    rec = {"source_id": args.source_id, "url": args.url, "role": "manual", "status": "manual",
           "obtained_on": args.obtained_on, "obtained_by": args.obtained_by, "note": args.note,
           "sha256": digest, "bytes": target.stat().st_size, "stored_path": str(target.relative_to(ROOT)),
           "original_filename": src.name, "tool": TOOL_VERSION, **now_stamps()}
    append_jsonl(PROVENANCE, rec)
    return f"registered  {rec['stored_path']}  sha256={digest[:12]}…"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source-id", required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--file", help="path to one downloaded file")
    g.add_argument("--dir", help="register every file directly inside this folder")
    ap.add_argument("--url", help="where it was downloaded from (page or file URL)")
    ap.add_argument("--obtained-on", required=True, help="date downloaded, YYYY-MM-DD")
    ap.add_argument("--obtained-by", default="", help="person or team (optional)")
    ap.add_argument("--note", default="")
    args = ap.parse_args(argv)

    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.obtained_on):
        raise SystemExit(f"--obtained-on must be a date like 2026-11-13, got {args.obtained_on!r}")
    try:
        obtained = dt.date.fromisoformat(args.obtained_on)
    except ValueError:
        raise SystemExit(f"--obtained-on is not a real date: {args.obtained_on!r}")
    if obtained > dt.date.today() + dt.timedelta(days=1):
        raise SystemExit(f"--obtained-on is in the future: {args.obtained_on}")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", args.source_id):
        raise SystemExit(f"--source-id may contain only letters, digits, - and _: {args.source_id!r}")

    if args.file:
        files = [Path(args.file).expanduser()]
        if not files[0].is_file():
            raise SystemExit(f"Not a file: {files[0]}")
    else:
        d = Path(args.dir).expanduser()
        if not d.is_dir():
            raise SystemExit(f"Not a folder: {d}")
        files = sorted(p for p in d.iterdir() if p.is_file() and not p.name.startswith("."))
        if not files:
            raise SystemExit(f"No files in {d}")
    results = [register_one(f, args) for f in files]
    for line in results:
        print(line)
    refused = sum(r.startswith("REFUSED") for r in results)
    print(f"\n{sum(r.startswith('registered') for r in results)} registered, "
          f"{sum(r.startswith('already') for r in results)} already present, {refused} refused")
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main())
