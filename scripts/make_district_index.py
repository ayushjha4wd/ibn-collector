"""Index pages for the year-by-year district reports.

    python scripts/make_district_index.py --district 203        # Patna: docs/district_reports/patna/index.{md,pdf}
    python scripts/make_district_index.py --district all        # every district, plus docs/district_reports/README.md

Figures come from data/validated/egs/ as served; the two statement layouts (rupee "Receipts" up to 2020-21,
"OB + Receipts (Cr)" from 2021-22) are kept in separate columns.
"""
from __future__ import annotations

import argparse
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_district_report import (BLUE, GRID, INK2, ORANGE, ROOT, V, district_names, f, fy_label, plt,  # noqa: E402
                                  report_dir, rows, save, slug)
from make_task4_docs import pdf  # noqa: E402

BASE = ROOT / "docs" / "district_reports"
TIER = ("zp", "bp", "gp")


def money(d):
    """(layout, received-or-available, paid all levels, paid by GPs, available to GPs) in Rs crore."""
    if d.get("gp_ob_plus_receipts_cr"):
        return ("cr", sum(f(d[f"{t}_ob_plus_receipts_cr"]) for t in TIER), sum(f(d[f"{t}_payments_cr"]) for t in TIER),
                f(d["gp_payments_cr"]), f(d["gp_ob_plus_receipts_cr"]))
    return ("rs", sum(f(d[f"{t}_receipts_rs"]) or 0 for t in TIER) / 1e7,
            sum(f(d[f"{t}_payments_rs"]) or 0 for t in TIER) / 1e7, (f(d["gp_payments_rs"]) or 0) / 1e7,
            (f(d["gp_receipts_rs"]) or 0) / 1e7)


def state_zero(fy):
    t = next((r for r in rows("district_finance.csv") if r["financial_year"] == fy and r["is_portal_total"] == "yes"),
             {})
    return not any(f(v) for k, v in t.items() if (k.endswith("_rs") or k.endswith("_cr")) and v)


def district_index(dc, name):
    st = {r["financial_year"]: r for r in rows("district_finance.csv") if r["district_code_validated"] == dc}
    acc = {r["financial_year"]: r for r in rows("district_accounting_status.csv") if r["district_code_validated"] == dc}
    gpf = {r["financial_year"] for r in rows("gp_finance.csv") if r["district_code"] == dc}
    out = BASE / slug(name)
    L = []
    w = L.append
    w(f"# {name} District: Panchayat Finance Reports, Year by Year\n")
    w("India By Numbers · from the Government of India's eGramSwaraj system · one detailed report per financial "
      "year · [all districts](../README.md)\n")
    w("## The reports\n")
    w("| Financial year | Detailed report | What it contains |\n|---|---|---|")
    for fy in sorted(st, reverse=True):
        if (report_dir(name, fy) / "report.pdf").exists():
            vc = V / "vouchers" / f"{dc}_{fy}.csv"
            nv = sum(1 for _ in open(vc, encoding="utf-8")) - 1 if vc.exists() else 0
            what = "district, blocks, Zilla Parishad by month, sources, bookkeeping"
            what += f", {nv:,} vouchers" if nv else ""
            what += (", official figures of every Gram Panchayat" if fy in gpf else
                     ", voucher totals of every Gram Panchayat" if nv else "")
            w(f"| {fy_label(fy)} | [report.pdf]({fy}/report.pdf) ([text]({fy}/report.md)) | {what} |")
        else:
            _, av, pdx, _, _ = money(st[fy])
            if av or pdx:
                why = "not generated yet"
            elif state_zero(fy):
                why = ("all amounts on the portal are zero for every Bihar district, most likely because the accounts "
                       "for this year were not entered in eGramSwaraj. This means **no data**, not proof that nothing "
                       "was spent")
            else:
                why = f"all amounts on the portal are zero for {name} (no data, not proof that nothing was spent)"
            w(f"| {fy_label(fy)} | no report | {why} |")
    vrep = BASE / f"{slug(name)}_vouchers"
    if vrep.exists():
        w(f"\nA multi-year report on the vouchers alone is in [{vrep.name}/](../{vrep.name}/report.md).\n")
    w("\n## Year by year at a glance\n")
    w("| Year | Received (Rs crore, old layout) | Available: OB + receipts (Rs crore) | Paid out, all levels (Rs crore) "
      "| Paid out by Gram Panchayats (Rs crore) | Gram Panchayats | Year book closed (GPs) |\n|---|---|---|---|---|---|---|")
    ys, pd_all, pd_gp = [], [], []
    for fy in sorted(st):
        kind, av, pdx, gpp, _ = money(st[fy])
        a = acc.get(fy, {})
        if not av and not pdx:
            continue
        w(f"| {fy_label(fy)} | {f'{av:,.2f}' if kind == 'rs' else '—'} | {f'{av:,.2f}' if kind == 'cr' else '—'} | "
          f"{pdx:,.2f} | {gpp:,.2f} | {a.get('gps', '—')} | {a.get('gps_with_year_book_closed', '—')} |")
        ys.append(fy_label(fy))
        pd_all.append(pdx)
        pd_gp.append(gpp)
    w("\nThe 2020-21 statement printed *Receipts* in rupees; from 2021-22 the portal shows *OB + Receipts* (opening "
      "balance plus receipts) in crore. They are different measures, so they sit in different columns and should not "
      "be compared. *Payments* carry the same label in both layouts. The latest year is still running, so its figures "
      "are partial.\n")
    if ys and max(pd_all):
        fig, ax = plt.subplots(figsize=(7.2, 2.9))
        n = range(len(ys))
        ax.bar([i - 0.2 for i in n], pd_all, 0.38, color=BLUE, label="Paid out, all levels")
        ax.bar([i + 0.2 for i in n], pd_gp, 0.38, color=ORANGE, label="Paid out by Gram Panchayats")
        for i, (x, y) in enumerate(zip(pd_all, pd_gp)):
            ax.text(i - 0.2, x + max(pd_all) * 0.015, f"{x:,.0f}", ha="center", fontsize=7)
            ax.text(i + 0.2, y + max(pd_all) * 0.015, f"{y:,.0f}", ha="center", fontsize=7)
        ax.set_xticks(list(n), [y + ("*" if i == len(ys) - 1 else "") for i, y in enumerate(ys)])
        ax.set_ylabel("Rs crore", color=INK2)
        ax.yaxis.grid(True, color=GRID, linewidth=0.6)
        ax.set_axisbelow(True)
        ax.set_ylim(0, max(pd_all) * 1.15)
        ax.legend(frameon=False, fontsize=8)
        save(fig, out / "charts", "paid_out_by_year.png")
        w(f"![Money paid out by {name}'s Panchayats each year](charts/paid_out_by_year.png)\n")
        w("\\* still running.\n")
    w("## How to use these reports\n")
    w("- Each report starts with **the main points** in plain words; the later sections give the detail.")
    w("- The **Appendix** of each report lists every Gram Panchayat where the portal's village statement was collected "
      f"({', '.join(fy_label(y) for y in sorted(gpf))})"
      + (", and totals of each Gram Panchayat's own vouchers for every year with vouchers." if
         any((V / "vouchers" / f"{dc}_{y}.csv").exists() for y in st) else "."))
    w("- **No names of payees, vendors or residents** appear anywhere.")
    w("- Figures are copied from the portal and checked against the original pages (Task 5). Each report is a "
      "snapshot taken on the date shown in it.")
    md = out / "index.md"
    out.mkdir(parents=True, exist_ok=True)
    md.write_text("\n".join(L) + "\n", encoding="utf-8")
    pdf(md, out / "index.pdf", f"{name}: Panchayat Finance Reports by Year", f"India By Numbers · {name}")
    print("wrote", md)


def master(names):
    fys = sorted({r["financial_year"] for r in rows("district_finance.csv") if not state_zero(r["financial_year"])})
    running = datetime.date.today() <= datetime.date(int(fys[-1][5:]), 3, 31)
    last_closed = fys[-2] if running else fys[-1]  # latest complete year
    L = []
    w = L.append
    w("# Bihar: Panchayat Finance Reports for Every District\n")
    w("India By Numbers · from the Government of India's eGramSwaraj system · one detailed, plain-language report per "
      f"district per financial year ({fy_label(fys[0])} to {fy_label(fys[-1])})\n")
    w(f"Click a district for its year-by-year page, or a year for that report (PDF). Figures shown are for "
      f"{fy_label(last_closed)}, the latest complete year. 2016-17 to 2019-20 show zero for every district on the "
      "portal (no data), so there are no reports for those years. "
      + (f"{fy_label(fys[-1])} is still running." if running else "") + "\n")
    w(f"| District | Code | Gram Panchayats | Available to GPs {fy_label(last_closed)} (Rs crore) | Paid out by GPs "
      f"(Rs crore) | Reports |\n|---|---|---|---|---|---|")
    st = {(r["district_code_validated"], r["financial_year"]): r for r in rows("district_finance.csv")}
    acc = {(r["district_code_validated"], r["financial_year"]): r for r in rows("district_accounting_status.csv")}
    for dc, name in sorted(names.items(), key=lambda kv: kv[1]):
        s = slug(name)
        d = st.get((dc, last_closed))
        _, _, _, gpp, gpa = money(d) if d else (None, None, None, None, None)
        links = " · ".join(f"[{fy_label(y)}]({s}/{y}/report.pdf)" for y in fys
                           if (report_dir(name, y) / "report.pdf").exists())
        w(f"| [{name}]({s}/index.md) | {dc} | {acc.get((dc, last_closed), {}).get('gps', '—')} | "
          f"{'—' if gpa is None else f'{gpa:,.2f}'} | {'—' if gpp is None else f'{gpp:,.2f}'} | {links} |")
    w("\nPatna also has every receipt and payment voucher (2020-21 to 2026-27) in its reports, and a separate "
      "[voucher report](patna_vouchers/report.md). Voucher lists for other districts can be collected from India with "
      "`python scripts/run_vouchers.py --district <code> --fy <FY>`; the reports then pick them up.\n")
    w("Rebuild everything: `python scripts/make_district_report.py --district all --fy all` then "
      "`python scripts/make_district_index.py --district all`.")
    (BASE / "README.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("wrote", BASE / "README.md")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--district", default="203", help="district code, or 'all' (also writes the all-district page)")
    a = ap.parse_args()
    names = district_names()
    for dc in (sorted(names) if a.district == "all" else [a.district]):
        district_index(dc, names[dc])
    if a.district == "all":
        master(names)


if __name__ == "__main__":
    main()
