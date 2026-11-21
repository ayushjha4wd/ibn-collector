"""Build the consolidated Tasks 1-5 report as PDF and Excel from docs/IBN_FULL_REPORT.md.

    python scripts/make_full_report.py

Writes docs/IBN_FULL_REPORT.pdf and docs/IBN_FULL_REPORT.xlsx. The workbook has one sheet per report
section (every table, as written in the report), followed by key Task 3 and Task 4 tables taken from
data/analysis/ and data/clean/egs/. Needs pandoc, Playwright with Chromium, and openpyxl.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_task4_docs import ANA, CLEAN, md_sections, pdf, put, rows_of, widths  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MD = ROOT / "docs" / "IBN_FULL_REPORT.md"


def xlsx():
    wb = Workbook()
    wb.remove(wb.active)
    for sec, tables in md_sections(MD).items():
        name = re.sub(r"[\[\]:*?/\\]", "", sec)[:31]
        w = wb.create_sheet(name)
        r = 1
        for title, head, rows in tables:
            r = put(w, title, head, rows, r)
        widths(w)
    text = MD.read_text(encoding="utf-8")
    sec6 = text[text.index("## 7."):text.index("## 8.")]
    blocks = re.split(r"^\d+\. ", sec6.split("\n", 1)[1], flags=re.M)[1:]  # each numbered step with its sub-points
    items = [" ".join(re.sub(r"\*\*|`", "", ln).strip(" -") for ln in b.splitlines() if ln.strip()) for b in blocks]
    w = wb.create_sheet("7. Gaps and next steps")
    put(w, "Gaps and next steps", ["#", "Step"], [[i + 1, s] for i, s in enumerate(items)], 1)
    widths(w, 120)
    wb.move_sheet(w, offset=-(len(wb.sheetnames) - 1 - wb.sheetnames.index("6. How the work was done") - 1))
    files = ROOT / "data" / "analysis" / "files.csv"
    extra = [
        ("Task 3 - collected files", files, None, None),
        ("Task 4 - Bihar by year", CLEAN / "state_year_summary.csv",
         ["financial_year", "tier", "panchayats", "receipt_amount_rs", "payment_amount_rs", "report_generated_on"], None),
        ("Task 4 - districts 2024-25", CLEAN / "district_finance.csv",
         ["district_code", "district", "zp_ob_plus_receipts_cr", "zp_payments_cr", "bp_ob_plus_receipts_cr",
          "bp_payments_cr", "gp_ob_plus_receipts_cr", "gp_payments_cr"], lambda x: x["financial_year"] == "2024-2025"),
        ("Task 4 - elected reps", CLEAN / "state_indicators.csv", ["endpoint", "field", "value"],
         lambda x: x["endpoint"].startswith("ElectedStateReport")),
        ("Task 4 - AuditOnline by year", ANA / "coverage_by_year.csv", None, None),
    ]
    for title, path, keep, where in extra:
        if not path.exists():
            continue
        cols, rows = rows_of(path, keep, where)
        w = wb.create_sheet(title[:31])
        put(w, title.split(" - ", 1)[1], cols, rows, 1)
        widths(w)
        w.freeze_panes = "A3"
    out = MD.with_suffix(".xlsx")
    wb.save(out)
    print("wrote", out)


if __name__ == "__main__":
    pdf(MD, MD.with_suffix(".pdf"), "India By Numbers: Bihar Data, Tasks 1 to 5", "IBN · Bihar · Tasks 1–5")
    xlsx()
