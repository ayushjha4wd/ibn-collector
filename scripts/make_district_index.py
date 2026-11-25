"""Index page for one district's year-by-year reports, with a summary table of every financial year on the portal.

    python scripts/make_district_index.py --district 203        # Patna

Writes docs/district_reports/<name>_index.md and .pdf. Figures come from data/validated/egs/ as served; the two
statement layouts (rupee "Receipts" up to 2020-21, "OB + Receipts (Cr)" from 2021-22) are kept in separate columns.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_district_report import BLUE, ORANGE, GRID, INK2, ROOT, V, f, fy_label, plt, rows, save  # noqa: E402
from make_task4_docs import pdf  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--district", default="203")
    dc = ap.parse_args().district
    allrows = rows("district_finance.csv")
    st = {r["financial_year"]: r for r in allrows if r["district_code_validated"] == dc}
    tot = {r["financial_year"]: r for r in allrows if r["is_portal_total"] == "yes"}
    name = st[max(st)]["district"]
    slug = name.lower().replace(" ", "_")
    acc = {r["financial_year"]: r for r in rows("district_accounting_status.csv") if r["district_code_validated"] == dc}
    gpf = {r["financial_year"] for r in rows("gp_finance.csv") if r["district_code"] == dc}
    base = ROOT / "docs" / "district_reports"

    def money(fy):
        d = st[fy]
        if d.get("gp_ob_plus_receipts_cr"):
            return "cr", sum(f(d[f"{t}_ob_plus_receipts_cr"]) for t in ("zp", "bp", "gp")), \
                sum(f(d[f"{t}_payments_cr"]) for t in ("zp", "bp", "gp")), f(d["gp_payments_cr"])
        return "rs", sum(f(d[f"{t}_receipts_rs"]) or 0 for t in ("zp", "bp", "gp")) / 1e7, \
            sum(f(d[f"{t}_payments_rs"]) or 0 for t in ("zp", "bp", "gp")) / 1e7, (f(d["gp_payments_rs"]) or 0) / 1e7

    def state_zero(fy):
        t = tot.get(fy, {})
        return not any(f(v) for k, v in t.items() if (k.endswith("_rs") or k.endswith("_cr")) and v)

    L = []
    w = L.append
    w(f"# {name} District: Panchayat Finance Reports, Year by Year\n")
    w("India By Numbers · from the Government of India's eGramSwaraj system · one detailed report per financial year\n")
    w("## The reports\n")
    w("| Financial year | Detailed report | What it contains |\n|---|---|---|")
    for fy in sorted(st, reverse=True):
        rep = base / f"{slug}_{fy}" / "report.pdf"
        if rep.exists():
            vc = V / "vouchers" / f"{dc}_{fy}.csv"
            nv = sum(1 for _ in open(vc, encoding="utf-8")) - 1 if vc.exists() else 0
            what = "district, blocks, Zilla Parishad by month, sources, bookkeeping"
            what += f", {nv:,} vouchers" if nv else ""
            what += ", official figures of every Gram Panchayat" if fy in gpf else ", voucher totals of every Gram Panchayat"
            w(f"| {fy_label(fy)} | [{slug}_{fy}/report.pdf]({slug}_{fy}/report.pdf) ([text]({slug}_{fy}/report.md)) "
              f"| {what} |")
        else:
            why = ("all amounts on the portal are zero for every Bihar district" if state_zero(fy) else
                   f"all amounts on the portal are zero for {name}") if not money(fy)[1] and not money(fy)[2] else \
                "not generated"
            w(f"| {fy_label(fy)} | no report | {why}, most likely because the accounts for this year "
              "were not entered in eGramSwaraj. This means **no data**, not proof that nothing was spent |")
    w(f"\nA multi-year report on the vouchers alone is in [{slug}_vouchers/]({slug}_vouchers/).\n")

    w("## Year by year at a glance\n")
    w("| Year | Received (Rs crore, old layout) | Available: OB + receipts (Rs crore) | Paid out, all levels (Rs crore) "
      "| Paid out by Gram Panchayats (Rs crore) | Gram Panchayats | Year book closed (GPs) |\n|---|---|---|---|---|---|---|")
    ys, pd_all, pd_gp = [], [], []
    for fy in sorted(st):
        kind, av, pdx, gpp = money(fy)
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
      "be compared. *Payments* carry the same label in both layouts. The latest year is still running, so its figures are "
      "partial.\n")
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
    save(fig, base / f"{slug}_index_charts", "paid_out_by_year.png")
    w(f"![Money paid out by {name}'s Panchayats each year](" + f"{slug}_index_charts/paid_out_by_year.png)\n")
    w("\\* still running.\n")
    w("## How to use these reports\n")
    w("- Each report starts with **the main points** in plain words; the later sections give the detail.")
    w("- The **Appendix** of each report lists every Gram Panchayat: official figures where the portal's village "
      "statement was collected (2020-21 and 2024-25), and totals of each Gram Panchayat's own vouchers for every year "
      "with vouchers.")
    w("- **No names of payees, vendors or residents** appear anywhere; only voucher numbers, dates, types and amounts.")
    w("- Figures are copied from the portal and checked against the original pages (Task 5). Each report is a "
      "snapshot taken on the date shown in it.")
    md = base / f"{slug}_index.md"
    md.write_text("\n".join(L) + "\n", encoding="utf-8")
    pdf(md, base / f"{slug}_index.pdf", f"{name}: Panchayat Finance Reports by Year", f"India By Numbers · {name}")
    print("wrote", md)


if __name__ == "__main__":
    main()
