# IBN Collector: Task 3 Data Collection Report

Nov 13, 2026 · @Zorant Technology

The IBN collector is a set of Python scripts that downloads India By Numbers source datasets, keeps the original files untouched and records where and when each one came from. Its first live run on 13 November 2026 collected **139 data files (PDF and Excel, 158 MB) from 8 of the 26 catalogue sources**, each traceable to its URL, download time and sha256 hash. Of the other 18 sources, 11 were blocked by the portals themselves and 7 need a person to download them by hand.

## Results by source

Eight sources delivered data; the CAG accounts and GST statistics make up most of it.

| Source | Dataset | Status | Data files | Size (MB) |
| --- | --- | --- | --- | --- |
| BR-PF-05c | Bihar Monthly Key Indicators (AG Bihar) | Collected | 69 | 46.1 |
| BR-PF-12 | GST statistics, all states | Collected | 53 | 6.0 |
| BR-PF-05 | Bihar Finance Accounts Vol I & II (AG Bihar) | Collected | 8 | 37.3 |
| BR-PF-05b | Bihar Appropriation Accounts (AG Bihar) | Collected | 4 | 33.8 |
| BR-PF-16 | PRS Bihar Budget Analysis 2026-27 | Collected | 2 | 2.1 |
| BR-PF-05a | Bihar Accounts at a Glance 2024-25 | Collected | 1 | 17.3 |
| BR-DM-16 | Population Projections 2011-2036 | Collected | 1 | 11.5 |
| DM-11 | Vital Statistics of India, CRS 2023 | Collected | 1 | 4.5 |
| BR-PF-13 | RBI State Finances: A Study of Budgets | Blocked (bot check) | 0 |  |
| BR-PF-14 | RBI Handbook of Statistics on Indian States | Blocked (bot check) | 0 |  |
| BR-PF-01 | Bihar State Budget documents | Blocked (expired certificate) | 0 |  |
| BR-PF-02 | Bihar Green Budget 2024-25 | Blocked (certificate chain) | 0 |  |
| BR-PF-04 | Bihar Economic Survey | Blocked (certificate chain) | 0 |  |
| BR-DM-09 | NFHS Bihar fact sheets | Blocked (certificate chain) | 0 |  |
| BR-PF-07 | CAG State Finances Audit Report 2026 | Blocked (outside India) | 0 |  |
| BR-PF-09 | Bihar State Finance Commission reports | Blocked (outside India) | 0 |  |
| BR-PF-22 | Bihar District Domestic Product 2011-12 | Blocked (outside India) | 0 |  |
| BR-DM-06 | Bihar Annual Vital Statistics Reports | Blocked (outside India) | 0 |  |
| BR-DM-08 | Bihar Statistical Handbook 2020 | Blocked (outside India) | 0 |  |
| BR-PF-10 | Bihar CFMS treasury system | Manual (login) | 0 |  |
| BR-PF-19 | eGramSwaraj panchayat reports | Manual (on-screen only) | 0 |  |
| BR-DM-01 | Bihar Caste-Based Survey 2022-23 | Manual (no stable URL) | 0 |  |
| BR-DM-02 | Census 2011 tables, Bihar | Manual (JavaScript site) | 0 |  |
| BR-DM-12 | Mission Antyodaya, Bihar | Manual (form) | 0 |  |
| BR-DM-14 | Bihar electoral roll statistics | Manual (published stats only) | 0 |  |
| BR-XC-03 | Local Government Directory, Bihar | Manual (CAPTCHA) | 0 |  |

Sizes include the saved portal page each file was linked from. Every collected file has a matching extracted copy (CSV for tables and spreadsheets, text per page for PDFs).

## How it works

One command runs each stage, and every stage is safe to re-run.

1. **Manifest.** `config/manifest.csv` lists each source: its catalogue ID, URL, and whether to fetch one file, follow the matching links on a page, or leave it for manual download. Adding a source means adding a row, not changing code.
2. **Collect** (`collect.py`). Downloads each file byte for byte into `data/raw/<source>/<date>/`, makes it read-only, and appends a record to `provenance.jsonl`: URL, final URL, linking page, time in UTC and IST, HTTP headers, size and sha256. It rejects cut-off downloads and bot-check pages, and never saves the same file twice.
3. **Extract** (`extract.py`). Writes machine-readable copies to `data/processed/`: text and tables from PDFs, one CSV per Excel sheet, UTF-8 CSVs, HTML tables. Each output folder carries an `extraction.json` that points back to its original.
4. **Verify** (`verify.py`). Re-hashes every original against the log, reports any file that is missing, changed or unlogged, and writes `data/inventory.csv` with one row per original.

Two helpers cover the rest: `register_manual.py` adds a hand-downloaded file with the same provenance record, and `flag.py` marks a bad original as invalid without deleting it.

## Task 3 requirements

All five requirements are met by the scripts themselves, so they hold on every run, not just this one.

| Requirement | How it is met |
| --- | --- |
| Preserve original files | Files are saved byte for byte and made read-only. Nothing is overwritten: a revised file is kept alongside the old one. Cut-off downloads are rejected. |
| Record download dates | Every attempt is logged with the time in UTC and IST, plus the server's Last-Modified and ETag headers where sent. Folders are named by the IST date of the run. |
| Maintain source references | Each record holds the catalogue source ID, requested and final URL, linking page, link text, size and sha256. `inventory.csv` lists all of it, one row per file. |
| Avoid manually modifying originals | Extraction writes only to `data/processed/` and re-checks each original's hash first. `verify.py` flags any original that is missing, changed or unlogged. |
| Repeatable extraction scripts | One command per stage. Re-runs log unchanged files as `unchanged` and extract each original only once. |

## Quality checks

The offline test suite passes all 45 checks, and `verify.py` confirms that all 524 saved originals still match their recorded hashes.

- **Offline test suite.** `tests/run_test.sh` runs the whole pipeline against a fake portal on localhost. It covers re-runs, revised files, manual registration, extraction, tamper detection, dropped connections, unsafe file names, bot-check pages and messy links.
- **Integrity check.** `verify.py` re-hashed every original after the run and found none missing, modified or unlogged.
- **Issue found and fixed: RBI bot-check pages.** RBI's site answered the collector with a JavaScript challenge page instead of the 368 spreadsheets and PDFs it linked to, and the first version saved those pages under `.xlsx` and `.pdf` names. The collector now checks the content of every download and refuses HTML or bot-check pages served for a file link. The 368 bad files, plus 8 unrelated CAG PDFs from an over-broad link pattern, are flagged invalid in `inventory.csv` and excluded from extraction. They are kept rather than deleted, so the record of what the sites served stays complete.

## Not yet collected

All 18 remaining sources fail for reasons on the portals' side, and each has a known next step.

| Cause | Sources | Next step |
| --- | --- | --- |
| Bot check (RBI) | BR-PF-13, BR-PF-14 | Download in a browser, then add with `register_manual.py --dir` |
| Refuses connections from outside India | BR-PF-07, BR-PF-09, BR-PF-22, BR-DM-06, BR-DM-08 | Re-run `collect.py` from a machine in India |
| Incomplete certificate chain | BR-PF-02, BR-PF-04, BR-DM-09 | Re-run with `--ca-bundle` that includes the missing Sectigo intermediate certificate |
| Expired certificate | BR-PF-01 | Retry once the site renews it, or download by hand |
| Login, form, CAPTCHA or JavaScript-only site | BR-PF-10, BR-PF-19, BR-DM-01, BR-DM-02, BR-DM-12, BR-DM-14, BR-XC-03 | Download by hand, then add with `register_manual.py` |

The run took place from a cloud machine outside India. Only the second row depends on that: a run from an Indian network should recover those five sources, while the certificate and bot-check problems occur from anywhere.

## Repository and how to run it

The code and all collected data are in the public repository [ayushjha4wd/ibn-collector](https://github.com/ayushjha4wd/ibn-collector); use **Code → Download ZIP** for a copy. Start with `data/inventory.csv`: filter `valid` to `yes` for the 148 usable originals.

To run it, install Python 3.9 or later and the packages in `requirements.txt`, then:

```bash
python scripts/collect.py --priority 1
python scripts/extract.py
python scripts/verify.py
```

`bash tests/run_test.sh` checks the whole pipeline offline in under a minute.
