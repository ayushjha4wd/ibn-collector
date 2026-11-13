#!/usr/bin/env python3
"""Extract machine-readable copies of raw files into data/processed.

Raw files are opened read-only and never changed. Each raw file (identified
by sha256) is extracted once; outputs go to
  data/processed/<source_id>/<sha256[:12]>/
with an extraction.json sidecar linking back to the raw file, its source URL
and download time. Every extraction is also appended to data/extractions.jsonl.

What is extracted:
  PDF        -> page_NNN.txt (text per page) + tables/page_NNN_table_K.csv
  XLSX/XLS   -> sheets/<sheet>.csv  (all cells as text, header=None, no cleaning)
  CSV        -> data.csv re-encoded to UTF-8 (values untouched)
  HTML       -> tables/table_K.csv for each <table>
  ZIP        -> zip/<member>/<sheet>.csv for each spreadsheet or CSV inside, read in
                memory (nothing is unpacked into data/raw); other members are listed
                in zip/members.txt
Anything else is listed as "not extracted" so nothing is silently skipped.

Needs: pdfplumber, pandas, openpyxl, lxml (see requirements.txt).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (EXTRACTIONS, PROCESSED, PROVENANCE, ROOT, TOOL_VERSION, append_jsonl, flagged,  # noqa: E402
                    now_stamps, read_jsonl, safe_name, sha256_file)

EXTRACTOR_VERSION = "extract/0.3"
SUPPORTED = {"pdf", "xlsx", "xls", "csv", "html", "zip"}


class NotExtracted(Exception):
    """The file is fine but this extractor can't turn it into tables or text."""


def kind_of(path: Path, content_type: str) -> str:
    head = path.open("rb").read(8)
    ext = path.suffix.lower()
    if head.startswith(b"%PDF"):
        return "pdf"
    if head.startswith(b"PK") and ext == ".zip":
        return "zip"
    if head.startswith(b"PK") and ext in (".xlsx", ".xlsm", ""):
        return "xlsx"
    if head.startswith(b"\xd0\xcf\x11\xe0") or ext == ".xls":
        return "xls"
    if ext == ".csv" or "csv" in content_type:
        return "csv"
    if ext in (".html", ".htm", ".aspx") or "html" in content_type:
        return "html"
    return "other"


def extract_pdf(src: Path, out: Path) -> list[str]:
    import pdfplumber
    files = []
    (out / "tables").mkdir(parents=True, exist_ok=True)
    with pdfplumber.open(src) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            txt = out / f"page_{i:03d}.txt"
            txt.write_text(page.extract_text() or "", encoding="utf-8")
            files.append(txt)
            for k, table in enumerate(page.extract_tables() or [], start=1):
                import csv
                t = out / "tables" / f"page_{i:03d}_table_{k}.csv"
                with open(t, "w", newline="", encoding="utf-8") as f:
                    csv.writer(f).writerows([[("" if c is None else c) for c in row] for row in table])
                files.append(t)
            # pdfplumber keeps every parsed page in memory; release each one so a
            # 1,000-page report (e.g. the 116 MB 15th FC Vol IV) doesn't exhaust memory.
            page.close()
    return [str(f.relative_to(ROOT)) for f in files]


def extract_excel(src: Path, out: Path, engine: str | None) -> list[str]:
    import pandas as pd
    files = []
    (out / "sheets").mkdir(parents=True, exist_ok=True)
    sheets = pd.read_excel(src, sheet_name=None, header=None, dtype=str, engine=engine)
    for name, df in sheets.items():
        p = out / "sheets" / f"{safe_name(str(name), 'sheet')}.csv"
        df.to_csv(p, index=False, header=False)
        files.append(p)
    return [str(f.relative_to(ROOT)) for f in files]


def extract_zip(src: Path, out: Path) -> list[str]:
    """Spreadsheets and CSVs inside a zip (e.g. a District Census Handbook's district tables)."""
    import io
    import zipfile
    import pandas as pd
    files = []
    base = out / "zip"
    base.mkdir(parents=True, exist_ok=True)
    listing = []
    with zipfile.ZipFile(src) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            listing.append(f"{info.file_size}\t{info.filename}")
            ext = Path(info.filename).suffix.lower()
            if ext not in (".xls", ".xlsx", ".xlsm", ".csv"):
                continue
            # member names come from the archive: flatten them so nothing can escape `base`
            dest = base / safe_name(info.filename.replace("/", "__"), "member")
            dest.mkdir(parents=True, exist_ok=True)
            data = z.read(info)
            try:
                if ext == ".csv":
                    for enc in ("utf-8-sig", "cp1252", "latin-1"):
                        try:
                            text = data.decode(enc)
                            break
                        except UnicodeDecodeError:
                            continue
                    p = dest / "data.csv"
                    p.write_text(text, encoding="utf-8")
                    files.append(p)
                    continue
                engine = None if ext == ".xls" else "openpyxl"
                for name, df in pd.read_excel(io.BytesIO(data), sheet_name=None, header=None,
                                              dtype=str, engine=engine).items():
                    p = dest / f"{safe_name(str(name), 'sheet')}.csv"
                    df.to_csv(p, index=False, header=False)
                    files.append(p)
            except Exception as e:  # one unreadable member shouldn't lose the rest
                listing[-1] += f"\tNOT READ: {type(e).__name__}"
    (base / "members.txt").write_text("\n".join(listing) + "\n", encoding="utf-8")
    files.append(base / "members.txt")
    return [str(f.relative_to(ROOT)) for f in files]


def extract_csv(src: Path, out: Path) -> list[str]:
    raw = src.read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    out.mkdir(parents=True, exist_ok=True)
    p = out / "data.csv"
    p.write_text(text, encoding="utf-8")
    return [str(p.relative_to(ROOT))]


def extract_html(src: Path, out: Path) -> list[str]:
    import io
    import pandas as pd
    html = src.read_text(encoding="utf-8", errors="replace")
    try:
        # lxml only: pandas' fallback parser needs html5lib + bs4, which we don't require.
        tables = pd.read_html(io.StringIO(html), flavor="lxml")
    except ValueError:  # no tables
        return []
    except Exception as e:  # malformed markup lxml can't recover from
        raise NotExtracted(f"HTML tables not readable: {type(e).__name__}: {str(e)[:120]}")
    (out / "tables").mkdir(parents=True, exist_ok=True)
    files = []
    for k, df in enumerate(tables, start=1):
        p = out / "tables" / f"table_{k}.csv"
        df.to_csv(p, index=False)
        files.append(p)
    return [str(f.relative_to(ROOT)) for f in files]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*", help="source_ids to extract (default: all)")
    ap.add_argument("--force", action="store_true", help="re-extract even if already done (new folder version)")
    args = ap.parse_args(argv)

    log = read_jsonl(EXTRACTIONS)
    done = {r["raw_sha256"] for r in log if r.get("status") == "ok"}
    # A file once "not extracted" is tried again only if this version now supports its type.
    unsupported_before = {r["raw_sha256"] for r in log if r.get("status") == "not_extracted"} - done
    bad = flagged()
    saved = [r for r in read_jsonl(PROVENANCE) if r.get("status") in {"saved", "manual"}]
    skipped_flagged = sum(r["stored_path"] in bad for r in saved)
    saved = [r for r in saved if r["stored_path"] not in bad]
    if skipped_flagged:
        print(f"Skipping {skipped_flagged} flagged file(s) (see flag.py)")
    if args.only:
        saved = [r for r in saved if r["source_id"] in set(args.only)]
    counts: dict[str, int] = {}
    for rec in saved:
        src = ROOT / rec["stored_path"]
        if not args.force and (rec["sha256"] in done or (
                rec["sha256"] in unsupported_before and src.exists()
                and kind_of(src, (rec.get("headers") or {}).get("content-type", "")) not in SUPPORTED)):
            counts["already_done"] = counts.get("already_done", 0) + 1
            continue
        if not src.exists() or sha256_file(src) != rec["sha256"]:
            status, outputs, err, kind = "raw_mismatch", [], "raw file missing or changed — run verify.py", None
        else:
            kind = kind_of(src, (rec.get("headers") or {}).get("content-type", ""))
            out = PROCESSED / rec["source_id"] / rec["sha256"][:12]
            if args.force and out.exists():
                out = out.with_name(out.name + "__" + now_stamps()["retrieved_at_utc"][:19].replace(":", ""))
            out.mkdir(parents=True, exist_ok=True)
            try:
                outputs = {"pdf": lambda: extract_pdf(src, out),
                           "xlsx": lambda: extract_excel(src, out, "openpyxl"),
                           "xls": lambda: extract_excel(src, out, None),
                           "csv": lambda: extract_csv(src, out),
                           "html": lambda: extract_html(src, out),
                           "zip": lambda: extract_zip(src, out)}.get(kind, lambda: None)()
                status, err = ("ok", None) if outputs is not None else ("not_extracted", f"unsupported type: {kind}")
                outputs = outputs or []
            except NotExtracted as e:
                status, outputs, err = "not_extracted", [], str(e)
            except Exception as e:
                status, outputs, err = "error", [], f"{type(e).__name__}: {e}"
            side = {"raw_path": rec["stored_path"], "raw_sha256": rec["sha256"], "source_id": rec["source_id"],
                    "source_url": rec.get("final_url") or rec.get("url"), "parent_url": rec.get("parent_url"),
                    "retrieved_at_utc": rec.get("retrieved_at_utc"), "obtained_on": rec.get("obtained_on"),
                    "kind": kind, "outputs": outputs, "status": status, "error": err,
                    "extractor": EXTRACTOR_VERSION, "tool": TOOL_VERSION}
            (out / "extraction.json").write_text(json.dumps(side, indent=2, ensure_ascii=False), encoding="utf-8")
        log = {"source_id": rec["source_id"], "raw_sha256": rec["sha256"], "raw_path": rec["stored_path"],
               "kind": kind, "status": status, "error": err, "n_outputs": len(outputs),
               "extractor": EXTRACTOR_VERSION, "extracted_at_utc": now_stamps()["retrieved_at_utc"]}
        append_jsonl(EXTRACTIONS, log)
        counts[status] = counts.get(status, 0) + 1
        print(f"[{status:>13}] {rec['source_id']:<10} {rec['stored_path']}  ({len(outputs)} outputs){'  ' + err if err else ''}")
    print("\nExtraction: " + (", ".join(f"{k}={v}" for k, v in sorted(counts.items())) or "nothing to do"))
    return 1 if counts.get("error") or counts.get("raw_mismatch") else 0


if __name__ == "__main__":
    sys.exit(main())
