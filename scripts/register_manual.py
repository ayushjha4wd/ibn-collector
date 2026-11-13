#!/usr/bin/env python3
"""Add a file you downloaded by hand to data/raw with full provenance.

Use for sources behind logins, forms, captchas or JavaScript (manifest mode
"manual"). The file is copied byte-for-byte (your copy is left alone), made
read-only, hashed and logged in data/provenance.jsonl.

Example:
  python scripts/register_manual.py --source-id BR-DM-01 \
      --file ~/Downloads/caste_survey_report.pdf \
      --url "https://example.gov.in/report.pdf" \
      --obtained-on 2026-11-13 --note "Tabled in Bihar assembly, Nov 2023"
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (PROVENANCE, RAW, ROOT, TOOL_VERSION, append_jsonl, known_hashes,  # noqa: E402
                    make_read_only, now_stamps, safe_name, sha256_file)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source-id", required=True)
    ap.add_argument("--file", required=True, help="path to the downloaded file")
    ap.add_argument("--url", help="where it was downloaded from (page or file URL)")
    ap.add_argument("--obtained-on", required=True, help="date downloaded, YYYY-MM-DD")
    ap.add_argument("--obtained-by", default="", help="person or team (optional)")
    ap.add_argument("--note", default="")
    args = ap.parse_args(argv)

    import datetime as dt
    import re
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

    src = Path(args.file).expanduser()
    if not src.is_file():
        raise SystemExit(f"Not a file: {src}")
    digest = sha256_file(src)
    seen = known_hashes(args.source_id)
    if digest in seen:
        print(f"Already registered (same sha256): {seen[digest]}")
        return 0
    day_dir = RAW / args.source_id / args.obtained_on
    day_dir.mkdir(parents=True, exist_ok=True)
    target = day_dir / safe_name(src.name)
    n = 1
    while target.exists():
        target = day_dir / f"{target.stem}__{n}{target.suffix}"
        n += 1
    shutil.copy2(src, target)
    if sha256_file(target) != digest:
        target.unlink()
        raise SystemExit("Copy check failed; nothing registered.")
    make_read_only(target)
    rec = {"source_id": args.source_id, "url": args.url, "role": "manual", "status": "manual",
           "obtained_on": args.obtained_on, "obtained_by": args.obtained_by, "note": args.note,
           "sha256": digest, "bytes": target.stat().st_size, "stored_path": str(target.relative_to(ROOT)),
           "original_filename": src.name, "tool": TOOL_VERSION, **now_stamps()}
    append_jsonl(PROVENANCE, rec)
    print(f"Registered {rec['stored_path']}  sha256={digest[:12]}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
