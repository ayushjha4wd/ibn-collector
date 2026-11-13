#!/usr/bin/env python3
"""Mark saved files as not genuine originals, without deleting or moving them.

Original files are never removed. Instead, an "invalid" record is appended to
data/provenance.jsonl for each flagged file. Flagged files are then:
  * skipped by extract.py,
  * shown with their flag in data/inventory.csv (verify.py),
  * ignored when checking for duplicates, so a genuine download is saved later.

Two ways to flag:
  --auto            find saved files whose content is a bot-check page, or an
                    HTML page served for a file link (.pdf, .xlsx, ...)
  --path P [P ...]  flag specific stored paths (e.g. files from the wrong page)
                    with --reason

Dry run by default: shows what would be flagged. Add --apply to write the flags.

Examples:
  python scripts/flag.py --auto
  python scripts/flag.py --auto --apply
  python scripts/flag.py --path data/raw/BR-PF-05/2026-11-13/Pension-Guidelines.pdf \\
      --reason "off-target: from the AG Bihar home page, not a state accounts report" --apply
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (PROVENANCE, ROOT, TOOL_VERSION, append_jsonl, flagged, now_stamps,  # noqa: E402
                    problem_with, read_jsonl)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--auto", action="store_true")
    g.add_argument("--path", nargs="+")
    ap.add_argument("--reason", help="required with --path")
    ap.add_argument("--only", nargs="*", help="limit --auto to these source_ids")
    ap.add_argument("--apply", action="store_true", help="write the flags (default: dry run)")
    args = ap.parse_args(argv)
    if args.path and not args.reason:
        ap.error("--reason is required with --path")

    already = flagged()
    saved = {r["stored_path"]: r for r in read_jsonl(PROVENANCE) if r.get("status") in {"saved", "manual"}}
    todo = []
    if args.auto:
        for path, rec in saved.items():
            if path in already or (args.only and rec["source_id"] not in args.only):
                continue
            p = ROOT / path
            if not p.exists():
                continue
            why = problem_with(p, rec.get("final_url") or rec.get("url") or "", rec.get("role") == "page_snapshot")
            if why:
                todo.append((rec, why))
    else:
        for path in args.path:
            rel = str(Path(path)) if not Path(path).is_absolute() else str(Path(path).relative_to(ROOT))
            if rel not in saved:
                raise SystemExit(f"Not a saved original in the provenance log: {rel}")
            if rel in already:
                print(f"already flagged: {rel}")
                continue
            todo.append((saved[rel], args.reason))

    by_source: dict[str, int] = {}
    for rec, why in todo:
        by_source[rec["source_id"]] = by_source.get(rec["source_id"], 0) + 1
        if args.apply:
            append_jsonl(PROVENANCE, {"source_id": rec["source_id"], "status": "invalid",
                                      "stored_path": rec["stored_path"], "sha256": rec["sha256"],
                                      "reason": why, "flagged_by": "auto" if args.auto else "manual",
                                      "tool": TOOL_VERSION, **now_stamps()})
    for sid, n in sorted(by_source.items()):
        print(f"{'FLAGGED' if args.apply else 'would flag'}  {sid:<10} {n} file(s)")
    if todo:
        print(f"  e.g. {todo[0][0]['stored_path']}: {todo[0][1][:120]}")
    print(f"\n{len(todo)} file(s) {'flagged' if args.apply else 'to flag (dry run; add --apply)'}; "
          "files are kept in data/raw.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
