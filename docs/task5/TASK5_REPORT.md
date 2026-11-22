# IBN Task 5: eGramSwaraj Data Profiling, Validation and Standardisation (Bihar)

22 November 2026 · `ayushjha4wd/ibn-collector`

## 0. Summary

Task 5 tests whether the eGramSwaraj data collected for Bihar in Task 4 is accurate, understandable, consistent and traceable enough for later analysis. It builds on the Task 4 originals (`data/raw/EGS-PORTAL/`), the preliminary clean tables (`data/clean/egs/`) and their provenance. It does not integrate other sources or analyse the data.

**How to run it**

```bash
python scripts/egs_validate.py --check
```

This reads every clean table, re-reads the cited original pages, runs 112 checks, writes a separate validated layer to `data/validated/egs/`, then runs a second time and confirms that every output is byte-identical.

**Overall results**

| Result | Count |
|---|---|
| PASS | 90 |
| WARNING | 20 |
| UNRESOLVED | 1 |
| NOT TESTABLE | 1 |
| FAIL | 0 |

Every check records what it tested, how many records it tested, and how many did not pass (`validation_checks.csv`). Each record that did not pass is listed (1,159 in `validation_exceptions.csv`), and 29 issues are consolidated in `data_quality_summary.csv`.

**What can be relied on**

1. **Extraction is accurate.**
   - All 77,137 rows of the ten finance and accounting tables were found again in the same row of their original page, using a second, independent HTML reader. All 371,660 stored values were matched exactly. No value differed and no row was missing.
   - Every as-served amount parses to its stored number (B1, B2, D2).
2. **Units are correctly separated.**
   - Rs crore columns are filled only where the page prints "(Cr)", and rupee columns only where it does not (B3).
   - "Receipts" (up to 2020-21) and "OB + Receipts (Cr)" (from 2021-22) are kept in separate columns and never combined.
3. **Each page adds up.** Wherever a report prints its own Total, the rows sum to it within print rounding:
   - 2,134 village pages (R1);
   - 1,672 block pages (R5);
   - 66 district pages (R6).
4. **The hierarchy holds.**
   - All 534 blocks sit under exactly one district.
   - Every district and block row in the finance and accounting tables now carries a code confirmed by its own link on the original page and by eGramSwaraj's code list (C1, C6).
5. **GP codes rest on page evidence where the page provides it.** 10,726 GP finance rows carry a code confirmed by both the page link and the code list.

**What needs care**

1. **Snapshots disagree.**
   - Reports for the same year that were generated at different times often differ. For example, GP rows vs block statement differ in 55 cases, and block rows vs district statement in 51 cases.
   - None of these differences occurs between figures from the same report generation. They are recorded as WARNING, never adjusted.
2. **GP codes not yet settled.**
   - 48 of the 102 GP finance rows that Task 4 could not match are still unresolved. All are from 2020-21.
   - 47 of them have a single exact-name candidate taken from the same block's code list in another year. That candidate is listed but **not assigned**.
   - 5,612 rows (mostly 2020-21) have no code link on their page. Their code rests on an exact name match only.
3. **A defect in the preliminary step.**
   - 4 getMobileData GP lists are not UTF-8, and Task 4's `egs_clean.py` skipped them silently.
   - The validated layer decodes them and restores their GP rows, marked `row_origin`.
4. **Known gaps remain.** None of these is filled:
   - no population or household data;
   - CAPTCHA-protected reports;
   - XV FC tied-grant values;
   - district-level elected representatives;
   - GP finance for only two years;
   - no unspent balances.

## 1. Datasets examined

Every table in `data/clean/egs/` was inventoried and profiled (`dataset_profile.csv`, `field_profile.csv`). The schemas were checked against the files themselves.

**What the files actually contain, compared with the documentation:**

- `block_finance` and `block_accounting_status` hold block names but **no block codes**.
- The district-level tables hold no district code.
- `gp_year_book_closed` was missing the GPs of four blocks-years (section 5).
- `state_indicators` has no financial-year column. Its reference year is only in the request query.

| Dataset | Level | Rows | Years | Report generated | Portal "Total" rows |
|---|---|---|---|---|---|
| state_year_summary | state | 45 | 2012-13 … 2026-27 | 2024-10-23 to 2026-11-20 | 0 |
| district_finance | district | 429 | 2016-17 … 2026-27 | 2022-02-20 to 2026-11-21 | 11 |
| block_finance | block | 6,292 | 2016-17 … 2026-27 | 2022-02-20 to 2026-11-21 | 418 |
| gp_finance | gram panchayat | 17,508 | 2020-21, 2024-25 | 2022-07-18 to 2026-11-21 | 1,068 |
| district_scheme_finance | district / state row | 1,683 | 2020-21 … 2026-27 | 2021-08-20 to 2026-11-21 | 42 |
| monthly_finance | ZP or BP body × month | 13,932 | 2020-21 … 2026-27 | 2022-07-18 to 2026-11-21 | 0 |
| monthly_vouchers | district or block × month | 13,968 | 2020-21 … 2026-27 | 2022-07-18 to 2026-11-21 | 0 |
| district_accounting_status | district | 456 | 2015-16 … 2026-27 | 2022-02-20 to 2026-11-21 | 0 |
| block_accounting_status | block | 6,384 | 2015-16 … 2026-27 | 2022-01-30 to 2026-11-21 | 0 |
| gp_accounting_status | gram panchayat | 16,440 | 2020-21, 2024-25 | 2022-07-18 to 2026-11-21 | 0 |
| gp_year_book_closed | gram panchayat | 16,373 (+68 restored = 16,441) | 2020-21, 2024-25 | live JSON, retrieved 2026-11-22 | 0 |
| state_indicators | state | 84 | request year=2026 / FY 2024-25, 2026-27 | live JSON, retrieved 2026-11-22 | 0 |
| audit_gp (**supplementary, AuditOnline**) | gram panchayat | 16,439 | 2020-21, 2024-25 | live JSON | 0 |

AuditOnline is profiled and its codes are checked, but it is written to `data/validated/egs/supplementary_auditonline/` and is never merged with the eGramSwaraj tables.

## 2. Workstream A: data dictionary

`data/validated/egs/data_dictionary.csv` documents all 322 fields, of the 13 datasets plus the fields that the validated layer adds. For each field it records:

- dataset;
- original portal report (title and URL pattern);
- field name and meaning;
- administrative level;
- financial years in which the field has values;
- unit and data type;
- non-empty and empty counts;
- source reference;
- report generation dates;
- known limitations.

Every field has a definition (check A2). The definitions are kept, reviewable, in `config/egs_field_definitions.csv`, and each one cites where it comes from. They come from:

- the portal's own report titles and column headings;
- the printed note on scheme pages: "(RV-Receipt Voucher)( PV-Payment Voucher)(CV-Contra Voucher)(JV-Journal Voucher)";
- the Task 4 report.

Where the portal does not define a term, the dictionary says so rather than supplying a textbook meaning. For example, what a contra or journal voucher records, what "masters" are, and what the cancellation columns mean are all marked as not defined on the page.

**Key financial terms, as established from the originals:**

| Term (as printed) | Where | Unit | What the evidence shows |
|---|---|---|---|
| Receipts / Payments | District and block statements up to 2020-21 | Rs (unit not printed; values carry paise) | Labelled "Receipts", not "OB + Receipts". For 2020-21 the GP sums equal the State & Year Wise Summary's "Receipt Amount" exactly (R7) |
| OB + Receipts (Cr) / Payments (Cr) | District and block statements from 2021-22 | Rs crore (3 to 7 decimals) | Opening balance plus receipts. Not expenditure, and not the same as the earlier "Receipts" |
| Receipts / Payments | Village wise statement (every GP) | Rs (not printed) | The page does not say whether the opening balance is included. In 2024-25 the GP sums equal the district "OB + Receipts (Cr)" in all 38 districts (R2), which is consistent with the opening balance being included, but the page does not state it |
| Receipt Amount / Payment Amount (In Rs.) | State & Year Wise Summary | Rs | A snapshot per year |
| Opening Balance | Month Wise Payment and Receipt Statement | Rs | One value per body and year |
| RV / PV / CV / JV | Summary and scheme pages | count | Receipt, Payment, Contra and Journal Voucher, as defined by the printed note |
| Day / Month / Year Book Closed | Summary reports | yes/no (body); count (Panchayats) | Closure stages in eGramSwaraj accounting. They depend on the snapshot date |

**Month-wise statements against the annual figures (R10, exploratory).** For 2,242 of 2,322 ZP and BP body-years, the annual figure is reproduced as follows:

- For OB + Receipts (Cr): opening balance plus the sum of monthly Receipts (703 cases). In 20 cases, Receipt and OB Cancellations also have to be subtracted.
- For Payments (Cr): in 436 cases the annual figure matches only after Payment Cancellation/Rejected is subtracted.

This is consistent with the annual statements being net of cancellations. The pages do not define the cancellation columns, so this is recorded as an observation, not a definition.

## 3. Workstream B: financial validation

| # | Check | What was tested | Result |
|---|---|---|---|
| B1 | Values against the originals | Every row of state_year_summary, district, block, GP, scheme and monthly finance, and monthly vouchers, re-found in the same row of its cited page. The HTML reader is independent of the extractor and ignores rowspan padding. Each stored value must equal a number in that row, and each as-served text must equal a cell verbatim | **PASS**: 53,857 rows, 198,740 values; 0 not found, 0 different |
| B2 | Indian number format | Each as-served amount parses (commas removed) to the stored number; the grouping is classified | **PASS**: 52,404 amounts. Indian grouping, plain, and the portal's own style (`3,861,03,59,497.17`, no grouping above the crore place) are all parsed correctly |
| B3 | Units | `_cr` columns filled only where the page prints "(Cr)", `_rs` only where it does not, never both in one row | **PASS**: 6,721 rows |
| A1 | Duplicates | Repeated dataset keys and fully identical rows | **PASS**: none in any dataset |
| B5 | Missing values | Empty amount cells where the year's layout has the column (the other layout's columns, and the ZP tier on block pages, are not applicable) | **WARNING**: 8. `bp_payments_cr` is empty for 8 blocks in 2021-22 (e.g. Chhaurahi, Hilsa, Phulwari). These are left empty, not set to 0 |
| B6 | Range | Negative amounts; amounts above Q3 + 10 × IQR and 50 × the median of non-zero values in the same year, field and tier | **WARNING**: 0 negative; 58 unusually large values listed for review and left unchanged |
| B7 | Portal totals | Rows printed as "Total" are flagged `is_portal_total=yes` and carry no geographic code | **PASS**: 1,497 total rows flagged (11 district, 418 block, 1,068 village pages) |

**Reconciliation across levels** (`financial_reconciliation.csv`, 11,983 comparisons)

Each comparison records:

- child sum and parent value, with unit, difference and tolerance;
- the generation time of both sides, to the minute;
- the definitions compared and whether they are compatible;
- a status.

**Tolerance** is set by print precision, never chosen to make a total match:

- one unit of the parent's last printed decimal;
- with a floor of Rs 10. The block statement's crore figures differ from exact rupee sums by a few rupees in the 7th decimal;
- or half a unit per summed printed value.

**Status rules:**

| Status | When |
|---|---|
| FAIL | A difference beyond tolerance between figures from the same page, or from reports generated at the same minute |
| WARNING | A difference between reports generated at different times, or between different definitions |
| NOT TESTABLE | No comparable parent exists |

| ID | Comparison | Comparisons | PASS | WARNING | NOT TESTABLE |
|---|---|---|---|---|---|
| R1 | GP rows → village page's own Total | 2,136 | 2,134 | 0 | 2 (block 2513, 2024-25: the page lists no GP rows) |
| R2 | GP rows → district statement, Village Panchayat column (2020-21, 2024-25) | 152 | 152 | 0 | 0 |
| R3 | GP rows → block statement, Village Panchayat column | 2,136 | 2,079 | 55 (39 in 2020-21, 16 in 2024-25) | 2 |
| R4 | Block rows → district statement | 1,672 | 1,621 | 51 | 0 |
| R5 | Block rows → block page's own Total | 1,672 | 1,672 | 0 | 0 |
| R6 | District rows → district page's Total | 66 | 66 | 0 | 0 |
| R7 | GP rows → State & Year Wise Summary | 4 | 2 (2020-21: exact) | 2 (2024-25: summary is a 23 Oct 2024 mid-year snapshot) | 0 |
| R8 | District Total → State & Year Wise Summary, per tier | 66 | 47 | 19 | 0 |
| R9 | Scheme district rows → Bihar's row on the all-states scheme page | 252 | 195 | 57 | 0 |
| R10 | Month-wise statement → annual statement (same body) | 2,322 | 2,242 | 80 | 0 |
| R11 | Scheme-wise district statement (all listed schemes) → district statement, same tier | 1,505 | 1,075 | 430 | 0 |

**What the reconciliation shows:**

1. **The Task 4 starting points hold, with their conditions verified.**
   - 2024-25: GP rows equal the district statement's Village Panchayat totals in every district (R2), across different labels ("Receipts" vs "OB + Receipts (Cr)"). The labels differ, so the comparison is recorded as definitionally different (`definitions_compatible = no`) even though the numbers agree.
   - 2020-21: GP rows equal the State & Year Wise Summary exactly: Rs 2,350,531,006.54 receipts and Rs 2,086,008.55 payments (R7).
2. **The 2020-21 snapshots disagree in places.**
   - In 39 blocks, the GP rows of the village pages (generated 18 Jul 2022 03:58) exceed the block statement (generated 02:49 the same morning). For example, block 2229: Rs 2,799,817 against Rs 2,232,317.
   - The same pattern appears between block and district statements (R4, 15 districts in 2020-21).
   - These are recorded as WARNING because the reports were generated at different times. Whether the data changed in that hour or the pages are inconsistent cannot be determined from the originals.
3. **The 2025-26 scheme-wise statement appears to double-count (R11).** From 2020-21 to 2024-25 and in 2026-27, the scheme-wise district statement (all listed schemes added up) equals the district statement: the median ratio is 1.000 in every one of those years.
   - In 2025-26, 226 of the 228 district-tier comparisons are **exactly twice** the district statement. That report was generated on 10 Sep 2026. For example, Patna's Gram Panchayats show Rs 432.89 crore of XV FC receipts against Rs 216.454 crore "OB + Receipts" in the district statement.
   - Voucher counts on the same page are **not** doubled (Patna GP receipt vouchers: 3,658 on the scheme page, 3,659 in the district summary).
   - This points to a fault in that report's amounts. The 2025-26 scheme-wise amounts should not be used; use the district statement instead (issue EGS-DQ-013).
4. **District statements against the State & Year Wise Summary (R8).**
   - Payments agree where both were generated close together.
   - For 2024-25 they differ by up to Rs 1,447 crore. The summary is a mid-year snapshot from 23 Oct 2024.
   - For 2021-22, the district "OB + Receipts (Cr)" total (Rs 3,403.31 crore) is **smaller** than the summary's "Receipt Amount" (Rs 3,429.16 crore), although both were generated on 23 Oct 2024 and OB + Receipts should not be smaller than receipts. This is listed for investigation and not explained.

## 4. Workstream C: geography and identifiers

**Reference structure.** `geographic_reference.csv` lists 1 state, 38 districts, 534 blocks and 8,388 GP codes. Each entry gives:

- every name spelling seen;
- its parent code;
- the years it appears;
- the source of its code.

The codes come from eGramSwaraj's own getMobileData lists and from the report URLs. Codes are the identifiers; names are descriptive attributes.

**Codes are taken from the source page.** Each row on eGramSwaraj's static pages links to its child report, and that link carries the unit's code. Examples:

- `ExpenditureReport2024-2025/10/179&name=2206.html` for block 2206;
- `ExpFY2024-2025/10&name=93638.html` for GP 93638.

The validated layer reads that link from the row itself, so the code is evidence printed on the same page as the value. Task 4 matched by name instead. The code is then confirmed against the getMobileData list for the same district, block and year.

| Check | Result |
|---|---|
| C1: block → district | **PASS**: 534 blocks, each under exactly one district; report URLs agree with the code list |
| C6: district and block codes on finance and accounting tables | **PASS**: every district row (874) and block row (12,258) verified by page link and code list |
| C3: GP codes on gp_finance (16,440 GP rows) | 10,726 verified (page link = code list = preliminary match); 54 newly resolved by page link; 5,612 name match only (the page has no link for that row, mostly 2020-21); **48 unresolved**; 0 conflicts |
| C4: the 102 rows Task 4 left unmatched | 54 resolved by a code printed in their own row link and confirmed in the code list. 48 remain **UNRESOLVED**, all from 2020-21 village pages with no link for that row. 47 of them have exactly one candidate in the same block whose spelling in another year's code list equals the page's name (e.g. SARBAHDA: code 95635 is spelt "SARBAHADA" in 2020-21 and "Sarbahda" in 2024-25). One (TULAPATTY) has no exact match. **None is assigned**; candidates are in `unmatched_geographic_records.csv` |
| C2: GP under the same block every year | **WARNING**: 1 code (98100) is under block 2480 in 2020-21 and block 2483 in 2024-25. Recorded; the reason (administrative change or reporting difference) is not stated by any source |
| C5: name consistency | **WARNING**: 55 GP codes have different spellings in different years (case, spaces, transliteration). No two codes share a name within one block |

**GP counts by year** (`gp_counts_by_year.csv`, every source side by side; none is preferred)

| FY | State summary | Sum of district summaries | getMobileData (districts) | GP finance rows | GP accounting rows | AuditOnline (supplementary) |
|---|---|---|---|---|---|---|
| 2012-13 | 8,474 | — | 8,474 | — | — | — |
| 2015-16 | 8,392 | 7,124 | 8,392 | — | — | — |
| 2018-19 | 8,386 | 8,380 | 8,386 | — | — | — |
| 2020-21 | 8,387 | 8,387 | 8,387 | 8,387 | 8,387 | 8,386 |
| 2022-23 | 8,176 | 8,176 | 8,078 | — | — | — |
| 2023-24 | 8,176 | 8,176 | 8,056 | — | — | — |
| 2024-25 | 8,054 | 8,054 | 8,054 | 8,053 | 8,053 | 8,053 |
| 2026-27 | 8,051 | 8,051 | 8,051 | — | — | — |

The count falls from 8,474 to about 8,050. No eGramSwaraj source states the reason, so none is recorded: no boundary change is inferred. Two differences are explained by the data itself:

- One 2024-25 Panchayat has no row because the village page of block 2513 (Bettiah) lists no GPs. getMobileData gives that block 1 Panchayat whose year book is not closed, consistent with the single GP on AuditOnline's "Year Book Not Closed" list in Task 4 (supplementary source, not merged).
- The district summaries for 2015-16 to 2017-18 do not cover every district.

## 5. Workstream D: accounting status and year-book closure

| Check | What was tested | Result |
|---|---|---|
| D2 | Voucher counts and Panchayat counts re-found in the same row of the original page (district, block, GP summaries) | **PASS**: 23,280 rows, 172,920 values |
| D1 | Closure and entry fields contain only "yes"/"no"; counts are whole numbers ≥ 0 | **PASS**: no other values, no empty status cells |
| D3 | Panchayats at a stage ≤ Panchayats in the unit | **PASS** |
| D3 (observation) | Year book shown closed while month book is shown not closed | **PASS**: none |
| D4 | GP rows' "yes" counts and voucher sums equal the block summary | **WARNING**: 25 differences out of 10,670 (2020-21 voucher counts), all between pages generated at different times |
| D4b | Block rows add up to the district summary | **WARNING**: 314 of 7,296 (mostly 2021-22 to 2023-24), all between pages generated at different times (e.g. Araria 2021-22: district page 01:03, block page 15:24; 212 vs 211 GPs) |
| D5 | Per GP: static Village Wise Summary "Year Book Closed" against getMobileData `count` | **PASS**: 16,392 GPs compared; no difference |
| P2 | getMobileData responses decode | **WARNING**: 4 GP lists (blocks 6805 and 6806, both years) are cp1252, not UTF-8. `egs_clean.py` skipped them, so 68 GP rows (34 GPs in each of the two years) were missing from `gp_year_book_closed` and from the name matching. They are restored in the validated table with `row_origin` |

**Year-book closure across snapshots.** `accounting_snapshot_comparison.csv` lists, for each FY, the GP year-book figures from five sources, each with its generation or retrieval date:

- the State & Year Wise Summary;
- the sum of district summaries;
- the Village Wise Summary;
- getMobileData;
- getYearBookDrill.

For 2024-25 these read 0 (summary of 23 Oct 2024), 8,053 (district summaries of 21 Nov 2026), 8,053 (village summaries), 8,053 (getMobileData) and 8,053 (getYearBookDrill). The 0 is a snapshot taken before the year ended, not an error.

AuditOnline is not used here except as a separate column in the GP count table.

## 6. Workstream E: administrative and representative indicators

`administrative_indicators.csv` holds the results.

| Check | Result |
|---|---|
| E1: male + female + other = total, per tier | **PASS**: ZP 455 + 647 + 1 = 1,103; BP 4,905 + 6,760 + 1 = 11,666; GP 62,931 + 77,292 + 25 = 140,248 |
| E2: Panchayats represented vs the summary | **PASS**: 38 ZPs, 534 BPs, 8,051 GPs = State & Year Wise Summary 2026-27. The request said `year=2026` and the response gives no reference date, so matching it to FY 2026-27 is an assumption (noted) |
| E4: repeated captures | **PASS**: no conflicting values |
| E5: profile | **PASS**: GPs with profile 7,661 ≤ 8,051; updated 2,009 ≤ 7,661. This is profile **completion** only; no population field |
| E6: GPDP upload | **PASS**: 2024-25 GP 8,053/8,053, BP 533/534, ZP 38/38; 2026-27 GP 8,044/8,051, BP 533/534, ZP 37/38. Upload status only; plan contents and approved amounts are not in the data |
| E7: geo-tagging, ongoing activity | **PASS**: GPs with geo-tagging 8,006 ≤ 8,053 (2024-25). The field "count" (92,212) counts tagged items, not GPs |
| E8: population / household / SC-ST | **NOT TESTABLE**: none of the 123 distinct field names in the captured JSON refers to population, households, census, SC/ST or caste. No such fields were created |

The gender split is that of elected representatives. It does not describe the population.

## 7. Workstream F: historical comparability

`historical_comparability.csv` has 297 rows, one per indicator and year. Each row gives:

- level, unit and definition as printed;
- generation date and retrieval date;
- number of records;
- the state of the value: recorded, year in progress, zero (not recorded in eGramSwaraj), or missing;
- a classification and its limitations.

| Indicator | Classification | Why |
|---|---|---|
| District and block receipts | **Not directly comparable** across 2020-21 / 2021-22; **comparable with conditions** from 2021-22 to 2026-27 | "Receipts" (Rs) becomes "OB + Receipts (Cr)", a different definition and unit. From 2021-22 the snapshot dates differ and 2026-27 is in progress |
| District and block payments | **Comparable with conditions** | Same label; the unit changes from Rs to Rs crore and must be converted. Snapshot dates differ |
| State & Year Wise Summary, 2012-13 to 2019-20 | **Not directly comparable** | 0 means "not recorded in eGramSwaraj", not zero spending |
| State & Year Wise Summary, 2020-21 onward | **Comparable with conditions** | All files up to 2024-25 were generated on 23 Oct 2024; 2024-25 is mid-year, and 2026-27 is in progress |
| GP receipts and payments | **Comparable with conditions** (2 years only) | 2020-21 was Bihar's first year in eGramSwaraj (Rs 0.21 crore payments in total); the GP universe differs (8,387 vs 8,053) |
| Accounting stages and voucher counts | **Comparable with conditions** | Depend on snapshot date; earlier files were generated by PRIASoft / accountingonline.gov.in |
| Scheme receipts and payments | **Comparable with conditions** | The schemes listed for Bihar change by year (OWN, XV FC, FFC); "not listed" is not zero |
| Elected representatives | **Not enough evidence** | One reference point only |
| GPDP upload, profile, geo-tagging, ongoing activity | **Comparable with conditions** | Live JSON with no generation date; two request years |

## 8. Workstream G: data quality register

`data_quality_summary.csv` holds 29 issues. Each gives its ID, dataset and field, level, year, category, description, records affected, severity, evidence, action and status. The gaps that the brief requires are all recorded:

| ID | Issue | Status |
|---|---|---|
| EGS-DQ-001 | GP finance collected only for 2020-21 and 2024-25 | UNRESOLVED |
| EGS-DQ-002 | 102 unmatched GP rows: 54 resolved from page evidence, 48 unresolved | UNRESOLVED |
| EGS-DQ-003 | XV FC tied-grant values not collected (Report Type not chosen) | NOT TESTABLE |
| EGS-DQ-004 | District-level elected-representative drill-down not captured | NOT TESTABLE |
| EGS-DQ-005 | No population, household or SC/ST fields in examined open reports | NOT TESTABLE |
| EGS-DQ-006 | 39 CAPTCHA-protected forms (profile and finance) not collected | NOT TESTABLE |
| EGS-DQ-007 | GPDP upload status only; plans and approved amounts unverified | WARNING |
| EGS-DQ-008 | Unspent / closing balances not available; not derived | NOT TESTABLE |
| EGS-DQ-009 to 012 | Definition change, snapshots, zero vs not recorded, village "Receipts" definition | WARNING |
| EGS-DQ-013 | 2025-26 scheme-wise statement amounts are twice the district statement (R11b) | WARNING (High) |
| EGS-DQ-014 onward | Missing values, unusual amounts, reconciliation and aggregation warnings, name variants, the GP listed under two blocks, the encoding defect in `egs_clean.py`, 5,612 name-match-only GP codes, block 2513 with no GP rows | WARNING / UNRESOLVED |

## 9. What was standardised

The validated layer is in `data/validated/egs/<dataset>.csv`. The clean tables in `data/clean/egs/` are not modified. Every original column and value is kept unchanged; the only additions are these columns:

| Added column | Content |
|---|---|
| `record_id` | Stable identifier (dataset, year, key fields) |
| `is_portal_total` | "yes" for the portal's own Total rows, so they are never counted as units |
| `source_url`, `source_sha256` | From `data/provenance.jsonl`, with the hash re-checked in this run |
| `district_code_validated`, `block_code_validated`, `gp_code_validated` | Codes from the row's own page link, confirmed in the code list. A name match is kept only where labelled; unresolved codes are left blank |
| `geo_status`, `geo_evidence` | How each code was established |
| `receipts_definition` | The definition and unit of the row's receipts, as printed |
| `row_origin` (gp_year_book_closed) | Marks the 68 rows restored from the 4 originals that the preliminary step could not decode |
| `validation_status`, `validation_flags` | The worst row-level result and the IDs of the checks the row did not pass |

**What was not done:**

- no value was changed;
- no empty value was filled;
- no unit was converted inside a column;
- no "Receipts" and "OB + Receipts" series were joined;
- no total was adjusted;
- no code was guessed.

## 10. Suitable for analysis, use with caution, further collection

**Suitable for analysis**, with the stated definitions and dates:

- GP, block and district receipts and payments **within one report generation**;
- 2024-25 GP finance with verified codes;
- district and block payments 2021-22 to 2025-26 (in crore);
- OB + Receipts 2021-22 to 2025-26;
- accounting stage counts for a dated snapshot;
- elected-representative totals by gender (state level, request year 2026);
- GPDP upload counts.

**Use with caution:**

- any comparison across report generations (always cite `report_generated_on`);
- 2020-21 at any level (first year of use; snapshot inconsistencies in R3 and R4);
- 2026-27 (in progress);
- GP rows whose code status is "name match only";
- scheme statements (schemes listed vary);
- the month-wise cancellation columns (undefined).

**Not usable for these purposes:**

- pre-2020-21 Bihar finance (not recorded);
- any population or household measure;
- unspent balances;
- approved GPDP amounts.

**Further collection** (separate follow-up; none requires bypassing an access control).

Items 1–3 run with one command on a computer in India:

```bash
python scripts/run_followup.py --delay 0.3
```

It commits and pushes the result.

1. GP pages for 2021-22, 2022-23, 2023-24, 2025-26 and 2026-27 (`egs_bihar.py --steps static --deep-years all`).
2. The XV FC tied-component report for ZP, BP and GP, 2018-19 onward, for Bihar's districts and GPs. It is fetched from the public JSON endpoints that the report page itself calls: `getTiedExpenditureData.do`, `getDistrictTExpData.do` and `getVillageDistTExp.do`, with `reportType` set to Z, B or V (`egs_bihar.py --steps endpoints`).
3. Elected-representative counts for Bihar by district, block and GP. These come from `ElectedStatePanReport*.do`, `ElectedStateZpWiseBpCount.do`, `findBpNameAndGPCountByZpCode.do` and `findGpNameAndERCountByBpCode.do`, all defined in the portal's own `ElectedRepresent-service.js`. The member-level `ElectedMemberRepresent.do` is deliberately not requested.
4. The 48 unresolved 2020-21 GP codes. Their village pages are static archives generated on 18 Jul 2022, so fetching them again returns the same file. These codes can be settled only by official evidence linking name and code for 2020-21, or left unresolved.
5. `egs_clean.py` now decodes cp1252 responses (fixed in the code). The clean tables will be rebuilt, and validated again, together with the follow-up data. Task 5 did not overwrite `data/clean/egs/`.
6. CAPTCHA-protected reports can be viewed only by a person (`egs_bihar.py --steps manual`).

## 11. Verification and reproducibility

| Test | Result |
|---|---|
| Raw files unchanged | All 19,583 EGS-PORTAL and EGS-AO originals listed in provenance match their recorded sha256 before the run (P0) and after it (P9); `git status` shows no change under `data/raw` or `data/clean` |
| Repeat run | `python scripts/egs_validate.py --check` ran the full validation twice; all 26 output CSVs were byte-identical (`logs/validation_run.json`, `repeat_run.identical = true`) |
| Unit tests | `python -m unittest tests/test_egs_validate.py`: 10 tests, all pass. They cover number parsing and grouping, empty-is-not-zero, the row reader and code links, rowspan handling, tolerance, and that reconciliation never adjusts a value and labels snapshot or definition differences as WARNING |
| Manual spot check | 8 randomly sampled records (GP finance, state summary, monthly finance, scheme finance) were located verbatim in their original HTML with a plain text search, outside the validation code |
| Run time | About 47 seconds per pass |

Inputs, outputs and their hashes are logged in `data/validated/egs/logs/validation_run.json` and `validation_run.log`.

## 12. Files

| File | What |
|---|---|
| `scripts/egs_validate.py` | Validation run: workstreams A–G, validated layer, reports, `--check` |
| `scripts/egs_validate_lib.py` | Independent HTML row reader, number checks, registers |
| `config/egs_field_definitions.csv` | Field and dataset definitions with evidence (feeds the data dictionary) |
| `tests/test_egs_validate.py` | Unit tests |
| `data/validated/egs/` | 12 validated core tables; `supplementary_auditonline/audit_gp.csv`; `data_dictionary.csv`; `dataset_profile.csv`; `field_profile.csv`; `validation_checks.csv`; `validation_exceptions.csv`; `financial_reconciliation.csv`; `accounting_snapshot_comparison.csv`; `geographic_reference.csv`; `unmatched_geographic_records.csv`; `gp_counts_by_year.csv`; `administrative_indicators.csv`; `historical_comparability.csv`; `data_quality_summary.csv`; `logs/` |
