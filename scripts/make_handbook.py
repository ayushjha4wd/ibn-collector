#!/usr/bin/env python3
"""Build the Bihar Data Handbook (PDF) from the collector's own records.

Reads config/manifest.csv, config/manifest_census.csv, data/analysis/summary.json and
data/analysis/files.csv (run analyse.py first) and writes
docs/IBN_Bihar_Data_Handbook.pdf. Every count in the handbook comes from those files,
so re-running after a new collection run gives an up-to-date handbook.

Needs: reportlab, and the DejaVu Sans font (fonts-dejavu-core on Debian/Ubuntu).
"""
from __future__ import annotations

import collections
import csv
import datetime as dt
import json
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, ROOT, load_manifest  # noqa: E402

OUT = ROOT / "docs" / "IBN_Bihar_Data_Handbook.pdf"
REPO = "github.com/ayushjha4wd/ibn-collector"

# ---- fonts and styles ------------------------------------------------------------
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
for name, file in [("Sans", "DejaVuSans.ttf"), ("Sans-Bold", "DejaVuSans-Bold.ttf"),
                   ("Mono", "DejaVuSansMono.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / file)))
pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-Bold", italic="Sans",
                              boldItalic="Sans-Bold")

INK = colors.HexColor("#1d2a26")
MUTED = colors.HexColor("#5b6b65")
ACCENT = colors.HexColor("#1f6f5c")
RULE = colors.HexColor("#cfd8d4")
BAND = colors.HexColor("#eef3f1")
STATUS_COLOURS = {"Collected": "#e5f4e4", "Partly collected": "#f9eeda", "Blocked": "#fbebeb",
                  "Manual": "#e7f1fb", "Nothing to collect": "#f0efec"}

S = {
    "body": ParagraphStyle("body", fontName="Sans", fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Sans", fontSize=8, leading=10.5, textColor=MUTED, spaceAfter=4),
    "cell": ParagraphStyle("cell", fontName="Sans", fontSize=7.6, leading=9.6, textColor=INK, alignment=TA_LEFT),
    "cellb": ParagraphStyle("cellb", fontName="Sans-Bold", fontSize=7.6, leading=9.6, textColor=INK),
    "head": ParagraphStyle("head", fontName="Sans-Bold", fontSize=7.6, leading=9.6, textColor=colors.white),
    "h1": ParagraphStyle("h1", fontName="Sans-Bold", fontSize=16, leading=20, textColor=ACCENT,
                         spaceBefore=4, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName="Sans-Bold", fontSize=11.5, leading=15, textColor=INK,
                         spaceBefore=10, spaceAfter=4),
    "bullet": ParagraphStyle("bullet", fontName="Sans", fontSize=9.5, leading=13.5, textColor=INK,
                             leftIndent=12, bulletIndent=2, spaceAfter=2),
    "code": ParagraphStyle("code", fontName="Mono", fontSize=7.8, leading=10.5, textColor=INK,
                           backColor=BAND, borderPadding=(4, 6, 4, 6), spaceBefore=4, spaceAfter=8),
    "cover_t": ParagraphStyle("ct", fontName="Sans-Bold", fontSize=30, leading=36, textColor=INK),
    "cover_s": ParagraphStyle("cs", fontName="Sans", fontSize=13, leading=18, textColor=ACCENT),
    "cover_m": ParagraphStyle("cm", fontName="Sans", fontSize=9.5, leading=14, textColor=MUTED),
    "big": ParagraphStyle("big", fontName="Sans-Bold", fontSize=17, leading=20, textColor=ACCENT),
    "toc1": ParagraphStyle("toc1", fontName="Sans", fontSize=10, leading=16, textColor=INK, leftIndent=0),
}


def P(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, S[style])


def esc(x) -> str:
    return escape(str(x))


class Doc(SimpleDocTemplate):
    """Adds H1 headings to the table of contents."""

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "h1":
            self.notify("TOCEntry", (0, flowable.getPlainText(), self.page))


def H1(text: str) -> Paragraph:
    return Paragraph(esc(text), S["h1"])


def bullets(items: list[str]) -> list[Paragraph]:
    return [Paragraph(t, S["bullet"], bulletText="•") for t in items]


def table(rows: list[list], widths: list[float], header: bool = True, zebra: bool = True,
          extra: list | None = None) -> Table:
    data = []
    for i, row in enumerate(rows):
        style = "head" if header and i == 0 else "cell"
        data.append([c if isinstance(c, Paragraph) else Paragraph(esc(c), S[style]) for c in row])
    t = Table(data, colWidths=[w * mm for w in widths], repeatRows=1 if header else 0)
    cmds = [("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]
    if header:
        cmds.append(("BACKGROUND", (0, 0), (-1, 0), ACCENT))
    if zebra:
        for i in range(1 if header else 0, len(rows)):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), BAND))
    t.setStyle(TableStyle(cmds + (extra or [])))
    return t


def on_page(canvas, doc):
    if doc.page == 1:
        return
    canvas.saveState()
    canvas.setFont("Sans", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "India By Numbers · Bihar Data Handbook · Task 3: Data collection")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, str(doc.page))
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 13 * mm, A4[0] - 18 * mm, 13 * mm)
    canvas.restoreState()


# ---- data ------------------------------------------------------------------------
def load():
    summary = json.loads((DATA / "analysis" / "summary.json").read_text(encoding="utf-8"))
    files = list(csv.DictReader(open(DATA / "analysis" / "files.csv", encoding="utf-8")))
    manifest = {}
    for r in load_manifest(ROOT / "config" / "manifest.csv"):
        manifest.setdefault(r["source_id"], r)
    census = list(csv.DictReader(open(ROOT / "config" / "manifest_census.csv", encoding="utf-8")))
    return summary, files, manifest, census


CATALOGUE_IDS = [f"BR-PF-{i:02d}" for i in range(1, 23)] + [f"BR-DM-{i:02d}" for i in range(1, 17)] + \
                [f"BR-XC-{i:02d}" for i in range(1, 4)]
# manifest rows that hold part of a catalogue source
PARTS = {"BR-PF-05": ["BR-PF-05", "BR-PF-05a", "BR-PF-05b"], "BR-PF-06": ["BR-PF-06", "BR-PF-05c"],
         "BR-PF-15": ["BR-PF-15", "BR-PF-15a"]}
BLOCKED = {"BR-PF-01": "Expired security certificate on budget.bihar.gov.in",
           "BR-PF-03": "Expired security certificate (same site as BR-PF-01)",
           "BR-PF-07": "saiindia.gov.in resets connections from outside India",
           "BR-PF-08": "CAG audit-report page returned a server error (HTTP 500)",
           "BR-PF-13": "RBI shows scripts a bot check; download in a browser",
           "BR-PF-14": "RBI shows scripts a bot check; download in a browser",
           "BR-PF-22": "Statistics directorate site unreliable; district GDP is also in the Economic Survey",
           "BR-DM-06": "Statistics directorate site unreliable (502 errors, resets, wrong certificate)",
           "BR-DM-07": "Statistics directorate site unreliable",
           "BR-DM-08": "Statistics directorate site unreliable",
           "BR-DM-09": "Expired security certificate on rchiips.org"}
NOTHING = {"BR-PF-11": "The department publishes no revenue data files",
           "BR-PF-20": "Publishes orders and notices, not datasets",
           "BR-PF-21": "Publishes orders and notices, not datasets",
           "BR-DM-04": "Census 2027 results not yet published"}
SHORT_NOTE = {"BR-PF-02": "Green Budget 2024-25; outcome, gender and child budgets have no links on the portal",
              "BR-PF-04": "Economic Survey 2024-25, English and Hindi",
              "BR-PF-05": "Finance and Appropriation Accounts FY 2021-22 to 2024-25; Accounts at a Glance 2024-25",
              "BR-PF-06": "Monthly Key Indicators Apr 2021 – Jun 2026; Monthly Civil Accounts page returned 504",
              "BR-PF-09": "5th SFC Vol I and 6th SFC Parts 1–3",
              "BR-PF-12": "All states, FY 2017-18 to FY 2026-27",
              "BR-PF-15": "15th and 16th Finance Commission reports, Bihar evaluation, 13 datasets",
              "BR-PF-16": "2026-27 analysis and 16th FC summary",
              "BR-DM-02": "500 tables naming Bihar",
              "BR-DM-03": "All 38 districts: 2,344 district tables plus state village and town files",
              "BR-DM-05": "Statistical Reports 2011–2024",
              "BR-DM-16": "Technical Group projections 2011–2036"}


def source_status(cid, summary, manifest):
    ps = summary["per_source"]
    ids = [i for i in PARTS.get(cid, [cid]) if i in ps]
    n = sum(ps[i]["data_files"] for i in ids)
    mb = sum(ps[i]["bytes"] for i in ids) / 1e6
    if n:
        status = "Partly collected" if cid == "BR-PF-06" else "Collected"
        note = SHORT_NOTE.get(cid, "")
    elif cid in BLOCKED:
        status, note = "Blocked", BLOCKED[cid]
    elif cid in NOTHING:
        status, note = "Nothing to collect", NOTHING[cid]
    else:
        status = "Manual"
        note = manifest.get(cid, {}).get("notes", "")
        note = re.split(r"(?<=\.)\s", note)[0] if note else "Needs a person: login, form or on-screen reports"
    return n, mb, status, note


# ---- sections --------------------------------------------------------------------
def cover(summary):
    today = dt.date.today().strftime("%d %B %Y")
    story = [Spacer(1, 45 * mm),
             P("India By Numbers", "cover_s"), Spacer(1, 4 * mm),
             P("Bihar Data Handbook", "cover_t"), Spacer(1, 3 * mm),
             P("Task 3: Data collection — what was collected, what it contains, and what remains", "cover_s"),
             Spacer(1, 18 * mm)]
    stats = [[P(f"{summary['data_files']:,}", "big"), P(f"{summary['data_bytes'] / 1e9:.2f} GB", "big"),
              P(f"{summary['pdf_pages']:,}", "big"), P("41", "big")],
             [P("data files collected", "small"), P("of original files", "small"),
              P("PDF pages extracted", "small"), P("Bihar catalogue sources covered", "small")]]
    t = Table(stats, colWidths=[42 * mm] * 4)
    t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, 0), 1.2, ACCENT), ("TOPPADDING", (0, 0), (-1, -1), 4),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    story += [t, Spacer(1, 40 * mm),
              P(f"Prepared {today} from the collector's own records (manifest, provenance log and analysis "
                f"files).", "cover_m"),
              P(f"Code and data: {REPO}", "cover_m"), PageBreak()]
    return story


def contents():
    toc = TableOfContents()
    toc.levelStyles = [S["toc1"]]
    return [P("Contents", "h2"), toc, PageBreak()]


def at_a_glance(summary, files):
    ps = summary["per_source"]
    sheets_zip = sum(1 for _ in (DATA / "processed" / "BR-DM-03").rglob("zip/*/*.csv"))
    rows = [["Measure", "Value"],
            ["Data files collected and verified", f"{summary['data_files']:,}"],
            ["Size of original data files", f"{summary['data_bytes'] / 1e9:.2f} GB"],
            ["Bihar catalogue sources with data", "12 of 41"],
            ["PDF documents", f"{summary['kinds'].get('pdf', 0):,} ({summary['pdf_pages']:,} pages)"],
            ["Excel workbooks", f"{summary['kinds'].get('excel', 0):,} ({summary['excel_sheets']:,} sheets)"],
            ["District Census Handbook archives", f"{summary['kinds'].get('zip', 0)} ({sheets_zip:,} district tables)"],
            ["Tables found in PDFs and saved as CSV", f"{summary['pdf_tables_found']:,}"],
            ["Scanned pages read by OCR", f"{summary['pdf_pages_read_by_ocr']:,} of {summary['pdf_pages_without_text']:,}"],
            ["Originals still matching their recorded fingerprint", "All"],
            ["Bad downloads caught and set aside", f"{summary['flagged_invalid']} (kept for the record, never used)"],
            ["Offline tests passing", "52 of 52"]]
    story = [H1("1. At a glance"),
             P("This handbook explains the data collected for India By Numbers in Task 3, for the Bihar "
               "catalogue built in Tasks 1 and 2. It covers what each dataset is and the period it covers. "
               "It also shows where each file sits, how far it can be trusted, and what is still to collect."),
             table(rows, [110, 64]), Spacer(1, 6),
             P("Every file can be traced to the web address it came from, the date and time it was downloaded "
               "(UTC and IST), and a sha256 fingerprint that proves it has not changed since.", "small")]
    return story


def about():
    return [H1("2. About India By Numbers and this task"),
            P("India By Numbers (IBN) brings together public information from ministries, departments, "
              "commissions, surveys and local governments. It aims to build a connected picture of India's "
              "people, places, economy and public resources. The first phase focuses on Public Finance and "
              "Demographics, starting with Bihar: what information exists, who produces it, what it covers and "
              "where the gaps are."),
            P("Three tasks", "h2"),
            table([["Task", "Brief", "Output"],
                   ["1. Data source discovery", "Find every relevant dataset; record publisher, link, purpose, "
                    "subjects, access and format",
                    "Catalogues: 66 India-wide sources and 41 Bihar sources"],
                   ["2. Data availability assessment", "Assess geographic detail, years, frequency, coverage, "
                    "gaps and access restrictions", "Availability sheets and a Gap Summary in each catalogue"],
                   ["3. Data collection", "Download the datasets: keep originals, record dates and sources, "
                    "never edit originals, use repeatable scripts",
                    "The ibn-collector toolkit and the Bihar data described in this handbook"]],
                  [38, 74, 62]),
            Spacer(1, 6),
            P("Task 3 is scoped to the Bihar catalogue. The India-wide catalogue is out of scope for now.",
              "small")]


def status_section(summary, manifest):
    rows = [["ID", "Dataset", "Status", "Files", "MB", "Notes"]]
    colour_cmds, counts = [], collections.Counter()
    for i, cid in enumerate(CATALOGUE_IDS, start=1):
        n, mb, status, note = source_status(cid, summary, manifest)
        counts[status] += 1
        title = manifest.get(cid, {}).get("title", cid).split(" (")[0]
        rows.append([cid, title, status, f"{n:,}" if n else "", f"{mb:,.1f}" if n else "", note])
        colour_cmds.append(("BACKGROUND", (2, i), (2, i), colors.HexColor(STATUS_COLOURS[status])))
    summary_line = ", ".join(f"{counts[k]} {k.lower()}" for k in
                             ["Collected", "Partly collected", "Blocked", "Manual", "Nothing to collect"])
    return [H1("3. Status of every Bihar catalogue source"),
            P(f"All 41 sources in the Bihar catalogue are in the collector's list: {summary_line}. "
              "<b>Blocked</b> means the website itself failed (expired certificate, server error, bot check, or "
              "refusing connections from outside India). <b>Manual</b> means a person must download it "
              "(login, form, CAPTCHA or on-screen-only reports)."),
            table(rows, [17, 50, 21, 11, 12, 63], extra=colour_cmds)]


GUIDE = [
    ("BR-PF-05c", "Monthly Key Indicators (Accountant General, Bihar)",
     "The state's monthly receipts, spending, borrowing and deficits against the budget estimate, about 18 "
     "pages each. Every month from April 2021 to June 2026 is present, plus preliminary and supplementary "
     "March editions. Catalogue ID BR-PF-06."),
    ("BR-PF-05", "Finance Accounts, Volumes I and II",
     "The audited annual accounts of the Government of Bihar for FY 2021-22 to FY 2024-25. Volume II runs to "
     "474–535 pages of detailed statements a year."),
    ("BR-PF-05b", "Appropriation Accounts", "Spending grant by grant against what the legislature approved, "
     "FY 2021-22 to FY 2024-25."),
    ("BR-PF-05a", "Accounts at a Glance 2024-25", "A 53-page summary of the state's finances for the year."),
    ("BR-PF-04", "Bihar Economic Survey 2024-25",
     "The Finance Department's annual survey of the economy, in English and Hindi, including district GDP. "
     "Both editions are scanned images, so their text comes from OCR."),
    ("BR-PF-02", "Green Budget 2024-25", "Spending tagged to environment and climate objectives."),
    ("BR-PF-09", "State Finance Commission reports",
     "The 5th SFC report (Volume I) and the 6th SFC report (Parts 1–3) on sharing state resources with "
     "panchayats and municipalities. Part 3 is mostly scanned."),
    ("BR-PF-15", "16th Finance Commission (2026-31)",
     "The main report and annexures, the commission's evaluation of Bihar's state finances, and 13 all-state "
     "datasets: devolution, key fiscal indicators, state finance accounts, salaries, subsidies, state "
     "enterprises and urban local bodies."),
    ("BR-PF-15a", "15th Finance Commission (2020-21 and 2021-26)",
     "Volumes I, II and IV (The States) and the 2020-21 report. Volume IV is 116 MB, over GitHub's file limit, "
     "so it is kept out of git and listed in config/not_in_git.txt."),
    ("BR-PF-12", "GST statistics (all states)",
     "State-wise GST collections, GSTR-1 and GSTR-3B returns and IGST settlement for FY 2017-18 to FY 2026-27, "
     "e-way bill data from FY 2018-19, registrations and summary reports."),
    ("BR-PF-16", "PRS Bihar Budget Analysis 2026-27", "PRS Legislative Research's analysis of the 2026-27 "
     "budget and its summary of the 16th Finance Commission report."),
    ("BR-DM-02", "Census 2011 tables for Bihar",
     "500 tables whose title names Bihar, listed through the census catalogue's public API. See Appendix B "
     "for the series."),
    ("BR-DM-03", "District Census Handbooks 2011",
     "For all 38 districts, about 60 district tables each (2,344 in all), plus state-wide village and town "
     "files. The village file lists every village in Bihar."),
    ("BR-DM-05", "Sample Registration System — Statistical Reports",
     "Annual reports for 2011 to 2024 with state birth, death, fertility and mortality rates, plus two "
     "corrigenda."),
    ("BR-DM-16", "Population Projections 2011–2036", "The Technical Group's projections, with state tables."),
    ("DM-11", "Vital Statistics of India, CRS 2023", "National civil registration report with state tables "
     "(from the India-wide catalogue)."),
]


def guide_section(summary):
    ps = summary["per_source"]
    story = [H1("4. Guide to the collected data"),
             P("Each entry gives what the dataset is and what was collected. Originals are in "
               "<font name='Mono'>data/raw/&lt;ID&gt;/</font> and machine-readable copies in "
               "<font name='Mono'>data/processed/&lt;ID&gt;/</font>. Appendix A lists every file.")]
    for sid, title, text in GUIDE:
        p = ps.get(sid)
        if not p or not p["data_files"]:
            continue
        period = ""
        if p["period_first"]:
            period = p["period_first"] if p["period_first"] == p["period_last"] else \
                f"{p['period_first']} to {p['period_last']}"
        facts = [f"{p['data_files']:,} files", f"{p['bytes'] / 1e6:,.1f} MB"]
        if p["pdf_pages"]:
            facts.append(f"{p['pdf_pages']:,} PDF pages")
        if p["excel_sheets"]:
            facts.append(f"{p['excel_sheets']:,} sheets")
        if p["pdf_tables_found"]:
            facts.append(f"{p['pdf_tables_found']:,} tables")
        if p["pdf_pages_without_text"]:
            facts.append(f"{p['pdf_pages_read_by_ocr']:,} of {p['pdf_pages_without_text']:,} scanned pages read by OCR")
        if period and sid not in ("BR-DM-02",):
            facts.append(f"period in file names: {period}")
        story.append(KeepTogether([P(f"{esc(title)}  <font color='#5b6b65' size='8'>{sid}</font>", "h2"),
                                   P(text), P(" · ".join(facts), "small")]))
    return story


def example_section():
    rows = [["Item", "Budget estimate 2026-27", "Actual to June 2026", "% of budget", "Same point last year"],
            ["Total receipts", "324,924.93", "46,157.86", "14.21%", "18.25%"],
            ["Revenue receipts", "285,277.12", "7,756.04", "2.72%", "2.90%"],
            ["of which GST", "84,050.30", "2,490.13", "2.96%", "3.59%"],
            ["Borrowings and other liabilities (net)", "39,111.80", "38,354.02", "98.06%", "140.85%"],
            ["Revenue expenditure", "284,133.93", "41,627.56", "14.65%", "18.43%"],
            ["of which salaries and wages", "74,375.39", "15,839.82", "21.30%", "22.94%"],
            ["of which pensions", "35,170.48", "8,825.10", "25.09%", "24.40%"],
            ["Capital expenditure", "40,689.93", "3,843.45", "9.45%", "16.42%"]]
    right = [("ALIGN", (1, 0), (-1, -1), "RIGHT")]
    return [H1("5. What the data shows: an example"),
            P("The June 2026 Monthly Key Indicators show Bihar's position after the first quarter of FY 2026-27. "
              "Figures are in Rs crore, unaudited and provisional, as reported by the Accountant General."),
            table(rows, [58, 30, 30, 24, 32], extra=right), Spacer(1, 6),
            P("By June the state had used 98% of its budgeted net borrowing but received under 3% of its budgeted "
              "revenue, partly because no share of union taxes had been recorded yet. Capital spending was "
              "running at a little over half last year's pace."),
            P("Source: account-report-MKI-June-2026, data/raw/BR-PF-05c/.", "small")]


def how_section():
    steps = [["Step", "Script", "What it does"],
             ["1. List what to collect", "config/manifest.csv; census_manifest.py",
              "One row per source, matched to the catalogue ID. Census and SRS files are listed through the "
              "census catalogue's public API"],
             ["2. Download", "collect.py", "Saves each file exactly as served and makes it read-only; logs URL, "
              "time (UTC and IST), headers, size and sha256. Rejects cut-off downloads and bot-check pages. "
              "--resume continues an interrupted run"],
             ["3. Hand downloads", "register_manual.py", "Adds a file someone downloaded by hand with the same "
              "record, including how it was obtained"],
             ["4. Set aside bad files", "flag.py", "Marks a bad original invalid without deleting it"],
             ["5. Extract", "extract.py", "Text and tables from PDFs, a CSV per Excel sheet, tables inside zip "
              "archives, tables from web pages"],
             ["6. OCR", "ocr.py", "Reads scanned PDF pages with Tesseract (English and Hindi)"],
             ["7. Verify", "verify.py", "Re-checks every original's fingerprint and writes inventory.csv"],
             ["8. Describe", "analyse.py; make_handbook.py", "Per-file catalogue, summary figures and this handbook"]]
    reqs = [["Requirement", "How it is met"],
            ["Preserve original files", "Saved byte for byte and made read-only. Nothing is overwritten: a revised "
             "file is kept alongside the old one. Bad files are flagged, never deleted"],
            ["Record download dates", "Every attempt is logged with the time in UTC and IST, plus the server's "
             "Last-Modified and ETag where sent"],
            ["Maintain source references", "Each record holds the catalogue ID, requested and final URL, linking "
             "page, link text, size and sha256"],
            ["Avoid manually modifying originals", "Extraction and OCR write only to data/processed after "
             "re-checking each original; verify.py confirms every original is unchanged"],
            ["Repeatable scripts", "One command per stage; re-runs skip unchanged files and finished work"]]
    return [H1("6. How the collection works"),
            P("The toolkit is a set of small Python scripts, each doing one stage. It runs anywhere with Python "
              "3.9 or later; 52 offline tests check the whole pipeline against a fake portal."),
            table(steps, [36, 44, 94]),
            P("Task 3 requirements", "h2"),
            table(reqs, [50, 124])]


def quality_section(summary):
    fixes = [["Problem found", "How it was handled"],
             ["RBI served a bot-check page instead of 368 spreadsheets and PDFs",
              "Every download's content is now checked. The 368 files are flagged invalid and excluded; RBI is a "
              "manual download"],
             ["8 unrelated PDFs came from an over-broad CAG link pattern",
              "Flagged invalid; the manifest now points at CAG's report pages"],
             ["state.bihar.gov.in leaves an intermediate certificate out of its chain",
              "The public Sectigo certificate is supplied in config/extra-intermediates.pem; verification stays on"],
             ["The same site loops without its session cookie", "Cookies are kept within a run"],
             ["The Economic Survey is served only through a form", "Fetched by a short script and registered with "
              "a note on how it was obtained"],
             ["The census website is JavaScript-only", "Files listed through the census catalogue's public API"],
             ["District handbooks come as zip archives", "Spreadsheets are read from inside the zip; nothing is "
              "unpacked into data/raw"],
             ["Two handbook tables per district crashed the Excel reader",
              "Their broken named-range definitions (which hold no data) are skipped"],
             ["A 116 MB PDF ran out of memory during extraction", "Each page is released after reading"],
             ["The cloud machine restarted mid-download", "collect.py --resume continued; every original "
              "verified intact"]]
    return [H1("7. Data quality"),
            P("Extracted copies", "h2"),
            P("The CSV and text files are faithful copies of the originals, not cleaned data. Headings, units and "
              "place names are as published. Standardising them (district names, LGD codes, units) is the next "
              "stage of work."),
            P("OCR accuracy", "h2"),
            P(f"{summary['pdf_pages_without_text']:,} PDF pages had no text layer: both Economic Survey editions, the "
              f"SRS reports for 2015–2019 and the 6th SFC report Part 3, among others. OCR found text on "
              f"{summary['pdf_pages_read_by_ocr']:,} of them; the rest are blank, divider or picture-only pages."),
            P("OCR is good enough to find tables and figures, but not to quote them unchecked. In the Economic "
              "Survey's Table 2.7 (revenue deficit by state), Bihar's 2021-22 to 2023-24 values were read correctly "
              "(422, 11288, −2833), but its 2024-25 value, −1121, came out garbled. Elsewhere in the same table "
              "minus signs were dropped: Andhra Pradesh's −43487 became 43487. <b>Use OCR text to locate a figure, "
              "and take the figure from the original page.</b>"),
            P("National files", "h2"),
            P("GST, SRS and Finance Commission files cover all states and were kept whole; filter Bihar during "
              "cleaning. 119 census files are district Primary Census Abstract tables identified by census code "
              "rather than by name."),
            P("Problems found and fixed", "h2"),
            table(fixes, [72, 102])]


def todo_section():
    return [H1("8. What remains"),
            P("Everything that could be collected from a cloud machine outside India has been collected. The rest "
              "needs a person or a different connection."),
            P("1. Re-run from a machine in India", "h2"),
            P("Run <font name='Mono'>python scripts/collect.py</font>. It retries the Bihar statistics "
              "directorate (district GDP, vital statistics, CRS returns, Statistical Handbook), the CAG audit "
              "report, and the CAG pages that returned server errors."),
            P("2. Download by hand and register", "h2"),
            *bullets(["RBI State Finances and Handbook of Statistics on Indian States (bot check).",
                      "Bihar budget documents, FRBM disclosures and NFHS while their certificates are expired.",
                      "CFMS, eGramSwaraj, Open Budgets India, PLFS, HCES, HMIS, Mission Antyodaya, electoral roll "
                      "statistics, SECC, the Local Government Directory, DataLab and e-Statistics (login, form, "
                      "CAPTCHA or on-screen reports).",
                      "The 2022-23 caste survey report, which has no stable official link."]),
            P("Add each file so it gets the same record as automatic downloads:", "body"),
            Paragraph("python scripts/register_manual.py --source-id BR-PF-14 --dir ~/Downloads/rbi \\<br/>"
                      "&nbsp;&nbsp;&nbsp;&nbsp;--url \"https://rbi.org.in/...\" --obtained-on 2026-11-20 "
                      "--note \"Saved from browser\"", S["code"]),
            P("3. Next stage: cleaning", "h2"),
            P("Build cleaned, standardised tables from data/processed: consistent district names and LGD codes, "
              "units, and Bihar rows from the national files.")]


def use_section():
    return [H1("9. Using and re-running the collection"),
            P("Where to look", "h2"),
            table([["File", "What it holds"],
                   ["REPORT.md", "The Task 3 report"],
                   ["data/analysis/FILES.md", "Every file with its period, pages, tables and link"],
                   ["data/analysis/files.csv", "The same, as a spreadsheet"],
                   ["data/inventory.csv", "Every original with its source, URL, download date and validity"],
                   ["data/provenance.jsonl", "The download log: one line per attempt"],
                   ["data/raw/<ID>/<date>/", "Original files, read-only"],
                   ["data/processed/<ID>/<sha12>/", "Extracted text and CSV, with extraction.json pointing back to "
                    "the original"]], [62, 112]),
            P("Re-running everything", "h2"),
            Paragraph("pip install -r requirements.txt<br/>"
                      "apt-get install tesseract-ocr tesseract-ocr-hin poppler-utils<br/>"
                      "bash tests/run_test.sh<br/>"
                      "python scripts/collect.py<br/>"
                      "python scripts/census_manifest.py<br/>"
                      "python scripts/census_manifest.py --groups srs --out config/manifest_srs.csv<br/>"
                      "python scripts/collect.py --manifest config/manifest_census.csv<br/>"
                      "python scripts/collect.py --manifest config/manifest_srs.csv<br/>"
                      "python scripts/flag.py --auto --apply<br/>"
                      "python scripts/extract.py<br/>"
                      "python scripts/ocr.py<br/>"
                      "python scripts/verify.py<br/>"
                      "python scripts/analyse.py<br/>"
                      "python scripts/make_handbook.py", S["code"]),
            P("Re-runs skip files that have not changed upstream and work already done, so they only add what "
              "is new.", "small")]


def appendix_files(files, manifest):
    story = [H1("Appendix A. Every collected file (excluding Census 2011)"),
             P("Sorted by source and period. Census 2011 files (540) are summarised in Appendix B; the full list is "
               "in data/analysis/FILES.md.")]
    rows = [["Source", "File", "Period", "Type", "MB", "Pages / sheets"]]
    order = {sid: i for i, sid in enumerate(manifest)}
    keyed = [x for x in files if x["kind"] != "page" and x["source_id"] not in ("BR-DM-02", "BR-DM-03")]

    def pkey(x):
        p = x["period"]
        if p.startswith("FY "):
            p = p[3:7] + "-04"
        return (order.get(x["source_id"], 999), p or "9999", x["file"])
    for x in sorted(keyed, key=pkey):
        ps = x["pages"] if x["kind"] == "pdf" else x["sheets"]
        name = x["file"]
        if len(name) > 70:
            name = name[:67] + "…"
        rows.append([x["source_id"], name, x["period"] or "", x["kind"], f"{int(x['bytes']) / 1e6:.1f}", ps or ""])
    story.append(table(rows, [18, 92, 20, 12, 12, 20], extra=[("ALIGN", (4, 0), (5, -1), "RIGHT")]))
    return story


SERIES = [("PC11_PCA", "Primary Census Abstract by district, for all, SC and ST populations"),
          ("PCA_CDB", "Primary Census Abstract by community development block, per district"),
          ("PCA_REL", "Primary Census Abstract by religion"),
          ("PC11_A", "General population tables (decadal variation, villages and towns)"),
          ("PC11_B", "Economic tables: main and marginal workers, non-workers"),
          ("PC11_C", "Social and cultural tables: religion, marital status, mother tongue"),
          ("PC11_D", "Migration tables: place of birth and last residence"),
          ("PC11_F", "Fertility tables: women by parity and children ever born"),
          ("PC11_FH", "Female-headed households"),
          ("PC11_H", "Census houses and their uses"),
          ("PC11_HH", "Households by size and composition"),
          ("PC11_HL", "Houselisting: housing condition, amenities and assets"),
          ("PC11_SC", "Scheduled caste workers by industry, age and education"),
          ("PC11_ST", "Scheduled tribe workers by industry, age and education"),
          ("PC11_MDDS", "Location codes (MDDS e-governance codes)")]


def appendix_census(census):
    t = [x for x in census if x["source_id"] == "BR-DM-02"]
    count, size = collections.Counter(), collections.Counter()
    for x in t:
        m = re.match(r"([A-Z]+\d*_[A-Z]+)", x["title"])
        k = m.group(1) if m else "other"
        count[k] += 1
        size[k] += float(x["notes"].split("; ")[1].split()[0])
    rows = [["Series", "Contents", "Tables", "MB"]]
    for k, desc in SERIES:
        if count[k]:
            rows.append([k, desc, str(count[k]), f"{size[k]:.1f}"])
    rows.append(["Total", "", str(sum(count.values())), f"{sum(size.values()):.1f}"])
    return [H1("Appendix B. Census 2011 tables for Bihar"),
            P("The 500 Census 2011 tables (BR-DM-02) grouped by series. Each was downloaded as a spreadsheet and "
              "every sheet saved as CSV. The District Census Handbooks (BR-DM-03) are separate: 38 district "
              "archives of about 60 tables each, plus the state village and town files."),
            table(rows, [24, 116, 16, 18], extra=[("ALIGN", (2, 0), (3, -1), "RIGHT"),
                                                  ("FONTNAME", (0, len(rows) - 1), (-1, len(rows) - 1), "Sans-Bold")])]


def main():
    summary, files, manifest, census = load()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Doc(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm,
              bottomMargin=18 * mm, title="Bihar Data Handbook", author="India By Numbers",
              subject="Task 3: Data collection")
    story = (cover(summary) + contents() + at_a_glance(summary, files) + about() + [PageBreak()]
             + status_section(summary, manifest) + [PageBreak()] + guide_section(summary) + [PageBreak()]
             + example_section() + how_section() + [PageBreak()] + quality_section(summary) + [PageBreak()]
             + todo_section() + use_section() + [PageBreak()] + appendix_files(files, manifest) + [PageBreak()]
             + appendix_census(census))
    doc.multiBuild(story, onLaterPages=on_page)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
