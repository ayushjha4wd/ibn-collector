#!/usr/bin/env python3
"""Pull analysis-ready figures out of the collected files into data/analysis/insights/.

Each output CSV names the original file (and page, for PDFs) every value came from, so
any figure in the handbook can be traced back and checked. Nothing in data/raw is
touched; this reads the extracted copies in data/processed.

  gst_bihar.csv            Bihar's GST collection by financial year, share and rank
  state_finances.csv       Bihar's receipts, spending and deficits from the year-end
                           Monthly Key Indicators (budget estimate and actual)
  srs_rates.csv            Birth, death, infant mortality and fertility rates, Bihar and
                           India, 2009-2024 (SRS "annual estimates" tables)
  population.csv           Bihar's population 1901-2011 (Census) and 2016-2036 (projected)
  devolution.csv           Bihar's share of central tax devolution, 11th-16th FC
  fc16_inputs.csv          Bihar against all states: population, area, GSDP (16th FC data)
  census_districts.csv     District profile from the 2011 Primary Census Abstract
  village_amenities.csv    Share of inhabited villages with each amenity, by district (2011)

Run after extract.py and analyse.py.
"""
from __future__ import annotations

import csv
import glob
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROCESSED  # noqa: E402

OUT = DATA / "analysis" / "insights"
csv.field_size_limit(10 ** 9)


def files_by_name() -> dict[str, dict]:
    return {r["file"]: r for r in csv.DictReader(open(DATA / "analysis" / "files.csv", encoding="utf-8"))}


def folder(rec: dict) -> Path:
    return PROCESSED / rec["source_id"] / rec["sha256"][:12]


def page_text(rec: dict, name: str) -> str:
    """Text of one extracted page; the OCR text if the page had no text layer."""
    p = folder(rec) / name
    t = p.read_text(encoding="utf-8")
    ocr = p.with_name(p.stem + ".ocr.txt")
    return ocr.read_text(encoding="utf-8") if len(t.strip()) < 20 and ocr.exists() else t


def pages(rec: dict):
    for p in sorted(folder(rec).glob("page_*.txt")):
        if not p.name.endswith(".ocr.txt"):
            yield p.name, page_text(rec, p.name)


def write(name: str, rows: list[dict]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    print(f"  {name}: {len(rows)} rows")


def num(s: str) -> float:
    return float(s.replace(",", ""))


# ---- GST ------------------------------------------------------------------------
def gst(F):
    rows = []
    for name in sorted(k for k in F if k.startswith("statewise_GST_collection_")):
        rec = F[name]
        fy = re.search(r"(\d{4}-\d{2})", name).group(1)
        sheet = next(p for p in (folder(rec) / "sheets").glob("*.csv") if "ollection" in p.name)
        R = list(csv.reader(open(sheet, encoding="utf-8")))
        upto = next((r[0] for r in R[:4] if re.search(r"(?i)up\s*to", r[0])), "")
        hdr = next(i for i, r in enumerate(R) if "CGST" in r and "TOTAL" in r)
        ti = R[hdr].index("TOTAL")  # first TOTAL = financial-year total
        vals = {}
        for r in R[hdr + 1:]:
            code = r[0].strip() if r else ""
            if re.fullmatch(r"\d+", code) and int(code) < 97 and len(r) > ti and r[ti] not in ("", "-"):
                vals[r[1].strip()] = float(r[ti])  # codes 97/99: other territory, OIDAR
        b = vals["Bihar"]
        rows.append({"financial_year": fy, "bihar_gst_crore": round(b, 2),
                     "all_states_crore": round(sum(vals.values()), 2),
                     "bihar_share_pct": round(100 * b / sum(vals.values()), 2),
                     "rank_of_states_uts": sorted(vals.values(), reverse=True).index(b) + 1,
                     "states_uts": len(vals),
                     "period_note": ("Jul 2017-Mar 2018 (GST began July 2017)" if fy == "2017-18"
                                     else upto.replace("Data upto :", "data up to").strip() or "full year"),
                     "source_file": name})
    write("gst_bihar.csv", rows)


# ---- state finances (Monthly Key Indicators, year-end editions) ------------------
YEAR_END = {"2021-22": "MKI-March-S-2022", "2022-23": "MKI-MARCH-S-2023-064", "2023-24": "MKI-MARCH-S-2023-2024",
            "2024-25": "MKI-MARCH-S-2025-REVISED", "2025-26": "MKI-MARCH-SY-2026"}
ITEMS = [("Revenue receipts", r"^1\.\s*Revenue Receipts"), ("Tax revenue", r"^\(a\)\s*Tax Revenue"),
         ("GST", r"^\(i\)\s*GST"), ("Share of union taxes", r"^\(vi\)\s*State.s Share of Union Taxes"),
         ("Non-tax revenue", r"^\(b\)\s*Non\s*.?\s*Tax Revenue"), ("Grants-in-aid", r"^\(c\)\s*Grants\s*.?\s*in.?Aid"),
         ("Borrowings and other liabilities (net)", r"^\(c\)\s*Borrowings and Other"),
         ("Revenue expenditure", r"^4\.\s*Revenue Expenditure"), ("Interest payments", r"^\(b\)\s*Expenditure on Interest"),
         ("Salaries and wages", r"^\(c\)\s*Expenditure on Salaries"), ("Pensions", r"^\(d\)\s*Expenditure on Pension"),
         ("Subsidies", r"^\(e\)\s*Expenditure on Subsidy"), ("Capital expenditure", r"^5\.\s*Capital Expenditure"),
         ("Total expenditure", r"^7\.\s*Total Expenditure"), ("Revenue surplus (+) / deficit (-)", r"^9\.\s*Revenue Surplus"),
         ("Fiscal deficit (-)", r"^10\.\s*Fiscal"), ("Primary deficit (-)", r"^11\.?\s*Primary")]


def state_finances(F):
    rows = []
    for fy, pat in YEAR_END.items():
        [name] = [k for k in F if F[k]["source_id"] == "BR-PF-05c" and pat.lower() in k.lower()]
        lines = page_text(F[name], "page_001.txt").splitlines()
        for item, rx in ITEMS:
            for line in lines:
                if re.search("(?i)" + rx, line.strip()):
                    nums = re.findall(r"-?\d[\d,]*\.\d+", line)
                    rows.append({"financial_year": fy, "item": item, "budget_estimate_crore": num(nums[0]),
                                 "actual_crore": num(nums[1]), "source_file": name, "page": 1})
                    break
            else:
                raise SystemExit(f"state_finances: {item} not found in {name}")
    # internal check: revenue receipts - revenue expenditure = revenue surplus/deficit
    for fy in YEAR_END:
        v = {r["item"]: r["actual_crore"] for r in rows if r["financial_year"] == fy}
        diff = v["Revenue receipts"] - v["Revenue expenditure"] - v["Revenue surplus (+) / deficit (-)"]
        if abs(diff) > 1:
            raise SystemExit(f"state_finances {fy}: receipts - expenditure != reported deficit (off by {diff:.2f})")
    write("state_finances.csv", rows)


# ---- SRS --------------------------------------------------------------------------
SRS_TABLES = {"Birth rate (per 1,000)": r"Annual estimates of Birth rate",
              "Death rate (per 1,000)": r"Annual estimates of Death rate",
              "Infant mortality rate (per 1,000 live births)": r"Annual estimates of Infant mortality rate",
              "Total fertility rate (children per woman)": r"Annual estimates of Total Fertility rate"}


def srs(F):
    vals = {}  # (indicator, year, area) -> (value, source)
    for report in (2014, 2019, 2024):
        rec = F[f"SRS_STAT_{report}.pdf"]
        for pname, t in pages(rec):
            for ind, title in SRS_TABLES.items():
                m = re.search(r"(?i)Table\s*\d+\s*:?\s*" + title + r"[^\n]*?(\d{4})\s*-\s*(\d{2,4})", t[:400])
                if not m:
                    continue
                start = int(m.group(1))
                for area in ("Bihar", "India"):
                    row = re.search(rf"(?m)^\s*(?:\d+\.?\s*)?{area}\s+((?:\d+(?:\.\d+)?\s+){{5}}\d+(?:\.\d+)?)", t)
                    if not row:
                        continue
                    for i, v in enumerate(row.group(1).split()):
                        key = (ind, start + i, area)
                        src = f"SRS_STAT_{report}.pdf, {pname}"
                        if key in vals and abs(vals[key][0] - float(v)) > 1e-9:
                            raise SystemExit(f"SRS {key}: {vals[key]} disagrees with {v} ({src})")
                        vals.setdefault(key, (float(v), src))
    rows = []
    for (ind, year, area) in sorted(vals, key=lambda k: (k[0], k[1], k[2])):
        if area != "Bihar":
            continue
        india = vals.get((ind, year, "India"), (None, ""))[0]
        rows.append({"indicator": ind, "year": year, "bihar": vals[(ind, year, area)][0], "india": india,
                     "source": vals[(ind, year, area)][1]})
    write("srs_rates.csv", rows)


# ---- population -------------------------------------------------------------------
def population(F):
    rows = []
    sheet = next((folder(F["10_A-2_Bihar.xls"]) / "sheets").glob("*.csv"))
    R = list(csv.reader(open(sheet, encoding="utf-8")))
    state = False
    for r in R:
        if len(r) > 4 and r[2].strip().upper() == "BIHAR":
            state = True
        elif len(r) > 2 and r[2].strip():
            state = False  # a district block starts
        if state and len(r) > 4 and re.fullmatch(r"\d{4}", r[3].strip()) and r[4].strip():
            rows.append({"year": int(r[3]), "population": int(float(r[4])), "kind": "Census",
                         "source": "10_A-2_Bihar.xls (Census 2011 Table A-2)"})
    rec = F["Report_Population_Projection_2019.pdf"]
    for pname, t in pages(rec):
        if re.search(r"(?i)TABLE-21", t[:200]) and re.search(r"(?i)Projected Total Population", t[:300]):
            # the column headings are three years alone on a line ("2011 2016 2021"); the title also
            # contains "2011 – 2036", so it can't just take the first years it finds
            years = [int(y) for y in re.search(r"(?m)^\s*(20\d\d)\s+(20\d\d)\s+(20\d\d)\s*$", t).groups()]
            m = re.search(r"(?m)^\s*10\s+Bihar\s+([\d,]+)\s+[\d,]+\s+[\d,]+\s+([\d,]+)\s+[\d,]+\s+[\d,]+\s+([\d,]+)", t)
            for y, v in zip(years, m.groups()):
                if y > 2011:
                    rows.append({"year": y, "population": int(num(v)) * 1000, "kind": "Projected",
                                 "source": f"Report_Population_Projection_2019.pdf, {pname} (Table 21)"})
    write("population.csv", sorted(rows, key=lambda r: r["year"]))


# ---- Finance Commissions ----------------------------------------------------------
def devolution(F):
    rows = []
    t = page_text(F["Vol1-Main-Report.pdf"], "page_183.txt")
    m = re.search(r"(?m)^Bihar\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)", t)
    pop01, fc11, fc12, pop11, fc13, fc14, fc15 = (float(x) for x in m.groups())
    src = "Vol1-Main-Report.pdf (16th FC), page_183 (Table 8.4)"
    for fc, share, period in [("11th FC", fc11, "2000-05"), ("12th FC", fc12, "2005-10"), ("13th FC", fc13, "2010-15"),
                              ("14th FC", fc14, "2015-20"), ("15th FC", fc15, "2020-26")]:
        rows.append({"commission": fc, "period": period, "bihar_share_pct": share, "source": src})
    t16 = next(t for p, t in pages(F["Vol1-Main-Report.pdf"]) if "Table 8.9" in t[:300] and "Inter se" in t[:300])
    share16 = float(re.search(r"(?m)^Bihar\s+([\d.]+)", t16).group(1))
    rows.append({"commission": "16th FC", "period": "2026-31", "bihar_share_pct": share16,
                 "source": "Vol1-Main-Report.pdf (16th FC), Table 8.9"})
    t15 = next(t for p, t in pages(F["XVFC_VOL_I_Main_Report.pdf"]) if "Table 6.5" in t[:300])
    exact15 = float(re.search(r"(?m)^Bihar\s+([\d.]+)", t15).group(1))
    rows[4]["bihar_share_pct"] = exact15  # 15th FC to three decimals (Table 6.5); Table 8.4 rounds to 10.06
    rows[4]["source"] = "XVFC_VOL_I_Main_Report.pdf (15th FC), Table 6.5"
    for r in rows:
        r["population_share_2001_pct"], r["population_share_2011_pct"] = pop01, pop11
    write("devolution.csv", rows)

    sheet = next((folder(F["Horizontal_Devolution.xlsx"]) / "sheets").glob("*.csv"))
    R = list(csv.reader(open(sheet, encoding="utf-8")))
    b = next(r for r in R if r and r[0] == "Bihar")
    a = next(r for r in R if r and r[0] == "All States")
    out = []
    for label, i, unit in [("Population, Census 2011", 2, "million"), ("Population estimate 2023-24", 7, "million"),
                           ("Area", 8, "'000 sq km"), ("Comparable GSDP 2023-24", 13, "Rs crore")]:
        out.append({"measure": label, "unit": unit, "bihar": float(b[i]), "all_states": float(a[i]),
                    "bihar_share_pct": round(100 * float(b[i]) / float(a[i]), 2),
                    "source": "Horizontal_Devolution.xlsx (16th FC datasets)"})
    pc_b = float(b[13]) * 1e7 / (float(b[7]) * 1e6)
    pc_a = float(a[13]) * 1e7 / (float(a[7]) * 1e6)
    out.append({"measure": "GSDP per person 2023-24", "unit": "Rs", "bihar": round(pc_b), "all_states": round(pc_a),
                "bihar_share_pct": round(100 * pc_b / pc_a, 1), "source": "computed from the rows above"})
    write("fc16_inputs.csv", out)


# ---- Census districts ---------------------------------------------------------------
def census_districts(F):
    rows = []
    for name in sorted(k for k in F if re.fullmatch(r"DDW_PCA10\d\d_2011_MDDS_with_UI\.xlsx", k)):
        sheet = next((folder(F[name]) / "sheets").glob("*.csv"))
        with open(sheet, encoding="utf-8") as f:
            rd = csv.DictReader(f)
            row = next(r for r in rd if r["Level"] == "DISTRICT" and r["TRU"] == "Total")
            urban = next((r for r in rd if r["Level"] == "DISTRICT" and r["TRU"] == "Urban"), None)
        p, m, fe = int(row["TOT_P"]), int(row["TOT_M"]), int(row["TOT_F"])
        p06, m06, f06 = int(row["P_06"]), int(row["M_06"]), int(row["F_06"])
        rows.append({"district": row["Name"], "district_code": row["District"], "population": p,
                     "households": int(row["No_HH"]),
                     "urban_pct": round(100 * int(urban["TOT_P"]) / p, 1) if urban else "",
                     "sex_ratio": round(1000 * fe / m), "child_sex_ratio_0_6": round(1000 * f06 / m06),
                     "literacy_pct": round(100 * int(row["P_LIT"]) / (p - p06), 1),
                     "female_literacy_pct": round(100 * int(row["F_LIT"]) / (fe - f06), 1),
                     "sc_pct": round(100 * int(row["P_SC"]) / p, 1), "st_pct": round(100 * int(row["P_ST"]) / p, 1),
                     "work_participation_pct": round(100 * int(row["TOT_WORK_P"]) / p, 1),
                     "source_file": name})
    rows.sort(key=lambda r: r["district"])
    write("census_districts.csv", rows)
    tot = {k: sum(r[k] for r in rows) for k in ("population", "households")}
    print(f"    38 districts sum to {tot['population']:,} people")


# ---- Village amenities ----------------------------------------------------------------
AMENITIES = [("Government primary school", "Govt Primary School (Status A(1)/NA(2))"),
             ("Anganwadi centre", "Nutritional Centres-Anganwadi Centre (Status A(1)/NA(2))"),
             ("Public distribution shop", "Public Distribution System (PDS) Shop (Status A(1)/NA(2))"),
             ("Mobile phone coverage", "Mobile Phone Coverage (Status A(1)/NA(2))"),
             ("Power for domestic use", "Power Supply For Domestic Use  (Status A(1)/NA(2))"),
             ("All-weather road", "All Weather Road (Status A(1)/NA(2))"),
             ("Black-topped (pucca) road", "Black Topped (pucca) Road (Status A(1)/NA(2))"),
             ("Post office", "Post Office (Status A(1)/NA(2))"),
             ("Hand pump", "Hand Pump (Status A(1)/NA(2))"),
             ("Tap water, untreated", "Tap Water Untreated (Status A(1)/NA(2))"),
             # in the 2011 data no inhabited Bihar village has treated tap water (every value is 2)
             ("Tap water, treated", "Tap Water-Treated (Status A(1)/NA(2))"),
             ("Commercial bank", "Commercial Bank (Status A(1)/NA(2))"),
             ("ATM", "ATM (Status A(1)/NA(2))")]


def village_amenities(F):
    rec = F["DH_2011_DCHB_Village_Release_1000.xlsx"]
    sheet = folder(rec) / "sheets" / "Village_Data_1000.csv"
    counts, total, uninhabited = {}, {}, 0
    with open(sheet, encoding="utf-8") as f:
        rd = csv.reader(f)
        h = next(rd)
        ix = {label: h.index(col) for label, col in AMENITIES}
        di, pi = h.index("District Name"), h.index("Total Population of Village")
        for r in rd:
            try:
                pop = int(float(r[pi] or 0))
            except ValueError:
                pop = 0
            if pop <= 0:
                uninhabited += 1
                continue
            for key in (r[di].strip().title(), "Bihar"):
                total[key] = total.get(key, 0) + 1
                for label, i in ix.items():
                    counts[(key, label)] = counts.get((key, label), 0) + (r[i].strip() == "1")
    rows = []
    for key in sorted(total, key=lambda k: (k != "Bihar", k)):
        row = {"area": key, "inhabited_villages": total[key]}
        for label, _ in AMENITIES:
            row[label] = round(100 * counts[(key, label)] / total[key], 1)
        row["source_file"] = "DH_2011_DCHB_Village_Release_1000.xlsx (Village Directory)"
        rows.append(row)
    write("village_amenities.csv", rows)
    print(f"    {total['Bihar']:,} inhabited villages; {uninhabited:,} uninhabited left out")


def main():
    F = files_by_name()
    print(f"Writing {OUT.relative_to(DATA.parent)}/")
    for step in (gst, state_finances, srs, population, devolution, census_districts, village_amenities):
        step(F)


if __name__ == "__main__":
    main()
