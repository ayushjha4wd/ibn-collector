# IBN Task 4: Bihar eGramSwaraj Data Exploration

20 November 2026 · `ayushjha4wd/ibn-collector`

## 0. Summary

This report covers the eGramSwaraj suite of the Ministry of Panchayati Raj for Bihar (state code 10). Two kinds of access were used:

* **eGramSwaraj** (`egramswaraj.gov.in`) answers only connections from India. It was explored from a laptop in India with `scripts/egs_explore.py` and `scripts/egs_bihar.py`, and every page, file and API response was saved under `data/raw/EGS-PORTAL/`.
* **AuditOnline** (`auditonline.gov.in`) is the suite's audit module. It answers from anywhere and was collected from the cloud machine with `scripts/egs_auditonline.py` into `data/raw/EGS-AO/`.

Every finding carries one of these labels:

| Label | Meaning |
|---|---|
| **VERIFIED** | Seen in a page, file or response saved in this repository; URL, parameters and time are in `data/provenance.jsonl` |
| **INDIRECT** | Shown by one part of the suite about another (for example AuditOnline code that calls eGramSwaraj) |
| **NOT VERIFIED** | Could not be checked; the obstacle and the attempts are stated |

**Main results**

1. **Bihar Panchayat finance is publicly available on eGramSwaraj without CAPTCHA, as pre-generated static reports** (`FileRedirect.jsp`). It is available for every tier (Zilla Parishad, Panchayat Samiti, Gram Panchayat) and by district for 2020-21 to 2026-27. The reports give "OB + Receipts" and "Payments" in Rs crore, accounting status (masters, opening balance, voucher counts by type, day/month/year book closed), and month-wise voucher counts by block. They link down to individual voucher listings. VERIFIED.
2. **Each static report is a snapshot with its own "Report generated … on" date, and some are years old.** The State & Year Wise Summary for 2024-25 was generated on 23 Oct 2024, in the middle of that year. It shows Bihar GP Receipts Rs 3,861 crore, Payments Rs 1,425 crore and 0 year books closed. The district report for 2024-25, generated on 20 Nov 2026, shows GP "OB + Receipts" Rs 4,221.843 crore and Payments Rs 2,872.269 crore. These are two different figures, not a contradiction, and each must be cited with its generation date. VERIFIED.
3. **The Bihar rows before 2020-21 are "0" / "0.00", not missing.** From 2012-13 to 2018-19 the summary lists 8,386–8,474 Bihar GPs with 0 vouchers and Rs 0.00. That means Bihar did not keep accounts in eGramSwaraj (PRIASoft) then. It does **not** mean Panchayats spent nothing. VERIFIED (values); the interpretation is stated as such.
4. **Most detailed finance and planning reports are behind a CAPTCHA.** Of 59 report forms that offer Bihar, 39 show a CAPTCHA in the form. These include the cash book, day book, ledger, annual receipts, receipt-head and object-head expenditure, Panchayat-wise expenditure, physical and financial progress, GPDP action plans, the vendor report and the beneficiary report. These were **not** bypassed (section 8). VERIFIED (the CAPTCHA); contents NOT VERIFIED.
5. **eGramSwaraj has an unauthenticated JSON interface (`/getMobileData/`) for year-book closure.** It works by state, district, block and GP. For Bihar 2024-25 GP it returns 38 districts, 8,054 GPs and 8,053 with the year book closed. That matches AuditOnline's "Year Book Not Closed" list of exactly 1 GP. VERIFIED.
6. **AuditOnline is fully collectable for Bihar, without login or CAPTCHA, from 2019-20 to 2025-26.** It goes down to each GP for 2020-21 and 2024-25 (8,386 and 8,053 GPs). It records audits and observations, not rupee amounts. VERIFIED.
7. **Population and elected representatives.** eGramSwaraj has profile and elected-representative pages for ZP, BP and GP, built in the browser from JSON. The pass that records those JSON responses (`egs_bihar.py --steps xhr`) had been handed to the laptop but had not reported back when this was written. Their field lists are therefore NOT VERIFIED, and no demographic figure appears in the material saved so far (section 3).

**Status of this report.** The eGramSwaraj material comes from the first laptop pass (crawl, form inventory, static reports, year-book API). The second pass, `scripts/egs_bihar.py`, is written and tested offline. It collects all Bihar static reports for every year, the scheme-wise expenditure archives, district → block → GP drill-downs and the browser-side JSON. When its output is committed, `python scripts/egs_portal_summary.py` regenerates the tables in `data/analysis/egs/`, and the items marked "pass 2" below can be filled in.

## 1. Access attempts

| Host | From the cloud (outside India) | From a laptop in India | Use |
|---|---|---|---|
| `egramswaraj.gov.in` | TLS completes, then no HTTP reply (empty reply / 502), on every attempt | **200, normal** | Explored and collected (`EGS-PORTAL`) |
| `reportingonline.gov.in` | Connection reset | **Timed out** | NOT VERIFIED |
| `accountingonline.gov.in` | 502 | **DNS failure** (`getaddrinfo`) | NOT VERIFIED; host name may be retired |
| `planningonline.gov.in` | 502 | **DNS failure** | NOT VERIFIED; host name may be retired |
| `areaprofiler.gov.in` | 502 | not tried | NOT VERIFIED |
| `auditonline.gov.in` | **200** | — | Collected (`EGS-AO`) |

The cloud session's network policy was changed to allow these hosts first, so the refusals come from the far end. The pattern of AuditOnline working while eGramSwaraj answers only from India matches geographic filtering. Nothing was done to get around it: the eGramSwaraj work was simply run from India. Every report that eGramSwaraj links to on the other three hosts is listed in `data/egs_explore/2026-11-20/links.jsonl`. In practice, the accounting, planning and reporting functions are served from `egramswaraj.gov.in` itself (sections 2–4).

## 2. Portal structure and report inventory (Deliverable A)

### 2.1 How eGramSwaraj publishes reports (VERIFIED)

There are four delivery mechanisms, and they decide what can be collected:

| Mechanism | Example | CAPTCHA | How it was collected |
|---|---|---|---|
| **Static archive files**: pre-generated HTML, served by `FileRedirect.jsp?FD=<folder>&name=<file>.html`; each carries "Report generated through eGramSwaraj (egramswaraj.gov.in) on <date>" | District-wise Receipt and Payment, District Summary, State & Year Wise Summary | **No** | Plain GET; `egs_bihar.py --steps static` |
| **JSON API** `/getMobileData/…` | Year Book Closed by state, district, block and GP | **No** | Plain GET; `egs_bihar.py --steps api` |
| **Browser-built pages** (AngularJS): the page is a template, the table comes from JSON calls defined in `/resources/js/report/**/…-service.js` | GP/BP/ZP profile, elected representatives, XV FC tied expenditure, FFC sector-wise expenditure, GPDP upload status | **No** | A real browser records the JSON (`egs_bihar.py --steps xhr`, Playwright); **pass 2** |
| **Report forms** (`*.do`) with a CAPTCHA image (`captchaImage`, `captchaAnswer`, checked by the `captchaValidator` DWR call before the form is sent) | Cash book, ledger, Panchayat-wise expenditure, physical and financial progress, vendors | **Yes** | Not automated. Optional `egs_bihar.py --steps manual`: a person types each CAPTCHA, and the script only saves the page they get |

The form inventory has 163 forms on 59 report pages that offer Bihar. It is in `data/egs_explore/2026-11-20/forms.jsonl`, with every field and option, and the outcome for each page is in `form_results.jsonl`: 14 filled, 39 CAPTCHA (not attempted), 6 page errors.

### 2.2 Static finance and accounting reports (VERIFIED, no CAPTCHA)

| Report (title as printed) | URL pattern | Levels | Years found | Content |
|---|---|---|---|---|
| State & Year Wise Summary Report | `FileRedirect.jsp?FD=priasoftOverview&name=statewiseClosureReport{FY}.html` | All states, one row each; Bihar row | 2012-13 … 2026-27 | Per tier: number of Panchayats, number with vouchers, receipt and payment voucher counts, **Receipt Amount (In Rs.)**, **Payment Amount (In Rs.)**, numbers with month book / year book closed |
| District wise Receipt and Payment Statement | `FD=ExpenditureReport{FY}/10&name=10.html` | Bihar → 38 districts (+ Total) | 2020-21 … 2026-27 | Per tier ZP / Block Panchayat / Village Panchayat: **"OB + Receipts (Cr)"** and **"Payments (Cr)"**; links to `FD=ExpFY{FY}/10&name={district}.html` (pass 2) |
| District Wise Summary Report | `FD=SummaryReport{FY}/10&name=10.html` | Bihar → district → block (`FD=SummaryReport{FY}/10/{district}`) | 2020-21 … 2026-27 | ZP: Entered Masters / Opening Balance / Vouchers "(RV-n)(PV-n)(CV-n)(JV-n)" / Day, Month, Year Book Closed (yes/no); BP and GP: counts of Panchayats with each |
| Month-wise voucher status | `FD=FinancialYear{FY}/10&name={block}.html` | Block → month | 2026-27 (38 district folders in pass 1; other years pass 2) | Voucher counts by month; links to `voucherWiseReport.do?voucherWise=Y&finYear=&month=&schemewise=P&state=10&district=&schemeCode=-1` (voucher list) |
| Scheme-wise expenditure archive | `FD=SchemeWiseExpenditureReport{FY}/{scheme}&name={scheme}.html` | All states → state | 35 scheme codes (e.g. 0 OWN, 3 MGNREGA, 2813 FFC, 3287 XV FC, 3302 RGSA) | Pass 2 |
| Statistics At A Glance | `FileRedirect.jsp?name=priasoftOverview.html` | National | current | National totals only |

Values are copied cell by cell, exactly as served, into `data/analysis/egs/portal_bihar_values.csv`: 33,651 rows with file, year, district, row, full column heading and value. The 1,295 static files are listed in `portal_static_reports.csv`, with the printed generation date of each.

### 2.3 Report forms (titles as listed on the portal)

| Group | With CAPTCHA (not collected) | Without CAPTCHA |
|---|---|---|
| Accounting / finance | Annual Receipts Report, Receipt Head Expenditure, Object-Head-wise Expenditure, O&M Expenditure, Panchayat-wise Expenditure, Consolidated report, Monthly Reconciliation, Demand Collection, Day Book, Cash Book (two), Ledger Book, Journal Book, Remittance Balance, Chart of accounts (scheme and object head), DSC status, Vendor report | Scheme Wise Expenditure Report form (returned the form only, no table), Year Book Status, Theme-wise Expenditure, `getExpenditureData`, Offline Payment Voucher: all returned a header without rows or "0" rows for the default selection (**not read as zero**) |
| Planning (GPDP) | Action Plan for GP, Resource Envelope, Sector-wise activity, Scheme-wise activity, Activity analysis, Thematic activity analysis, Analytical report on PDP, Plan upload status on passed date, PDP self-assessment | GPDP dashboard and plan-wise activities (browser-built; pass 2) |
| Progress and assets | Physical and Financial Details, Thematic planning expenditure, Activity details analysis, Asset list for Panchayat, Asset configuration | Time / weekly progress graphs |
| Profile and others | Know Your Panchayat, Basic Profile Consolidated report, Mission Antyodaya survey data (out of scope), Dashboard analysis, SMS alert, Beneficiary report | GP/BP/ZP profile and elected representatives (browser-built; pass 2) |

### 2.4 AuditOnline public reports (VERIFIED, no login, no CAPTCHA)

| Menu item (portal wording) | Front-end URL | Data endpoints (drill-down order) | Levels | Formats |
|---|---|---|---|---|
| Year Book Closed (ZPs/BPs/GPs) | `yearBookClosedetails.htm?year=` | `egramswaraj.gov.in/getMobileData/getYearBookClosed{StateWise,DistrictWise,BlockWise,GPWise}` (eGramSwaraj; collected from India) | State → District → Block → GP | JSON |
| Year Book Not Closed | `yearBookNotClosedDetails.htm` (POST `finYear`, `stateCode`, `localBodyTypeCode`) | server-rendered HTML; Excel `yearBookNotClosedExcel.htm` | List of GPs with **LGD Code** | HTML, Excel |
| Registered Auditors | `auditordetails.htm?year=` | `centerLevelByYearForAuditor.htm` … | State → office → auditor | **Not collected: names, e-mail, mobile** |
| Registered Auditees | `auditeeRegistered.htm?year=` | `auditeeRegisteredStatewise` → `…Districtwise` → `…Blockwise` → `auditeeRegisteredDetails` | State → District → Block | JSON. **Officials' names not collected** |
| Audit Plans | `auditeePlandetails.htm?year=` | `centerLevelByYear` → `…AndState` → `…AndDistrict` → `…AndBlock` | State → District → Block → **GP** | JSON |
| Observations | `observationCountReport.htm?year=` | `observationCountStateReport` → `…DistrictReport` / `…CategoryReport` → `…SubCategoryReport` → `…BlocktReport` → `…GPReport` → `…CategoryReportGPWise` | down to **GP**, by category | JSON |
| Audit Reports generated | `gpWithAuditReportGeneratedReport.htm?year=` | `…StateWise` → `…DistrictWise` → `…BlockWise` → `gpWithAuditReportGeneratedDetail` | down to **GP** | JSON |
| Settlement Report | `settlementReport.htm?year=&level=` | `auditSettlementReportLevelWise.htm` | down to **GP** | JSON |
| Action Taken | `actionTakenSettlementLevelWise.htm` | `actionTakenSettlementReport.htm?lbCode=` | State → Block | JSON |
| GP Level Audit Status Report | `gpLevelAuditStatusReport.htm` (POST) | server HTML; **Excel `gpAuditStatusExcel.htm`** | District rows | HTML, XLSX |
| Documentation | User Manual, presentations, SOPs | `*.do?OWASP_CSRFTOKEN=` | — | PDF, XLSX |

**Label correction.** `centerLevelByYearAndDistrictGP.htm` sounds like a GP-level report, but it returns **Block Panchayat auditees** (about 531–533 codes a year), not GPs. GP-level audit plans come from `centerLevelByYearAndBlock.htm`. The summaries label it accordingly.

All 55 AuditOnline endpoints are in Appendix A.

## 3. Demographic and administrative data catalogue (Deliverable B)

Population figures and the make-up of elected bodies are kept apart below, as the brief asks.

**3a. Population and households**

| Indicator | Found? | Evidence |
|---|---|---|
| Total / male / female population, households, SC/ST, age | **Not found in any material saved so far** | No such field in any static report, getMobileData response or AuditOnline response (`field_catalogue.csv`). The GP profile pages are browser-built and their JSON is pass 2, so this is **NOT VERIFIED** for the profile, not "absent" |

**3b. Panchayat administrative profile**

| Indicator | Level | Source / field | Status |
|---|---|---|---|
| Number of ZPs, BPs, GPs | State, district, block | Summary reports ("Total No of Village Panchayats" etc.); getMobileData `totalcount`; AuditOnline `gpCount` | VERIFIED |
| GP names and codes | GP | getMobileData `getYearBookClosedGPWise` (`code`, `name`); AuditOnline `auditeeCode` / "LGD Code" | VERIFIED |
| Tier nomenclature | State | AuditOnline DWR `lgdDao.getTierSetup`: "Zilla Parishad", "Panchayat Samiti", "Gram Panchayat"; eGramSwaraj columns say "Zilla Panchayat", "Block Panchayat & Equivalent", "Village Panchayat & Equivalent" | VERIFIED |
| Profile completed | ZP, BP | Profile reports list Bihar with 38 ZPs (35 with profile) and 534 BPs (532 with profile) | VERIFIED (counts); profile fields pass 2 |
| Panchayat officials, auditors | Block, GP | AuditOnline: names, designations, contacts exist; **deliberately not collected** (personal data) | VERIFIED exists; withheld |

**3c. Elected representatives (composition, not population)**

| Indicator | Status |
|---|---|
| Elected Representative Report for ZP / BP / Village Panchayat | The pages exist and offer Bihar without CAPTCHA (`ElectedRepresentativeReport` Zp/Bp/Vp). They are browser-built. Fields (gender, category, post) are **pass 2**. Names are personal data and would be kept only as counts if the response is aggregate |

## 4. Public finance data catalogue (Deliverable C)

The definitions matter more than the numbers. **Receipts are not expenditure; "OB + Receipts" includes the opening balance; "Payments" are cash payments recorded in Panchayat accounts.** None of them is an approved plan, a budget allocation, or all government spending in the Panchayat's area. Schemes run by line departments directly are not in Panchayat accounts.

| Concept in the brief | What eGramSwaraj shows for Bihar | Where | Access | Status |
|---|---|---|---|---|
| Funds received (receipts) | "Receipt Amount (In Rs.)" per tier, state total by year; number of receipt vouchers | State & Year Wise Summary | Static | VERIFIED |
| Opening balance + receipts | "OB + Receipts (Cr)" per tier, per district | District wise Receipt and Payment Statement | Static | VERIFIED |
| Payments | "Payment Amount (In Rs.)" (state), "Payments (Cr)" (district) | same two | Static | VERIFIED |
| Closing / unspent balance | Not printed. The difference of two columns is **not** published as a balance and must not be presented as one. "Panchayat-Wise Sources of Revenue" (`schemeWiseUnspendBalance`) is behind a CAPTCHA | — | CAPTCHA | NOT VERIFIED |
| Grants, tied / untied | XV FC Tied expenditure page (`tiedExpenditure`, browser-built) and FFC sector-wise expenditure; scheme codes 2813 FFC and 3287 XV FC in the scheme-wise archive | Browser-built / static | No CAPTCHA | Pass 2 |
| Scheme-wise expenditure | `SchemeWiseExpenditureReport{FY}/{scheme}` archive, 35 schemes; Scheme Wise Expenditure Report form (CAPTCHA-free form returned no table for the default selection) | Static / form | No CAPTCHA | Pass 2 |
| Activity-wise / object-head / receipt-head expenditure | Object-head, receipt-head, O&M, Panchayat-wise expenditure reports | Forms | **CAPTCHA** | NOT VERIFIED |
| Vouchers | Counts by type (RV receipt, PV payment, CV contra, JV journal) by district, block and month; voucher list pages `voucherWiseReport.do` | Static + linked page | No CAPTCHA | VERIFIED (counts); list sampled in pass 2 |
| Vendors | Vendor report | Form | **CAPTCHA** | NOT VERIFIED |
| Cash book, day book, ledger | Public cash/day/ledger/journal books | Forms | **CAPTCHA** | NOT VERIFIED |
| Accounting compliance | Masters, opening balance, day/month/year book closed | Summary reports; getMobileData | No CAPTCHA | VERIFIED |
| GPDP (approved plans) | Plan upload status, action plan, resource envelope, sector/scheme-wise activities | Mostly forms with CAPTCHA; GPDP upload report and plan-wise activities browser-built | Mixed | NOT VERIFIED / pass 2 |
| Physical and financial progress | Physical and Financial Details | Form | **CAPTCHA** | NOT VERIFIED |
| Audit of accounts | AuditOnline: audit plans, reports, observations by category, settlement | JSON | No CAPTCHA | VERIFIED (counts, no amounts) |

**Bihar, Village Panchayat tier, State & Year Wise Summary (values exactly as served).** Each file is a snapshot. The file for 2012-13 to 2024-25 was generated on 23 Oct 2024, and the files for 2025-26 and 2026-27 on 20 Nov 2026.

| FY | GPs | GPs with vouchers | Receipt Amount (In Rs.) | Payment Amount (In Rs.) | GPs with Year Book Closed |
|---|---|---|---|---|---|
| 2012-13 | 8474 | 0 | 0.00 | 0.00 | 0 |
| 2015-16 | 8392 | 0 | 0.00 | 0.00 | 0 |
| 2018-19 | 8386 | 0 | 0.00 | 0.00 | 0 |
| 2019-20 | 8387 | 1 | 0.00 | 0.00 | 1 |
| 2020-21 | 8387 | 8108 | 235,05,31,006.54 | 20,86,008.55 | 8108 |
| 2021-22 | 8221 | 8220 | 3,429,16,45,963.85 | 780,18,14,262.15 | 8095 |
| 2022-23 | 8176 | 8094 | 5,934,58,84,976.92 | 3,017,22,76,765.27 | 8077 |
| 2023-24 | 8176 | 8078 | 5,738,43,97,797.99 | 2,922,37,46,314.91 | 8053 |
| 2024-25 | 8054 | 8053 | 3,861,03,59,497.17 | 1,425,01,57,843.78 | 0 (snapshot of 23 Oct 2024) |
| 2025-26 | 8050 | 8050 | 4,767,48,37,753.05 | 2,889,54,65,480.79 | 8049 |
| 2026-27 | 8051 | 8050 | 2,797,12,68,405.76 | 1,871,09,91,099.68 | 0 (year in progress) |

Amounts use the portal's own digit grouping, copied unchanged. **Bihar 2024-25 from the district statement**, generated on 20 Nov 2026, for all 38 districts: Village Panchayat "OB + Receipts (Cr)" 4221.843 and "Payments (Cr)" 2872.269; Block Panchayat 1028.781 and 607.265; Zilla Panchayat 1885.170 and 493.256. The difference from the summary table comes from the generation date and from the inclusion of the opening balance. It is recorded, not reconciled.

## 5. Geographic coverage matrix (Deliverable D)

✔ collected · ◐ available, collected for some years · ✖ not offered · 🔒 behind CAPTCHA (not collected) · P2 = pass 2 (written, awaiting run) · ? not verified

| Report | State | District | Block | GP | Village |
|---|---|---|---|---|---|
| State & Year Wise Summary (receipts, payments, voucher and closure counts) | ✔ | ✖ | ✖ | ✖ | ✖ |
| District wise Receipt and Payment (OB + Receipts, Payments) | ✔ | ✔ | P2 (`ExpFY`) | ? | ✖ |
| District Wise Summary (accounting status, voucher counts) | ✔ | ✔ | ◐ (block lists) | ✖ | ✖ |
| Month-wise vouchers | — | ✔ | ◐ (2026-27) | P2 (voucher lists, sampled) | ✖ |
| Scheme-wise expenditure archive | P2 | P2 | ? | ? | ✖ |
| Year Book Closed API (getMobileData) | ✔ | ✔ | ✔ | ✔ (2024-25; all years P2) | ✖ |
| Profiles, elected representatives, XV FC tied, FFC sector-wise, GPDP upload | P2 | P2 | P2 | P2 | ? |
| Cash/day/ledger books, vendor, receipt/object-head expenditure, physical and financial progress, GPDP action plans | 🔒 | 🔒 | 🔒 | 🔒 | ? |
| AuditOnline: audit plans, reports generated, observations, settlement | ✔ | ✔ | ✔ | ✔ (2020-21, 2024-25) | ✖ |
| AuditOnline: observations by category | ✔ | ✖ | ✖ | ◐ (30 GPs sampled) | ✖ |
| AuditOnline: Year Book Not Closed | — | ✔ | ✔ | ✔ (list) | ✖ |

No eGramSwaraj report seen so far goes below GP. Where "village" appears in eGramSwaraj wording ("Village Panchayat"), it means the Gram Panchayat tier, not a revenue village.

**AuditOnline GP coverage (VERIFIED, `data/analysis/egs/gp_coverage.csv`).** Distinct GP codes per report against GPs registered: 2020-21 audit plans 8,149, reports generated 8,129, observations 8,386, settlement 8,386, out of 8,386. 2024-25: 8,053 in every report, out of 8,053.

## 6. Historical coverage matrix (Deliverable E)

| Source | Earliest year offered | Latest | Bihar has data from | Notes |
|---|---|---|---|---|
| State & Year Wise Summary (eGramSwaraj) | 2012-13 | 2026-27 | **2020-21** (2019-20: 1 GP) | 2012-13 to 2018-19: Bihar rows are "0" / "0.00" (not recorded in eGramSwaraj; not zero spending) |
| District wise Receipt and Payment | 2020-21 | 2026-27 | 2020-21 | Older years not offered |
| District Wise Summary | 2020-21 | 2026-27 | 2020-21 | |
| Month-wise voucher status | 2026-27 seen | — | — | Other years pass 2 |
| getMobileData Year Book Closed | 2024-25 tested; API takes any "YYYY-YYYY" | — | — | Year must be written "2024-2025"; "2024-25" returns an HTML error page |
| AuditOnline | 2019-20 (audit years); district GP counts from 2015-16 | 2025-26 | 2019-20 | 2015-16 to 2018-19: GP counts only, 0 audit plans |

**AuditOnline Bihar by year (VERIFIED, `coverage_by_year.csv`, counts as served)**

| FY | GPs registered | GPs with audit plan | GPs with audit report | Observations | Settlement reports |
|---|---|---|---|---|---|
| 2015-16 | 8369 | 0 | — | — | — |
| 2016-17 | 8366 | 0 | — | — | — |
| 2017-18 | 8366 | 0 | — | — | — |
| 2018-19 | 8363 | 0 | — | — | — |
| 2019-20 | 8364 | 2159 | 2139 | 14093 | 0 |
| 2020-21 | 8386 | 8149 | 8069 | 67545 | 0 |
| 2021-22 | 8125 | 8073 | 8000 | 56212 | 0 |
| 2022-23 | 8077 | 8060 | 8053 | 77441 | 0 |
| 2023-24 | 8055 | 8055 | 8051 | 75202 | 1292 |
| 2024-25 | 8053 | 8053 | 8049 | 81208 | 0 |
| 2025-26 | 8052 | 8026 | 100 | 987 | 0 (audit in progress) |

"—" means the report was not offered for that year. It does not mean zero.

The GP count changes over time: 8,474 GPs in 2012-13, 8,386 in 2018-19 and 8,050–8,054 from 2024-25. Comparing years Panchayat by Panchayat therefore needs the GP codes, not names.

## 7. Sample data repository (Deliverable F)

| What | Where | Files |
|---|---|---|
| eGramSwaraj pages, static reports, API responses, exports | `data/raw/EGS-PORTAL/2026-11-20/egramswaraj.gov.in/` | 1,517 records (pass 1) |
| Crawl inventory: pages, links, forms (every field and option), form results | `data/egs_explore/2026-11-20/{pages,links,forms,form_results}.jsonl` | 4 |
| AuditOnline JSON, HTML, XLSX and documentation | `data/raw/EGS-AO/2026-11-20/<level>/<endpoint>/<parameters>.<ext>` | 6,459 checked |
| Provenance (URL, method, parameters or POST data, selections, report name, level, FY, HTTP status, size, sha256, UTC and IST time) | `data/provenance.jsonl` (sources `EGS-PORTAL`, `EGS-AO`) | append-only |
| Descriptions (no values changed) | `data/analysis/egs/`: `portal_static_reports.csv`, `portal_bihar_values.csv`, `portal_api_values.csv`, `portal_page_inventory.csv`, `field_catalogue.csv`, `report_inventory.csv`, coverage files | — |

Representative originals:

| Report | Parameters | File |
|---|---|---|
| State & Year Wise Summary 2024-25 | FY 2024-25, all states | `data/raw/EGS-PORTAL/2026-11-20/egramswaraj.gov.in/FileRedirect.jsp__FD=priasoftOverview_name=statewiseClosureReport2024-2025.html.html` |
| District wise Receipt and Payment, Bihar 2024-25 | FY 2024-25, state 10 | `…/FileRedirect.jsp__FD=ExpenditureReport2024-2025_10_name=10.html.html` |
| District Wise Summary, Bihar 2024-25 | FY 2024-25, state 10 | `…/FileRedirect.jsp__FD=SummaryReport2024-2025_10_name=10.html.html` |
| Year Book Closed, Bihar districts | FY 2024-2025, state 10, GP | `…/getMobileData_getYearBookClosedDistrictWise_2024-2025_10_GP.json` |
| Year Book Closed, all states | FY 2024-2025, GP | `…/getMobileData_getYearBookClosedStateWise_2024-2025_GP.json` |
| AuditOnline audit plans per GP | year 2024-2025, one block | `data/raw/EGS-AO/2026-11-20/gp/centerLevelByYearAndBlock/…` |
| AuditOnline GP Level Audit Status (XLSX) | year, state 10, lbtc 3 | `data/raw/EGS-AO/2026-11-20/district/gpAuditStatusExcel/…` |

**Integrity.** `egs_summary.py` re-hashes every AuditOnline original: 6,459 checked, 0 mismatches. For eGramSwaraj, 160 HTML files were altered on the laptop by Git's Windows line-ending conversion (`core.autocrlf`) before they were committed, so their sha256 no longer matches provenance. They are skipped by every summary rather than trusted. The repository now has `.gitattributes` (`data/** -text`) so that this cannot recur. The laptop holds the untouched copies in `egs_explore_2026-11-20.zip`, and restoring them is the first step of pass 2. Until then, 1,357 eGramSwaraj originals are verified.

`data/egs_explore/2026-11-20/tables/` and the Bihar workbook made by `scripts/egs_tables.py` on the laptop convert Indian-format numbers. They are **derived convenience copies**, not Task 4 deliverables and not originals.

## 8. Data accessibility assessment (Deliverable G)

| Aspect | eGramSwaraj (VERIFIED) | AuditOnline (VERIFIED) |
|---|---|---|
| Geography | Answers only Indian connections | Open |
| Login | Not needed for any public report examined | Not needed |
| CAPTCHA | **On 39 of 59 report forms that offer Bihar**: an image checked server-side before the form is sent. Static archives, the getMobileData API and browser-built pages have none | None |
| Documented API | None. `getMobileData` is used by AuditOnline and the mobile app; found in JavaScript | None; 55 endpoints found in JavaScript |
| Formats | HTML (static archives), JSON (API and browser-built pages), XLS exports on some state pages (generic layout, not Bihar-specific) | JSON; XLSX for two reports |
| Freshness | **Each static file is a dated snapshot**, and the date is printed in the file. Some are refreshed daily (20 Nov 2026), others years old (23 Oct 2024; 18 Jul 2022 for 2020-21) | Live |
| Quirks | Year must be "2024-2025" in the API. Unknown pages return an error page with HTTP 200. Many static pages contain the table twice (an outer and an inner table), so each value appears twice in `portal_bihar_values.csv` with a different `table_index` | Errors returned with HTTP 200; `"0"` strings used as placeholders |
| Hosts | `reportingonline` timed out and `accountingonline` / `planningonline` do not resolve, even from India | — |
| Personal data | Elected-representative and beneficiary pages may list names; collection keeps aggregates and withholds bodies with ≥5 phones or e-mails | Auditor contacts and officials' names exist; not collected |

**CAPTCHA policy followed.** No CAPTCHA was solved by software, skipped by calling the form's back-end directly, or replayed. The 39 pages are recorded as `captcha_present_not_attempted`. `egs_bihar.py --steps manual` exists for a person to view those reports one at a time. It only saves what that person is shown.

## 9. Collection automation assessment (Deliverable H)

| Report | Method | Repeatable? | Effort |
|---|---|---|---|
| eGramSwaraj static archives (all Bihar years, district → block → month, scheme-wise) | `egs_bihar.py --steps static` (stdlib); from India | Yes; resumable; new day = new folder | About 1–2 h at 0.7 s per request with `--depth 1` |
| getMobileData Year Book Closed, all years, all tiers, block-wise and GP-wise | `egs_bihar.py --steps api` | Yes | Minutes |
| Browser-built reports (profiles, representatives, XV FC tied, FFC sector, GPDP upload) | `egs_bihar.py --steps xhr` (Playwright) records the JSON the page loads | Yes, if page layouts stay the same | About 1 h |
| CAPTCHA reports | `egs_bihar.py --steps manual`: a person enters each CAPTCHA | Manual | 1–2 minutes per report and per selection; impractical at GP level |
| AuditOnline, all reports | `egs_auditonline.py` (stdlib), from anywhere | Yes; resumes | About 1 h per year at GP level |
| Description tables | `egs_portal_summary.py`, `egs_summary.py` | Yes, offline | Seconds |

The dependable automated route for Bihar Panchayat finance is the static archives plus getMobileData. The detailed books (cash book, ledger, vendor) are not suitable for automation because of the CAPTCHA.

## 10. Remaining step

The laptop in India runs three commands from the repository folder and pushes the result:

```bash
python scripts/egs_bihar.py
python scripts/egs_bihar.py --steps xhr
python scripts/egs_portal_summary.py
```

The first collects the static archives, the API and the page scripts. The second needs `pip install playwright` once. The third must print "0 hash mismatches" after the 160 files are restored from the zip. All other steps are complete.

## 11. Data gaps report (Deliverable I)

| Gap | Kind | Steps already taken |
|---|---|---|
| Population, households, SC/ST at Panchayat level | Not found so far | Searched all static reports, API responses and AuditOnline fields; GP profile JSON is pass 2 |
| Elected representative composition | Pending | Pages located, no CAPTCHA; JSON recorded in pass 2 |
| Cash book, ledger, day book, vendor, receipt-head, object-head, Panchayat-wise expenditure, physical and financial progress, GPDP action plans | **CAPTCHA** | Forms inventoried with all fields and options; not bypassed; manual mode provided |
| Closing / unspent balance | Not published as a balance in open reports | "Sources of Revenue / unspent balance" report is behind CAPTCHA |
| Tied vs untied grants, scheme-wise expenditure | Pending | XV FC tied page and the 35-scheme archive identified; pass 2 |
| Budget allocations, approved plan amounts | Not seen in open reports | GPDP reports mostly CAPTCHA |
| Bihar finance before 2020-21 | Not recorded in eGramSwaraj | Summary rows "0" / "0.00" from 2012-13 to 2018-19 |
| `reportingonline`, `accountingonline`, `planningonline`, `areaprofiler` | Unreachable even from India (timeout, DNS failure) | Tried from cloud and India; functions appear to be served by `egramswaraj.gov.in` itself |
| Stale snapshots | Data quality | Each static file's printed generation date recorded; e.g. 2024-25 summary frozen at 23 Oct 2024 |
| Two different 2024-25 totals | Inconsistency (not reconciled) | Summary (23 Oct 2024) Receipts Rs 3,861 cr, Payments Rs 1,425 cr vs district statement (20 Nov 2026) OB + Receipts Rs 4,221.843 cr, Payments Rs 2,872.269 cr |
| Year book closed 2024-25 | Inconsistency across snapshots | Summary snapshot shows 0; getMobileData (live) 8,053 of 8,054; AuditOnline "Not Closed" lists 1 GP. The live sources agree |
| AuditOnline: reports generated exceed the Panchayat count | Inconsistency | 52 district-year rows in `inconsistencies.csv` (e.g. Jehanabad 2019-20: 93 > 91) |
| AuditOnline settlement and action taken | Mostly 0 | Settlement reports 0 except 1,292 in 2023-24; action taken 0 every year |
| GP count changes 8,474 → 8,050 | Boundary changes | Comparisons must use GP codes |
| 160 eGramSwaraj HTML files with altered line endings | Preservation | Detected by hash check; excluded; `.gitattributes` added; restore from laptop zip |
| AuditOnline run stopped once at its time limit | Process | Resumed for the remaining years with no errors; resumable design means no file was lost or duplicated |

## 12. Answers to the specific questions

1. **Which reports does eGramSwaraj publish for Bihar, and where?** Static archives (State & Year Wise Summary, District wise Receipt and Payment, District Wise Summary, month-wise vouchers, scheme-wise expenditure), the getMobileData API, browser-built profile, representative and grant pages, and 59 report forms, 39 of them behind CAPTCHA. Sections 2.1–2.3.
2. **Is population data available, and at what level?** No population or household figure was found in anything collected. The GP profile JSON is pending. Not verified either way.
3. **Is elected representative composition available?** The ZP, BP and GP pages exist without CAPTCHA. Their fields are pending (pass 2).
4. **What finance data is openly available?** Receipts, opening balance plus receipts, payments, voucher counts and accounting status by tier: state by year from 2020-21, and by district. Detailed books, vendors and object-head expenditure need a CAPTCHA. Section 4.
5. **Can approved plans, allocations, receipts, payments and expenditure be told apart?** Receipts, "OB + Receipts" and payments are separate published columns. Approved plans (GPDP) and allocations are not in the open reports seen. "Payments" are the Panchayat's own recorded payments, not all government spending in its area.
6. **Lowest geographic level?** Open finance: district, with block for voucher status. The year-book API goes to GP. AuditOnline goes to GP. No report goes below GP.
7. **Historical depth?** Bihar finance in eGramSwaraj from 2020-21 (earlier rows "0"); the AuditOnline audit cycle from 2019-20. Section 6.
8. **Formats and downloads?** HTML static files, JSON, a few XLS/XLSX. No documented bulk download or API.
9. **Can collection be automated?** Yes for the static archives, getMobileData, browser-built pages and AuditOnline. No for CAPTCHA reports. Section 9.
10. **Main obstacles?** Geographic restriction, CAPTCHA, snapshot dates, three unreachable hosts, and changing GP counts. Section 11.

## Appendix A. AuditOnline data endpoints found in its JavaScript

Source files: `/resources/reportComponents/component/**/*.service.js`, `js/GPLevelAuditStatusReport/gpLevelAuditStatusReport.js`, `js/ATR/atr.js` on `https://auditonline.gov.in/`. All paths are relative to `https://auditonline.gov.in/` unless absolute. Personal-data endpoints (auditor/auditee details) are listed for completeness and were not called.

| Endpoint | Parameters |
|---|---|
| `actionTakenSettlementReport.htm` | lbCode, level, stateCode, year |
| `auditSettlementReportLevelWise.htm` | blockCode, districtCode, level, stateCode, twoTierzpCode, year |
| `auditeeRegisteredBlockwise.htm` | districtCode, year |
| `auditeeRegisteredBlockwiseByState.htm` | stateCode, year |
| `auditeeRegisteredDetails.htm` | blockCode, year |
| `auditeeRegisteredDetailsBYDistrict.htm` | districtCode, year |
| `auditeeRegisteredDetailsBYState.htm` | stateCode, year |
| `auditeeRegisteredDistrictwise.htm` | stateCode, year |
| `auditeeRegisteredStatewise.htm` | year |
| `auditorAssignedDetails.htm` | districtCode, stateCode, userId, year |
| `auditordetails.htm` | year |
| `centerLevelByYear.htm` | year |
| `centerLevelByYearAndBlock.htm` | blockCode, stateCode, year |
| `centerLevelByYearAndDistrict.htm` | districtCode, stateId, year |
| `centerLevelByYearAndDistrictGP.htm` | districtId, stateCode, year |
| `centerLevelByYearAndState.htm` | stateId, year |
| `centerLevelByYearAndStateAuditorHr.htm` | stateCode, year |
| `centerLevelByYearAndStateForAuditor.htm` | stateId, year |
| `centerLevelByYearAndStateHr.htm` | stateId, year |
| `centerLevelByYearAnddistrictAuditor.htm` | districtCode, stateCode, year |
| `centerLevelByYearForAuditor.htm` | year |
| `centerLevelCount.htm` | year |
| `centerLevelTotalYearCount.htm` | type |
| `downloadAuditReportNotGenerated.htm` | OWASP_CSRFTOKEN, blockCode, districtCode, level, stateCode, year |
| `getPanchayatDetail.htm` | panchayatCode, panchayatType, stateCode |
| `gpWithAuditReportGeneratedDetail.htm` | blockCode, stateCode, year |
| `gpWithAuditReportGeneratedDetailByDistrict.htm` | districtCode, year |
| `gpWithAuditReportGeneratedDetailByState.htm` | stateCode, year |
| `gpWithAuditReportGeneratedReportBlockWise.htm` | districtCode, year |
| `gpWithAuditReportGeneratedReportBlockWiseByState.htm` | stateCode, year |
| `gpWithAuditReportGeneratedReportDistrictWise.htm` | stateCode, year |
| `gpWithAuditReportGeneratedReportStateWise.htm` | year |
| `https://egramswaraj.gov.in/getMobileData/getTotalBookClosed/{finyear}/0` | path parameters (eGramSwaraj; NOT VERIFIED) |
| `https://egramswaraj.gov.in/getMobileData/getYearBookClosedBlockWise/{finyear}/{stateId}/GP/{zpcode}` | path parameters (eGramSwaraj; NOT VERIFIED) |
| `https://egramswaraj.gov.in/getMobileData/getYearBookClosedDistrictWise/{finyear}/{stateId}/GP` | path parameters (eGramSwaraj; NOT VERIFIED) |
| `https://egramswaraj.gov.in/getMobileData/getYearBookClosedGPWise/{finyear}/{stateId}/{bpcode}` | path parameters (eGramSwaraj; NOT VERIFIED) |
| `https://egramswaraj.gov.in/getMobileData/getYearBookClosedStateWise/{finyear}/GP` | path parameters (eGramSwaraj; NOT VERIFIED) |
| `mappedAuditorDetails.htm` | auditeeCode, year |
| `observationCountBlockSubReport.htm` | categoryId, districtCode, subCategoryId, year |
| `observationCountBlocktReport.htm` | districtCode, year |
| `observationCountCategoryReport.htm` | stateId, year |
| `observationCountCategoryReportGPWise.htm` | auditeeCode, year |
| `observationCountDistrictReport.htm` | stateId, year |
| `observationCountDistrictSubReport.htm` | categoryId, stateId, subCategoryId, year |
| `observationCountGPReport.htm` | blockCode, stateCode, year |
| `observationCountGPSubReport.htm` | blockCode, categoryId, subCategoryId, year |
| `observationCountStateReport.htm` | year |
| `observationCountSubCategoryReport.htm` | categoryId, stateId, year |
| `observationCountSubCategoryReportGPWise.htm` | auditeeCode, categoryId, year |
| `recentUpdateDetails.htm` | type |
| `totalCount.htm` | stateCode |
| `gpLevelAuditStatusReportApi.htm` | auditYear, lbtc, stateCode (returned `{}` for Bihar; the page itself uses the POST form) |
| `gpLevelDataForExcelDownload.htm` | auditYear, lbtc, stateCode, type, zpCode (not explored) |
| `gpAuditStatusExcel.htm` | auditYear, lbtc, stateCode (server XLSX; collected) |
| `yearBookNotClosedExcel.htm` | OWASP_CSRFTOKEN + form fields (not collected; the HTML form result is) |

