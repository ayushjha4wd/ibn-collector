"""Build the shareable Task 5 documents from docs/task5/TASK5_REPORT.md and data/validated/egs/.

    python scripts/make_task5_docs.py

Writes docs/task5/TASK5_REPORT.pdf and docs/task5/TASK5_SUMMARY.xlsx (one sheet per report section with
every table as written there, then the main validation outputs). Needs pandoc, Playwright with Chromium,
and openpyxl.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_task4_docs import md_sections, pdf, put, rows_of, widths  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MD = ROOT / "docs" / "task5" / "TASK5_REPORT.md"
VAL = ROOT / "data" / "validated" / "egs"


def xlsx():
    wb = Workbook()
    wb.remove(wb.active)
    for sec, tables in md_sections(MD).items():
        w = wb.create_sheet(re.sub(r"[\[\]:*?/\\]", "", sec)[:31])
        r = 1
        for title, head, rows in tables:
            r = put(w, title, head, rows, r)
        widths(w)
    for title, name in (("Checks", "validation_checks.csv"), ("Quality register", "data_quality_summary.csv"),
                        ("Unmatched GPs", "unmatched_geographic_records.csv"),
                        ("GP counts by year", "gp_counts_by_year.csv"),
                        ("Accounting snapshots", "accounting_snapshot_comparison.csv"),
                        ("Admin indicators", "administrative_indicators.csv"),
                        ("Historical comparability", "historical_comparability.csv"),
                        ("Data dictionary", "data_dictionary.csv")):
        cols, rows = rows_of(VAL / name)
        w = wb.create_sheet(title[:31])
        put(w, title, cols, rows, 1)
        widths(w)
        w.freeze_panes = "A3"
    out = MD.with_name("TASK5_SUMMARY.xlsx")
    wb.save(out)
    print("wrote", out)


if __name__ == "__main__":
    pdf(MD, MD.with_suffix(".pdf"), "IBN Task 5: eGramSwaraj Data Validation", "IBN Task 5 · Bihar eGramSwaraj validation")
    xlsx()
