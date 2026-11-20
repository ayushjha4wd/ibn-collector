# IBN Task 4: Bihar eGramSwaraj Data Exploration

20 November 2026 · `ayushjha4wd/ibn-collector`

## 0. Summary

**What happened.** The eGramSwaraj portal itself could not be explored from where this work ran. All four eGramSwaraj hosts (`egramswaraj.gov.in`, `reportingonline.gov.in`, `accountingonline.gov.in` and `planningonline.gov.in`) refuse connections from the cloud machine used for this task. The same refusal happened on every attempt, with plain requests and with a real browser (section 1). `areaprofiler.gov.in` failed in the same way. The one host of the eGramSwaraj suite that does answer is **AuditOnline (`auditonline.gov.in`)**, the Ministry of Panchayati Raj's module for auditing Panchayat accounts. It was explored in full and collected for Bihar.

**So this report has two kinds of finding.** They are labelled throughout:

| Label | Meaning |
|---|---|
| **VERIFIED** | Seen directly in a page or response saved in this repository, with URL and time in `data/provenance.jsonl` |
| **INDIRECT** | Shown by AuditOnline about eGramSwaraj: AuditOnline's own code calls eGramSwaraj, or AuditOnline prints "Report generated through (egramswaraj.gov.in)" |
| **NOT VERIFIED** | Could not be checked because the host was unreachable. Nothing in this report describes eGramSwaraj report fields, menus or coverage without one of the two labels above |

**Main results:**

1. **AuditOnline is fully collectable for Bihar without login or CAPTCHA.** Its report pages are thin front-ends over unauthenticated JSON endpoints. 55 endpoints were found in the pages' own JavaScript, and the useful ones were called for Bihar (state code 10) for every year offered, 2019-20 to 2025-26. They drill down **state → district (38) → block → Gram Panchayat**, with GP codes. The script that does this is `scripts/egs_auditonline.py`, and the results are in section 5. VERIFIED.
2. **AuditOnline holds no population, household, representative or rupee figures.** It records, per GP and per year, whether the accounts were audited, which grant streams were audited ("Others, TFC, 14FC, 15FC"), the audit dates, the number of audit observations ("paras") by category and risk, and whether settlement or action-taken reports exist. VERIFIED.
3. **eGramSwaraj has a public JSON interface that is undocumented but used in production.** AuditOnline's public JavaScript calls `https://egramswaraj.gov.in/getMobileData/getYearBookClosed{StateWise,DistrictWise,BlockWise,GPWise}/…` to show whether each Panchayat's annual accounts ("Year Book") are closed in eGramSwaraj's accounting module. AuditOnline also serves an eGramSwaraj-generated list of Bihar GPs whose year book is *not* closed: 1 GP for 2024-25, against 8,053 GPs. INDIRECT.
4. **The core questions of Task 4 cannot be answered yet.** These are the Panchayat profile, elected representatives, receipts, expenditure, GPDP and physical progress, and they need eGramSwaraj itself. A ready-to-run explorer, `scripts/egs_explore.py`, was written and tested here against AuditOnline. Run from any computer in India, it crawls the four hosts, saves every page, menu, form option and downloadable file with provenance, fills each report form for Bihar, and drills down from district to GP. It then packs everything into one zip for analysis. Section 10 has the steps.

## 1. Access attempts (20 Nov 2026)

| Host | Result (every attempt) | What was tried |
|---|---|---|
| `egramswaraj.gov.in` | TLS handshake completes (certificate `CN=egramswaraj.gov.in`), then the server sends **no HTTP response** (empty reply) on `/`, `/index.do`, `/welcome.do`, `/home.do`, `/robots.txt` | curl with browser headers, HTTP/1.1; headless Chromium (502); 3 retries 25 s apart; fetch tool from a second network (DNS failure) |
| `www.egramswaraj.gov.in` | Same server; certificate does not cover `www.` | as above |
| `reportingonline.gov.in` | **Connection reset** during TLS handshake | as above |
| `accountingonline.gov.in` | Egress proxy cannot reach it (**502**) | as above |
| `planningonline.gov.in` | **502** | as above |
| `areaprofiler.gov.in` | **502** | as above |
| `auditonline.gov.in` | **200**, normal | collected (sections 2–9) |
| `web.archive.org` copies | refused by the fetch tool | not usable here |

The session's network policy was first changed to allow these hosts, and that change was confirmed. The failures above come from the far end after that change, not from the policy. The pattern (AuditOnline answers while its sister hosts reset or drop connections) matches geographic filtering of non-Indian traffic. The same thing was seen in Task 3 for `saiindia.gov.in`. This cannot be confirmed from outside, and nothing was done to get around it.

## 2. Portal structure and report inventory (Deliverable A)

### 2.1 eGramSwaraj suite hosts

| Host | Role | Evidence |
|---|---|---|
| `egramswaraj.gov.in` | Main portal; also serves a JSON API under `/getMobileData/` | INDIRECT: called by AuditOnline's `yearBook.service.js` and `centerLevel.service.js`; it also hosts images shown on AuditOnline's home page |
| `auditonline.gov.in` | AuditOnline: audit of Panchayat accounts | VERIFIED |
| `reportingonline.gov.in`, `accountingonline.gov.in`, `planningonline.gov.in`, `areaprofiler.gov.in` | Hosts named for reporting, accounting, planning (GPDP) and area profiles | NOT VERIFIED: no page could be loaded; roles are inferred from the host names only |

### 2.2 AuditOnline public reports (VERIFIED)

Every report below is linked from `https://auditonline.gov.in/` (home-page menu) and needs **no login and no CAPTCHA**. "Front-end" is the page a person opens. "Data endpoint" is the JSON call that page makes, which is what the collector uses. All take a financial year `year=YYYY-YYYY` (2019-2020 … 2025-2026).

| Menu item (portal wording) | Front-end URL | Data endpoints (drill-down order) | Levels | Formats |
|---|---|---|---|---|
| Year Book Closed (ZPs/BPs/GPs) | `yearBookClosedetails.htm?year=` | `egramswaraj.gov.in/getMobileData/getYearBookClosed{StateWise,DistrictWise,BlockWise,GPWise}` (**eGramSwaraj, not reachable here**) | State → District → Block → GP | On-screen table; client-side Excel |
| Year Book Not Closed | `yearBookNotClosedDetails.htm` (POST `finYear`, `stateCode`, `localBodyTypeCode`) | server-rendered HTML; Excel via `yearBookNotClosedExcel.htm` | List of GPs (District, Block, GP name, **LGD Code**, "Is Year Book Closed") | HTML, Excel |
| Registered Auditors: Details | `auditordetails.htm?year=` | `centerLevelByYearForAuditor.htm`, `centerLevelByYearAndStateForAuditor.htm`, … | State → office → auditor | **Not collected: auditor names, e-mail, mobile** |
| Registered Auditees (ZPs/BPs/GPs) | `auditeeRegistered.htm?year=` | `auditeeRegisteredStatewise` → `…Districtwise` → `…Blockwise` → `auditeeRegisteredDetails` | State → District → Block (→ named officials) | JSON; client Excel. **Officials' names not collected** |
| Audit Plans (ZPs/BPs/GPs) | `auditeePlandetails.htm?year=` | `centerLevelByYear` → `centerLevelByYearAndState` → `centerLevelByYearAndDistrict` → `centerLevelByYearAndBlock` | State → District → Block → **GP** | JSON |
| Observations (ZPs/BPs/GPs) | `observationCountReport.htm?year=` | `observationCountStateReport` → `…DistrictReport` / `…CategoryReport` → `…SubCategoryReport` → `…BlocktReport` → `…GPReport` → `…CategoryReportGPWise` | State → District → Block → **GP**, by category and sub-category | JSON |
| Audit Reports generated (ZPs/BPs/GPs) | `gpWithAuditReportGeneratedReport.htm?year=` | `…StateWise` → `…DistrictWise` → `…BlockWise` → `gpWithAuditReportGeneratedDetail` | State → District → Block → **GP** | JSON |
| Settlement Report (ZPs/BPs/GPs) | `settlementReport.htm?year=&level=` | `auditSettlementReportLevelWise.htm` (no code / `stateCode` / `districtCode` / `blockCode`) | State → District → Block → **GP** | JSON; client Excel/PDF |
| ATR Status / Action Taken | `actionTakenReport.htm`, `actionTakenSettlementLevelWise.htm` | `actionTakenSettlementReport.htm?lbCode=` | State → District → Block → GP | JSON |
| GP Level Audit Status Report | `gpLevelAuditStatusReport.htm` (POST `stateCode`, `lbtc`, `auditYear`; `lbtc=3` is Village Panchayat) | server-rendered HTML; **Excel `gpAuditStatusExcel.htm`** | District rows | HTML, **XLSX (server-generated)** |
| Audit Scheduling, Constituted Audit Teams, Analysis of Observations, Task Tracking, KPI Reports, Consolidated | `assignPanchWithAuditSchedule1.do`, `auditTeamDetailsReport.do`, `observationAnalysis.htm`, `taskTrackingReport.htm`, `auditkpiConsolidateReport.htm`, `centreLevelReport.htm` | not examined in depth (team/auditor detail or duplicates of the above) | — | — |
| Documentation | User Manual (333 pp.), Introduction and Detailed presentations, SOPs, Process Flow template | `*.do?OWASP_CSRFTOKEN=` | — | PDF, XLSX (collected under `data/raw/EGS-AO/<date>/docs/`) |

The full list of 55 endpoints, taken from the JavaScript, with parameter names, is in Appendix A.

## 3. Demographic and administrative data catalogue (Deliverable B)

**Population and household information: absent from everything that could be examined.** AuditOnline has no population, sex, household, age or SC/ST field in any response (all fields: `data/analysis/egs/field_catalogue.csv`). Whether eGramSwaraj's Panchayat profile carries such fields is **NOT VERIFIED**.

| Indicator | Reported? | Level | Source / field | Status |
|---|---|---|---|---|
| State, district, block names and codes | Yes | State, district, block | `code`, `name` in `centerLevelByYear*`; district codes 179–215 and 561 (Arwal) | VERIFIED |
| GP names and codes | Yes | GP | `auditeeCode`/`code`, `auditeeName`/`name`; the *Year Book Not Closed* report labels the same code "LGD Code" | VERIFIED |
| Panchayat type | Yes | GP | `getPanchayatDetail.htm` → `local_body_type_name` ("Village Panchayat"), `category` ("P") | VERIFIED |
| Tier set-up (ZP / Panchayat Samiti / GP) | Yes | State | DWR call `lgdDao.getTierSetup` → `localBodyTypeCode` 1/2/3 with Bihar nomenclature "Zilla Parishad", "Panchayat Samiti", "Gram Panchayat" | VERIFIED |
| Number of GPs per district/block, by year | Yes | District, block | `gpCount` | VERIFIED |
| Villages per GP, wards | No | — | — | Absent in AuditOnline; eGramSwaraj NOT VERIFIED |
| Total / male / female population, households, age, SC/ST | No | — | — | Absent in AuditOnline; eGramSwaraj NOT VERIFIED |
| Elected representatives (names, gender, category) | No | — | — | Absent in AuditOnline; eGramSwaraj NOT VERIFIED |
| Committees | No | — | — | Absent; NOT VERIFIED for eGramSwaraj |
| Panchayat officials | Partly | Block/GP | `auditeeRegisteredDetails*`: auditee **official's name and designation**, deliberately **not collected** (personal data) | VERIFIED exists; withheld |
| Auditors | Yes | Office | name, designation, **e-mail, mobile**: **not collected** | VERIFIED exists; withheld |

Population demographics and the make-up of elected bodies are separate questions. AuditOnline answers neither.

## 4. Public finance data catalogue (Deliverable C)

AuditOnline records **the audit of Panchayat accounts, not the accounts themselves**. No response contains a rupee amount. The table shows what it does say about Panchayat finance. All rows are VERIFIED, and units are counts unless stated.

| Information | Field(s) / report | Level | Notes and definitions |
|---|---|---|---|
| Grant streams covered by the audit | `schemeName` / `scheme` ("Others,TFC,14FC,15FC") | GP | TFC, 14FC and 15FC are the 13th, 14th and 15th Finance Commission grants; "Others" is not defined in the responses. The AuditOnline introduction deck says the pilot was 14th Finance Commission accounts for FY 2019-20, via the PRIASoft–PFMS Interface |
| Period audited and audit dates | `auditPeriod`, `auditStartDate`/`auditEndDate`, `scheduleStartDate`/`scheduleEndDate` | GP | dd/mm/yyyy strings. An audit of FY 2024-25 is held after the year ends, e.g. Dec 2025 – Mar 2026 |
| Accounts audited (yes/no) | `gpWithAuditReportGeneratedDetail.count` (1 = report generated) | GP | |
| Audit observations ("paras") | `observationCount*Report.count` | State → GP | Total per Panchayat; Bihar 2024-25: 81,208 |
| Observation categories | `observationCountCategoryReport` (22 categories in Bihar 2024-25) | State, GP | Finance-related categories include "02 Excess Utilization of Grant", "04 Non Utilization of Grants before lapsable date", "05 Misutilization of Grants or Funds", "06 Non Utilization of Earmarked funds", "07 Non collection of dues", "08 Advances pending adjustment", "10 Non remittance of deductions recoveries", "12 Misappropriations and Funds", "13 Excess Payments", "14 Wasteful Expenditure", "16 Pendency of Utilization Certificates", "19 Financial status of Panchayat and physical status of schemes" |
| Sub-categories | `observationCountSubCategoryReport` | State | e.g. under 19: "Budget not prepared by PRIs", "Budget prepared but not on a prescribed format", "Out standing Audit Fee" |
| Risk grading of paras | GP Level Audit Status Report: MAJOR (High/Moderate/Low) and OTHER risk paras | District | XLSX, 23 columns, 3 header rows |
| Settlement and action taken | `auditSettlementReportCount`, `action_taken_count`; status-report columns "Dropped Paras", "Paras with Action Implemented", "…Under Implementation" | State → GP | Bihar 2024-25: 0 settlement reports and 0 action taken at the time of access |
| Year book (annual accounts) closed | Year Book Closed / Not Closed | GP | Produced by eGramSwaraj accounting (INDIRECT). Shows that accounts are kept and closed in eGramSwaraj, not what they contain |

**What is not here:** funds received, grant allocations, opening or closing balances, tied or untied grants, scheme-wise or activity-wise expenditure, vouchers, vendors, GPDP activities, estimated costs, physical or financial progress. All of these would come from eGramSwaraj's accounting, planning and reporting modules, which are **NOT VERIFIED**. Do not read observation counts as amounts. An observation such as "Non Utilization of Grants" says that the auditor raised the issue, not how much money was involved.

## 5. Geographic coverage matrix (Deliverable D)

✔ = available and collected · ◐ = available, summary only · ✖ = not available · ? = not verified (host unreachable)

| Report | State | District | Block | GP | Village |
|---|---|---|---|---|---|
| Audit plans (GP count, auditee count, audit dates, schemes) | ✔ | ✔ | ✔ | ✔ | ✖ |
| Registered auditees | ✔ | ✔ | ✔ | withheld (names) | ✖ |
| GPs with audit report generated | ✔ | ✔ | ✔ | ✔ | ✖ |
| Audit observations, total | ✔ | ✔ | ✔ | ✔ | ✖ |
| Audit observations by category | ✔ (Bihar) | ✖ | ✖ | ✔ (endpoint per GP; sampled for 30 GPs) | ✖ |
| Audit observations by sub-category | ✔ (Bihar) | ✔ (endpoint exists; not collected) | ✔ (endpoint exists; not collected) | ✔ (endpoint exists; not collected) | ✖ |
| Settlement report status | ✔ | ✔ | ✔ | ✔ | ✖ |
| Action taken | ◐ | ✔ | ✔ | ? | ✖ |
| GP Level Audit Status Report (risk paras) | ◐ | ✔ | ✖ (row per district) | via `gpLevelDataForExcelDownload` (not explored) | ✖ |
| Year Book Not Closed | — | ✔ | ✔ | ✔ (list of GPs) | ✖ |
| Year Book Closed (eGramSwaraj API) | ? | ? | ? | ? | ? |
| eGramSwaraj profile, finance, planning, progress | ? | ? | ? | ? | ? |

**Drill-down: yes, all the way to GP.** Every count above can be followed from Bihar to a district, a block and a named GP with its code. Collection results: section 5a, filled in from `data/analysis/egs/`.

<!-- COVERAGE -->

## 6. Historical coverage matrix (Deliverable E)

<!-- HISTORY -->

## 7. Sample data repository (Deliverable F)

All originals are under `data/raw/EGS-AO/2026-11-20/`, saved byte for byte as served and set read-only. Each one has a record in `data/provenance.jsonl` (source `EGS-AO`) with the full URL, method, parameters, report name, geographic level, financial year, HTTP status, content type, size, sha256 and retrieval time in UTC and IST. Folders follow `<level>/<endpoint>/<parameters>.<ext>`.

<!-- SAMPLES -->

## 8. Data accessibility assessment (Deliverable G)

| Aspect | AuditOnline (VERIFIED) | eGramSwaraj (NOT VERIFIED) |
|---|---|---|
| Login | Not needed for any report listed in 2.2 | Unknown |
| CAPTCHA | None on any report page (checked page source) | Unknown; the explorer records and skips any |
| Session | A session cookie (`JSESSIONID`) is set on the home page. Some form pages render their form only within a session; JSON endpoints answer without one. Document links carry a per-session `OWASP_CSRFTOKEN` | Unknown |
| Documented API | **None.** The JSON endpoints are undocumented, found in the site's JavaScript | `getMobileData` endpoints exist (INDIRECT); undocumented |
| Download formats | JSON (all data endpoints); server-side XLSX for two reports; other "Excel/PDF" buttons are built in the browser from the on-screen table | Unknown |
| Geographic restriction | None seen | **Refuses non-Indian connections** (section 1) |
| Quirks | JSON responses carry `Content-Disposition: inline;filename=f.txt`. Unknown or invalid requests return an HTML error page ("Lost Cloud - Error page") **with HTTP 200**, so status alone does not show success. Some endpoints return `"0"` strings as placeholders (e.g. `auditPeriod: "0"`) | — |
| Personal data | Auditor contact details and auditee officials' names are public on the site; deliberately not collected | Explorer withholds pages with ≥5 phone numbers or e-mails |

## 9. Collection automation assessment (Deliverable H)

| Report | Method | Repeatable? | Effort |
|---|---|---|---|
| All AuditOnline JSON reports (2.2) | `scripts/egs_auditonline.py` (stdlib only) | Yes; resumes within a day; new day = new dated folder | Bihar, all years, all levels: about 2,400 requests per year at GP level (about 1 hour at 1.4 s per request); state, district and block levels only: about 300 per year |
| GP Level Audit Status (XLSX) | same script, POST then GET | Yes | 1 request per year |
| Year Book Not Closed | same script (POST form) | Yes | 1 per year |
| Per-GP observation categories | same script; sampled for one block; full run = one request per GP per year (~8,000) | Yes | about 3 hours per year |
| eGramSwaraj `getMobileData` Year Book API | `scripts/egs_explore.py` step 2 | Expected yes (JSON) | Needs an Indian connection |
| All eGramSwaraj profile, finance, planning and progress reports | `scripts/egs_explore.py` steps 1 and 3 (crawl + form filling); a dedicated collector to be written from its output | To be established | Needs an Indian connection |

Manual work needed: none for AuditOnline. For eGramSwaraj, one person in India runs one command (section 10).

## 10. What is needed to finish Task 4

On any computer in India with Python 3.9+ and this repository:

```bash
python scripts/egs_explore.py
pip install playwright
python -m playwright install chromium
python scripts/egs_explore.py --forms --skip-crawl
```

The first command crawls up to 1,500 pages across the four hosts, one per second, then calls the year-book API. The last one fills every form that offers Bihar, drills down three levels and saves any Excel/PDF/CSV export. It prints the path of `egs_explore_<date>.zip`. Send that file back (or commit `data/`). From it, sections 2–9 can be completed for eGramSwaraj with VERIFIED evidence, and a dedicated collector can be written for the reports that matter.

## 11. Data gaps report (Deliverable I)

<!-- GAPS -->

## 12. Answers to the specific questions

<!-- ANSWERS -->

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

