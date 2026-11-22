"""Build the shareable Task 4 documents from docs/task4/TASK4_REPORT.md and the data tables.

    python scripts/make_task4_docs.py

Writes
  docs/task4/TASK4_REPORT.pdf         the full report (pandoc -> HTML -> Chromium print)
  docs/task4/TASK4_SUMMARY.xlsx       one sheet per report section (every table in the report,
                                      as written there) plus key Bihar figures from data/clean/egs/
                                      and data/analysis/egs/
Needs pandoc, Playwright with Chromium, and openpyxl.
"""
from __future__ import annotations

import csv
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / "docs" / "task4"
MD = DOC / "TASK4_REPORT.md"
CLEAN = ROOT / "data" / "clean" / "egs"
ANA = ROOT / "data" / "analysis" / "egs"

CSS = """
@page { size: A4; margin: 16mm 14mm 18mm 14mm; }
body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 9.2pt; line-height: 1.42; color: #1a1a1a; }
h1 { font-size: 19pt; margin: 0 0 4pt; color: #12355b; }
h2 { font-size: 13.5pt; color: #12355b; border-bottom: 1.5px solid #12355b; padding-bottom: 2pt;
     margin-top: 18pt; page-break-after: avoid; }
h3 { font-size: 11pt; color: #12355b; margin-top: 12pt; page-break-after: avoid; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 7.8pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background: #12355b; color: #fff; text-align: left; padding: 3pt 4pt; vertical-align: top; }
td { border-bottom: 0.5px solid #c9d1db; padding: 3pt 4pt; vertical-align: top; }
td:first-child, th:first-child { min-width: 58px; }
tr:nth-child(even) td { background: #f3f6f9; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 7.4pt; background: #eef1f5; padding: 0 2px;
       word-break: break-all; }
img { max-width: 100%; display: block; margin: 6pt auto 10pt; }
pre { background: #eef1f5; padding: 6pt; font-size: 7.6pt; white-space: pre-wrap; }
p, li { orphans: 3; widows: 3; }
"""


def pdf(md=MD, out=None, title="IBN Task 4: Bihar eGramSwaraj Data Exploration", footer="IBN Task 4 · Bihar eGramSwaraj"):
    out = out or DOC / "TASK4_REPORT.pdf"
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / "report.html"
        css = Path(tmp) / "report.css"
        css.write_text(CSS, encoding="utf-8")
        md = Path(md).resolve()
        subprocess.run(["pandoc", str(md), "-f", "gfm", "-t", "html5", "-s", "--embed-resources",
                        f"--resource-path={Path(md).parent}{os.pathsep}{tmp}", "--metadata",
                        f"pagetitle={title}", "-c", css.name,
                        "-o", str(html)], check=True, cwd=tmp)
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch()
            page = b.new_page()
            # relative links in the markdown are meaningless in the PDF; keep their text
            page.goto(html.as_uri())
            page.pdf(path=str(out), format="A4", print_background=True,
                     display_header_footer=True, header_template="<span></span>",
                     footer_template='<div style="font-size:7pt;width:100%;text-align:center;color:#666">'
                                     f'{footer} · page <span class="pageNumber"></span> of '
                                     '<span class="totalPages"></span></div>',
                     margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
            b.close()
    print("wrote", out)


def plain(s):
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"`([^`]*)`", r"\1", s)
    return re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s).strip()


def md_sections(md=MD):
    """{section title: [(table title, header, rows)]} for every markdown table in the report."""
    out, sec, last = {}, "Front", ""
    lines = Path(md).read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("## "):
            sec, last = plain(ln[3:]), ""
        elif ln.startswith("### "):
            last = plain(ln[4:])
        elif ln.startswith("**") and not ln.startswith("|"):
            last = plain(ln.split("**")[1]) if ln.count("**") >= 2 else last
        if ln.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|$", lines[i + 1]):
            head = [plain(c) for c in ln.strip("|").split("|")]
            rows, i = [], i + 2
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([plain(c) for c in lines[i].strip("|").split("|")])
                i += 1
            out.setdefault(sec, []).append((last, head, rows))
            continue
        i += 1
    return out


HEAD_FILL = PatternFill("solid", fgColor="12355B")
TITLE = Font(bold=True, size=12, color="12355B")


def put(ws, title, header, rows, r):
    if title:
        ws.cell(r, 1, title).font = TITLE
        r += 1
    for k, h in enumerate(header, 1):
        c = ws.cell(r, k, h)
        c.font, c.fill = Font(bold=True, color="FFFFFF"), HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical="top")
    for row in rows:
        r += 1
        for k, v in enumerate(row, 1):
            ws.cell(r, k, v).alignment = Alignment(wrap_text=True, vertical="top")
    return r + 2


def widths(ws, cap=60):
    for col in ws.columns:
        m = max((len(str(c.value)) for c in col if c.value is not None), default=8)
        ws.column_dimensions[col[0].column_letter].width = max(10, min(cap, m * 0.9 + 2))


def rows_of(path, keep=None, where=None):
    with open(path, encoding="utf-8") as f:
        rd = list(csv.DictReader(f))
    rd = [r for r in rd if where is None or where(r)]
    cols = keep or (list(rd[0].keys()) if rd else [])

    def val(v):
        try:
            return int(v) if re.fullmatch(r"-?\d+", v) else float(v) if re.fullmatch(r"-?\d*\.\d+", v) else v
        except (TypeError, ValueError):
            return v
    return cols, [[val(r.get(c, "")) for c in cols] for r in rd]


def xlsx():
    wb = Workbook()
    ws = wb.active
    ws.title = "Overview"
    r = put(ws, "IBN Task 4: Bihar eGramSwaraj Data Exploration (20-22 Nov 2026)", ["Item", "Where", "Status"], [
        ["A. Portal structure and report inventory", "Report section 2; sheet '2 Portal structure'", "Done"],
        ["B. Demographic data catalogue", "Section 3", "Done"],
        ["C. Public finance catalogue", "Section 4", "Done"],
        ["D. Geographic coverage matrix", "Section 5", "Done"],
        ["E. Historical coverage matrix", "Section 6", "Done"],
        ["F. Sample data repository", "Section 7; data/raw/EGS-PORTAL, data/raw/EGS-AO, data/provenance.jsonl", "Done"],
        ["G. Accessibility assessment", "Section 8", "Done"],
        ["H. Automation assessment", "Section 9", "Done"],
        ["I. Data gaps report", "Section 11", "Done"],
        ["Answers to the specific questions", "Section 12", "Done"],
        ["Clean data (separate later step)", "Section 10; data/clean/egs/", "Done"],
    ], 1)
    put(ws, "How to read this workbook", ["Note"], [
        ["Sheets 0-12 reproduce every table in docs/task4/TASK4_REPORT.md, in the report's own words."],
        ["Sheets starting 'Data -' are copied from data/clean/egs/ and data/analysis/egs/; each row there names its source file."],
        ["Amounts: _rs = rupees, _cr = Rs crore, as printed by the portal. Empty means not reported, not zero."],
        ["Receipts are not expenditure; Payments are payments recorded in Panchayat accounts, not all government spending in the area."],
    ], r)
    widths(ws, 90)

    for sec, tables in md_sections().items():
        name = re.sub(r"[\[\]:*?/\\]", "", sec)
        name = re.sub(r"\s*\(Deliverable [A-I]\)", "", name)[:31]
        w = wb.create_sheet(name)
        r = 1
        for title, head, rows in tables:
            r = put(w, title, head, rows, r)
        widths(w)

    md = MD.read_text(encoding="utf-8")
    ans = md[md.index("## 12."):md.index("## Appendix")] if "## Appendix" in md else md[md.index("## 12."):]
    qa = [re.match(r"(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)", ln) for ln in ans.splitlines()]
    w = wb.create_sheet("12. Answers")
    put(w, "Answers to the specific questions", ["#", "Question", "Answer"],
        [[int(m.group(1)), plain(m.group(2)), plain(m.group(3))] for m in qa if m], 1)
    widths(w, 100)
    wb.move_sheet("12. Answers", offset=-(len(wb.sheetnames) - 1 - wb.sheetnames.index("11. Data gaps report") - 1))

    data = [
        ("Data - Bihar by year", CLEAN / "state_year_summary.csv",
         ["financial_year", "tier", "panchayats", "panchayats_with_vouchers", "receipt_amount_rs", "payment_amount_rs",
          "with_year_book_closed", "report_generated_on"], None),
        ("Data - districts 2024-25", CLEAN / "district_finance.csv",
         ["district_code", "district", "zp_ob_plus_receipts_cr", "zp_payments_cr", "bp_ob_plus_receipts_cr",
          "bp_payments_cr", "gp_ob_plus_receipts_cr", "gp_payments_cr", "report_generated_on"],
         lambda x: x["financial_year"] == "2024-2025"),
        ("Data - elected reps", CLEAN / "state_indicators.csv", ["endpoint", "query", "field", "value"],
         lambda x: x["endpoint"].startswith("ElectedStateReport")),
        ("Data - other state rows", CLEAN / "state_indicators.csv", ["report_page", "endpoint", "query", "field", "value"],
         lambda x: not x["endpoint"].startswith("ElectedStateReport")),
        ("Data - AuditOnline by year", ANA / "coverage_by_year.csv", None, None),
        ("Data - CAPTCHA forms", None, None, None),
    ]
    for title, path, keep, where in data:
        w = wb.create_sheet(title[:31])
        if path is None:  # report pages whose form has a CAPTCHA (not collected)
            import json
            res = [json.loads(x) for x in open(ROOT / "data/egs_explore/2026-11-20/form_results.jsonl", encoding="utf-8")]
            cols, rows = ["report page", "title", "outcome"], [[x["page"], x.get("title", ""), x["status"]] for x in res]
        else:
            cols, rows = rows_of(path, keep, where)
        put(w, title.replace("Data - ", ""), cols, rows, 1)
        widths(w)
        w.freeze_panes = "A3"
    wb.save(DOC / "TASK4_SUMMARY.xlsx")
    print("wrote", DOC / "TASK4_SUMMARY.xlsx")


if __name__ == "__main__":
    what = sys.argv[1:] or ["pdf", "xlsx"]
    if "pdf" in what:
        pdf()
    if "xlsx" in what:
        xlsx()
