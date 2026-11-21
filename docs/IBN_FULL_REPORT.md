# India By Numbers: Bihar Data, Tasks 1 to 4

Consolidated report · 22 November 2026 · `ayushjha4wd/ibn-collector`

## 0. Summary

India By Numbers (IBN) is building a picture of Bihar from official public data. The work so far has four tasks:

| Task | Aim | Result | Detailed report |
|---|---|---|---|
| **1–2. Source catalogue** | List the official sources for Bihar's public finance and demographics and assess each one | A catalogue of **41 Bihar sources**: 22 public finance (BR-PF), 16 demographic (BR-DM) and 3 cross-cutting (BR-XC) | Not in this repository (see section 1) |
| **3. Data collection** | Download the data behind the catalogued sources, keeping originals, dates and references | **721 verified data files (1.23 GB) covering 12 of the 41 sources**, plus the national CRS 2023 report; all 41 in the collector's manifest; every file extracted to CSV or text | [REPORT.md](../REPORT.md), [Task 3 PDF](IBN_Task3_Submission_Report.pdf) |
| **4. eGramSwaraj exploration** | Explore eGramSwaraj (catalogue source BR-PF-19) in depth for Bihar Panchayat profiles and public finance | **13,160 eGramSwaraj and 6,459 AuditOnline originals**. Panchayat receipts and payments down to **every Gram Panchayat**, elected representatives by gender, and a full report inventory, coverage matrices and gaps. Clean tables built afterwards | [TASK4_REPORT.md](task4/TASK4_REPORT.md), [PDF](task4/TASK4_REPORT.pdf), [Excel](task4/TASK4_SUMMARY.xlsx) |

**Across all four tasks:**

- Original files are kept byte for byte, read-only, never edited.
- Every file is logged in `data/provenance.jsonl` with its URL, retrieval time and sha256.
- Re-checking the hashes found no altered original:
  - Task 3: 1,112 of 1,112 intact.
  - Task 4: 13,124 eGramSwaraj and 6,459 AuditOnline originals, 0 mismatches.
- No CAPTCHA, login or bot check was bypassed. Such sources are recorded as gaps, with what was tried.

**What IBN now has for Bihar:**

| Area | Collected and verified |
|---|---|
| State finances | Finance and Appropriation Accounts (FY 2021-22 to 2024-25); Monthly Key Indicators (Apr 2021 – Jun 2026); GST statistics (FY 2017-18 to 2026-27); Economic Survey 2024-25; Green Budget 2024-25; 5th and 6th State Finance Commission reports; 15th and 16th Finance Commission reports and datasets; PRS budget analysis |
| Panchayat finances | eGramSwaraj receipts and payments for Zilla Parishads, Block Panchayats and Gram Panchayats: state totals by year from 2020-21, every district and block, **every GP for 2020-21 and 2024-25**, month-wise cash flow, scheme-wise totals (OWN, XV FC, FFC), and accounting status |
| Panchayat governance | Elected representatives by gender (ZP, BP, GP); GPDP upload status; audits and audit observations for every GP (AuditOnline, 2019-20 to 2025-26) |
| Demographics | 500 Census 2011 tables; District Census Handbooks for all 38 districts (2,344 district tables, village and town files); SRS reports 2011–2024; population projections 2011–2036; CRS 2023 |

**Main gaps:**

- Bihar budget documents and FRBM disclosures (expired certificate).
- RBI state publications (bot check).
- CAG audit reports and the statistics directorate's reports (server errors, or the site refuses non-Indian connections).
- NFHS (expired certificate).
- Sources that need a login, form or CAPTCHA: CFMS, PLFS, HCES, HMIS, Mission Antyodaya, SECC, LGD, and eGramSwaraj's cash book, ledger, vendor and progress reports.
- Panchayat-level population, which is not in any open eGramSwaraj report.

## 1. Tasks 1 and 2: the Bihar source catalogue

**What the evidence in this repository shows.** The catalogue itself is not in this repository: `IBN_Bihar_Data_Source_Catalogue_v2.xlsx` and the Task 1–2 reports are referred to but not stored. This section therefore relies only on what the repository records about them:

- Tasks 1 and 2 identified the official sources for Bihar and assessed how complete each one is (Task 3 report: "Tasks 1 and 2 listed the 41 Bihar sources and assessed how complete each one is").
- The catalogue has **41 Bihar sources**, with IDs in three groups. Its IDs are used unchanged in the collector's manifest (`config/manifest.csv`) and in every provenance record.
- A separate India-wide catalogue exists. Task 3 used one entry from it (DM-11, the national CRS 2023 report).

| Group | Prefix | Sources | Examples |
|---|---|---|---|
| Public finance | BR-PF | 22 (BR-PF-01 … BR-PF-22) | State budget, Finance Accounts, Monthly Key Indicators, CAG audits, SFC reports, GST, Finance Commission, eGramSwaraj |
| Demographics | BR-DM | 16 (BR-DM-01 … BR-DM-16) | Caste survey, Census 2011, District Census Handbooks, SRS, CRS, NFHS, PLFS, HCES, Mission Antyodaya, HMIS |
| Cross-cutting | BR-XC | 3 (BR-XC-01 … BR-XC-03) | Bihar DataLab, Bihar e-Statistics portal, Local Government Directory |

The full list of 41 sources, with the outcome of Tasks 3 and 4 for each, is in section 4. The catalogue's own assessments (completeness, granularity, update frequency and so on) are not reproduced, because they are not in the repository. Add `IBN_Bihar_Data_Source_Catalogue_v2.xlsx` to `docs/` to complete this section.

## 2. Task 3: data collection

**Brief.** Download the datasets catalogued in Tasks 1 and 2, and meet five conditions:

1. preserve the original files;
2. record download dates;
3. keep source references;
4. never edit originals by hand;
5. use repeatable scripts wherever practical.

**Result (13 November 2026).** All five conditions are met by the scripts.

| Measure | Value |
|---|---|
| Catalogue sources in the manifest | 41 of 41 (each automated, or marked manual with the reason) |
| Sources with data | 12 of 41, plus the national CRS 2023 report |
| Verified data files | 721 (1.23 GB): 117 PDFs (14,905 pages), 566 Excel workbooks (1,144 sheets), 38 District Census Handbook archives (2,344 district tables) |
| Extraction | 721 of 721 files extracted to text or CSV; 14,451 ruled tables found in PDFs; 3,488 Excel sheets to CSV; 2,446 scanned pages read by OCR (2,165 with text) |
| Integrity | 1,112 saved originals, all matching their recorded hashes |
| Sources not collected | 29: 11 blocked by the website, 14 need a person (login, form, CAPTCHA or on-screen report), 4 have nothing to collect yet |
| Tests | 52 offline tests, all passing |

**What was collected:**

- **Accountant General accounts: 82 files.** Monthly Key Indicators for every month from April 2021 to June 2026, and Finance and Appropriation Accounts for FY 2021-22 to FY 2024-25.
- **Budget and planning.** Economic Survey 2024-25 (English and Hindi, 1,272 pages, including district GDP), the Green Budget 2024-25, and the 5th and 6th SFC reports.
- **Finance Commissions.** The 16th FC report with its 13 all-state Excel datasets, and the 15th FC reports.
- **GST.** State-wise collections, returns and IGST settlement for FY 2017-18 to FY 2026-27.
- **Census 2011.** 500 Bihar tables and the District Census Handbooks for all 38 districts.
- **Other demographics.** SRS reports 2011–2024, population projections 2011–2036 and CRS 2023.

**Example finding.** The June 2026 Monthly Key Indicators show where Bihar stood after the first quarter of FY 2026-27:

- 98% of budgeted net borrowing had already been used.
- Under 3% of budgeted revenue receipts had come in.
- Capital spending was running at a little over half last year's pace.

**Problems solved:**

- RBI bot-check pages saved in place of 368 files were detected and flagged, and RBI is now a manual download.
- An incomplete certificate chain on `state.bihar.gov.in` was handled without turning off verification.
- Census files were listed through the census catalogue's public API.
- A form-only download was registered with its origin.
- Out-of-memory and restart interruptions were handled by resumable runs.

Full details: [REPORT.md](../REPORT.md).

## 3. Task 4: eGramSwaraj exploration

**Brief.** Explore in depth the official eGramSwaraj portal (catalogue source BR-PF-19) and its Bihar interfaces. The aim is to establish what is available on:

- demographics and Panchayat profiles;
- public finance: receipts, grants, balances, expenditure, vouchers, vendors, GPDP, and physical and financial progress.

Deliverables A–I and answers to set questions were required, under these rules:

- eGramSwaraj only, with no external datasets;
- no bypassing of CAPTCHA or access controls;
- preserve originals and their parameters;
- do not clean or combine data;
- no personal data;
- empty is not zero;
- keep plans, allocations, receipts, payments and expenditure distinct.

**Access.** eGramSwaraj answers only connections from India, so it was collected from a laptop in India (20–22 Nov 2026). AuditOnline, the suite's audit module, was collected from the cloud.

**Results:**

| Question | Finding |
|---|---|
| Is Panchayat finance public? | **Yes, without CAPTCHA**, as dated static reports. Receipts and Payments are given for each tier and for every district, block and **Gram Panchayat**, with month-wise cash flow and scheme-wise totals. Bihar has data from 2020-21; earlier rows are "0", meaning not recorded in eGramSwaraj, not zero spending |
| Do the numbers hold together? | The 2024-25 GP rows add up exactly to the district statement's totals: Rs 4,221.843 crore receipts and Rs 2,872.269 crore payments |
| Elected representatives | GP tier 140,248 (77,292 female, 62,931 male, 25 other); Block Panchayat tier 11,666 (6,760 female); Zilla Parishad tier 1,103 (647 female) |
| Population at Panchayat level | **Not in any open report.** The profile pages that may hold it are behind a CAPTCHA |
| Detailed books (cash book, ledger, vendors), physical progress, GPDP action plans | **Behind a CAPTCHA** on 39 of the 59 report forms that offer Bihar. Not bypassed; recorded as gaps |
| Audit | AuditOnline covers every GP: audit plans, reports and observations for 2019-20 to 2025-26 (2024-25: 8,053 GPs, 81,208 observations). There are no rupee amounts |
| Caution | Each report is a snapshot with its own printed generation date, so totals for the same year differ between reports generated on different days |

**Clean data (a separate step after Task 4, as requested).** `data/clean/egs/` holds 14 CSVs and a workbook:

- every row names its source file;
- empty values stay empty;
- amounts are parsed and keep their as-served text beside them;
- GP codes are matched by exact name within the same block (16,338 of 16,440 rows; the rest are left blank).

Full details: [docs/task4/TASK4_REPORT.md](task4/TASK4_REPORT.md).

## 4. Every catalogue source through Tasks 3 and 4

Status as recorded in the Task 3 report (13 Nov 2026), updated where Task 4 changed it. "Collected" means verified files are in `data/raw/`.

| ID | Dataset | Task 3 status | Task 4 | Notes |
|---|---|---|---|---|
| BR-PF-01 | Bihar State Budget | Blocked | — | Expired certificate |
| BR-PF-02 | Bihar thematic budgets — Outcome, Gender, Green and Child Budget | Collected (1 file) | — | Green Budget 2024-25 only |
| BR-PF-03 | Bihar FRBM disclosures | Blocked | — | Expired certificate |
| BR-PF-04 | Bihar Economic Survey | Collected (2) | — | 2024-25, English and Hindi |
| BR-PF-05 | Finance Accounts, Appropriation Accounts, Accounts at a Glance | Collected (13) | — | FY 2021-22 to 2024-25 |
| BR-PF-06 | Bihar Monthly Key Indicators | Partly collected (69) | — | Monthly Civil Accounts returned 504 |
| BR-PF-07 | CAG State Finances Audit Report — Bihar | Blocked | — | Site refuses connections from outside India |
| BR-PF-08 | CAG Local Bodies audit reports — Bihar | Blocked | — | CAG page returned HTTP 500 |
| BR-PF-09 | Bihar State Finance Commission reports | Collected (3) | — | |
| BR-PF-10 | Comprehensive Financial Management System | Manual | — | Login required |
| BR-PF-11 | Commercial Taxes Department — revenue data | Manual | — | No data files published; use GST (BR-PF-12) |
| BR-PF-12 | GST statistics — Bihar | Collected (53) | — | |
| BR-PF-13 | RBI State Finances: A Study of Budgets | Blocked | — | Bot check |
| BR-PF-14 | RBI Handbook of Statistics on Indian States | Blocked | — | Bot check |
| BR-PF-15 | Finance Commission — devolution and grants | Collected (20) | — | 15th and 16th FC |
| BR-PF-16 | PRS Bihar Budget Analysis | Collected (2) | — | |
| BR-PF-17 | Open Budgets India | Manual | — | HTTP 520 (bot protection) |
| BR-PF-18 | CityFinance — urban local bodies | Manual | — | 16th FC ULB dump contains CityFinance data |
| **BR-PF-19** | **eGramSwaraj — panchayat accounts and plans** | Manual | **Collected (13,160 files + AuditOnline 6,459)** | Explored in full in Task 4; CAPTCHA reports remain gaps |
| BR-PF-20 | Panchayati Raj Department, Bihar | Manual | — | Orders and notices, not datasets |
| BR-PF-21 | Urban Development and Housing Department | Manual | — | Orders and notices only |
| BR-PF-22 | State and District Domestic Product | Blocked | — | Statistics directorate unreliable; district GDP is in BR-PF-04 |
| BR-DM-01 | Bihar Caste-Based Survey 2022-23 | Manual | — | No stable official URL |
| BR-DM-02 | Census 2011 — Bihar tables | Collected (500) | — | |
| BR-DM-03 | District Census Handbooks — Bihar | Collected (40) | — | All 38 districts |
| BR-DM-04 | Census of India 2027 — Bihar | Manual | — | Not yet published |
| BR-DM-05 | Sample Registration System | Collected (16) | — | 2011–2024 |
| BR-DM-06 | Bihar Annual Vital Statistics Report | Blocked | — | Statistics directorate unreliable |
| BR-DM-07 | Monthly district CRS returns | Blocked | — | Statistics directorate unreliable |
| BR-DM-08 | Bihar Statistical Handbook | Blocked | — | Statistics directorate unreliable |
| BR-DM-09 | National Family Health Survey — Bihar | Blocked | — | Expired certificate |
| BR-DM-10 | Periodic Labour Force Survey | Manual | — | JavaScript site; microdata needs registration |
| BR-DM-11 | Household Consumption Expenditure Survey | Manual | — | JavaScript site; microdata needs registration |
| BR-DM-12 | Mission Antyodaya | Manual | Out of scope in Task 4 | Download form asks for name and purpose |
| BR-DM-13 | SECC 2011 — Bihar | Manual | — | View-only portal |
| BR-DM-14 | Electoral rolls — SIR 2025 | Manual | — | Published statistics only, not name-level rolls |
| BR-DM-15 | HMIS — districts and facilities | Manual | — | On-screen reports |
| BR-DM-16 | Population projections — Bihar | Collected (1) | — | |
| BR-XC-01 | Bihar DataLab | Manual | — | JavaScript app |
| BR-XC-02 | Bihar e-Statistics portal | Manual | — | Redirects to login |
| BR-XC-03 | Local Government Directory — Bihar units | Manual | Codes used | eGramSwaraj and AuditOnline carry the same GP (LGD) codes, used to key the clean Panchayat tables; the LGD download itself still needs a CAPTCHA |

**Count after Task 4.** 13 of the 41 catalogue sources now have verified data (12 from Task 3, plus BR-PF-19 from Task 4). Of the rest, 11 are blocked by their websites, 13 need a person, and 4 have nothing to collect yet.

## 5. How the work was done

| Principle | How it is kept |
|---|---|
| Preserve originals | Bytes saved exactly as served, made read-only, never overwritten. A revised file is kept beside the old one. `.gitattributes` stops Git from changing line endings |
| Record dates and references | `data/provenance.jsonl`: catalogue source ID, URL, parameters or form selections, report name, level, financial year, HTTP status, size, sha256, and time in UTC and IST |
| No manual editing | Extraction, summaries and clean tables are written elsewhere (`data/processed/`, `data/analysis/`, `data/clean/`) after re-checking each original's hash |
| Repeatable | One command per stage; runs resume and skip finished work. The eGramSwaraj pass runs from India with one command (`scripts/run_pass2.py`) |
| Honest gaps | Blocked, CAPTCHA, login and on-screen sources are recorded with the reason and what was tried. Empty values are never read as zero |
| Privacy | Name-level records are not collected. Auditor contacts and officials' names seen on AuditOnline were left out |

## 6. Gaps and next steps

1. **From a computer in India, run `python scripts/collect.py`.** This retries:
   - the statistics directorate (BR-PF-22, BR-DM-06, BR-DM-07, BR-DM-08);
   - CAG (BR-PF-06, BR-PF-07, BR-PF-08).
2. **Download by hand and register with `register_manual.py`:**
   - RBI publications (BR-PF-13, BR-PF-14);
   - budget and FRBM documents and NFHS, while their certificates are expired (BR-PF-01, BR-PF-03, BR-DM-09);
   - the caste survey report;
   - the login, form and on-screen sources (CFMS, PLFS, HCES, HMIS, SECC, DataLab, e-Statistics, LGD).
3. **eGramSwaraj follow-ups.** None of these needs a CAPTCHA:
   - GP-level pages for the other years: `egs_bihar.py --deep-years all`;
   - the XV FC tied-grant report, with a Report Type chosen;
   - district-level elected-representative counts.

   CAPTCHA reports (cash book, ledger, vendor, physical progress, GPDP plans) can only be viewed one at a time by a person (`egs_bihar.py --steps manual`).
4. **Add the Task 1–2 catalogue** (`IBN_Bihar_Data_Source_Catalogue_v2.xlsx`) to the repository, so that section 1 can show its assessments.
5. **Next stage: cleaning and standardising across sources.** Make district names, LGD codes and units consistent across sources, reading from `data/processed/` and `data/clean/`. Task 4's clean Panchayat tables are the first example.

## 7. Where everything is

| What | Where |
|---|---|
| This report | `docs/IBN_FULL_REPORT.md`, `.pdf`; Excel: `docs/IBN_FULL_REPORT.xlsx` |
| Task 3 report | `REPORT.md`; `docs/IBN_Task3_Submission_Report.pdf`; Data Book and Handbook PDFs in `docs/` |
| Task 4 report | `docs/task4/TASK4_REPORT.md`, `.pdf`; `docs/task4/TASK4_SUMMARY.xlsx` |
| Original files | `data/raw/<source ID>/<date>/` |
| Download log | `data/provenance.jsonl` |
| Extracted text and tables (Task 3) | `data/processed/` |
| File descriptions | `data/analysis/` (Task 3: `FILES.md`, `files.csv`; Task 4: `data/analysis/egs/`) |
| Clean Panchayat tables (Task 4) | `data/clean/egs/` |
| Scripts and tests | `scripts/`, `tests/`; commands in `README.md` |
