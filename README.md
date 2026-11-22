# IBN collector: Bihar data (Task 3 and Task 4)

Repeatable scripts to download India By Numbers source datasets for Bihar, keep the original
files untouched, and record where and when each file came from.

**For non-technical readers: [Bihar's Panchayats in eGramSwaraj: what the data tells us](docs/explainer/BIHAR_EGRAMSWARAJ_EXPLAINED.md)** ([PDF](docs/explainer/BIHAR_EGRAMSWARAJ_EXPLAINED.pdf)).

**District profile (plain language): [Patna, 2025-26](docs/district_reports/patna_2025-2026/report.md)** ([PDF](docs/district_reports/patna_2025-2026/report.pdf)); any district: `python scripts/make_district_report.py --district <code> --fy 2025-2026`. Transaction-level vouchers for a district-year: `python scripts/run_vouchers.py --district <code> --fy <FY>` (from India), then they appear in that district's report.

**Consolidated report, Tasks 1–5: [docs/IBN_FULL_REPORT.md](docs/IBN_FULL_REPORT.md)** ([PDF](docs/IBN_FULL_REPORT.pdf), [Excel](docs/IBN_FULL_REPORT.xlsx); rebuild with `python scripts/make_full_report.py`).

| Task | What | Report |
|---|---|---|
| **Task 3: Data collection** | All 41 sources in the Bihar catalogue (IDs match `IBN_Bihar_Data_Source_Catalogue_v2.xlsx`), plus a few extra entries (suffixes `a`, `b`, `c`) and the national CRS report (`DM-11`) | [REPORT.md](REPORT.md) (13 Nov 2026) · [Data Book (PDF)](docs/IBN_Bihar_Data_Book.pdf) · [Handbook (PDF)](docs/IBN_Bihar_Data_Handbook.pdf) · [every file](data/analysis/FILES.md) |
| **Task 4: eGramSwaraj exploration** | Bihar Panchayat profiles, elected representatives and public finance from the eGramSwaraj suite (Ministry of Panchayati Raj) | [TASK4_REPORT.md](docs/task4/TASK4_REPORT.md) (20–22 Nov 2026) · [PDF](docs/task4/TASK4_REPORT.pdf) · [Excel summary](docs/task4/TASK4_SUMMARY.xlsx) · [clean data](data/clean/egs/README.md) |
| **Task 5: eGramSwaraj validation** | Profiling, validation and standardisation of the Task 4 data: dictionary, reconciliation, geographic reference, comparability, quality register | [TASK5_REPORT.md](docs/task5/TASK5_REPORT.md) (22 Nov 2026) · [PDF](docs/task5/TASK5_REPORT.pdf) · [Excel summary](docs/task5/TASK5_SUMMARY.xlsx) · [validated data](data/validated/egs/) |

## Task 4: eGramSwaraj (Bihar Panchayats)

**Status: complete.** All deliverables (A–I) and the answers to the specific questions are in the
[report](docs/task4/TASK4_REPORT.md), which was merged in ayushjha4wd/ibn-collector#1.

**What was found (all verified from saved originals):**

* **Panchayat finance is public without CAPTCHA.** It is published as dated static reports: Receipts
  and Payments for each tier (Zilla Parishad, Block Panchayat, Gram Panchayat) by state, district,
  block and **every GP**, plus month-wise cash flow, scheme-wise statements (OWN, XV FC, FFC) and
  accounting status. Bihar has data from 2020-21. Earlier years show "0", which means accounts were
  not kept in eGramSwaraj, not zero spending.
* **Elected representatives are counted by gender.** For Bihar: GP 140,248 (77,292 female), BP
  11,666 (6,760 female), ZP 1,103 (647 female).
* **No population or household data** appears in any open report.
* **39 of the 59 report forms that offer Bihar have a CAPTCHA**, including the cash book, ledger,
  vendors, physical progress and GPDP action plans. They were not bypassed and are listed as gaps.
* **AuditOnline** (the suite's audit module) covers audits and observations for every GP, 2019-20 to
  2025-26. It has no rupee amounts.

**Where things are:**

| What | Where |
|---|---|
| Original files (read-only, byte-exact) | `data/raw/EGS-PORTAL/<date>/egramswaraj.gov.in/` (13,160) and `data/raw/EGS-AO/<date>/` (6,459) |
| Source URL, parameters, time and sha256 of every file | `data/provenance.jsonl` (sources `EGS-PORTAL`, `EGS-AO`) |
| Crawl and form inventory | `data/egs_explore/2026-11-20/` |
| Values copied exactly as served, coverage matrices | `data/analysis/egs/` |
| Clean tables and workbook (a separate later step) | `data/clean/egs/`; see its [README](data/clean/egs/README.md) |

**How to run it again.** `egramswaraj.gov.in` answers only connections from India, so the eGramSwaraj
steps must run on a computer in India. AuditOnline and every step after collection run anywhere.

```bash
python scripts/egs_auditonline.py      # AuditOnline: Bihar, all audit years, down to GP (works from anywhere)
python scripts/egs_summary.py          # AuditOnline field catalogue + coverage matrices -> data/analysis/egs/
python scripts/run_pass2.py            # FROM INDIA, one command: egs_bihar.py, egs_bihar.py --steps xhr,
                                       #   egs_portal_summary.py, then commit and push (add --delay 0.3 to go faster)
python scripts/egs_clean.py            # clean Bihar tables + workbook -> data/clean/egs/
python scripts/make_task4_docs.py      # rebuild docs/task4/TASK4_REPORT.pdf and TASK4_SUMMARY.xlsx
```

The individual eGramSwaraj steps, if needed:

```bash
python scripts/egs_explore.py          # crawl: saves every page, form and file, packs a zip
python scripts/egs_explore.py --forms  # also fills the Bihar report forms (pip install playwright; python -m playwright install chromium)
python scripts/egs_bihar.py            # static finance archives, getMobileData API, page scripts (resumes across days)
python scripts/egs_bihar.py --steps xhr     # JSON behind browser-built reports (representatives, profiles, GPDP)
python scripts/egs_bihar.py --deep-years all # block and GP pages for every year (default: 2020-21 and 2024-25)
python scripts/egs_portal_summary.py   # re-hashes originals; must print "0 hash mismatches"
```

**Rules the scripts keep:**

* CAPTCHA and login are never bypassed. `egs_bihar.py --steps manual` lets a person enter each CAPTCHA, and saves only what they are shown.
* Originals are never changed or overwritten. `.gitattributes` stops Git from converting line endings, which would break the sha256 check, and merges `data/provenance.jsonl` by keeping the lines of both sides.
* Empty is never read as zero.
* Personal names and contact details are not kept in derived files.

## Task 5: eGramSwaraj validation (Bihar)

**Report: [docs/task5/TASK5_REPORT.md](docs/task5/TASK5_REPORT.md)** ([PDF](docs/task5/TASK5_REPORT.pdf), [Excel summary](docs/task5/TASK5_SUMMARY.xlsx); rebuild with `python scripts/make_task5_docs.py`). It profiles, validates and standardises the Task 4 tables without changing them. The validated layer, data dictionary, reconciliation, geographic reference, comparability matrix and quality register are in `data/validated/egs/`.

```bash
python scripts/egs_validate.py --check         # full validation, run twice, outputs must be byte-identical
python -m unittest tests/test_egs_validate.py  # unit tests for the validation rules
python scripts/run_followup.py --delay 0.3   # FROM INDIA: follow-up collection (tied report, elected reps, all GP years), commit + push
python scripts/run_vouchers.py --district 203 --fy 2025-2026 --delay 0.3   # FROM INDIA: every voucher list of one district-year (203 = Patna)
```

## Quick start

```bash
pip install -r requirements.txt        # only needed for extract.py
python scripts/collect.py --dry-run    # see what would run
python scripts/collect.py --priority 1 # download priority-1 sources
python scripts/census_manifest.py --groups tables,handbooks       # list Bihar Census 2011 files (BR-DM-02, BR-DM-03)
python scripts/census_manifest.py --groups srs --out config/manifest_srs.csv   # SRS reports (BR-DM-05)
python scripts/collect.py --manifest config/manifest_census.csv
python scripts/collect.py --manifest config/manifest_srs.csv
python scripts/extract.py              # build machine-readable copies
python scripts/ocr.py                  # OCR scanned PDF pages (needs tesseract + poppler-utils)
python scripts/verify.py               # confirm originals are unchanged; writes inventory.csv
python scripts/analyse.py              # describe every file; writes data/analysis/ (files.csv, summary.json, FILES.md)
python scripts/insights.py             # analysis-ready figures, traced to source pages (data/analysis/insights/)
python scripts/book_charts.py          # charts for the book (docs/charts/)
python scripts/make_book.py            # build docs/IBN_Bihar_Data_Book.pdf (detailed)
python scripts/make_handbook.py        # build docs/IBN_Bihar_Data_Handbook.pdf (short)
```

Run `bash tests/run_test.sh` to check everything works offline (fake portal on localhost; the summary line gives the number of checks).

## How the Task 3 requirements are met

| Requirement | How |
|---|---|
| Preserve original files | Bytes are streamed to `data/raw/<source_id>/<YYYY-MM-DD>/` exactly as served, then made read-only. Nothing is ever overwritten: a revised file is saved alongside the old one. A download smaller than the size the server announced is rejected and its temporary file deleted, so a cut-off file is never recorded as an original. |
| Record download dates | Every attempt goes into `data/provenance.jsonl` with the time in UTC and IST, plus HTTP `Last-Modified` and `ETag` when the server sends them. |
| Maintain source references | Each record holds `source_id` (catalogue ID), requested URL, final URL after redirects, the page it was linked from, the link text, size and sha256. `verify.py` writes `data/inventory.csv` with one row per original. |
| Avoid manually modifying originals | Raw files are read-only. `extract.py` writes only to `data/processed/` and re-checks the sha256 before using a file. `verify.py` flags any file that's missing, modified or not in the log. |
| Repeatable extraction scripts | One command per stage. Re-running is safe: unchanged files are logged as `unchanged`, not copied again, and each raw file is extracted only once. |

## Folder layout

```
config/manifest.csv          what to collect (edit this, not the scripts)
config/manifest_census.csv   Bihar Census 2011 tables and District Census Handbooks (built by census_manifest.py)
config/manifest_srs.csv      SRS Statistical Reports (built by census_manifest.py --groups srs)
config/extra-intermediates.pem  public CA certificates some portals leave out of their TLS chain
data/raw/                    original files, read-only, by source and date (IST calendar date of the run)
data/processed/<id>/<sha12>/ extracted CSV/text + extraction.json pointing to the raw file
data/provenance.jsonl        append-only download log
data/extractions.jsonl       append-only extraction log
data/ocr.jsonl               append-only OCR log (page_NNN.ocr.txt files sit beside page_NNN.txt)
data/analysis/               files.csv, summary.json and FILES.md, written by analyse.py
data/analysis/egs/           Task 4 descriptions of the eGramSwaraj / AuditOnline originals (values as served)
data/egs_explore/            Task 4 crawl and form inventory
data/clean/egs/              Task 4 clean tables (separate later step), with README
docs/task4/                  Task 4 report (Markdown, PDF) and Excel summary
data/inventory.csv           regenerated by verify.py
```

## The manifest

| Column | Meaning |
|---|---|
| `source_id` | Catalogue ID (a suffix like `a` marks a second entry for the same dataset). One source may have several `file` rows, one per download (used by the census manifests); `page` rows must be unique |
| `mode` | `file` = download the URL; `page` = save the page and download linked files that match `link_pattern`; `manual` = can't be automated (see below) |
| `link_pattern` | Regular expression for which links to follow on a `page` |
| `max_files` | Cap on linked files per page (a `truncated` record is logged if more were found) |
| `priority` | 1 = collect first |

To add a source, add a row. URLs marked "to verify" in the catalogue may need fixing after the first run; check `provenance.jsonl` for `error` records.

## Manual sources

Rows with `mode` = `manual` can't be collected by script; each row's `notes` says why (login, form, CAPTCHA, a JavaScript-only site, view-only reports, or nothing published yet). The two RBI publications (BR-PF-13, BR-PF-14) show a bot check to scripts. Download these in a browser, then register them so they get the same treatment as automatic downloads:

```bash
# one file
python scripts/register_manual.py --source-id BR-DM-01 --file ~/Downloads/report.pdf \
    --url "https://where-it-came-from" --obtained-on 2026-11-13 --note "context"
# a whole folder (e.g. all RBI tables saved into one folder)
python scripts/register_manual.py --source-id BR-PF-14 --dir ~/Downloads/rbi_handbook \
    --url "https://rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States" \
    --obtained-on 2026-11-13 --note "Saved from browser"
```

Each file is copied (your copy is untouched), hashed, made read-only and logged. A file that is really a CAPTCHA or error page is refused.

## Bot-check pages and flagging bad originals

Some sites answer scripts with a CAPTCHA or block page instead of the file. `collect.py` now checks the content of every download. If an HTML page comes back for a `.pdf`/`.xlsx`/`.csv` link, or a page looks like a bot check, it is logged as `blocked` and **not** saved. The run then exits with code 1 and tells you to download those files by hand.

Files saved before this check existed (368 RBI CAPTCHA pages in the 13 Nov 2026 run), or files from the wrong page, are handled with `flag.py`. Flagging never deletes or moves anything. It appends an `invalid` record to the provenance log; flagged files are then skipped by `extract.py`, marked `valid=no` with the reason in `inventory.csv`, and ignored for duplicate detection.

```bash
python scripts/flag.py --auto            # dry run: what looks like a bot-check page or HTML-for-a-file
python scripts/flag.py --auto --apply
python scripts/flag.py --path data/raw/... --reason "off-target: ..." --apply
```

Anything in `data/processed/` that was extracted from a flagged file is derived output and can be deleted.

## What extraction does and doesn't do

* PDF → text for each page, plus any ruled tables as CSV. Scanned pages give empty text; `ocr.py` then reads those pages with Tesseract (English and Hindi) into `page_NNN.ocr.txt`. OCR text can contain misreadings: use it to find figures, then check them against the original.
* Excel → one CSV per sheet, every cell as text, with no header guessing or cleaning.
* CSV → re-encoded to UTF-8 only.
* HTML → one CSV per `<table>`.

These are faithful machine-readable copies, not cleaned datasets. Cleaning and standardising (state and district names, LGD codes, units) should be a separate step that reads from `data/processed/`.

## Things to know

* **Dates.** Folder names use the IST date the run started; `provenance.jsonl` records the exact time in both UTC and IST. For manual files, the folder uses the `--obtained-on` date you give, which must be a real `YYYY-MM-DD` date.
* **Rebuilt files look new.** Duplicates are detected by exact bytes (sha256). Some portals rebuild Excel or PDF files on every request, adding a new timestamp inside the file. These are saved as new versions even if the figures haven't changed. That's the safe choice for preserving originals; compare the extracted CSVs if you need to know whether the content changed.
* **Leftover `.part-` files.** These are deleted on any error. If a run is killed (power loss, Ctrl-C at the wrong moment), `verify.py` reports any that remain as `PARTIAL`; they are safe to delete.
* **Messy links.** Portal pages often have hrefs with raw spaces, or two URLs pasted into one href. `collect.py` percent-encodes the first and splits the second into separate links before matching `link_pattern`.
* **Census files come from an API.** censusindia.gov.in is a JavaScript site, but its catalogue (NADA) has a public JSON API. `census_manifest.py` lists Bihar's files through it, keeps the spreadsheets (add `--with-pdf` for the PDF versions), and drops repeats such as the state village file linked from every District Census Handbook.
* **Form downloads.** The Bihar Economic Survey is served only through a POST form on the Finance Department site, which `collect.py` doesn't support; it was fetched by a short script and added with `register_manual.py`, which records how it was obtained.

## Notes for running

* Uses only the Python standard library for downloading, so `collect.py` runs anywhere with Python 3.9+.
* It waits 1.5 s between requests by default (`--delay`) and keeps cookies within a run (`state.bihar.gov.in` redirects in a loop without its session cookie).
* **Incomplete certificate chains.** `state.bihar.gov.in` leaves the Sectigo DV R36 intermediate out of its chain. `collect.py` loads `config/extra-intermediates.pem` on top of the system store, so it verifies normally; never turn verification off. Add any other missing public intermediate there, with a comment saying where it came from and how it was checked.
* **Sites that still fail** (13 Nov 2026, from outside India):
  * `budget.bihar.gov.in` and `rchiips.org` (NFHS) have expired certificates. Only the sites can fix that; download by hand meanwhile.
  * `dse.bihar.gov.in` alternates between 502 errors, resets and a certificate for the wrong name; `saiindia.gov.in` resets the connection. Try again, ideally from an Indian connection.
  * CAG's Monthly Civil Accounts and audit-report pages returned 504 and 500; try again later.
* Keep `data/` out of git if it gets large, but always keep `provenance.jsonl` with the files it describes.
