"""Helpers for egs_validate.py (Task 5): an independent HTML row reader, number checks, and the
check / exception / issue registers. Nothing here writes to data/raw."""
from __future__ import annotations

import csv
import hashlib
import re
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

PASS, WARNING, FAIL, NOT_TESTABLE, UNRESOLVED = "PASS", "WARNING", "FAIL", "NOT TESTABLE", "UNRESOLVED"


# ------------------------------------------------------------------ numbers
def num(v):
    """'3,861,03,59,497.17' -> 38610359497.17; '' -> None; non-numbers -> None. Same rule as egs_clean.num."""
    s = (v or "").strip().replace(",", "")
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if re.fullmatch(r"-?\d*\.\d+", s):
        return float(s)
    return None


def fnum(v):
    """A CSV cell -> float, or None when empty / not a number."""
    if v is None:
        return None
    s = str(v).strip()
    if s == "":
        return None
    try:
        return float(s)
    except ValueError:
        return None


GROUPING_INDIAN = re.compile(r"^-?\d{1,2}(,\d{2})*,\d{3}(\.\d+)?$|^-?\d{1,3}(\.\d+)?$")
GROUPING_PORTAL = re.compile(r"^-?\d{1,3}(,\d{3})?(,\d{2})*,\d{3}(\.\d+)?$|^-?\d{1,3}(\.\d+)?$")


def grouping(s):
    """'indian' (12,34,567.00), 'portal' (3,861,03,59,497.17: three digits above the crore place),
    'plain' (no commas), or 'other'."""
    s = (s or "").strip()
    if not s:
        return ""
    if "," not in s and num(s) is not None:
        return "plain"
    if GROUPING_INDIAN.match(s):
        return "indian"
    if GROUPING_PORTAL.match(s):
        return "portal"
    return "other"


def close(a, b, tol):
    return a is not None and b is not None and abs(a - b) <= tol


# ------------------------------------------------------------------ HTML rows (independent of egs_portal_summary.grids)
class _Rows(HTMLParser):
    """Each <tr> as {cells: [text...], links: [(FD, name)...]} in document order. rowspan/colspan are
    ignored on purpose: a cell's text appears once, where the portal wrote it."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows, self._row, self._cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._row = {"cells": [], "links": []}
            self.rows.append(self._row)
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []
            self._row["cells"].append(self._cell)
        elif tag == "a" and self._row is not None:
            href = dict(attrs).get("href") or ""
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(href).query))
            if q.get("FD") or q.get("name"):
                self._row["links"].append((q.get("FD", ""), q.get("name", "").replace(".html", "")))
            if q.get("district"):  # scheme pages link to monthWiseReport.do?...&district=<code>
                self._row["links"].append(("district", q["district"]))

    def handle_endtag(self, tag):
        if tag in ("td", "th"):
            self._cell = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def norm_text(s):
    return " ".join((s or "").split())


_CACHE: dict = {}


def page_rows(path: Path):
    key = str(path)
    if key not in _CACHE:
        p = _Rows()
        try:
            p.feed(Path(path).read_bytes().decode("utf-8", "ignore"))
        except Exception:
            pass
        rows = []
        for r in p.rows:
            cells = [norm_text("".join(c)) for c in r["cells"]]
            if any(cells):
                rows.append({"cells": cells, "links": r["links"]})
        if len(_CACHE) > 4000:
            _CACHE.clear()
        _CACHE[key] = rows
    return _CACHE[key]


def rows_labelled(path, label, anywhere=False):
    lab = norm_text(label).lower()
    out = []
    for r in page_rows(path):
        cells = [c.lower() for c in r["cells"]]
        if (anywhere and lab in cells) or (cells and cells[0] == lab):
            out.append(r)
    return out


def numbers_in(row):
    return [n for n in (num(c) for c in row["cells"][1:]) if n is not None]


def page_text(path):
    return " ".join(c for r in page_rows(path) for c in r["cells"])


def norm_name(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


# ------------------------------------------------------------------ registers
class Registers:
    """checks: one row per check actually run (what was tested, how many, result).
    exceptions: one row per record that failed or needs attention.
    issues: the consolidated data-quality register (filled at the end)."""

    def __init__(self):
        self.checks, self.exceptions, self.issues = [], [], []

    def check(self, check_id, workstream, dataset, field, level, fy, tested, n_tested, n_failed, status, detail="",
              evidence=""):
        self.checks.append({"check_id": check_id, "workstream": workstream, "dataset": dataset, "field": field,
                            "level": level, "financial_year": fy, "what_was_tested": tested,
                            "records_tested": n_tested, "records_not_passing": n_failed, "status": status,
                            "detail": detail, "evidence": evidence})
        return status

    def exc(self, check_id, dataset, fy, record, field, value, expected, status, note, source_file=""):
        self.exceptions.append({"check_id": check_id, "dataset": dataset, "financial_year": fy, "record": record,
                                "field": field, "value": value, "expected": expected, "status": status,
                                "note": note, "source_file": source_file})

    def issue(self, dataset, field, level, fy, category, description, n_affected, severity, evidence, action,
              status):
        self.issues.append({"issue_id": f"EGS-DQ-{len(self.issues) + 1:03d}", "dataset": dataset, "field": field,
                            "level": level, "financial_year": fy, "category": category,
                            "description": description, "records_affected": n_affected, "severity": severity,
                            "evidence": evidence, "action_taken": action, "status": status})


def write_csv(path: Path, header, rows):
    """Deterministic CSV: fixed header, rows written in the order given (callers sort)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        for r in rows:
            w.writerow({k: ("" if r.get(k) is None else r.get(k)) for k in header})


def read_csv(path: Path):
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def sha256(path: Path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fmt(x, nd=6):
    """Stable text for floats in outputs (avoids run-to-run float noise)."""
    if x is None or x == "":
        return ""
    if isinstance(x, float):
        return f"{round(x, nd):.{nd}f}".rstrip("0").rstrip(".")
    return x
