# IBN Collector: Task 3 Data Collection Report

13 November 2026 · `ayushjha4wd/ibn-collector`

Task 3 asked for the datasets catalogued in Tasks 1 and 2 to be downloaded, with original files kept, download dates recorded, source references kept, originals never edited by hand, and repeatable scripts wherever practical. All five requirements are met by the scripts, and the collector now covers **all 41 sources in the Bihar catalogue**.

It holds **721 verified data files (1.23 GB) from 16 collection entries, covering 12 of the 41 catalogue sources**, plus the national CRS 2023 report. That is 117 PDFs (14,905 pages), 566 Excel workbooks (1,144 sheets) and 38 District Census Handbook archives (2,344 district tables). Every file is traceable to its URL, download time and sha256 hash, every one has been extracted to CSV or text, and all 1,112 saved originals still match their recorded hashes. Of the other 29 catalogue sources, 11 are blocked by the websites themselves, 14 need a person (a login, form, CAPTCHA or on-screen-only report) and 4 have nothing to collect.

- Every file, with its period, pages, tables and link: [data/analysis/FILES.md](data/analysis/FILES.md)
- Machine-readable: [data/analysis/files.csv](data/analysis/files.csv), [data/analysis/summary.json](data/analysis/summary.json), [data/inventory.csv](data/inventory.csv)

## 1. Done and still to do

| | Done | Still to do |
| --- | --- | --- |
| Toolkit | Collect, extract, OCR, verify, flag, analyse and register-by-hand scripts; 52 offline tests, all passing | Nothing required |
| Catalogue coverage | All 41 Bihar sources are in the manifest, each either automated or marked manual with the reason | India-wide catalogue (66 sources) is not yet in a manifest |
| Public finance | State accounts (4 years), Monthly Key Indicators (Apr 2021 – Jun 2026), GST (10 years), Economic Survey 2024-25, Green Budget, all three SFC reports, 15th and 16th Finance Commission, PRS | Budget documents and FRBM disclosures (expired certificate), RBI publications (bot check), CAG audit reports and Monthly Civil Accounts (CAG server errors) |
| Demographics | 500 Census 2011 tables, District Census Handbooks for all 38 districts, SRS reports 2011–2024, population projections, CRS 2023 | Statistics-directorate reports (site unreliable), NFHS (expired certificate), PLFS, HCES, HMIS, Mission Antyodaya, caste survey |
| Extraction | Text and tables from every PDF; every Excel sheet and zipped table to CSV; OCR has read 624 of 2,446 scanned pages so far | Finish OCR: `python scripts/ocr.py` resumes where it stopped |

## 2. Status of every Bihar catalogue source

| ID | Dataset | Status | Data files | MB | Notes |
| --- | --- | --- | ---: | ---: | --- |
| BR-PF-01 | Bihar State Budget | Blocked |  |  | Expired certificate |
| BR-PF-02 | Bihar thematic budgets — Outcome, Gender, Green and Child Budget | Collected | 1 | 12.4 | Green Budget 2024-25 only; outcome, gender and child budgets have no links on the budget portal |
| BR-PF-03 | Disclosures under the Bihar Fiscal Responsibility and Budget Managemen | Blocked |  |  | Expired certificate (same site as BR-PF-01) |
| BR-PF-04 | Bihar Economic Survey | Collected | 2 | 110.5 | Economic Survey 2024-25, English and Hindi; earlier years are on Google Drive |
| BR-PF-05 | Bihar Finance Accounts, Appropriation Accounts and Accounts at a Glanc | Collected | 13 | 88.1 |  |
| BR-PF-06 | Bihar Monthly Key Indicators | Partly collected | 69 | 46.0 | Monthly Key Indicators collected (as BR-PF-05c); Monthly Civil Accounts page returned 504 |
| BR-PF-07 | CAG State Finances Audit Report — Bihar | Blocked |  |  | Site resets connections from outside India |
| BR-PF-08 | CAG Local Bodies audit reports — Bihar | Blocked |  |  | CAG page returned HTTP 500 |
| BR-PF-09 | Bihar State Finance Commission reports | Collected | 3 | 99.0 |  |
| BR-PF-10 | Comprehensive Financial Management System | Manual |  |  | Login required; register any public report with register_manual.py |
| BR-PF-11 | Commercial Taxes Department, Bihar — revenue data | Manual |  |  | Checked Nov 2026: the department site publishes no revenue data files (only a helpline PDF). Use GST statistics (BR-PF-12) and the Monthly Key Indicat |
| BR-PF-12 | GST statistics — Bihar | Collected | 53 | 5.9 |  |
| BR-PF-13 | RBI State Finances: A Study of Budgets — Bihar statements | Blocked |  |  | Bot check (RBI); download in a browser |
| BR-PF-14 | RBI Handbook of Statistics on Indian States — Bihar series | Blocked |  |  | Bot check (RBI); download in a browser |
| BR-PF-15 | Finance Commission — Bihar devolution and grants | Collected | 20 | 249.1 |  |
| BR-PF-16 | PRS Bihar Budget Analysis | Collected | 2 | 1.4 |  |
| BR-PF-17 | Open Budgets India — Bihar budget datasets | Manual |  |  | Site returned HTTP 520 (behind a bot-protection layer) in Nov 2026; download Bihar datasets by hand |
| BR-PF-18 | CityFinance — Bihar urban local bodies | Manual |  |  | JavaScript app with no file links; the 16th FC ULB data dump (BR-PF-15) contains CityFinance data for all states |
| BR-PF-19 | eGramSwaraj — Bihar panchayat accounts and plans | Manual |  |  | On-screen reports; export manually or write a dedicated scraper later |
| BR-PF-20 | Panchayati Raj Department, Bihar | Manual |  |  | Publishes orders and notices, not datasets; /prd returned 404 in Nov 2026 |
| BR-PF-21 | Urban Development and Housing Department, Bihar | Manual |  |  | Checked Nov 2026: orders and notices only, no data files |
| BR-PF-22 | State and District Domestic Product estimates, Bihar | Blocked |  |  | Statistics directorate site unreliable; district GDP is also in the Economic Survey (BR-PF-04) |
| BR-DM-01 | Bihar Caste-Based Survey 2022-23 | Manual |  |  | No stable official URL; register the tabled report PDF manually with its origin |
| BR-DM-02 | Census 2011 — Bihar tables | Collected | 500 | 316.7 |  |
| BR-DM-03 | District Census Handbooks — Bihar | Collected | 40 | 116.1 |  |
| BR-DM-04 | Census of India 2027 — Bihar | Manual |  |  | Not yet published (Nov 2026) |
| BR-DM-05 | Sample Registration System | Collected | 16 | 169.9 |  |
| BR-DM-06 | Bihar Annual Vital Statistics Report | Blocked |  |  | Statistics directorate site unreliable |
| BR-DM-07 | Monthly district CRS returns | Blocked |  |  | Statistics directorate site unreliable |
| BR-DM-08 | Bihar Statistical Handbook | Blocked |  |  | Statistics directorate site unreliable |
| BR-DM-09 | National Family Health Survey — Bihar | Blocked |  |  | Expired certificate (rchiips.org) |
| BR-DM-10 | Periodic Labour Force Survey — Bihar estimates | Manual |  |  | mospi.gov.in is a JavaScript app with no file links; download the PLFS annual report by hand. Microdata needs registration |
| BR-DM-11 | Household Consumption Expenditure Survey — Bihar estimates | Manual |  |  | mospi.gov.in is a JavaScript app; download the HCES report by hand. Microdata needs registration |
| BR-DM-12 | Mission Antyodaya — Bihar villages and gram panchayats | Manual |  |  | Download form asks for name and purpose |
| BR-DM-13 | Socio Economic and Caste Census 2011 — Bihar | Manual |  |  | View-only portal; returned 502 in Nov 2026 |
| BR-DM-14 | Bihar electoral rolls — Special Intensive Revision 2025 | Manual |  |  | Use published statistics only; not name-level rolls |
| BR-DM-15 | HMIS — Bihar districts and facilities | Manual |  |  | Reports are generated on screen; connection reset in Nov 2026. Download by hand |
| BR-DM-16 | Population projections — Bihar | Collected | 1 | 11.5 |  |
| BR-XC-01 | Bihar DataLab | Manual |  |  | JavaScript app; login and API described as planned (Nov 2026) |
| BR-XC-02 | Bihar e-Statistics portal | Manual |  |  | Redirects to a login page (Nov 2026) |
| BR-XC-03 | Local Government Directory — Bihar units | Manual |  |  | Download form with captcha; data.gov.in API is an alternative |

The manifest also has rows that split a catalogue source into separate collections: BR-PF-05a (Accounts at a Glance), BR-PF-05b (Appropriation Accounts), BR-PF-05c (Monthly Key Indicators, catalogue BR-PF-06) and BR-PF-15a (15th Finance Commission). DM-11 is the national CRS 2023 report from the India-wide catalogue.

## 3. What was collected

**State accounts from the Accountant General (A&E), Bihar: 82 files, 134 MB.**
- Monthly Key Indicators: every month from April 2021 to June 2026 (63 months) plus 6 preliminary and supplementary March editions.
- Finance Accounts Vol I and II and Appropriation Accounts, FY 2021-22 to FY 2024-25; Accounts at a Glance 2024-25.

**State budget and planning: 6 files, 222 MB.**
- Bihar Economic Survey 2024-25 in English and Hindi (1,272 pages; includes district GDP).
- Green Budget 2024-25.
- 5th State Finance Commission report Vol I and 6th SFC report Parts 1–3.

**Finance Commissions: 20 files, 249 MB.** The 16th FC report (2026-31) with annexures, its evaluation of Bihar's state finances, and its 13 all-state Excel datasets (horizontal devolution, key fiscal indicators, state finance accounts, salaries, subsidies, state enterprises, urban local bodies). The 15th FC's 2020-21 report and Volumes I, II and IV (The States). Volume IV is 116 MB, over GitHub's 100 MB file limit, so it is kept out of git; `config/not_in_git.txt` gives its URL and hash.

**GST statistics: 53 files, all states.** State-wise collections, GSTR-1 and GSTR-3B returns and IGST settlement for FY 2017-18 to FY 2026-27, e-way bill data from FY 2018-19, plus registrations and summary reports.

**Census 2011: 540 files, 433 MB.**
- 500 tables whose title names Bihar: Primary Census Abstract (state and district), houselisting and household amenities, scheduled castes and tribes, workers, migration, religion and mother tongue.
- District Census Handbooks for all 38 districts: each district's tables (about 60 per district, 2,344 in all) and the state-wide village and town data files (the village file is 82 MB, with every village in Bihar).

**Other demographics.** SRS Statistical Reports 2011–2024 (state birth, death, fertility and mortality rates; 4,560 pages), population projections 2011–2036 and the national CRS 2023 report.

## 4. Extraction analysis

| Measure | Value |
| --- | ---: |
| Data files extracted | 721 of 721 |
| PDF pages extracted to text | 14,905 |
| Ruled tables found in PDFs and saved as CSV | 14,451 |
| Excel sheets saved as CSV (including inside zips) | 3,488 |
| Scanned PDF pages with no text layer | 2,446 |
| Scanned pages read by OCR (13 Nov, still running) | 624 |

Excel sheets: 1,144 from workbooks plus 2,344 from the handbook archives.

**Scanned pages.** 2,446 pages have no text layer. Most are in the English Economic Survey 2024-25, which is an image-only PDF, the SRS reports for 2015–2019 (about 110–120 scanned pages each) and the 6th SFC report Part 3. `ocr.py` reads them with Tesseract in English and Hindi and saves the text beside the normal output; OCR text can contain misreadings, so use it to find figures and check them against the original.

**Bihar coverage.** Every file from Bihar's own sources (state accounts, budget, SFC) mentions Bihar, except the English Economic Survey, which has no text layer until OCR reads it. National datasets were kept whole: GST, SRS and Finance Commission files cover all states. 119 of the 500 census files never name Bihar because they are district Primary Census Abstract files identified by census code (for example `PCA1002` is a Bihar district). Filter Bihar out at the cleaning stage.

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

## 6. Problems found and how they were fixed

| Problem | Fix |
| --- | --- |
| RBI served a bot-check page instead of 368 spreadsheets and PDFs | `collect.py` checks every download's content and refuses bot-check or HTML pages served for a file link. The 368 files are flagged invalid, kept for the record and excluded from extraction. RBI is now a manual download |
| 8 unrelated PDFs came from an over-broad CAG link pattern | Flagged invalid; the manifest now points at CAG's three report pages |
| `state.bihar.gov.in` leaves an intermediate certificate out of its chain | `config/extra-intermediates.pem` holds the public Sectigo certificate, checked against a trusted root. Verification stays on |
| The same site redirects in a loop without its session cookie | `collect.py` keeps cookies within a run |
| The Economic Survey is served only through a form | Fetched by a short script and added with `register_manual.py`, which records how it was obtained |
| censusindia.gov.in is a JavaScript site | `census_manifest.py` lists Bihar's files through the census catalogue's public API and drops repeats, such as the 82 MB village file linked from every handbook page |
| District Census Handbooks come as zip archives | `extract.py` reads spreadsheets inside a zip in memory; member names cannot write outside the output folder |
| Two handbook tables per district (T42, T43) crashed the Excel reader | `extract.py` skips their broken named-range definitions, which hold no data, and reads the cells |
| Extracting a 116 MB PDF ran out of memory | `extract.py` releases each page after reading it |
| The cloud machine restarted mid-download | `collect.py --resume` continued without downloading again; `verify.py` found all originals intact |
| One original is over GitHub's 100 MB file limit | Kept out of git and listed in `config/not_in_git.txt`; `verify.py` reports it as NOT IN GIT |

## 7. Still to do

1. **From a machine in India**, run `python scripts/collect.py`. That retries the statistics directorate (BR-PF-22, BR-DM-06, BR-DM-07, BR-DM-08) and the CAG audit report (BR-PF-07), and the CAG pages that returned server errors (BR-PF-06, BR-PF-08).
2. **Download by hand and register** with `register_manual.py`:
   - RBI publications (BR-PF-13, BR-PF-14).
   - Bihar budget documents and FRBM disclosures (BR-PF-01, BR-PF-03) and NFHS (BR-DM-09) while their certificates are expired.
   - Login, form or on-screen sources: CFMS, eGramSwaraj, Open Budgets India, PLFS, HCES, HMIS, Mission Antyodaya, electoral roll statistics, SECC, LGD, DataLab, e-Statistics.
   - The caste survey report, which has no stable official URL.
3. **India-wide catalogue.** Add the 66 India-wide sources to a manifest the same way.
4. **Next stage (cleaning).** The extracted CSVs are faithful copies, not cleaned data. Standardising state and district names, LGD codes and units belongs in a separate step that reads from `data/processed/`.

## 8. Task 3 requirements

| Requirement | How it is met |
| --- | --- |
| Preserve original files | Files are saved byte for byte and made read-only. Nothing is overwritten: a revised file is kept alongside the old one. Cut-off downloads and bot-check pages are rejected. Bad files are flagged, never deleted |
| Record download dates | Every attempt is logged with the time in UTC and IST, plus the server's Last-Modified and ETag headers where sent. 10 collection runs are recorded in `data/provenance.jsonl` |
| Maintain source references | Each record holds the catalogue source ID, requested and final URL, linking page, link text (for census files, the table name), size and sha256. `inventory.csv` and `FILES.md` list them per file |
| Avoid manually modifying originals | Extraction and OCR write only to `data/processed/`, after re-checking each original's hash. `verify.py` found all 1,112 originals intact |
| Repeatable extraction scripts | One command per stage; re-runs skip unchanged files and finished work, and `--resume` continues an interrupted download |

## 9. Reproducing this

Install Python 3.9 or later, `pip install -r requirements.txt`, and for OCR `apt-get install tesseract-ocr tesseract-ocr-hin poppler-utils`. Then:

```bash
bash tests/run_test.sh
python scripts/collect.py
python scripts/census_manifest.py
python scripts/census_manifest.py --groups srs --out config/manifest_srs.csv
python scripts/collect.py --manifest config/manifest_census.csv
python scripts/collect.py --manifest config/manifest_srs.csv
python scripts/flag.py --auto --apply
python scripts/extract.py
python scripts/ocr.py
python scripts/verify.py
python scripts/analyse.py
```

`analyse.py` regenerates every number in sections 2–4 from the logs and extracted files.
