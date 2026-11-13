#!/usr/bin/env python3
"""OCR the scanned pages that extract.py could not read.

extract.py writes page_NNN.txt for every PDF page. Scanned pages come out empty.
For each valid original PDF, this script finds those empty pages, renders just
those pages to images (pdftoppm, 200 dpi) and runs Tesseract on them (English and
Hindi), writing page_NNN.ocr.txt next to the empty page_NNN.txt. Nothing in
data/raw is touched, and the original extraction outputs are kept as they are.

Each OCR'd file is logged in data/ocr.jsonl, so re-running skips work already done.
OCR text is machine-read and can contain errors: treat it as a search aid and a
starting point for checking figures, not as the reported figure itself.

Needs: tesseract (with eng and hin language data) and pdftoppm (poppler-utils).
  apt-get install tesseract-ocr tesseract-ocr-hin poppler-utils
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (DATA, PROCESSED, PROVENANCE, ROOT, TOOL_VERSION, append_jsonl, flagged,  # noqa: E402
                    now_stamps, read_jsonl, sha256_file)

OCR_LOG = DATA / "ocr.jsonl"
EMPTY = 20  # a page with fewer characters than this counts as having no text


def ocr_page(pdf: Path, page: int, langs: str, workdir: Path) -> str:
    stem = workdir / f"p{page}"
    subprocess.run(["pdftoppm", "-r", "200", "-gray", "-png", "-f", str(page), "-l", str(page),
                    "-singlefile", str(pdf), str(stem)], check=True, capture_output=True, timeout=300)
    # one thread per Tesseract process; parallelism comes from --workers instead
    env = {**os.environ, "OMP_THREAD_LIMIT": "1"}
    out = subprocess.run(["tesseract", f"{stem}.png", "-", "-l", langs, "--psm", "3"],
                         check=True, capture_output=True, timeout=600, env=env)
    Path(f"{stem}.png").unlink(missing_ok=True)
    return out.stdout.decode("utf-8", "replace")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*", help="source_ids to OCR (default: all)")
    ap.add_argument("--langs", default="eng+hin", help="Tesseract languages (default eng+hin)")
    ap.add_argument("--max-pages", type=int, default=0, help="stop after this many pages (0 = no limit)")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 1,
                    help="pages OCR'd at the same time (default: number of CPU cores)")
    args = ap.parse_args(argv)
    for tool in ("tesseract", "pdftoppm"):
        if not shutil.which(tool):
            raise SystemExit(f"{tool} not found; see the install line in this script's help")

    done = {r["raw_sha256"] for r in read_jsonl(OCR_LOG) if r.get("status") == "ok"}
    bad = flagged()
    recs = [r for r in read_jsonl(PROVENANCE) if r.get("status") in {"saved", "manual"}
            and r["stored_path"] not in bad and r["stored_path"].lower().endswith(".pdf")]
    if args.only:
        recs = [r for r in recs if r["source_id"] in set(args.only)]
    seen, pages_total, files = set(), 0, 0
    for rec in recs:
        if rec["sha256"] in done or rec["sha256"] in seen:
            continue
        seen.add(rec["sha256"])
        out = PROCESSED / rec["source_id"] / rec["sha256"][:12]
        empty = sorted(p for p in out.glob("page_*.txt")
                       if not p.name.endswith(".ocr.txt") and len(p.read_text(encoding="utf-8").strip()) < EMPTY)
        # resume: pages OCR'd by an earlier, interrupted run keep their result
        todo = [p for p in empty if not p.with_name(p.stem + ".ocr.txt").exists()]
        if not empty:
            continue
        src = ROOT / rec["stored_path"]
        if sha256_file(src) != rec["sha256"]:
            print(f"[ raw_mismatch] {rec['stored_path']} - run verify.py")
            continue
        if args.max_pages:
            todo = todo[:max(0, args.max_pages - pages_total)]

        def one(p: Path, tmp: Path) -> None:
            n = int(p.stem.split("_")[1])
            try:
                text = ocr_page(src, n, args.langs, tmp)
            except subprocess.SubprocessError as e:
                text = ""
                print(f"    page {n}: {type(e).__name__}", flush=True)
            # write to a temp name first so an interrupted run never leaves a half-written page
            dest = p.with_name(f"page_{n:03d}.ocr.txt")
            part = dest.with_name(dest.name + ".part")
            part.write_text(text, encoding="utf-8")
            part.replace(dest)

        with tempfile.TemporaryDirectory() as tmp, ThreadPoolExecutor(max(1, args.workers)) as pool:
            list(pool.map(lambda p: one(p, Path(tmp)), todo))
        pages_total += len(todo)
        texts = [p.with_name(p.stem + ".ocr.txt").read_text(encoding="utf-8")
                 for p in empty if p.with_name(p.stem + ".ocr.txt").exists()]
        read = sum(len(t.strip()) >= EMPTY for t in texts)
        chars = sum(len(t) for t in texts)
        tried = len(texts)
        complete = tried == len(empty)
        append_jsonl(OCR_LOG, {"source_id": rec["source_id"], "raw_sha256": rec["sha256"],
                               "raw_path": rec["stored_path"], "pages_empty": len(empty), "pages_ocr": tried,
                               "pages_with_text": read,
                               "chars": chars, "langs": args.langs, "status": "ok" if complete else "partial",
                               "tool": TOOL_VERSION, "ocr_at_utc": now_stamps()["retrieved_at_utc"]})
        files += 1
        print(f"[ocr] {rec['source_id']:<10} {Path(rec['stored_path']).name[:60]}: "
              f"{read} of {tried} empty pages now have text" + ("" if complete else f" (stopped; {len(empty)} empty)"),
              flush=True)
        if not complete:
            break
    print(f"\nOCR: {files} file(s), {pages_total} page(s)")


if __name__ == "__main__":
    main()
