"""Shared helpers: paths, hashing, provenance log, manifest loading."""
from __future__ import annotations

import csv
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path

TOOL_VERSION = "ibn-collector/0.1"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

ROOT = Path(os.environ.get("IBN_ROOT", Path(__file__).resolve().parent.parent))
DATA = ROOT / "data"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
PROVENANCE = DATA / "provenance.jsonl"
EXTRACTIONS = DATA / "extractions.jsonl"


def now_stamps() -> dict:
    utc = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    return {"retrieved_at_utc": utc.isoformat(), "retrieved_at_ist": utc.astimezone(IST).isoformat()}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def append_jsonl(path: Path, record: dict) -> None:
    """Append-only log: one JSON object per line, never rewritten."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load_manifest(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    ids = [r["source_id"] for r in rows]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise SystemExit(f"Duplicate source_id in manifest: {sorted(dupes)}")
    for r in rows:
        if not re.fullmatch(r"[A-Za-z0-9_-]+", r["source_id"] or ""):
            raise SystemExit(f"Bad source_id {r['source_id']!r}: use only letters, digits, - and _")
        if r["mode"] not in {"file", "page", "manual"}:
            raise SystemExit(f"{r['source_id']}: mode must be file, page or manual")
        if r["mode"] in {"file", "page"} and not r["url"]:
            raise SystemExit(f"{r['source_id']}: url required for mode {r['mode']}")
    return rows


_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def safe_name(name: str, default: str = "download") -> str:
    name = _SAFE.sub("_", name).strip("._") or default
    return name[:150]


def make_read_only(path: Path) -> None:
    os.chmod(path, 0o444)


def known_hashes(source_id: str) -> dict[str, str]:
    """sha256 -> stored path for everything already saved for this source."""
    out = {}
    for rec in read_jsonl(PROVENANCE):
        if rec.get("source_id") == source_id and rec.get("status") in {"saved", "manual"}:
            out[rec["sha256"]] = rec["stored_path"]
    return out
