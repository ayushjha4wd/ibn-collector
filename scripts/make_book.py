#!/usr/bin/env python3
"""Build the Bihar Data Book: the detailed account of the IBN collector and its data.

Writes docs/IBN_Bihar_Data_Book.pdf from the manifest, data/analysis (analyse.py),
data/analysis/insights (insights.py) and docs/charts (book_charts.py). Run those first:

  python scripts/analyse.py && python scripts/insights.py && python scripts/book_charts.py
  python scripts/make_book.py

Every figure in the text is read from those files when the book is built.
"""
from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from pathlib import Path

from reportlab.lib.units import mm
from reportlab.platypus import CondPageBreak, Image, KeepTogether, PageBreak, Paragraph, Spacer
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROCESSED, ROOT  # noqa: E402
import make_handbook as hb  # noqa: E402
from make_handbook import ACCENT, INK, MUTED, P, S, bullets, esc, table  # noqa: E402

OUT = ROOT / "docs" / "IBN_Bihar_Data_Book.pdf"
CHARTS = ROOT / "docs" / "charts"
INS = DATA / "analysis" / "insights"
WIDTH = 174  # mm of text width on A4 with 18 mm margins

S["part"] = ParagraphStyle("part", fontName="Sans-Bold", fontSize=26, leading=32, textColor=ACCENT, spaceAfter=10)
S["partsub"] = ParagraphStyle("partsub", fontName="Sans", fontSize=11, leading=16, textColor=MUTED)
S["h3"] = ParagraphStyle("h3", fontName="Sans-Bold", fontSize=9.8, leading=13, textColor=INK, spaceBefore=6,
                         spaceAfter=2)
S["toc0"] = ParagraphStyle("toc0", fontName="Sans-Bold", fontSize=10, leading=17, textColor=ACCENT, spaceBefore=4)
S["toc1"] = ParagraphStyle("toc1b", fontName="Sans", fontSize=9.5, leading=14, textColor=INK, leftIndent=12)
S["caption"] = ParagraphStyle("caption", fontName="Sans", fontSize=7.8, leading=10.5, textColor=MUTED, spaceAfter=8)


def on_page(canvas, doc):
    """Footer for this book (the handbook's footer names the handbook)."""
    if doc.page == 1:
        return
    canvas.saveState()
    canvas.setFont("Sans", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "India By Numbers · Bihar Data Book · Task 3: Data collection")
    canvas.drawRightString(hb.A4[0] - 18 * mm, 10 * mm, str(doc.page))
    canvas.setStrokeColor(hb.RULE)
    canvas.line(18 * mm, 13 * mm, hb.A4[0] - 18 * mm, 13 * mm)
    canvas.restoreState()


class Book(hb.Doc):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            name = flowable.style.name
            if name == "part":
                self.notify("TOCEntry", (0, flowable.getPlainText(), self.page))
            elif name == "h1":
                self.notify("TOCEntry", (1, flowable.getPlainText(), self.page))


def rows(name):
    return list(csv.DictReader(open(INS / name, encoding="utf-8")))


def part(title, subtitle):
    return [PageBreak(), Spacer(1, 70 * mm), Paragraph(esc(title), S["part"]), P(subtitle, "partsub"), PageBreak()]


def H1(text):
    return Paragraph(esc(text), S["h1"])


def chart(name, height_mm, caption):
    img = Image(str(CHARTS / name))
    ratio = img.imageHeight / img.imageWidth
    w = min(WIDTH, height_mm / ratio)
    img.drawWidth, img.drawHeight = w * mm, w * ratio * mm
    return KeepTogether([img, P(caption, "caption")])


def fmt(x, d=0):
    return f"{float(x):,.{d}f}"


# ---------------------------------------------------------------------------- Part I
def part_one(summary):
    s = summary
    return part("Part I. Introduction", "What India By Numbers is, what Task 3 asked for, and how to read this book") + [
        H1("1. India By Numbers"),
        P("India generates a great deal of public information about its people, places and public finances. "
          "Ministries, departments, commissions, surveys and local governments each collect data for their own "
          "administrative, operational or policy purposes. The result is fragmented: information about the same "
          "people, places and development issues sits in separate portals, databases and publications, which makes it "
          "hard to find, compare and connect."),
        P("India By Numbers (IBN) aims to close that gap. It starts by building a structured, growing repository of "
          "India's public information, so that existing datasets, reports and surveys are easier to discover and "
          "understand. Later it will connect information across sources, institutions, subjects and places: for "
          "example, relating Census population characteristics, panchayat records, school and health surveys and "
          "public spending, to see how population, public resources and services relate to each other."),
        P("Three principles shape the work:"),
        *bullets(["<b>Start from what exists.</b> Understand and build on the information already published before "
                  "committing to complex technology or analysis.",
                  "<b>Be transparent about evidence.</b> Distinguish what a source reports directly, what is derived by "
                  "combining sources, what rests on assumptions, and what is unavailable.",
                  "<b>Show the gaps.</b> Make visible where information is missing, uneven or out of date, and why that "
                  "matters."]),
        P("The first phase covers two domains, <b>Public Finance</b> and <b>Demographics</b>, starting with Bihar."),
        H1("2. The three tasks"),
        table([["Task", "What it asked for", "What it produced"],
               ["1. Data source discovery", "Find every relevant dataset for public finance and demographics and record "
                "its name, publisher, link, purpose, subjects and indicators, access method and format",
                "Two catalogues: 66 India-wide sources and 41 Bihar sources, each with geographic level, update "
                "frequency, latest edition and known gaps"],
               ["2. Data availability assessment", "Work out how complete each dataset really is: geographic detail, "
                "years covered, frequency, coverage, missing places and periods, and access restrictions",
                "An availability assessment of every source on common categories, and a Gap Summary"],
               ["3. Data collection", "Download the datasets, keeping the original files, recording download dates and "
                "source references, never editing originals by hand, and using repeatable scripts",
                "The ibn-collector toolkit and the Bihar collection described in this book"]], [36, 72, 66]),
        Spacer(1, 6),
        P("The tasks build on each other. Task 1's catalogue became the collector's list of sources, under the same "
          "IDs (BR-PF-01, BR-DM-02 and so on). Task 2's availability notes predicted much of what went wrong in "
          "collection: sources that are view-only, need a login, or are published only as PDFs."),
        P("Headline findings carried forward from Task 2", "h2"),
        *bullets(["India-wide, most data stops at state level; village-level data is either from Census 2011 or only "
                  "viewable on screen; key household surveys have long breaks; district GDP is not published nationally; "
                  "most fiscal data is PDF only.",
                  "For Bihar, three population figures disagree: Census 2011 (10.41 crore), the 2023 caste survey "
                  "(13.07 crore, state level only) and official projections based on 2011.",
                  "District spending is locked inside the treasury system, which needs a login; panchayat finances can "
                  "only be viewed on screen; there are no district-level health rates after NFHS-5 (2019-21)."]),
        H1("3. How to read this book"),
        P("Part II explains what the collector does and the records it keeps. Part III describes every dataset that "
          "was collected and the status of every catalogue source. Part IV analyses the data: Bihar's public finances, "
          "its population and demography, its villages, and how far the sources agree with each other. Part V covers "
          "data quality, what remains to be collected, and next steps. The appendices list every file."),
        P("Figures in this book are read from the collector's own files when the book is built. Each analysis table "
          "names the original document it came from; the underlying CSV files are in "
          "<font name='Mono'>data/analysis/insights/</font> and record the exact page.", "small"),
        P("Numbers at a glance", "h2"),
        table([["Measure", "Value"],
               ["Bihar catalogue sources covered", "41 of 41 in the collector's list; 12 with data collected"],
               ["Data files collected and verified", f"{s['data_files']:,} ({s['data_bytes'] / 1e9:.2f} GB)"],
               ["PDF documents", f"{s['kinds'].get('pdf', 0):,} with {s['pdf_pages']:,} pages"],
               ["Excel workbooks", f"{s['kinds'].get('excel', 0):,} with {s['excel_sheets']:,} sheets"],
               ["District Census Handbook archives", f"{s['kinds'].get('zip', 0)} with 2,344 district tables"],
               ["Tables found in PDFs", f"{s['pdf_tables_found']:,}"],
               ["Scanned pages read by OCR", f"{s['pdf_pages_read_by_ocr']:,} of {s['pdf_pages_without_text']:,}"],
               ["Collection runs logged", f"{len(s['runs'])}"],
               ["Bad downloads caught and set aside", f"{s['flagged_invalid']}"]], [90, 84]),
    ]


# ---------------------------------------------------------------------------- Part II
SCRIPTS = [
    ("collect.py", "Download sources and record where they came from",
     "Reads a manifest (config/manifest.csv by default) and, for each row, downloads the file or the page. In "
     "<b>file</b> mode it downloads one URL. In <b>page</b> mode it saves a snapshot of the page, finds the links on it "
     "that match the row's link pattern, and downloads those. <b>Manual</b> rows are logged as skipped.",
     ["Streams each download to a temporary file, then checks it before keeping it: the size must match what the "
      "server announced (so a cut-off download is never kept), and an HTML page served for a .pdf or .xlsx link, or a "
      "bot-check page, is refused and logged as <i>blocked</i>.",
      "Computes a sha256 fingerprint. If a file with the same fingerprint was already saved for that source, it is "
      "logged as <i>unchanged</i> and not saved again. Otherwise it is moved into data/raw/&lt;source&gt;/&lt;date&gt;/ "
      "and made read-only. A file is never overwritten: a new version gets a new name beside the old one.",
      "Appends one line per attempt to data/provenance.jsonl (see chapter 6).",
      "Keeps cookies within a run and loads config/extra-intermediates.pem on top of the system certificate store, for "
      "portals that omit part of their certificate chain. Certificate verification is never turned off.",
      "Cleans up links from messy pages: encodes spaces, and splits two URLs pasted into one link."],
     "python scripts/collect.py [--only ID ...] [--priority N] [--manifest FILE] [--resume] [--dry-run]"),
    ("census_manifest.py", "List Bihar's census files through the census catalogue's API",
     "censusindia.gov.in loads its pages with JavaScript, so ordinary scraping finds nothing. Behind it is a catalogue "
     "(NADA) with a public JSON API. This script asks it for Census 2011 tables naming Bihar (BR-DM-02), the 2011 "
     "District Census Handbooks for Bihar (BR-DM-03) and the SRS Statistical Reports (BR-DM-05).",
     ["For each catalogue entry, reads its list of downloads and checks each one's file name and size.",
      "Keeps machine-readable files (Excel, CSV, zip) by default; --with-pdf keeps the PDF versions too.",
      "Drops repeats: the 82 MB state village file is linked from every District Census Handbook page but is listed once.",
      "Writes one file row per download to config/manifest_census.csv (or manifest_srs.csv), which collect.py then runs."],
     "python scripts/census_manifest.py [--groups tables,handbooks,srs] [--out FILE] [--with-pdf]"),
    ("register_manual.py", "Add files downloaded by hand",
     "For sources behind a login, form or CAPTCHA, a person downloads the file in a browser and registers it, so it "
     "gets the same treatment as an automatic download.",
     ["Copies the file byte for byte (the person's copy is untouched), checks the copy, makes it read-only and logs it "
      "with the source ID, URL, date obtained, who obtained it and a note.",
      "Accepts one file or a whole folder (--dir). Refuses a file that is really a CAPTCHA or error page.",
      "Validates the date and the source ID, so a typo cannot create files outside data/raw."],
     "python scripts/register_manual.py --source-id ID --file F | --dir D --url URL --obtained-on YYYY-MM-DD"),
    ("flag.py", "Set aside bad originals without deleting them",
     "Some downloads turn out not to be what they claim, for example a bot-check page saved under a .xlsx name.",
     ["--auto finds saved files whose content is a bot-check page or HTML served for a file link; --path flags named "
      "files with a reason.",
      "Appends an <i>invalid</i> record to the provenance log. Nothing is deleted or moved: the record of what the site "
      "served stays complete.",
      "Flagged files are skipped by extraction, marked valid = no in inventory.csv, and ignored for duplicate checks."],
     "python scripts/flag.py --auto [--apply] | --path P ... --reason TEXT --apply"),
    ("extract.py", "Make machine-readable copies",
     "Turns each valid original into text and CSV in data/processed/&lt;source&gt;/&lt;first 12 characters of its "
     "sha256&gt;/, with an extraction.json that points back to the original, its URL and download time.",
     ["PDF: the text of every page (page_NNN.txt) and every ruled table as CSV. Pages are released after reading so "
      "1,000-page reports fit in memory.",
      "Excel: one CSV per sheet, every cell as text, no cleaning. Old-format .xls files with broken named ranges are "
      "still read.",
      "Zip: spreadsheets and CSVs inside are read in memory and written as CSV; nothing is unpacked into data/raw, and "
      "member names cannot write outside the output folder.",
      "CSV re-encoded to UTF-8; HTML tables to CSV.",
      "Re-checks each original's fingerprint first and extracts each original once; --retry-partial re-runs zips "
      "with unread members."],
     "python scripts/extract.py [--only ID ...] [--retry-partial] [--force]"),
    ("ocr.py", "Read scanned pages",
     "Scanned pages have no text layer, so extraction gives empty text. This script finds those pages and reads them "
     "with Tesseract in English and Hindi.",
     ["Renders only the empty pages (200 dpi) and writes page_NNN.ocr.txt beside page_NNN.txt.",
      "Runs several pages at once (--workers) and resumes page by page after an interruption.",
      "Logs each file in data/ocr.jsonl. OCR text can contain misreadings (chapter 18)."],
     "python scripts/ocr.py [--only ID ...] [--workers N]"),
    ("verify.py", "Prove the originals are unchanged",
     "Re-computes the fingerprint of every original in the provenance log and compares it with the recorded one.",
     ["Reports any original that is missing, modified, or present on disk but never logged, and any leftover partial "
      "download. Exit code 1 if anything is wrong.",
      "Writes data/inventory.csv: one row per original with its source, URL, download date, size, fingerprint and "
      "validity.",
      "Files kept out of git for size (config/not_in_git.txt) are reported as NOT IN GIT, not missing."],
     "python scripts/verify.py"),
    ("analyse.py", "Describe what was collected",
     "Builds data/analysis/files.csv, summary.json and FILES.md: for every valid file, the period it covers (read from "
     "its name), pages or sheets, tables found, pages without text and how many OCR read, and how often Bihar is "
     "mentioned.", [], "python scripts/analyse.py"),
    ("insights.py", "Extract analysis-ready figures",
     "Reads specific tables from the collected files into data/analysis/insights/: GST by year, state finances, SRS "
     "rates, population, Finance Commission shares, the district census profile and village amenities. Each value "
     "carries the file and page it came from, and the script checks the figures where it can (chapter 16).",
     [], "python scripts/insights.py"),
    ("book_charts.py, make_book.py, make_handbook.py", "Produce this book and the short handbook",
     "Draw the charts from the insights files and assemble the PDFs.", [],
     "python scripts/book_charts.py && python scripts/make_book.py"),
]


def part_two(summary):
    story = part("Part II. What the system does", "The ibn-collector toolkit: its stages, its records and its tests")
    story += [H1("4. The toolkit at a glance"),
              P("The collector is a set of small Python scripts, each doing one stage. It needs only Python 3.9 or later "
                "for downloading; extraction uses pdfplumber, pandas and openpyxl, and OCR uses Tesseract. Every stage "
                "is safe to re-run: work already done is skipped, and nothing already saved is changed."),
              table([["Stage", "Script", "Reads", "Writes"],
                     ["List sources", "manifest.csv, census_manifest.py", "Task 1 catalogue IDs; census API",
                      "config/manifest*.csv"],
                     ["Download", "collect.py", "manifests", "data/raw/, provenance.jsonl"],
                     ["Hand downloads", "register_manual.py", "files saved by a person", "data/raw/, provenance.jsonl"],
                     ["Set aside", "flag.py", "data/raw/", "invalid records in provenance.jsonl"],
                     ["Extract", "extract.py", "data/raw/", "data/processed/, extractions.jsonl"],
                     ["OCR", "ocr.py", "data/raw/, empty pages", "page_NNN.ocr.txt, ocr.jsonl"],
                     ["Verify", "verify.py", "data/raw/, provenance.jsonl", "data/inventory.csv"],
                     ["Describe", "analyse.py, insights.py", "logs, data/processed/", "data/analysis/"],
                     ["Publish", "book_charts.py, make_book.py", "data/analysis/", "docs/"]], [24, 50, 50, 50]),
              H1("5. Each script in detail")]
    for name, title, what, how, cmd in SCRIPTS:
        block = [P(f"<font name='Mono'>{esc(name)}</font>: {esc(title)}", "h2"), P(what)]
        block += bullets(how)
        block.append(Paragraph(esc(cmd), S["code"]))
        story += block
    rec = next(json.loads(line) for line in open(DATA / "provenance.jsonl", encoding="utf-8")
               if '"BR-PF-16"' in line and '"linked_file"' in line and '"saved"' in line)
    rec_lines = "<br/>".join(esc(f'"{k}": {json.dumps(v, ensure_ascii=False)}') for k, v in rec.items())
    story += [H1("6. The records it keeps"),
              P("Every download attempt is one line of JSON in data/provenance.jsonl, appended and never rewritten. "
                "This is the record behind the Task 3 requirements: it says where each file came from, when, and what "
                "it was. Here is the real record for the PRS Bihar Budget Analysis 2026-27:"),
              Paragraph(rec_lines, S["code"]),
              table([["Field", "Meaning"],
                     ["source_id", "Task 1 catalogue ID (a suffix such as 05c marks a part of a catalogue source)"],
                     ["url, final_url", "Address requested, and the address after any redirects"],
                     ["parent_url, link_text", "The page the file was linked from, and the link's text"],
                     ["retrieved_at_utc / _ist", "When it was downloaded, in UTC and Indian time"],
                     ["headers", "What the server said: type, size, Last-Modified, ETag"],
                     ["sha256, bytes", "Fingerprint and size of the saved file"],
                     ["status", "saved, unchanged, error, blocked, skipped_manual, manual, or invalid (flagged)"],
                     ["stored_path", "Where the original is kept, under data/raw/"],
                     ["run_id", "Which collection run made the attempt"]], [45, 129]),
              P("Folder layout", "h2"),
              Paragraph("config/manifest.csv &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; what to collect (41 catalogue sources)<br/>"
                        "config/manifest_census.csv, manifest_srs.csv &nbsp; census and SRS files (built by script)<br/>"
                        "config/extra-intermediates.pem &nbsp; public certificates some portals omit<br/>"
                        "config/not_in_git.txt &nbsp;&nbsp; originals over GitHub's 100 MB limit<br/>"
                        "data/raw/&lt;ID&gt;/&lt;date&gt;/ &nbsp;&nbsp; original files, read-only<br/>"
                        "data/processed/&lt;ID&gt;/&lt;sha12&gt;/ &nbsp; extracted text and CSV<br/>"
                        "data/provenance.jsonl &nbsp; download log<br/>"
                        "data/extractions.jsonl, ocr.jsonl &nbsp; extraction and OCR logs<br/>"
                        "data/inventory.csv &nbsp;&nbsp;&nbsp;&nbsp; one row per original (verify.py)<br/>"
                        "data/analysis/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; files.csv, summary.json, FILES.md, insights/<br/>"
                        "docs/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; this book, the handbook "
                        "and the charts", S["code"]),
              P("How each Task 3 requirement is met", "h2"),
              table([["Requirement", "How it is met"],
                     ["Preserve original files", "Saved byte for byte, read-only, never overwritten; bad files flagged, "
                      "never deleted"],
                     ["Record download dates", "Every attempt logged with UTC and IST time and the server's own dates"],
                     ["Maintain source references", "Catalogue ID, URLs, linking page, link text, size and fingerprint "
                      "in every record"],
                     ["Avoid manually modifying originals", "All derived work goes to data/processed; verify.py proves "
                      "every original is unchanged"],
                     ["Repeatable scripts", "One command per stage; re-runs skip finished work"]], [50, 124])]
    tests = subprocess.run(["bash", str(ROOT / "tests" / "run_test.sh")], capture_output=True, text=True,
                           cwd=ROOT).stdout
    passed = [ln[6:] for ln in tests.splitlines() if ln.startswith("PASS  ")]
    failed = [ln[6:] for ln in tests.splitlines() if ln.startswith("FAIL  ")]
    story += [H1("7. How it is tested"),
              P(f"tests/run_test.sh runs the whole pipeline offline against a fake government portal on the local "
                f"machine and checks the results. When this book was built it ran {len(passed) + len(failed)} checks: "
                f"{len(passed)} passed and {len(failed)} failed."),
              table([["#", "Check"]] + [[str(i), t] for i, t in enumerate(passed + failed, 1)], [10, 164])]
    return story


# ---------------------------------------------------------------------------- Part III
DETAIL = {
    "BR-PF-05c": ("Accountant General (A&E), Bihar", "Monthly", "State",
                  "Track the state's fiscal position month by month: receipts, spending and deficits against the budget.",
                  "PDF, about 18 pages: a one-page summary of receipts, expenditure by type and sector, and deficits, "
                  "each with the budget estimate, actual to date, % of budget and the same point last year; then "
                  "monthly progressions.",
                  "Unaudited and provisional. Each month is cumulative from April. March has preliminary and "
                  "supplementary editions; the supplementary one is final for the year."),
    "BR-PF-05": ("Accountant General (A&E), Bihar", "Annual", "State; department; major head",
                 "The audited annual accounts of the government: what was received and spent, under every head.",
                 "Volume I: summary statements. Volume II: detailed statements of revenue, expenditure, loans, "
                 "guarantees and investments.", "Published about nine months after the year ends."),
    "BR-PF-05b": ("Accountant General (A&E), Bihar", "Annual", "State; grant",
                  "Spending under each grant against what the legislature authorised.",
                  "Grant-by-grant statements with excess and saving explanations.", ""),
    "BR-PF-05a": ("Accountant General (A&E), Bihar", "Annual", "State", "A short readable summary of the accounts.",
                  "Charts and tables on receipts, spending, debt and deficits, with a five-year comparison.", ""),
    "BR-PF-04": ("Finance Department, Government of Bihar", "Annual", "State; district",
                 "The government's review of the economy: growth, district GDP, sectors, public finance and services.",
                 "Chapters with tables and charts; English and Hindi editions.",
                 "Both editions are image-only PDFs, so their text comes from OCR. Earlier years are linked from the "
                 "Finance Department site on Google Drive and were not collected."),
    "BR-PF-02": ("Finance Department, Government of Bihar", "Annual", "State; department; scheme",
                 "Spending tagged to environmental objectives.", "Scheme-level tables.",
                 "The portal lists outcome, gender and child budgets too, but without download links."),
    "BR-PF-09": ("State Finance Commission, Bihar", "Every five years", "State; panchayat; municipality",
                 "Recommendations on sharing state revenue with local governments.",
                 "Report volumes with fiscal data on local bodies.", "6th SFC Part 3 is mostly scanned."),
    "BR-PF-15": ("Sixteenth Finance Commission", "Once (award period 2026-31)", "Centre; states",
                 "How central taxes are shared among states, and grants to states and local bodies.",
                 "Main report, annexures, an evaluation of Bihar's finances, and 13 all-state Excel datasets.", ""),
    "BR-PF-15a": ("Fifteenth Finance Commission", "Once (award periods 2020-21 and 2021-26)", "Centre; states",
                  "The previous award, including state-by-state chapters.", "Report volumes I, II and IV.",
                  "Volume IV is 116 MB, over GitHub's file limit, so it is kept out of git."),
    "BR-PF-12": ("GST Network / GST Council", "Monthly, published by year", "State",
                 "Goods and services tax collected in each state.",
                 "Excel workbooks by year: state-wise monthly collections, returns filed, IGST settlement, e-way bills.",
                 "All states in every file; Bihar is one row."),
    "BR-PF-16": ("PRS Legislative Research", "Annual", "State", "An independent analysis of the state budget.",
                 "A short PDF with key figures and charts.", ""),
    "BR-DM-02": ("Office of the Registrar General and Census Commissioner", "Every ten years (2011)",
                 "State; district; block; town; village",
                 "The full count of Bihar's population and its characteristics.",
                 "Excel tables by series: Primary Census Abstract, houselisting, social and cultural, economic, migration, "
                 "fertility (Appendix B).", "Census 2011 is the latest available; Census 2027 results are not yet out."),
    "BR-DM-03": ("Office of the Registrar General and Census Commissioner", "Every ten years (2011)",
                 "District; block; village; town",
                 "Each district's tables and the amenities in every village and town.",
                 "38 district archives of about 60 tables, plus the state Village Directory (44,873 villages, 396 "
                 "attributes) and Town Directory.", ""),
    "BR-DM-05": ("Office of the Registrar General (SRS)", "Annual", "State; rural and urban",
                 "Birth, death, fertility and infant mortality rates from a continuous sample survey.",
                 "Report PDFs with statements and annual-estimate tables.",
                 "State-level only; reports for 2015-2019 are partly scanned."),
    "BR-DM-16": ("Technical Group on Population Projections (MoHFW)", "Once (2019)", "State",
                 "Projected population 2011-2036 by age and sex.", "Report PDF with state tables.", ""),
    "DM-11": ("Office of the Registrar General (CRS)", "Annual", "State",
              "Registered births and deaths under the Civil Registration System.", "Report PDF with state tables.", ""),
}


def part_three(summary, manifest):
    ps = summary["per_source"]
    story = part("Part III. What data we have", "Coverage of the Bihar catalogue and a guide to every dataset collected")
    status = hb.status_section(summary, manifest)
    status[0] = H1("8. Status of every Bihar catalogue source")  # chapter number in this book
    story += status
    story += [CondPageBreak(60 * mm), H1("9. The datasets in detail"),
              P("For each dataset: who publishes it, how often, at what geographic level, what it is for, how the files are "
                "laid out, and anything to watch for. Figures in grey are from the collection itself.")]
    for sid, title, text in hb.GUIDE:
        p = ps.get(sid)
        if not p or not p["data_files"]:
            continue
        pub, freq, geo, purpose, layout, note = DETAIL[sid]
        facts = [f"{p['data_files']:,} files", f"{p['bytes'] / 1e6:,.1f} MB"]
        if p["pdf_pages"]:
            facts.append(f"{p['pdf_pages']:,} PDF pages, {p['pdf_tables_found']:,} tables")
        if p["excel_sheets"]:
            facts.append(f"{p['excel_sheets']:,} sheets")
        if p["pdf_pages_without_text"]:
            facts.append(f"{p['pdf_pages_read_by_ocr']:,} of {p['pdf_pages_without_text']:,} scanned pages read by OCR")
        if p["period_first"] and sid != "BR-DM-02":
            facts.append("period " + (p["period_first"] if p["period_first"] == p["period_last"]
                                      else f"{p['period_first']} to {p['period_last']}"))
        detail = table([["Publisher", pub], ["Frequency", freq], ["Geography", geo], ["Purpose", purpose],
                        ["Files", layout]] + ([["Watch for", note]] if note else []), [28, 146], header=False)
        story += [KeepTogether([P(f"{esc(title)}  <font color='#5b6b65' size='8'>{sid}</font>", "h2"), P(text),
                                detail, P(" · ".join(facts), "small")])]
    return story


# ---------------------------------------------------------------------------- Part IV
def part_four():
    gst = rows("gst_bihar.csv")
    fin = rows("state_finances.csv")
    srs = rows("srs_rates.csv")
    pop = rows("population.csv")
    dev = rows("devolution.csv")
    fc = {r["measure"]: r for r in rows("fc16_inputs.csv")}
    dist = rows("census_districts.csv")
    vil = rows("village_amenities.csv")
    years = sorted({r["financial_year"] for r in fin})

    def f(item, fy):
        return float(next(r for r in fin if r["item"] == item and r["financial_year"] == fy)["actual_crore"])

    def be(item, fy):
        return float(next(r for r in fin if r["item"] == item and r["financial_year"] == fy)["budget_estimate_crore"])
    y0, y1 = years[0], years[-1]
    growth = (f("Revenue receipts", y1) / f("Revenue receipts", y0)) ** (1 / (len(years) - 1)) - 1
    fin_items = ["Revenue receipts", "Tax revenue", "GST", "Share of union taxes", "Grants-in-aid", "Non-tax revenue",
                 "Revenue expenditure", "Salaries and wages", "Pensions", "Interest payments", "Subsidies",
                 "Capital expenditure", "Total expenditure", "Revenue surplus (+) / deficit (-)", "Fiscal deficit (-)",
                 "Primary deficit (-)"]
    fin_table = [["Rs crore"] + years] + [[it] + [fmt(f(it, y)) for y in years] for it in fin_items]
    committed = [(f("Salaries and wages", y) + f("Pensions", y) + f("Interest payments", y)) / f("Revenue receipts", y) * 100
                 for y in years]

    story = part("Part IV. Analysis", "What the collected data says about Bihar, and how far the sources agree")
    # --- public finance
    story += [H1("10. Bihar's public finances"),
              P(f"The year-end Monthly Key Indicators give a consistent five-year picture, {y0} to {y1}. Revenue receipts "
                f"grew from Rs {fmt(f('Revenue receipts', y0))} crore to Rs {fmt(f('Revenue receipts', y1))} crore, "
                f"about {growth * 100:.1f}% a year. Revenue expenditure grew faster in the last year, to Rs "
                f"{fmt(f('Revenue expenditure', y1))} crore, so a near balance on the revenue account in {years[-2]} "
                f"became a revenue deficit of Rs {fmt(-f('Revenue surplus (+) / deficit (-)', y1))} crore in {y1}."),
              chart("finances.png", 75, f"Source: Monthly Key Indicators, year-end (March supplementary) editions, "
                    f"{y0} to {y1}; unaudited. data/analysis/insights/state_finances.csv."),
              table(fin_table, [56] + [23.6] * len(years), extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")]),
              P("Deficits are shown as reported: negative is a deficit. Tax revenue includes the state's share of central "
                "taxes.", "caption"),
              P("Three things stand out", "h2"),
              *bullets([f"<b>Dependence on the Centre.</b> In {y1}, the share of central taxes and grants together made up "
                        f"{(f('Share of union taxes', y1) + f('Grants-in-aid', y1)) / f('Revenue receipts', y1) * 100:.0f}% "
                        f"of revenue receipts; the state's own taxes about "
                        f"{(f('Tax revenue', y1) - f('Share of union taxes', y1)) / f('Revenue receipts', y1) * 100:.0f}%.",
                        f"<b>Committed spending is rising.</b> Salaries, pensions and interest took "
                        f"{committed[0]:.0f}% of revenue receipts in {y0} and {committed[-1]:.0f}% in {y1}. Salaries alone "
                        f"rose from Rs {fmt(f('Salaries and wages', y0))} crore to Rs {fmt(f('Salaries and wages', y1))} "
                        f"crore.",
                        f"<b>Borrowing jumped in {y1}.</b> The fiscal deficit was Rs {fmt(-f('Fiscal deficit (-)', y1))} "
                        f"crore against Rs {fmt(-f('Fiscal deficit (-)', years[-2]))} crore a year earlier, while capital "
                        f"spending was flat at Rs {fmt(f('Capital expenditure', y1))} crore: the extra borrowing went to "
                        f"the revenue account."]),
              chart("revenue_mix.png", 50, f"Source: Monthly Key Indicators, March {y1[:2]}{y1[-2:]} supplementary "
                    "edition. Own taxes = tax revenue minus the share of central taxes."),
              chart("deficit.png", 62, "Fiscal deficit equals net borrowing and other liabilities in the Monthly Key "
                    "Indicators."),
              P("Budget against actual", "h2"),
              P(f"In {y1} revenue receipts reached {f('Revenue receipts', y1) / be('Revenue receipts', y1) * 100:.0f}% of "
                f"the budget estimate and capital expenditure {f('Capital expenditure', y1) / be('Capital expenditure', y1) * 100:.0f}%; "
                f"the fiscal deficit was {f('Fiscal deficit (-)', y1) / be('Fiscal deficit (-)', y1) * 100:.0f}% of the "
                f"budgeted figure.")]
    # GST
    full = [r for r in gst if r["financial_year"] not in ("2017-18", "2026-27")]
    first, last = full[0], full[-1]
    gst_growth = (float(last["bihar_gst_crore"]) / float(first["bihar_gst_crore"])) ** (1 / (len(full) - 1)) - 1
    story += [H1("11. GST in Bihar"),
              P(f"GST collected in Bihar rose from Rs {fmt(first['bihar_gst_crore'])} crore in {first['financial_year']} "
                f"(the first full year) to Rs {fmt(last['bihar_gst_crore'])} crore in {last['financial_year']}, about "
                f"{gst_growth * 100:.1f}% a year. Bihar's share of GST collected across states and union territories has "
                f"stayed near 1.2%, and it ranks about 19th, far below its 9.4% share of population: GST is collected "
                f"largely where goods are produced and businesses are registered."),
              chart("gst.png", 70, "Source: GST statistics, state-wise collection workbooks (Collections-Statewise "
                    "sheet, financial-year total). data/analysis/insights/gst_bihar.csv."),
              table([["Financial year", "Bihar (Rs crore)", "Share of states/UTs", "Rank", "Covers"]] +
                    [[r["financial_year"], fmt(r["bihar_gst_crore"]), f"{float(r['bihar_share_pct']):.2f}%",
                      f"{r['rank_of_states_uts']} of {r['states_uts']}", r["period_note"]] for r in gst],
                    [24, 30, 30, 22, 68], extra=[("ALIGN", (1, 0), (3, -1), "RIGHT")]),
              P("States and union territories exclude 'Other Territory' and OIDAR (online services). The 2025-26 and "
                "2026-27 workbooks have no cess column; their totals are CGST, SGST and IGST.", "caption")]
    # Finance Commission
    story += [H1("12. Bihar and the Finance Commissions"),
              P(f"The Finance Commission decides how central taxes are shared among states. Bihar's share was "
                f"{dev[-2]['bihar_share_pct']}% under the 15th Commission and is {dev[-1]['bihar_share_pct']}% under the "
                f"16th, for 2026-31. Since the 12th Commission it has stayed between "
                f"{min(float(r['bihar_share_pct']) for r in dev[1:])}% and {max(float(r['bihar_share_pct']) for r in dev[1:])}%, "
                f"above Bihar's population share because the formula weights low income heavily."),
              chart("devolution.png", 66, "Sources: 16th FC report Table 8.4 (11th–14th FC), 15th FC report Table 6.5, "
                    "16th FC report Table 8.9."),
              P("The commission's own data shows why", "h2"),
              table([["Measure (16th FC data)", "Bihar", "All states", "Bihar's share"]] +
                    [[r["measure"] + (f" ({r['unit']})" if r["unit"] not in ("Rs",) else " (Rs)"),
                      fmt(r["bihar"], 1 if float(r["bihar"]) < 1000 else 0),
                      fmt(r["all_states"], 1 if float(r["all_states"]) < 10000 else 0),
                      f"{r['bihar_share_pct']}%"] for r in fc.values()], [70, 34, 36, 34],
                    extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")]),
              P(f"In 2023-24 Bihar had {fc['Population estimate 2023-24']['bihar_share_pct']}% of the population of all "
                f"states but {fc['Comparable GSDP 2023-24']['bihar_share_pct']}% of their combined GSDP, so its income per "
                f"person was about Rs {fmt(fc['GSDP per person 2023-24']['bihar'])}, "
                f"{fc['GSDP per person 2023-24']['bihar_share_pct']}% of the all-state average of Rs "
                f"{fmt(fc['GSDP per person 2023-24']['all_states'])}.")]
    # Population
    cen = [r for r in pop if r["kind"] == "Census"]
    pro = [r for r in pop if r["kind"] == "Projected"]
    story += [H1("13. Population"),
              P(f"Bihar's population (within its present boundaries) was {int(cen[0]['population']) / 1e6:.1f} million in "
                f"1901 and barely grew for 30 years. It then grew fast: {int(cen[-2]['population']) / 1e6:.1f} million in "
                f"2001 and {int(cen[-1]['population']) / 1e6:.1f} million in 2011. The official projection reaches "
                f"{int(pro[-1]['population']) / 1e6:.1f} million by 2036."),
              chart("population.png", 75, "Sources: Census 2011 Table A-2 (1901–2011); Technical Group on Population "
                    "Projections (2019), Table 21 (2016–2036, as on 1 March)."),
              table([["Year", "Population", "Kind"]] +
                    [[r["year"], fmt(r["population"]), r["kind"]] for r in pop], [30, 50, 50],
                    extra=[("ALIGN", (1, 0), (1, -1), "RIGHT")])]
    # SRS
    def srsv(ind, y, col="bihar"):
        return float(next(r for r in srs if r["indicator"].startswith(ind) and r["year"] == str(y))[col])
    story += [H1("14. Births, deaths and fertility"),
              P(f"The Sample Registration System gives annual rates for 2009–2024. Bihar has had the highest birth rate of "
                f"the larger states throughout: {srsv('Birth', 2024):g} per 1,000 people in 2024 against "
                f"{srsv('Birth', 2024, 'india'):g} for India. Its total fertility rate fell from {srsv('Total', 2009):g} "
                f"to {srsv('Total', 2024):g} children per woman, still well above India's {srsv('Total', 2024, 'india'):g} "
                f"and the replacement level of 2.1."),
              P(f"Infant mortality is the clear improvement: from {srsv('Infant', 2009):g} to {srsv('Infant', 2024):g} "
                f"deaths per 1,000 live births, now in line with India ({srsv('Infant', 2024, 'india'):g}). The death "
                f"rate is below India's, partly because Bihar's population is young. Both rose in 2021, the year of the COVID-19 "
                f"second wave."),
              chart("srs.png", 110, "Source: SRS Statistical Reports 2014, 2019 and 2024, Tables 12–15 (annual "
                    "estimates). Where the tables overlap (2014, 2019) they agree exactly."),
              table([["Year", "Birth rate", "Death rate", "Infant mortality", "Fertility", "India birth rate",
                      "India infant mortality"]] +
                    [[str(y), f"{srsv('Birth', y):g}", f"{srsv('Death', y):g}", f"{srsv('Infant', y):g}",
                      f"{srsv('Total', y):g}", f"{srsv('Birth', y, 'india'):g}", f"{srsv('Infant', y, 'india'):g}"]
                     for y in range(2009, 2025)], [16, 22, 22, 28, 22, 30, 34],
                    extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")])]
    # districts
    dsort = sorted(dist, key=lambda r: -int(r["population"]))
    story += [H1("15. Districts and villages in 2011"),
              P(f"The 38 district abstracts of Census 2011 add up to exactly Bihar's published population, 104,099,452, "
                f"and reproduce its published literacy rate (61.8%), sex ratio (918 women per 1,000 men) and child sex ratio "
                f"(935). Behind those averages the districts differ widely: literacy runs from "
                f"{min(float(r['literacy_pct']) for r in dist)}% in Purnia to {max(float(r['literacy_pct']) for r in dist)}% "
                f"in Rohtas, and urban population from "
                f"{min(float(r['urban_pct']) for r in dist)}% to {max(float(r['urban_pct']) for r in dist)}% (Patna)."),
              chart("literacy.png", 160, "Source: Census 2011 Primary Census Abstract, district files "
                    "(DDW_PCA1001–1038). Literacy is literates as a share of people aged 7 and over."),
              P("District profile", "h2"),
              table([["District", "Population", "Urban %", "Sex ratio", "Child sex ratio", "Literacy %", "Female lit. %",
                      "SC %", "ST %", "Workers %"]] +
                    [[r["district"], fmt(r["population"]), r["urban_pct"], r["sex_ratio"], r["child_sex_ratio_0_6"],
                      r["literacy_pct"], r["female_literacy_pct"], r["sc_pct"], r["st_pct"], r["work_participation_pct"]]
                     for r in dsort], [30, 20, 14, 15, 17, 16, 17, 13, 13, 19],
                    extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")]),
              P("Sex ratio is women per 1,000 men; child sex ratio is girls per 1,000 boys aged 0–6. Sorted by population.",
                "caption"),
              P("Amenities in villages", "h2"),
              P(f"The Village Directory records amenities in every village. Of Bihar's "
                f"{int(vil[0]['inhabited_villages']):,} inhabited villages in 2011, almost all had a hand pump and most had "
                f"a government primary school and an anganwadi centre. Only {vil[0]['Power for domestic use']}% had power "
                f"for domestic use, {vil[0]['Mobile phone coverage']}% had mobile coverage, "
                f"{vil[0]['Commercial bank']}% had a commercial bank, and none had treated tap water."),
              chart("villages.png", 92, "Source: District Census Handbooks 2011, Village Directory "
                    "(DH_2011_DCHB_Village_Release_1000.xlsx); uninhabited villages excluded."),
              table([["District", "Villages", "Power", "All-weather road", "Mobile", "Bank", "PDS shop", "School"]] +
                    [[r["area"], fmt(r["inhabited_villages"]), r["Power for domestic use"], r["All-weather road"],
                      r["Mobile phone coverage"], r["Commercial bank"], r["Public distribution shop"],
                      r["Government primary school"]] for r in vil],
                    [34, 18, 16, 26, 18, 16, 20, 26], extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")]),
              P("Percentages of inhabited villages with each amenity in the village (2011). First row: Bihar.", "caption")]
    # connections
    aag = {"2020-21": 128168, "2021-22": 158797, "2022-23": 172688, "2023-24": 193347, "2024-25": 218657}
    story += [H1("16. Connecting the sources"),
              P("IBN's aim is to connect sources, and the first step is knowing how far they agree. The collection makes "
                "several cross-checks possible."),
              P("State accounts: three sources agree", "h2"),
              table([["Financial year", "Monthly Key Indicators (March)", "Accounts at a Glance 2024-25 (audited)",
                      "Revenue deficit, MKI", "Economic Survey Table 2.7"]] +
                    [[y, fmt(f("Revenue receipts", y)), fmt(aag[y]), fmt(f("Revenue surplus (+) / deficit (-)", y)),
                      {"2021-22": "422", "2022-23": "11,288", "2023-24": "-2,833"}.get(y, "–")] for y in years if y in aag],
                    [24, 40, 46, 30, 34], extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")]),
              P("Revenue receipts in Rs crore. The audited Accounts at a Glance matches the year-end Monthly Key Indicators "
                "to the crore for every year. The Economic Survey shows the revenue deficit with the opposite sign "
                "(deficit positive) and matches it too.", "caption"),
              P("Bihar's population: one state, several numbers", "h2"),
              table([["Figure", "Population", "Source in the collection"],
                     ["Census 2011", "104.1 million", "Census Table A-2; district abstracts sum to 104,099,452"],
                     ["Projection for 2021 (1 March)", f"{int(next(r for r in pop if r['year'] == '2021')['population']) / 1e6:.1f} million",
                      "Technical Group projections, Table 21"],
                     ["Estimate for 2023-24", f"{float(fc['Population estimate 2023-24']['bihar']):.1f} million",
                      "16th Finance Commission dataset (from MoSPI)"],
                     ["Projection for 2026 (1 March)", f"{int(next(r for r in pop if r['year'] == '2026')['population']) / 1e6:.1f} million",
                      "Technical Group projections, Table 21"],
                     ["Caste-based survey 2022-23", "130.7 million", "Task 2 catalogue; the report itself is still to be "
                      "collected (BR-DM-01)"]], [56, 30, 88]),
              P("The Census is 15 years old, the projections and the Finance Commission's estimate are both built on it, "
                "and the 2022-23 caste survey counted about 2.5 crore more people than the 2023-24 estimate. Until Census "
                "2027 is published, any per-person figure for Bihar depends on which population is used; IBN should always "
                "say which."),
              P("Other connections the data supports", "h2"),
              *bullets(["Per-person public spending and revenue by year, using the state accounts with a stated population "
                        "figure.",
                        "District literacy, urbanisation and village amenities (Census 2011) against district GDP in the "
                        "Economic Survey once its tables are taken from the original pages.",
                        "Birth rates and infant mortality (SRS) against health and education spending in the Appropriation "
                        "Accounts.",
                        "GST collections against the state's own tax revenue in the Monthly Key Indicators."])]
    return story


# ---------------------------------------------------------------------------- Part V
def part_five(summary):
    story = part("Part V. Quality, gaps and next steps", "How far the data can be trusted, what is missing and what comes next")
    story += [H1("17. Data quality")]
    story += hb.quality_section(summary)[1:]  # reuse the handbook's chapter without its heading
    story += [H1("18. Lessons from collecting Bihar's data"),
              *bullets(["<b>Government sites fail in ordinary ways.</b> Expired or incomplete certificates, server errors, "
                        "sites that refuse foreign connections, and bot checks blocked 11 sources. None of these is a reason "
                        "to turn verification off; each has a fix that keeps the record honest.",
                        "<b>JavaScript sites often have an API behind them.</b> The census website looks impossible to "
                        "collect from, but its catalogue API gave 556 files in a repeatable way.",
                        "<b>Check content, not file names.</b> 368 'spreadsheets' from RBI were bot-check pages. Every "
                        "download is now checked.",
                        "<b>Scanned PDFs are common.</b> 2,446 pages had no text, including the whole Economic Survey. OCR "
                        "makes them searchable but not quotable.",
                        "<b>Cross-check before trusting.</b> The state accounts, the audited summary and the Economic Survey "
                        "agree, which is what makes the finance figures in Part IV reliable."])]
    todo = hb.todo_section()
    todo[0] = H1("19. What remains")  # chapter number in this book
    story += todo
    story += [H1("20. Next steps for India By Numbers"),
              *bullets(["<b>Finish Task 3 for Bihar.</b> Run the collector from India, and download and register the "
                        "manual sources.",
                        "<b>Clean and standardise.</b> Build tidy tables from data/processed: one row per district or year, "
                        "LGD codes for places, consistent units, and Bihar rows from national files.",
                        "<b>Take key figures from original pages.</b> For scanned sources such as the Economic Survey, enter "
                        "the important tables from the page images, using OCR only to find them.",
                        "<b>Record what each number is.</b> Tag every figure as reported, derived, estimated or unavailable, "
                        "as the IBN principles require.",
                        "<b>Connect.</b> Start with the links in chapter 16: per-person finances, district profiles against "
                        "spending, and health outcomes against health spending."])]
    return story


def main():
    summary, files, manifest, census = hb.load()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Book(str(OUT), pagesize=hb.A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm,
               bottomMargin=18 * mm, title="Bihar Data Book", author="India By Numbers",
               subject="Task 3: Data collection, in detail")
    cover = hb.cover(summary)
    cover[3] = P("Bihar Data Book", "cover_t")
    cover[5] = P("The IBN collector explained: what it does, what data it holds, and what the data shows", "cover_s")
    toc = TableOfContents()
    toc.levelStyles = [S["toc0"], S["toc1"]]
    story = cover + [P("Contents", "h2"), toc]
    story += part_one(summary) + part_two(summary) + part_three(summary, manifest) + part_four() + part_five(summary)
    story += part("Appendices", "Every file collected, the Census 2011 series, and a glossary")
    story += hb.appendix_files(files, manifest) + [PageBreak()] + hb.appendix_census(census)
    story += [PageBreak(), H1("Appendix C. Glossary"),
              table([["Term", "Meaning"],
                     ["Actual (MKI)", "Amount received or spent from April to the month of the report"],
                     ["Budget estimate (BE)", "The amount in the budget passed for the year"],
                     ["Crore", "10 million (1,00,00,000); Rs 1 lakh crore = Rs 1 trillion"],
                     ["Devolution", "The states' share of central taxes, divided among states by the Finance Commission"],
                     ["Fiscal deficit", "Total spending and net lending minus receipts other than borrowing; equals net "
                      "borrowing"],
                     ["GSDP", "Gross State Domestic Product, the size of a state's economy"],
                     ["IMR", "Infant mortality rate: deaths before age one per 1,000 live births"],
                     ["MKI", "Monthly Key Indicators, the Accountant General's monthly summary of state accounts"],
                     ["OCR", "Optical character recognition: reading text from an image of a page"],
                     ["PCA", "Primary Census Abstract: the core Census counts for each area"],
                     ["Provenance", "The record of where, when and how a file was obtained"],
                     ["Revenue deficit", "Revenue expenditure minus revenue receipts"],
                     ["sha256", "A fingerprint of a file's exact bytes; any change gives a different value"],
                     ["SRS", "Sample Registration System: an annual survey of births and deaths"],
                     ["TFR", "Total fertility rate: the average number of children a woman would have"]], [42, 132])]
    doc.multiBuild(story, onLaterPages=on_page)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
