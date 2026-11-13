# IBN Collector: Final Task 3 Data Collection Report

13 November 2026 · Final run `2026-11-13T083340Z` (14:03 IST)

The IBN collector downloads India By Numbers source datasets, keeps the original files untouched and records where and when each one came from. After running every script end to end, it holds **140 verified data files (236.8 MB) from 9 of the 26 Bihar catalogue sources**: 89 PDFs with 6,361 pages and 51 Excel workbooks with 95 sheets. Every file is traceable to its URL, download time and sha256 hash, and every one has been extracted to machine-readable CSV or text. The other 17 sources are blocked by the portals (10) or need a person to download them (7).

- Per-file catalogue: [data/analysis/FILES.md](data/analysis/FILES.md) (every file, its period, pages, tables and links)
- Machine-readable: [data/analysis/files.csv](data/analysis/files.csv), [data/analysis/summary.json](data/analysis/summary.json), [data/inventory.csv](data/inventory.csv)

## 1. How the final run was done

All scripts were run in order on 13 November 2026, against the live portals for the collection step and offline for everything else.

| Step | Command | Result |
| --- | --- | --- |
| 1. Offline tests | `bash tests/run_test.sh` | 45 of 45 checks passed ([log](final_tests.log)) |
| 2. Collect | `python scripts/collect.py` | 26 sources tried: 144 files unchanged since the earlier runs, 3 new, 10 errors, 9 manual sources skipped ([log](final_collect.log)) |
| 3. Check for bad files | `python scripts/flag.py --auto` | 0 new bad files (the 376 found earlier stay flagged) |
| 4. Extract | `python scripts/extract.py` | 3 new files extracted, 148 already done, 0 errors ([log](final_extract.log)) |
| 5. Verify | `python scripts/verify.py` | 527 originals checked, all intact; 151 valid, 376 flagged ([log](final_verify.log)) |
| 6. Analyse | `python scripts/analyse.py` | Wrote `files.csv`, `summary.json` and `FILES.md` in `data/analysis/` |

## 2. Results by source

| Source | Dataset | Status | Data files | Size (MB) | Period covered |
| --- | --- | --- | ---: | ---: | --- |
| BR-PF-05c | Bihar Monthly Key Indicators (AG Bihar) | Collected | 69 | 46.0 | Apr 2021 – Jun 2026 |
| BR-PF-12 | GST statistics, all states | Collected | 53 | 5.9 | FY 2017-18 – FY 2026-27 |
| BR-PF-05 | Bihar Finance Accounts Vol I & II (AG Bihar) | Collected | 8 | 37.2 | FY 2021-22 – FY 2024-25 |
| BR-PF-05b | Bihar Appropriation Accounts (AG Bihar) | Collected | 4 | 33.7 | FY 2021-22 – FY 2024-25 |
| BR-PF-16 | PRS Bihar Budget Analysis 2026-27 | Collected | 2 | 1.4 | FY 2026-27 |
| BR-PF-09 | Bihar State Finance Commission reports | Partly collected (1 of 3 reports) | 1 | 79.3 | 6th SFC, Part 3 |
| BR-PF-05a | Bihar Accounts at a Glance 2024-25 | Collected | 1 | 17.3 | FY 2024-25 |
| BR-DM-16 | Population Projections 2011-2036 | Collected | 1 | 11.5 | 2011–2036 (published 2019) |
| DM-11 | Vital Statistics of India, CRS 2023 | Collected | 1 | 4.5 | 2023 |
| BR-PF-13 | RBI State Finances: A Study of Budgets | Blocked (bot check); now manual | 0 | | |
| BR-PF-14 | RBI Handbook of Statistics on Indian States | Blocked (bot check); now manual | 0 | | |
| BR-PF-01 | Bihar State Budget documents | Blocked (expired certificate) | 0 | | |
| BR-PF-02 | Bihar Green Budget 2024-25 | Blocked (certificate chain) | 0 | | |
| BR-PF-04 | Bihar Economic Survey | Blocked (certificate chain) | 0 | | |
| BR-PF-22 | Bihar District Domestic Product 2011-12 | Blocked (certificate chain) | 0 | | |
| BR-DM-06 | Bihar Annual Vital Statistics Reports | Blocked (certificate chain) | 0 | | |
| BR-DM-09 | NFHS Bihar fact sheets | Blocked (certificate chain) | 0 | | |
| BR-PF-07 | CAG State Finances Audit Report 2026 | Blocked (connection reset) | 0 | | |
| BR-DM-08 | Bihar Statistical Handbook 2020 | Blocked (502 from site) | 0 | | |
| BR-PF-10 | Bihar CFMS treasury system | Manual (login) | 0 | | |
| BR-PF-19 | eGramSwaraj panchayat reports | Manual (on-screen only) | 0 | | |
| BR-DM-01 | Bihar Caste-Based Survey 2022-23 | Manual (no stable URL) | 0 | | |
| BR-DM-02 | Census 2011 tables, Bihar | Manual (JavaScript site) | 0 | | |
| BR-DM-12 | Mission Antyodaya, Bihar | Manual (form) | 0 | | |
| BR-DM-14 | Bihar electoral roll statistics | Manual (published stats only) | 0 | | |
| BR-XC-03 | Local Government Directory, Bihar | Manual (CAPTCHA) | 0 | | |

Sizes count data files only; the 11 saved portal pages they were linked from are kept as well but not counted.

## 3. What was collected, source by source

**State accounts from the Accountant General (A&E), Bihar: 82 files, 134 MB.** This is the core fiscal dataset.
- *Monthly Key Indicators (BR-PF-05c):* a complete monthly series, all 63 months from April 2021 to June 2026, plus 6 preliminary and supplementary March year-end editions. Each is about 18 pages of receipts, expenditure and deficit figures against the budget estimate.
- *Finance Accounts (BR-PF-05):* Volumes I and II for four years, FY 2021-22 to FY 2024-25. Volume II runs to 474–535 pages per year of detailed statements.
- *Appropriation Accounts (BR-PF-05b):* the same four years, grant by grant.
- *Accounts at a Glance 2024-25 (BR-PF-05a):* the 53-page summary of the year.

**GST statistics (BR-PF-12): 53 files covering all states, Bihar included.**

| Series | Files | Years |
| --- | ---: | --- |
| State-wise GST collection | 10 | FY 2017-18 – FY 2026-27 |
| GSTR-1 returns filed | 10 | FY 2017-18 – FY 2026-27 |
| GSTR-3B returns filed | 10 | FY 2017-18 – FY 2026-27 |
| IGST settlement to states | 10 | FY 2017-18 – FY 2026-27 |
| E-way bill data | 9 | FY 2018-19 – FY 2026-27 |
| Registrations, gross and net tax collection, 9-year report, pre-GST revenue | 4 | Single files |

52 of the 53 files mention Bihar. The exception, `Gross_Net_Tax_collection.xlsx`, is an all-India total, so Bihar's figures must come from the state-wise files.

**Other sources.**
- *6th State Finance Commission report, Part 3 (BR-PF-09):* 377 pages, newly collected in the final run. Parts 1–2 and the 5th SFC report failed (see section 7).
- *PRS Bihar Budget Analysis 2026-27 (BR-PF-16):* the 9-page analysis plus PRS's 4-page summary of the 16th Finance Commission report.
- *Population Projections 2011–2036 (BR-DM-16):* the Technical Group report, 268 pages, with state tables including Bihar.
- *Vital Statistics of India, CRS 2023 (DM-11):* the national report, 181 pages, with state tables.

## 4. Extraction analysis

All 140 data files were extracted without error. The extracted copies are faithful, not cleaned: headers and units still need standardising in a later step.

| Measure | Value |
| --- | ---: |
| PDF pages extracted to text | 6,361 |
| Ruled tables found in PDFs and saved as CSV | 8,106 |
| Excel sheets saved as CSV | 95 |
| PDF pages with no extractable text | 381 (6%) |
| Data files that mention Bihar | 139 of 140 |

**Scanned pages need OCR.** 270 of the 381 pages with no text are in one file: the 6th SFC report, Part 3, where 72% of pages are scanned images. Its text and tables are mostly missing until OCR is added. Every other file has at most 11 such pages.

## 5. What the data shows: an example

The June 2026 Monthly Key Indicators give Bihar's position after the first quarter of FY 2026-27 (₹ crore, unaudited provisional figures).

| Item | Budget estimate 2026-27 | Actual to June 2026 | % of budget | Same point last year |
| --- | ---: | ---: | ---: | ---: |
| Total receipts | 324,924.93 | 46,157.86 | 14.21% | 18.25% |
| Revenue receipts | 285,277.12 | 7,756.04 | 2.72% | 2.90% |
| of which GST | 84,050.30 | 2,490.13 | 2.96% | 3.59% |
| Borrowings and other liabilities (net) | 39,111.80 | 38,354.02 | 98.06% | 140.85% |
| Revenue expenditure | 284,133.93 | 41,627.56 | 14.65% | 18.43% |
| of which salaries and wages | 74,375.39 | 15,839.82 | 21.30% | 22.94% |
| of which pensions | 35,170.48 | 8,825.10 | 25.09% | 24.40% |
| Capital expenditure | 40,689.93 | 3,843.45 | 9.45% | 16.42% |

By June the state had used 98% of its budgeted net borrowing but received under 3% of its budgeted revenue, partly because no share of union taxes had been recorded yet. Capital spending was running at a little over half last year's pace.

## 6. Collection runs

| Run (IST) | Saved | Unchanged | Errors | What happened |
| --- | ---: | ---: | ---: | --- |
| 13 Nov, 12:18 | 8 | 0 | 76 | First run; most file hosts not yet allowed by the network |
| 13 Nov, 12:31 | 62 | 2 | 1 | GST and CAG file hosts allowed |
| 13 Nov, 12:43 | 454 | 1 | 0 | Fixed CAG and RBI pages; 368 RBI downloads later found to be bot-check pages |
| 13 Nov, 14:03 (final) | 3 | 144 | 10 | Full re-run: nothing had changed upstream; 1 new SFC report and 2 updated portal pages |

The final run shows the collector is repeatable. 144 files came back byte-identical and were logged as `unchanged`, not saved again. No file appears twice in the collection.

## 7. Data quality issues and how they were handled

- **RBI bot check.** RBI's site answered with a JavaScript challenge page instead of the 368 spreadsheets and PDFs it linked to, and an early version saved those pages under `.xlsx` and `.pdf` names. The collector now checks every download's content and refuses HTML or bot-check pages served for a file link. The 368 files are flagged invalid, kept for the record, and excluded from extraction. The two RBI sources are now manual.
- **Off-target files.** 8 unrelated PDFs (citizen charter, pension guidelines and similar) came from an over-broad link pattern on the old CAG page. They are flagged invalid; the manifest now points at the three report pages.
- **Changing portal pages.** The SFC and PRS pages changed between runs, so new snapshots were saved alongside the old ones. That is expected: snapshots record what each page linked to at the time.
- **Partial source.** BR-PF-09 links its reports from two hosts. One report downloaded; one is on `state.bihar.gov.in` (certificate chain) and one reset the connection.

## 8. Not yet collected

| Cause | Sources | Next step |
| --- | --- | --- |
| Incomplete certificate chain | BR-PF-02, BR-PF-04, BR-PF-22, BR-DM-06, BR-DM-09, 1 BR-PF-09 report | Re-run with `--ca-bundle` that includes the missing Sectigo intermediate certificate |
| Connection reset or 502 | BR-PF-07, BR-DM-08, 1 BR-PF-09 report | Re-run from a machine in India |
| Expired certificate | BR-PF-01 | Retry once the site renews it, or download by hand |
| Bot check (RBI) | BR-PF-13, BR-PF-14 | Download in a browser, then `register_manual.py --dir` |
| Login, form, CAPTCHA or JavaScript-only site | BR-PF-10, BR-PF-19, BR-DM-01, BR-DM-02, BR-DM-12, BR-DM-14, BR-XC-03 | Download by hand, then `register_manual.py` |

`dse.bihar.gov.in` refused connections in the first run but answered in the final run with an incomplete certificate chain. So BR-PF-22 and BR-DM-06 now need the CA bundle, not a different location.

## 9. Task 3 requirements

| Requirement | How it is met |
| --- | --- |
| Preserve original files | Files are saved byte for byte and made read-only. Nothing is overwritten: a revised file is kept alongside the old one. Cut-off downloads and bot-check pages are rejected. |
| Record download dates | Every attempt is logged with the time in UTC and IST, plus the server's Last-Modified and ETag headers where sent. Folders are named by the IST date of the run. |
| Maintain source references | Each record holds the catalogue source ID, requested and final URL, linking page, link text, size and sha256. `inventory.csv` and `FILES.md` list them per file. |
| Avoid manually modifying originals | Extraction writes only to `data/processed/` and re-checks each original's hash first. `verify.py` found all 527 originals intact. Bad files are flagged, never edited or deleted. |
| Repeatable extraction scripts | One command per stage. The final re-run saved nothing twice and extracted only the 3 new files. |

## 10. Reproducing this report

Install Python 3.9 or later and `pip install -r requirements.txt`, then run:

```bash
bash tests/run_test.sh
python scripts/collect.py
python scripts/flag.py --auto --apply
python scripts/extract.py
python scripts/verify.py
python scripts/analyse.py
```

`analyse.py` regenerates every number in sections 2–4 from the logs and extracted files. A run from an Indian network with a CA bundle for the Sectigo chain should add most of the blocked sources.
