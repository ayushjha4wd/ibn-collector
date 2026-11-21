# Bihar eGramSwaraj: clean tables

Built by `python scripts/egs_clean.py` from the read-only originals in `data/raw/EGS-PORTAL/` (eGramSwaraj)
and `data/raw/EGS-AO/` (AuditOnline). This is a **separate step after Task 4**. The originals are never
changed, and each file's sha256 is re-checked against `data/provenance.jsonl` before use.
`bihar_egramswaraj_clean.xlsx` holds every table below, one sheet each.

## Rules

* **Traceable.** Every row has `source_file`, the path of the original it came from. Most tables also
  give `report_generated_on`, the date printed in that report, and `retrieved_at_ist`.
* **Empty is not zero.** A blank cell in the portal stays blank here. "0" stays 0.
* **Numbers.** Indian digit grouping is removed ("3,861,03,59,497.17" → 38610359497.17). Where the
  amount matters, the original text is kept in an `*_as_served` column. A value that is not a clean
  number is left blank in the number column.
* **Units.** These are as printed: `_cr` = Rs crore, `_rs` = rupees. Units are not converted.
* **Latest copy.** When the same report URL was saved on several days, the latest copy is used.
* **Codes.** District and block codes come from the report URLs and from eGramSwaraj's own
  getMobileData lists. `gp_code` is the LGD code used by eGramSwaraj and AuditOnline. In
  `gp_finance` and `gp_accounting_status` the pages give only GP names, so `gp_code` is filled by
  matching the name to the getMobileData list of the **same block and year**, ignoring spaces and
  case. 16,338 of 16,440 GP rows matched. The rest are left blank and were not guessed.
* **No personal data.** Only aggregates and place names are kept.

## Tables

| File | Level | Years | What |
|---|---|---|---|
| `state_year_summary.csv` | Bihar × tier (zp/bp/gp) | 2012-13 … 2026-27 | Panchayats, with vouchers, receipt/payment vouchers, Receipt and Payment Amount (Rs), month/year book closed |
| `district_finance.csv` | district (+ Total) | 2016-17 … 2026-27 | Receipts and Payments of the ZP, BP and GP tiers. The layout changed: up to 2020-21 the page prints *Receipts* and *Payments* in rupees (`*_receipts_rs`, `*_payments_rs`); from 2021-22 it prints *OB + Receipts (Cr)* and *Payments (Cr)* (`*_ob_plus_receipts_cr`, `*_payments_cr`). The two are kept apart, and the other set of columns stays empty |
| `block_finance.csv` | block (+ district Total) | 2016-17 … 2026-27 | Same columns |
| `gp_finance.csv` | **every GP** (+ block Total) | 2020-21, 2024-25 | Receipts and Payments (Rs) of each Gram Panchayat |
| `district_scheme_finance.csv` | district, or "BIHAR (state row)" | 2020-21 … 2026-27 | Voucher counts, Receipts and Payments (Rs) by scheme and tier. District pages exist for OWN and XV FC. State rows exist only where the portal lists Bihar for that scheme |
| `monthly_finance.csv` | ZP (district page) or BP (block page) × month | ZP 2020-21 … 2026-27, BP 2020-21 and 2024-25 | Opening balance, receipts, cancellations, payments (Rs) of that Panchayat body's own accounts |
| `monthly_vouchers.csv` | district or block × month | as collected | Voucher counts: Receipts, Payments, Contra, Journal |
| `district_accounting_status.csv`, `block_accounting_status.csv`, `gp_accounting_status.csv` | district / block / GP | 2015-16 … 2026-27 (GP: 2020-21, 2024-25) | Masters, opening balance, voucher counts (RV/PV/CV/JV), day/month/year book closed |
| `gp_year_book_closed.csv` | GP | 2020-21, 2024-25 | getMobileData: `count_closed` of `totalcount` |
| `audit_gp.csv` | GP | 2020-21, 2024-25 | AuditOnline: in audit plan, audit dates, grant streams audited, audit report generated, number of observations, settlement reports |
| `state_indicators.csv` | Bihar | as served | State rows of browser-built reports: elected representatives by gender (ZP/BP/GP), profile completion, GPDP upload, ongoing activities, geo-tagging, year book drill, audit counts |

## Read before using

* **Receipts are not expenditure.** "OB + Receipts" includes the opening balance. "Payments" are
  payments recorded in the Panchayat's own accounts. They are not all government spending in the
  Panchayat's area, not budget allocations and not approved plans.
* **Each report is a snapshot.** It carries its own generation date, and reports for the same year
  generated on different days give different totals (see `report_generated_on`).
* **Check.** For 2024-25 the GP rows of `gp_finance` add up exactly to the district statement's
  Village Panchayat totals (Rs 4,221.843 crore receipts, Rs 2,872.269 crore payments). For 2020-21
  they add up to the State & Year Wise Summary (Rs 235.05 crore and Rs 0.21 crore).
* **No Bihar data before 2020-21.** The portal shows "0" / "0.00" for Bihar from 2012-13 to 2018-19.
  That means accounts were not kept in eGramSwaraj then, not that nothing was spent.
* **Totals.** Rows named "Total" are the portal's own totals. Remove them before adding up rows.
