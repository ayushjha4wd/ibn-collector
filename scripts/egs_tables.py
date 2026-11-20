"""Turn the eGramSwaraj report pages saved by egs_explore.py into clean CSV + Excel.

The portal's reports are JasperReports HTML: every value sits in a <td> with rowspan/colspan,
padded with empty <tr>s, and the column headings span several rows. This script rebuilds the
grid, drops the padding rows, joins multi-row headings ("Zilla Panchayat - Entered Vouchers"),
reads the caption ("Financial Year:-2024-2025 State:-Bihar,District:-Araria") into columns,
and stacks files of the same report into one table.

Standard library only (+ openpyxl for the .xlsx). Raw files are never modified.

USAGE
  python scripts/egs_tables.py                      # newest data/raw/EGS-PORTAL/<date>
  python scripts/egs_tables.py --date 2026-11-20
Output: data/egs_explore/<date>/tables/*.csv, bihar/*.csv and bihar_egramswaraj_reports.xlsx
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import OrderedDict, defaultdict
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "EGS-PORTAL"
HEADER_BG = "#fcce3c"
TEXT_COLS = {"report", "fin_year", "state", "district", "block", "source_file", "family"}
SKIP_TEXT = re.compile(r"(?i)^(export to (excel|pdf)|print|back)$")


class TableParser(HTMLParser):
    """Collect every <table> as a list of rows; each cell = dict(text, colspan, rowspan, header)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self._stack, self._cell, self._skip = [], [], None, 0

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in ("script", "style"):
            self._skip += 1
        elif tag == "table":
            self._stack.append([])
        elif tag == "tr" and self._stack:
            self._stack[-1].append([])
        elif tag in ("td", "th") and self._stack:
            if not self._stack[-1]:
                self._stack[-1].append([])
            self._cell = {"text": "", "colspan": _int(d.get("colspan")), "rowspan": _int(d.get("rowspan")),
                          "header": tag == "th" or (d.get("bgcolor") or "").lower() == HEADER_BG}
            self._stack[-1][-1].append(self._cell)
        elif tag == "br" and self._cell is not None:
            self._cell["text"] += "\n"

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._skip = max(0, self._skip - 1)
        elif tag in ("td", "th"):
            if self._cell is not None:
                self._cell["text"] = "\n".join(re.sub(r"[ \t\r\xa0]+", " ", x).strip()
                                               for x in self._cell["text"].split("\n")).strip()
            self._cell = None
        elif tag == "table" and self._stack:
            self.tables.append(self._stack.pop())

    def handle_data(self, data):
        if self._cell is not None and not self._skip:
            self._cell["text"] += data


def _int(v):
    try:
        return max(1, int(float(v)))
    except (TypeError, ValueError):
        return 1


def grid(rows):
    """Lay out cells honouring rowspan/colspan. Returns [(cells_in_row, filled_row)] for rows
    that start at least one cell (padding rows that only carry spans are dropped)."""
    taken = {}  # (r, c) -> text from a span above
    out = []
    for r, cells in enumerate(rows):
        filled, c = {}, 0
        for cell in cells:
            while (r, c) in taken:
                filled[c] = taken[(r, c)]
                c += 1
            for dc in range(cell["colspan"]):
                filled[c + dc] = cell["text"]
                for dr in range(1, cell["rowspan"]):
                    taken[(r + dr, c + dc)] = cell["text"]
            cell["col"] = c
            c += cell["colspan"]
        for (rr, cc), t in taken.items():
            if rr == r and cc not in filled:
                filled[cc] = t
        if cells:
            out.append((cells, filled))
    return out


def parse_report(html: str):
    """Yield dicts {caption, columns, rows} for each data table on the page."""
    p = TableParser()
    try:
        p.feed(html)
    except Exception:
        pass
    captions = []
    for tbl in p.tables:  # report pages do not nest tables, so close order = document order
        laid = grid(tbl)
        if not laid:
            continue
        ncols = max((max(f) + 1 for _, f in laid if f), default=0)
        head, body = [], []
        for cells, filled in laid:
            texts = [x["text"] for x in cells if x["text"]]
            if len(cells) == 1 and (cells[0]["colspan"] >= max(2, ncols - 1) or ncols <= 1):
                if texts and not SKIP_TEXT.match(texts[0]):
                    captions.append(texts[0])
                continue
            if not texts:
                continue
            if all(x["header"] for x in cells) and not body:
                head.append(filled)
            else:
                body.append(filled)
        if not body or not head:
            continue
        cols = []
        for c in range(ncols):
            parts = []
            for h in head:
                t = (h.get(c) or "").replace("\n", " ").strip()
                if t and t not in parts:
                    parts.append(t)
            cols.append(" - ".join(parts) or f"col{c + 1}")
        cols = _dedupe(cols)
        rows = [[(b.get(c) or "").replace("\n", " ").strip() for c in range(ncols)] for b in body]
        yield {"caption": "\n".join(captions), "columns": cols, "rows": rows}


def _dedupe(cols):
    seen, out = defaultdict(int), []
    for c in cols:
        seen[c] += 1
        out.append(c if seen[c] == 1 else f"{c} ({seen[c]})")
    return out


def caption_fields(caption: str) -> dict:
    lines = [l for l in caption.split("\n") if l.strip() and "eGramSwaraj" not in l and l.strip() != "(Accounting)"
             and not re.search(r"(?i)designed\s*&\s*developed|national informatics centre|^page \d", l)]
    f = {"report": "", "fin_year": "", "state": "", "district": "", "block": ""}
    rest = []
    for l in lines:
        for k, v in re.findall(r"(Financial Year|State|District|Block|Panchayat)\s*:-\s*([^,:]+?)(?=,|$|\s+\w+\s*:-)", l):
            key = {"Financial Year": "fin_year", "Panchayat": "block"}.get(k, k.lower())
            f[key] = v.strip()
        if ":-" not in l:
            rest.append(l.strip())
    f["report"] = " / ".join(dict.fromkeys(rest))
    return f


def to_number(v: str):
    s = v.replace(",", "").strip()
    if not s:
        return v
    if re.fullmatch(r"-?\d+", s) and not (len(s) > 1 and s.startswith("0")):
        return int(s)
    if re.fullmatch(r"-?\d+\.\d+", s):
        return float(s)
    return v


def family(name: str) -> str:
    """Group saved file names by report type, e.g. SummaryReport + district level."""
    n = re.sub(r"\.\d+\.html$", ".html", name)
    m = re.match(r"FileRedirect\.jsp__FD=(SummaryReport|ExpenditureReport|FinancialYear)(\d{4}-\d{4})_(.*)\.html\.html$", n)
    if m:
        kind, _, tail = m.groups()
        if "StateSummaryReport" in tail or "StateExpenditureReport" in tail:
            return f"{kind}_all_states"
        return kind + "_{level}"  # filled from the caption: "state" (district rows) or "district" (block rows)
    m = re.match(r"FileRedirect\.jsp__FD=priasoftOverview_name=(statewiseClosureReport)", n)
    if m:
        return m.group(1)
    if n.startswith("FileRedirect.jsp"):
        return "other_" + re.sub(r"[^A-Za-z]+", "", n.split("FD=", 1)[-1])[:40]
    return re.sub(r"(__.*)?\.html$", "", n)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", help="crawl date folder under data/raw/EGS-PORTAL (default: newest)")
    ap.add_argument("--min-rows", type=int, default=5, help="skip smaller tables on non-report pages")
    a = ap.parse_args()
    dates = sorted(p.name for p in RAW.iterdir() if p.is_dir())
    date = a.date or dates[-1]
    src = RAW / date
    out = ROOT / "data" / "egs_explore" / date / "tables"
    (out / "bihar").mkdir(parents=True, exist_ok=True)

    fams = OrderedDict()  # family -> {"columns": [...], "rows": [dict]}
    index, seen = [], set()
    for f in sorted(src.rglob("*.html")):
        body = f.read_bytes()
        digest = hashlib.sha256(body).hexdigest()
        if digest in seen:  # the same page saved twice (crawl + forms run)
            continue
        seen.add(digest)
        html = body.decode("utf-8", errors="ignore")
        fam = family(f.name)
        is_report = f.name.startswith("FileRedirect.jsp")
        for i, t in enumerate(parse_report(html)):
            if not is_report and len(t["rows"]) < a.min_rows:
                continue  # menus, search boxes and one-line notices on ordinary portal pages
            meta = caption_fields(t["caption"])
            key = fam.replace("{level}", "district" if meta["district"] else "state")
            key = key if i == 0 else f"{key}_t{i + 1}"
            bucket = fams.setdefault(key, {"columns": [], "rows": []})
            for c in t["columns"]:
                if c not in bucket["columns"]:
                    bucket["columns"].append(c)
            for r in t["rows"]:
                bucket["rows"].append({**meta, "source_file": str(f.relative_to(ROOT)).replace("\\", "/"),
                                       **dict(zip(t["columns"], r))})
            index.append({"family": key, "source_file": str(f.relative_to(ROOT)).replace("\\", "/"),
                          **meta, "n_rows": len(t["rows"]), "n_cols": len(t["columns"])})

    # JSON API answers (getMobileData) -> flat tables
    for f in sorted(src.rglob("getMobileData_*.json")):
        if re.search(r"\.\d+\.json$", f.name):
            continue  # duplicate copy from the second run
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        rows = d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [d]) \
            if isinstance(d, dict) else []
        rows = [r for r in rows if isinstance(r, dict)]
        if not rows:
            continue
        key = "api_" + re.sub(r"^getMobileData_|_\d{4}-\d{2,4}.*$", "", f.stem)
        bucket = fams.setdefault(key, {"columns": [], "rows": []})
        fy = re.search(r"\d{4}-\d{4}", f.name)
        for r in rows:
            flat = {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v) for k, v in r.items()}
            for c in flat:
                if c not in bucket["columns"]:
                    bucket["columns"].append(c)
            bucket["rows"].append({"report": key, "fin_year": fy.group(0) if fy else "", "state": "", "district": "",
                                   "block": "", "source_file": str(f.relative_to(ROOT)).replace("\\", "/"), **flat})
        index.append({"family": key, "source_file": str(f.relative_to(ROOT)).replace("\\", "/"), "report": key,
                      "n_rows": len(rows), "n_cols": len(bucket["columns"])})

    meta_cols = ["report", "fin_year", "state", "district", "block"]
    written, bihar_sheets = [], OrderedDict()
    for key, b in fams.items():
        if not b["rows"]:
            continue
        cols = meta_cols + b["columns"] + ["source_file"]
        _write_csv(out / f"{key}.csv", cols, b["rows"])
        written.append((key, len(b["rows"])))
        bihar = [r for r in b["rows"] if _is_bihar(r)]
        if bihar:
            _write_csv(out / "bihar" / f"bihar_{key}.csv", cols, bihar)
            bihar_sheets[key] = (cols, bihar)
    _write_csv(out / "index.csv", ["family", "report", "fin_year", "state", "district", "block", "n_rows", "n_cols",
                                   "source_file"], index)
    xlsx = _write_xlsx(out / "bihar" / "bihar_egramswaraj_reports.xlsx", bihar_sheets, date)
    print(f"{len(written)} report tables -> {out}")
    for k, n in written:
        print(f"  {n:7d} rows  {k}.csv")
    print(f"Bihar: {len(bihar_sheets)} tables, workbook {xlsx}")


def _is_bihar(r: dict) -> bool:
    """Bihar if the report caption says State:-Bihar, a cell says Bihar (all-state tables),
    or it is an API answer requested for state code 10."""
    if (r.get("state") or "").strip().lower() == "bihar":
        return True
    if any(str(v).strip().lower() == "bihar" for k, v in r.items() if k not in ("source_file", "report")):
        return True
    src = str(r.get("source_file", ""))
    return "getMobileData" in src and re.search(r"Wise_\d{4}-\d{4}_10_", src) is not None


def _write_csv(path: Path, cols, rows):
    with open(path, "w", encoding="utf-8-sig", newline="") as fh:  # utf-8-sig so Excel shows Hindi correctly
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows:  # Indian-format numbers ("11,09,00,374.00") -> plain numbers Excel can add up
            w.writerow({k: (to_number(v) if k not in TEXT_COLS and isinstance(v, str) else v) for k, v in r.items()})


def _write_xlsx(path: Path, sheets, date):
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill
        from openpyxl.utils import get_column_letter
    except ImportError:
        print("openpyxl not installed: pip install openpyxl  (CSV files were still written)")
        return None
    wb = Workbook()
    ws = wb.active
    ws.title = "About"
    ws.append(["eGramSwaraj (Accounting) reports for Bihar, extracted from pages saved on " + date])
    ws.append(["Source: https://egramswaraj.gov.in public report pages; each row keeps its source_file."])
    ws.append([])
    ws.append(["Sheet", "Rows", "Report", "Financial years"])
    ws["A1"].font = Font(bold=True, size=13)
    for c in ws[4]:
        c.font = Font(bold=True)
    names = {}
    for key, (cols, rows) in sheets.items():
        name = re.sub(r"[\[\]:*?/\\]", "", key)[:31]
        while name in names.values():
            name = name[:28] + str(len(names))
        names[key] = name
        fys = sorted({r.get("fin_year") for r in rows if r.get("fin_year")})
        ws.append([name, len(rows), next((r.get("report") for r in rows if r.get("report")), ""),
                   ", ".join(fys)])
    ws.column_dimensions["A"].width = 32
    ws.column_dimensions["C"].width = 60
    head_fill = PatternFill("solid", fgColor="FCCE3C")
    for key, (cols, rows) in sheets.items():
        s = wb.create_sheet(names[key])
        keep = [c for c in cols if any(str(r.get(c, "")).strip() for r in rows)]
        s.append(keep)
        for c in s[1]:
            c.font, c.fill = Font(bold=True), head_fill
        for r in rows:
            s.append([to_number(str(r.get(c, ""))) if c not in ("fin_year", "source_file") else r.get(c, "")
                      for c in keep])
        s.freeze_panes = "A2"
        for i, c in enumerate(keep, 1):
            s.column_dimensions[get_column_letter(i)].width = min(40, max(10, len(c) * 0.9))
    wb.save(path)
    return path


if __name__ == "__main__":
    sys.exit(main())
