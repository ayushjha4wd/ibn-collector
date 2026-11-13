#!/usr/bin/env python3
"""Download sources listed in config/manifest.csv into data/raw, untouched.

Rules this script enforces:
  * Original bytes are saved exactly as served (streamed to disk, no parsing).
  * Saved files are made read-only and never overwritten.
  * A file whose sha256 already exists for that source is not saved again
    ("unchanged"), so re-running is safe and only new versions are kept.
  * Every attempt is appended to data/provenance.jsonl with URL, final URL,
    download time (UTC and IST), HTTP headers, size and sha256.

Modes:
  file   - download the URL.
  page   - save an HTML snapshot of the URL, then download linked files whose
           URL matches link_pattern (up to max_files).
  manual - logged as skipped; use register_manual.py for files you download
           by hand (logins, forms, captchas, JavaScript-only sites).

Only the Python standard library is used, so this runs anywhere with Python 3.9+.
"""
from __future__ import annotations

import argparse
import email.utils
import os
import re
import shutil
import ssl
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (IST, PROVENANCE, RAW, ROOT, TOOL_VERSION, append_jsonl, known_hashes,  # noqa: E402
                    load_manifest, make_read_only, now_stamps, problem_with, safe_name, sha256_file)

USER_AGENT = f"Mozilla/5.0 (compatible; {TOOL_VERSION}; India By Numbers public-data collector)"
KEEP_HEADERS = ("content-type", "content-length", "last-modified", "etag", "content-disposition")


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self._href, self._text = href, []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            self.links.append((self._href, " ".join("".join(self._text).split())))
            self._href = None


def fetch(url: str, dest_dir: Path, ctx, timeout: int, retries: int) -> dict:
    """Stream url to a temp file in dest_dir. Returns response metadata + temp path."""
    last_err = None
    for attempt in range(1, retries + 1):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                fd, tmp = tempfile.mkstemp(dir=dest_dir, prefix=".part-")
                try:
                    with os.fdopen(fd, "wb") as out:
                        shutil.copyfileobj(resp, out, 1 << 20)
                    # urllib does not raise when a connection drops early on a
                    # Content-Length response; it just stops. Check the size ourselves.
                    expected = resp.headers.get("content-length")
                    got = Path(tmp).stat().st_size
                    if expected and expected.isdigit() and int(expected) != got:
                        raise IOError(f"incomplete download: got {got} of {expected} bytes")
                except BaseException:
                    Path(tmp).unlink(missing_ok=True)  # never leave partial downloads behind
                    raise
                headers = {k: resp.headers.get(k) for k in KEEP_HEADERS if resp.headers.get(k)}
                return {"http_status": resp.status, "final_url": resp.geturl(), "headers": headers,
                        "tmp": Path(tmp), "attempts": attempt}
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}"
            if e.code in (400, 401, 403, 404, 410):
                break
        except Exception as e:  # network errors, timeouts, SSL
            last_err = f"{type(e).__name__}: {e}"
        time.sleep(min(2 ** attempt, 30))
    raise RuntimeError(last_err or "unknown error")


_URL_SAFE = ":/?#[]@!$&'()*+,;=%~"


def clean_links(page_url: str, href: str) -> list[str]:
    """Turn one href from a real-world page into absolute URLs that urllib accepts.

    * Several absolute URLs pasted into one href ("a.pdf http://x/b.pdf", seen on
      the CAG Bihar page) become separate links.
    * Otherwise spaces and control characters are percent-encoded
      ("Vital Stats 2023.pdf" -> "Vital%20Stats%202023.pdf"); existing %XX escapes are kept.
    """
    href = href.strip()
    parts = href.split()
    if len(parts) > 1 and sum("://" in p for p in parts) > 1:
        hrefs = parts
    else:
        hrefs = [href]
    return [urllib.parse.quote(urllib.parse.urljoin(page_url, h), safe=_URL_SAFE) for h in hrefs]


def filename_for(url: str, headers: dict) -> str:
    cd = headers.get("content-disposition", "")
    m = re.search(r"filename\*?=(?:UTF-8'')?\"?([^\";]+)", cd, re.I)
    if m:
        return safe_name(urllib.parse.unquote(m.group(1)))
    path = urllib.parse.urlparse(url).path
    name = urllib.parse.unquote(path.rsplit("/", 1)[-1])
    if not name:
        name = "index.html"
    elif "." not in name and "html" in headers.get("content-type", ""):
        name += ".html"
    return safe_name(name)


def store(source_id: str, url: str, role: str, parent_url: str | None, link_text: str | None,
          args, ctx, run_id: str) -> dict:
    """Download one URL for a source and log it. Returns the provenance record."""
    day_dir = RAW / source_id / args.run_date_ist  # folder date is the IST calendar date of the run
    day_dir.mkdir(parents=True, exist_ok=True)
    base = {"source_id": source_id, "url": url, "role": role, "parent_url": parent_url,
            "link_text": link_text, "run_id": run_id, "tool": TOOL_VERSION, **now_stamps()}
    try:
        meta = fetch(url, day_dir, ctx, args.timeout, args.retries)
    except RuntimeError as e:
        rec = {**base, "status": "error", "error": str(e)}
        append_jsonl(PROVENANCE, rec)
        return rec

    tmp: Path = meta.pop("tmp")
    digest = sha256_file(tmp)
    size = tmp.stat().st_size
    problem = problem_with(tmp, meta["final_url"], is_page=(role == "page_snapshot"))
    if problem:  # e.g. a CAPTCHA page served in place of a PDF: not an original, don't keep it
        tmp.unlink()
        rec = {**base, **meta, "status": "blocked", "sha256": digest, "bytes": size, "error": problem}
        append_jsonl(PROVENANCE, rec)
        return rec
    seen = known_hashes(source_id)
    if digest in seen:
        tmp.unlink()
        rec = {**base, **meta, "status": "unchanged", "sha256": digest, "bytes": size,
               "stored_path": seen[digest]}
        append_jsonl(PROVENANCE, rec)
        return rec

    name = filename_for(meta["final_url"], meta["headers"])
    target = day_dir / name
    n = 1
    while target.exists():  # never overwrite; keep both versions
        stem, dot, ext = name.rpartition(".")
        target = day_dir / (f"{stem}__{n}.{ext}" if dot else f"{name}__{n}")
        n += 1
    os.replace(tmp, target)
    make_read_only(target)
    rec = {**base, **meta, "status": "saved", "sha256": digest, "bytes": size,
           "stored_path": str(target.relative_to(ROOT))}
    append_jsonl(PROVENANCE, rec)
    return rec


def run_source(src: dict, args, ctx, run_id: str) -> list[dict]:
    sid, mode, url = src["source_id"], src["mode"], src["url"]
    if args.dry_run:  # dry runs never touch the log or the disk
        return [{"source_id": sid, "url": url, "status": "dry_run_manual" if mode == "manual" else "dry_run"}]
    if mode == "manual":
        rec = {"source_id": sid, "url": url or None, "status": "skipped_manual", "run_id": run_id,
               "tool": TOOL_VERSION, "note": src.get("notes", ""), **now_stamps()}
        append_jsonl(PROVENANCE, rec)
        return [rec]

    first = store(sid, url, "file" if mode == "file" else "page_snapshot", None, None, args, ctx, run_id)
    out = [first]
    if mode != "page" or first["status"] in ("error", "blocked"):
        return out

    html_path = ROOT / first["stored_path"]
    parser = LinkParser()
    parser.feed(html_path.read_text(encoding="utf-8", errors="replace"))
    pattern = re.compile(src["link_pattern"] or r".")
    page_url = first.get("final_url", url)
    seen, wanted = set(), []
    for href, text in parser.links:
        for absu in clean_links(page_url, href):
            if absu.startswith(("http://", "https://")) and pattern.search(absu) and absu not in seen:
                seen.add(absu)
                wanted.append((absu, text))
    limit = int(src["max_files"] or 50)
    if len(wanted) > limit:
        append_jsonl(PROVENANCE, {"source_id": sid, "url": page_url, "status": "truncated", "run_id": run_id,
                                  "tool": TOOL_VERSION, "links_found": len(wanted), "links_fetched": limit,
                                  **now_stamps()})
    for link, text in wanted[:limit]:
        time.sleep(args.delay)
        out.append(store(sid, link, "linked_file", page_url, text, args, ctx, run_id))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--manifest", default=str(ROOT / "config" / "manifest.csv"))
    ap.add_argument("--only", nargs="*", help="source_ids to run (default: all)")
    ap.add_argument("--priority", type=int, help="run only sources with priority <= this")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between requests to be polite")
    ap.add_argument("--timeout", type=int, default=60)
    ap.add_argument("--retries", type=int, default=3)
    ap.add_argument("--ca-bundle", help="custom CA bundle (some government sites have incomplete chains)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    ctx = ssl.create_default_context(cafile=args.ca_bundle) if args.ca_bundle else ssl.create_default_context()
    sources = load_manifest(Path(args.manifest))
    if args.only:
        sources = [s for s in sources if s["source_id"] in set(args.only)]
    if args.priority is not None:
        sources = [s for s in sources if s["priority"] and int(s["priority"]) <= args.priority]

    import datetime as dt
    started = dt.datetime.now(dt.timezone.utc)
    run_id = started.strftime("%Y-%m-%dT%H%M%SZ")
    args.run_date_ist = started.astimezone(IST).strftime("%Y-%m-%d")
    totals: dict[str, int] = {}
    for src in sources:
        for rec in run_source(src, args, ctx, run_id):
            totals[rec["status"]] = totals.get(rec["status"], 0) + 1
            tag = rec["status"].upper()
            detail = rec.get("stored_path") or rec.get("error") or rec.get("note") or ""
            print(f"[{tag:>14}] {rec['source_id']:<10} {rec.get('url') or ''}  {detail}")
        time.sleep(args.delay if not args.dry_run else 0)
    print(f"\nRun {run_id}: " + ", ".join(f"{k}={v}" for k, v in sorted(totals.items())))
    print(f"Provenance log: {PROVENANCE}")
    if totals.get("blocked"):
        print("Some responses were bot-check or block pages, not files; see 'blocked' records. "
              "Download those by hand and add them with register_manual.py --dir.")
    return 1 if totals.get("error") or totals.get("blocked") else 0


if __name__ == "__main__":
    sys.exit(main())
