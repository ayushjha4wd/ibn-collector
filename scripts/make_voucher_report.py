"""Plain-language, multi-year report on every voucher (receipt and payment) of one district.

    python scripts/make_voucher_report.py --district 203          # Patna, all years collected

Reads data/validated/egs/vouchers/<district>_<FY>.csv (made by egs_vouchers_extract.py from the read-only voucher
pages) and the validated district statement, and writes docs/district_reports/<name>_vouchers/report.md,
report.pdf and charts/. Figures are counted exactly as the portal lists them; nothing is estimated. No payee or
vendor names exist in the data, so none appear.
"""
from __future__ import annotations

import argparse
import collections
import csv
import glob
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_task4_docs import pdf  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "data" / "validated" / "egs"
BLUE, ORANGE, INK, INK2, GRID, SURF = "#2a78d6", "#eb6834", "#0b0b0b", "#52514e", "#e4e3df", "#fcfcfb"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9, "axes.edgecolor": GRID, "axes.labelcolor": INK2,
                     "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.facecolor": SURF, "figure.facecolor": SURF})
LEVEL = {"zp": "Zilla Parishad", "bp": "Panchayat Samiti", "gp": "Gram Panchayat"}
FY_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
MONTH_NAME = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct",
              11: "Nov", 12: "Dec"}
TYPE_MEANING = {"Expenditures": "a payment made", "Direct Receipts": "money received directly",
                "Reverse Receipt -PFMS": "a payment sent back by the PFMS payment system and re-credited",
                "Refund of Excess Payment": "money returned after an overpayment",
                "Receipt Cancellation": "a receipt entry cancelled", "OB Cancellation": "an opening-balance entry "
                "cancelled"}


def rows(path):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def lbl(fy):
    return f"{fy[:4]}-{fy[7:]}"


def save(fig, out, name):
    out.mkdir(parents=True, exist_ok=True)
    fig.savefig(out / name, dpi=200, bbox_inches="tight")
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--district", default="203")
    a = ap.parse_args()
    dc = a.district
    files = sorted(glob.glob(str(V / "vouchers" / f"{dc}_*.csv")))
    if not files:
        sys.exit(f"no voucher files for district {dc}")
    Y = {}
    for f in files:
        fy = Path(f).stem.split("_", 1)[1]
        Y[fy] = rows(f)
    fys = sorted(Y)
    stmt = {r["financial_year"]: r for r in rows(V / "district_finance.csv") if r["district_code_validated"] == dc}
    name = stmt[max(stmt)]["district"]  # latest year's spelling (older pages print names in capitals)
    blocks = {r["block_code_validated"]: r["block"] for r in rows(V / "block_finance.csv")
              if r["district_code"] == dc and r["block_code_validated"]}
    out = ROOT / "docs" / "district_reports" / f"{name.lower().replace(' ', '_')}_vouchers"
    charts = out / "charts"

    def amt(v, section=None, level=None, month=None, vtype=None):
        return sum(float(r["amount_rs"]) for r in v if (section is None or r["section"] == section)
                   and (level is None or r["level"] == level) and (month is None or int(r["month"]) == month)
                   and (vtype is None or r["voucher_type"] == vtype))

    def cnt(v, section=None, level=None):
        return sum(1 for r in v if (section is None or r["section"] == section) and (level is None or r["level"] == level))

    def stmt_pay(fy, level=None):
        d = stmt.get(fy)
        if not d:
            return None
        lv = [level] if level else ["zp", "bp", "gp"]
        tot = 0.0
        for t in lv:
            if d.get(f"{t}_payments_cr"):
                tot += float(d[f"{t}_payments_cr"]) * 1e7
            elif d.get(f"{t}_payments_rs"):
                tot += float(d[f"{t}_payments_rs"])
        return tot

    total = sum(len(v) for v in Y.values())
    pays = {fy: amt(Y[fy], "payment") for fy in fys}
    recs = {fy: amt(Y[fy], "receipt") for fy in fys}
    npay = {fy: cnt(Y[fy], "payment") for fy in fys}
    gpn = {fy: len({r["gp_code"] for r in Y[fy] if r["level"] == "gp"}) for fy in fys}
    bpn = {fy: len({r["block_code"] for r in Y[fy] if r["level"] == "bp"}) for fy in fys}

    # charts
    fig, ax = plt.subplots(figsize=(7.2, 3.1))
    n = range(len(fys))
    w = 0.38
    vp = [pays[f] / 1e7 for f in fys]
    sp = [(stmt_pay(f) or 0) / 1e7 for f in fys]
    ax.bar([i - w / 2 - 0.01 for i in n], vp, w, color=BLUE, label="Payments listed in vouchers")
    ax.bar([i + w / 2 + 0.01 for i in n], sp, w, color=ORANGE, label="Payments in the annual statement")
    top = max(vp + sp)
    for i, (x, y) in enumerate(zip(vp, sp)):
        ax.text(i - w / 2, x + top * 0.015, f"{x:,.0f}", ha="center", fontsize=7, color=INK)
        ax.text(i + w / 2, y + top * 0.015, f"{y:,.0f}", ha="center", fontsize=7, color=INK)
    ax.set_xticks(list(n), [lbl(f) + ("\n(in progress)" if f == "2026-2027" else "") for f in fys])
    ax.set_ylabel("Rs crore")
    ax.yaxis.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    ax.set_ylim(0, top * 1.16)
    ax.legend(frameon=False, fontsize=8, loc="upper left")
    save(fig, charts, "payments_by_year.png")

    fig, ax = plt.subplots(figsize=(7.2, 2.7))
    counts = [npay[f] for f in fys]
    ax.bar(list(n), counts, 0.6, color=BLUE)
    for i, c in enumerate(counts):
        ax.text(i, c + max(counts) * 0.015, f"{c:,}", ha="center", fontsize=7.5, color=INK)
    ax.set_xticks(list(n), [lbl(f) for f in fys])
    ax.set_ylabel("Payment vouchers")
    ax.yaxis.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    ax.set_ylim(0, max(counts) * 1.15)
    save(fig, charts, "payment_vouchers_by_year.png")

    full = [f for f in fys if f not in ("2020-2021", "2026-2027")]
    fig, ax = plt.subplots(figsize=(7.2, 3.0))
    for f, col, ls in zip(full, ["#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#0d366b"], ["-"] * 5):
        tot = pays[f] or 1
        ax.plot(range(12), [100 * amt(Y[f], "payment", month=m) / tot for m in FY_MONTHS], color=col, lw=2,
                marker="o", ms=3, label=lbl(f))
    ax.set_xticks(range(12), [MONTH_NAME[m] for m in FY_MONTHS])
    ax.set_ylabel("% of the year's payments")
    ax.yaxis.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    ax.legend(frameon=False, fontsize=7.5, ncol=5, loc="upper left")
    save(fig, charts, "payments_by_month.png")

    # ---- text
    L = []
    w_ = L.append
    first, last = fys[0], fys[-1]
    w_(f"# {name} District: Every Panchayat Receipt and Payment, {lbl(first)} to {lbl(last)}\n")
    w_("A plain-language report on the transaction-level accounts (vouchers) of all Panchayats in the district, from "
       "the Government of India's eGramSwaraj system · India By Numbers · collected 22 Nov 2026\n")
    w_("## 1. The main points\n")
    w_(f"- **{total:,} voucher entries** were collected for {name}'s Zilla Parishad, Panchayat Samitis and Gram "
       f"Panchayats over {len(fys)} financial years ({lbl(first)} to {lbl(last)}). Every page the portal offered was "
       "collected; no page needed a security check (CAPTCHA).")
    big_fy = max(fys, key=lambda f: pays[f])
    w_(f"- **Payments recorded through vouchers grew from Rs {pays['2021-2022'] / 1e7:,.0f} crore in 2021-22 to Rs "
       f"{pays['2025-2026'] / 1e7:,.0f} crore in 2025-26**, and the number of payment vouchers from "
       f"{npay['2021-2022']:,} to {npay['2025-2026']:,}." if "2021-2022" in Y and "2025-2026" in Y else "")
    w_(f"- **2020-21 was the first year**: only {len(Y[first]):,} entries, from {gpn[first]} Gram Panchayats. From "
       f"2021-22 every Gram Panchayat in the district records its accounts this way." if first == "2020-2021" else "")
    w_("- **Almost every payment is an 'Expenditure' voucher under the 15th Finance Commission grant** (voucher "
       "numbers begin with XVFC).")
    share = {f: {m: 100 * amt(Y[f], "payment", month=m) / pays[f] for m in FY_MONTHS} for f in full if pays[f]}
    peak = {f: max(share[f], key=share[f].get) for f in share}
    q4 = {f: share[f][1] + share[f][2] + share[f][3] for f in share}
    if share:
        w_("- **Payments are spread through the year; there is no fixed busiest month.** The busiest month was "
           + ", ".join(f"{MONTH_NAME[peak[f]]} in {lbl(f)}" for f in share) + f". The last quarter (January–March) "
           f"carried between {min(q4.values()):.0f}% and {max(q4.values()):.0f}% of a year's payments (section 6).")
    diffs = {f: 100 * (pays[f] - stmt_pay(f)) / stmt_pay(f) for f in fys if stmt_pay(f)}
    later = {f: d for f, d in diffs.items() if f >= "2022-2023"}
    if later:
        w_(f"- **Vouchers list somewhat more in payments than the official annual statement** ({min(later.values()):+.0f}% "
           f"to {max(later.values()):+.0f}% from 2022-23" + (f"; {diffs['2021-2022']:+.0f}% in 2021-22"
                                                             if "2021-2022" in diffs else "") +
           "). The statement is the official total; the vouchers give the detail and the pattern (section 10).")
    w_("- **No names of people or firms are included.** The voucher lists show only the date, voucher number, type and "
       "amount.\n")
    w_("## 2. What a voucher is\n")
    w_("Every time a Panchayat receives or pays money, it records a **voucher** in eGramSwaraj — like a numbered "
       "receipt or bill. The portal lists them month by month:\n")
    w_("| Kind | What it records |\n|---|---|")
    w_("| Receipt voucher | Money coming in (grants, refunds, money sent back by the payment system) |")
    w_("| Payment voucher | Money going out |")
    w_("| Contra voucher | Money moved between the Panchayat's own accounts |")
    w_("| Journal voucher | An adjustment entry, no money moves |\n")
    w_("A voucher number (e.g. *XVFC/2025-26/P/35*) can appear on more than one line when several entries are "
       "recorded under it; every line is counted as the portal lists it.\n")

    w_("## 3. Year by year\n")
    w_("![Payments in vouchers and in the annual statement, by year](charts/payments_by_year.png)\n")
    w_("| Year | Gram Panchayats covered | Receipt entries | Payment entries | Other entries | Received (Rs crore) | "
       "Paid (Rs crore) | Annual statement: paid (Rs crore) |\n|---|---|---|---|---|---|---|---|")
    for f in fys:
        other = cnt(Y[f], "contra") + cnt(Y[f], "journal")
        s = stmt_pay(f)
        w_(f"| {lbl(f)}{' (in progress)' if f == '2026-2027' else ''} | {gpn[f]} | {cnt(Y[f], 'receipt'):,} | "
           f"{npay[f]:,} | {other:,} | {recs[f] / 1e7:,.2f} | {pays[f] / 1e7:,.2f} | "
           f"{'—' if s is None else f'{s / 1e7:,.2f}'} |")
    w_(f"| **All years** | | **{sum(cnt(Y[f], 'receipt') for f in fys):,}** | **{sum(npay.values()):,}** | | "
       f"**{sum(recs.values()) / 1e7:,.2f}** | **{sum(pays.values()) / 1e7:,.2f}** | |\n")
    w_("'Received' here is money received during the year only. The annual statement's 'money available' also "
       "includes the opening balance carried over, so it is much larger.\n")
    w_("![Number of payment vouchers each year](charts/payment_vouchers_by_year.png)\n")

    w_("## 4. Who paid: each level of Panchayat\n")
    w_("Payments listed in vouchers (Rs crore):\n")
    w_("| Year | Zilla Parishad | Panchayat Samitis | Gram Panchayats | Payment entries at Gram Panchayats | "
       "Average entries per Gram Panchayat |\n|---|---|---|---|---|---|")
    for f in fys:
        g = cnt(Y[f], "payment", "gp")
        w_(f"| {lbl(f)} | {amt(Y[f], 'payment', 'zp') / 1e7:,.2f} | {amt(Y[f], 'payment', 'bp') / 1e7:,.2f} | "
           f"{amt(Y[f], 'payment', 'gp') / 1e7:,.2f} | {g:,} | {g / gpn[f] if gpn[f] else 0:,.0f} |")
    gsh = {f: 100 * amt(Y[f], "payment", "gp") / pays[f] for f in fys if f >= "2021-2022" and pays[f]}
    zp0 = [lbl(f) for f in fys if amt(Y[f], "payment", "zp") == 0]
    w_(f"\nFrom 2021-22, Gram Panchayats made between {min(gsh.values()):.0f}% and {max(gsh.values()):.0f}% of all "
       "payments listed." + (f" The Zilla Parishad recorded no payment vouchers in {', '.join(zp0)}." if zp0 else "")
       + "".join((lambda k, s: f" In {lbl(f)} it recorded {k} payment{'s' if k != 1 else ''} totalling only Rs {s:,.0f}.")(
                     cnt([r for r in Y[f] if r["level"] == "zp"], "payment"), amt(Y[f], "payment", "zp"))
                 for f in fys if 0 < amt(Y[f], "payment", "zp") < 1e5)
       + "\n")

    w_("## 5. Types of entry\n")
    types = sorted({r["voucher_type"] for f in fys for r in Y[f] if r["voucher_type"]},
                   key=lambda t: -sum(1 for f in fys for r in Y[f] if r["voucher_type"] == t))
    w_("| Type | " + " | ".join(lbl(f) for f in fys) + " | Meaning |\n|---|" + "---|" * len(fys) + "---|")
    for t in types:
        w_(f"| {t} | " + " | ".join(f"{sum(1 for r in Y[f] if r['voucher_type'] == t):,}" for f in fys) +
           f" | {TYPE_MEANING.get(t, 'as labelled by the portal')} |")
    w_(f"| Contra / journal (no type shown) | " + " | ".join(
        f"{cnt(Y[f], 'contra') + cnt(Y[f], 'journal'):,}" for f in fys) + " | money moved between own accounts, or "
       "adjustments |\n")

    w_("## 6. When the money is paid: month by month\n")
    w_("![Share of each year's payments made in each month](charts/payments_by_month.png)\n")
    w_("Payments listed in vouchers, Rs crore:\n")
    w_("| Month | " + " | ".join(lbl(f) for f in fys) + " |\n|---|" + "---|" * len(fys))
    for m in FY_MONTHS:
        w_(f"| {MONTH_NAME[m]} | " + " | ".join(f"{amt(Y[f], 'payment', month=m) / 1e7:,.2f}" for f in fys) + " |")
    if share:
        w_("\nThe busiest month changes from year to year ("
           + ", ".join(f"{lbl(f)}: {MONTH_NAME[peak[f]]}, {share[f][peak[f]]:.0f}%" for f in share)
           + "). The chart shows each full year; 2026-27 is still in progress, so its later months are empty.\n")

    w_("## 7. Size of payments\n")
    bands = [(0, 1e4, "Up to Rs 10,000"), (1e4, 1e5, "Rs 10,000 – 1 lakh"), (1e5, 5e5, "Rs 1 – 5 lakh"),
             (5e5, 1e6, "Rs 5 – 10 lakh"), (1e6, 1e12, "Over Rs 10 lakh")]
    w_("Number of payment entries:\n")
    w_("| Size | " + " | ".join(lbl(f) for f in fys) + " |\n|---|" + "---|" * len(fys))
    for lo, hi, lab in bands:
        w_(f"| {lab} | " + " | ".join(
            f"{sum(1 for r in Y[f] if r['section'] == 'payment' and lo <= float(r['amount_rs']) < hi):,}" for f in fys) + " |")
    med = {}
    for f in fys:
        xs = sorted(float(r["amount_rs"]) for r in Y[f] if r["section"] == "payment")
        med[f] = xs[len(xs) // 2] if xs else 0
    w_("\nThe typical (middle) payment was " + ", ".join(f"Rs {med[f]:,.0f} in {lbl(f)}" for f in fys if med[f]) +
       ". Most payments are small; a few large ones carry much of the money.\n")

    w_("## 8. The largest payments of each year\n")
    w_("| Year | Date | Voucher number | Level | Block | Amount (Rs) | Type |\n|---|---|---|---|---|---|---|")
    for f in fys:
        for r in sorted((r for r in Y[f] if r["section"] == "payment"), key=lambda r: -float(r["amount_rs"]))[:3]:
            w_(f"| {lbl(f)} | {r['voucher_date']} | {r['voucher_no']} | {LEVEL[r['level']]} | "
               f"{blocks.get(r['block_code'], '—') if r['block_code'] else '—'} | {r['amount_as_served']} | "
               f"{r['voucher_type']} |")
    w_("")

    w_("## 9. Block by block: Gram Panchayat payments\n")
    w_("Payments listed in Gram Panchayat vouchers, by block (Rs crore):\n")
    bcodes = sorted({r["block_code"] for f in fys for r in Y[f] if r["level"] == "gp"},
                    key=lambda b: blocks.get(b, b))
    w_("| Block | " + " | ".join(lbl(f) for f in fys) + " |\n|---|" + "---|" * len(fys))
    for b in bcodes:
        w_(f"| {blocks.get(b, b)} | " + " | ".join(
            f"{sum(float(r['amount_rs']) for r in Y[f] if r['level'] == 'gp' and r['section'] == 'payment' and r['block_code'] == b) / 1e7:,.2f}"
            for f in fys) + " |")
    w_("")

    w_("## 10. How these figures relate to the official annual statement\n")
    w_("| Year | Paid in vouchers (Rs crore) | Paid in the annual statement (Rs crore) | Vouchers above statement |\n"
       "|---|---|---|---|")
    for f in fys:
        s = stmt_pay(f)
        w_(f"| {lbl(f)} | {pays[f] / 1e7:,.2f} | {'—' if s is None else f'{s / 1e7:,.2f}'} | "
           f"{'—' if not s else f'{100 * (pays[f] - s) / s:+.0f}%'} |")
    w_("\nThe annual statement (District wise Receipt and Payment Statement) is the **official total** and should be "
       "quoted for totals. The vouchers list somewhat more in payments, probably because the statement is net of "
       "payments later cancelled, rejected or returned; the portal does not define the netting, and simple formulas "
       "(minus refunds, minus PFMS reversals) do not reproduce it exactly. Use the vouchers for detail, timing and "
       "pattern, not as a replacement for the official total.\n")

    w_("## 11. About this data\n")
    w_(f"- Source: eGramSwaraj 'Voucher Wise Summary Report' pages for {name} (district code {dc}), one per body and "
       "month, collected 22 Nov 2026 from an Indian connection. Each page is stored unchanged with its URL, time and "
       "sha256; every voucher number was re-found in its page.")
    w_(f"- Coverage: the Zilla Parishad, all {max(bpn.values())} Panchayat Samitis and every Gram Panchayat that the "
       f"portal lists ({', '.join(f'{gpn[f]} in {lbl(f)}' for f in fys)}).")
    w_("- Who received each payment is shown only on the individual voucher page, which is behind a security check "
       "(CAPTCHA); it was not collected.")
    w_(f"- Machine-readable: `data/validated/egs/vouchers/{dc}_<year>.csv` — one row per voucher line.")
    out.mkdir(parents=True, exist_ok=True)
    md = out / "report.md"
    md.write_text("\n".join(x for x in L if x is not None) + "\n", encoding="utf-8")
    pdf(md, out / "report.pdf", f"{name}: Every Panchayat Receipt and Payment",
        f"India By Numbers · {name} vouchers {lbl(first)}–{lbl(last)}")
    print("wrote", md, out / "report.pdf")


if __name__ == "__main__":
    main()
