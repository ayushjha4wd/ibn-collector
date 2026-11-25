"""Plain-language report on one district for one financial year, from the validated eGramSwaraj tables.

    python scripts/make_district_report.py --district 203 --fy 2025-2026     # Patna, 2025-26

Writes docs/district_reports/<district>_<FY>/report.md, report.pdf and charts/*.png. Every figure is taken from
data/validated/egs/ (values as served by the portal); nothing is estimated. Amounts in the scheme-wise statement
are used only for shares, never as totals, because the 2025-26 scheme report double-counts (Task 5, R11b).
"""
from __future__ import annotations

import argparse
import collections
import csv
import datetime
import json
import re
import statistics
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
TIERS = [("zp", "Zilla Parishad", "district council"), ("bp", "Panchayat Samitis", "block councils"),
         ("gp", "Gram Panchayats", "village councils")]


def rows(name):
    with open(V / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def f(x):
    return float(x) if x not in ("", None) else None


def cr(x, nd=2):
    return "—" if x is None else f"{x:,.{nd}f}"


def pct(a, b):
    return "—" if not a or b is None else f"{100 * b / a:.0f}%"


def fy_label(fy):
    return f"{fy[:4]}-{fy[7:]}"


def gen(rows_):
    vals = sorted({r.get("report_generated_on", "") for r in rows_ if r.get("report_generated_on")})
    return "; ".join(v.split(", ", 1)[-1] for v in vals)


def save(fig, out, name):
    out.mkdir(parents=True, exist_ok=True)
    fig.savefig(out / name, dpi=200, bbox_inches="tight")
    plt.close(fig)


def grouped(ax, labels, a, b, la, lb, horizontal=False, fmt="{:,.1f}"):
    n = range(len(labels))
    w = 0.38
    if horizontal:
        ax.barh([i + w / 2 + 0.01 for i in n], a, w, color=BLUE, label=la)
        ax.barh([i - w / 2 - 0.01 for i in n], b, w, color=ORANGE, label=lb)
        ax.set_yticks(list(n), labels)
        top = max(a + b)
        for i, (x, y) in enumerate(zip(a, b)):
            ax.text(x + top * 0.01, i + w / 2, fmt.format(x), va="center", fontsize=6.5, color=INK2)
            ax.text(y + top * 0.01, i - w / 2, fmt.format(y), va="center", fontsize=6.5, color=INK2)
        ax.xaxis.grid(True, color=GRID, linewidth=0.6)
        ax.set_xlim(0, top * 1.12)
    else:
        ax.bar([i - w / 2 - 0.01 for i in n], a, w, color=BLUE, label=la)
        ax.bar([i + w / 2 + 0.01 for i in n], b, w, color=ORANGE, label=lb)
        ax.set_xticks(list(n), labels)
        top = max(a + b)
        for i, (x, y) in enumerate(zip(a, b)):
            ax.text(i - w / 2, x + top * 0.015, fmt.format(x), ha="center", fontsize=7, color=INK)
            ax.text(i + w / 2, y + top * 0.015, fmt.format(y), ha="center", fontsize=7, color=INK)
        ax.yaxis.grid(True, color=GRID, linewidth=0.6)
        ax.set_ylim(0, top * 1.15)
    ax.set_axisbelow(True)
    ax.legend(frameon=False, fontsize=8)


def appendix(w, dc, fy, name, gps, gp_rows, geo, blocks, bname_of):
    """One row per Gram Panchayat: official receipts/payments (where the village statement was collected) and the
    totals of its own vouchers (gross; see section 8)."""
    vpath = V / "vouchers" / f"{dc}_{fy}.csv"
    vagg = collections.defaultdict(lambda: [0, 0.0, 0, 0.0])
    if vpath.exists():
        for r in csv.DictReader(open(vpath, encoding="utf-8")):
            if r["level"] != "gp" or r["section"] not in ("receipt", "payment"):
                continue
            a = vagg[r["gp_code"]]
            i = 0 if r["section"] == "receipt" else 2
            a[i] += 1
            a[i + 1] += float(r["amount_rs"])
    off = {}
    for r in gp_rows:
        if r["is_portal_total"] == "no":
            off[r["gp_code_validated"] or r["gp_code"]] = r
    codes = set(off) | set(vagg)
    if not codes:
        return
    bn = {b["block_code_validated"]: bname_of(b) for b in blocks}

    def gp_name(c):
        return geo.get(("gram panchayat", c), {}).get("name") or (off.get(c, {}).get("gp_name_as_served")) or c

    def blk(c):
        return bn.get(geo.get(("gram panchayat", c), {}).get("parent_code") or off.get(c, {}).get("block_code"), "?")

    w(f"## Appendix: every Gram Panchayat of {name}, {fy_label(fy)}\n")
    txt = ("Amounts in Rs lakh. ")
    if off:
        txt += ("**Official receipts / payments** are from the Village wise Receipt and Payment Statement (generated "
                f"{gen(gp_rows)}); they are the figures to quote. ")
    if vagg:
        txt += ("**Voucher** columns add up the Gram Panchayat's own receipt and payment vouchers (section 8). Voucher "
                "totals are gross and run somewhat higher than official figures; use them for detail and comparison "
                "between villages, not as official totals. A dash means no vouchers were listed or reached. ")
    w(txt + f"{len(codes)} Gram Panchayats are shown; the district statement counts {gps}.\n")
    hdr = ["Block", "Gram Panchayat", "Code"]
    if off:
        hdr += ["Official receipts", "Official payments"]
    if vagg:
        hdr += ["Receipt vouchers", "Received (vouchers)", "Payment vouchers", "Paid (vouchers)"]
    w("| " + " | ".join(hdr) + " |\n|" + "---|" * len(hdr))
    for c in sorted(codes, key=lambda c: (blk(c), gp_name(c).lower())):
        cells = [blk(c), gp_name(c), c]
        if off:
            o = off.get(c)
            cells += ([f"{f(o['receipts_rs']) / 1e5:,.2f}", f"{f(o['payments_rs']) / 1e5:,.2f}"] if o else ["—", "—"])
        if vagg:
            v = vagg.get(c)
            cells += ([f"{v[0]:,}", f"{v[1] / 1e5:,.2f}", f"{v[2]:,}", f"{v[3] / 1e5:,.2f}"] if v else ["—"] * 4)
        w("| " + " | ".join(cells) + " |")
    if off:
        so = sum(f(o["receipts_rs"]) for o in off.values()) / 1e7
        sp = sum(f(o["payments_rs"]) for o in off.values()) / 1e7
        w(f"\nOfficial Gram Panchayat figures above add up to Rs {so:,.2f} crore received and Rs {sp:,.2f} crore "
          "paid out.")
    if vagg:
        w(f"\nVoucher totals above add up to Rs {sum(v[1] for v in vagg.values()) / 1e7:,.2f} crore received and "
          f"Rs {sum(v[3] for v in vagg.values()) / 1e7:,.2f} crore paid out across {len(vagg)} Gram Panchayats.")
    w("")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--district", default="203", help="district code (eGramSwaraj / getMobileData), e.g. 203 = Patna")
    ap.add_argument("--fy", default="2025-2026")
    a = ap.parse_args()
    dc, fy = a.district, a.fy

    dist_all = [r for r in rows("district_finance.csv") if r["financial_year"] == fy]
    d = next(r for r in dist_all if r["district_code_validated"] == dc)
    tot = next(r for r in dist_all if r["is_portal_total"] == "yes")
    others = [r for r in dist_all if r["is_portal_total"] == "no"]
    # the district's current spelling (older reports print names in capitals)
    own_rows = [r for r in rows("district_finance.csv") if r["district_code_validated"] == dc]
    name = max(own_rows, key=lambda r: r["financial_year"])["district"]
    # Up to 2020-21 the statement prints "Receipts"/"Payments" in rupees; from 2021-22 "OB + Receipts (Cr)" and
    # "Payments (Cr)". The two are different measures and are never mixed.
    CRMODE = bool(d.get("gp_ob_plus_receipts_cr"))

    def AV(r, t):
        return f(r[f"{t}_ob_plus_receipts_cr"]) if CRMODE else (f(r[f"{t}_receipts_rs"]) or 0) / 1e7

    def PD(r, t):
        return f(r[f"{t}_payments_cr"]) if CRMODE else (f(r[f"{t}_payments_rs"]) or 0) / 1e7

    AVW = "Money available" if CRMODE else "Money received"
    AVP = "OB + Receipts" if CRMODE else "Receipts"
    avw = AVW.lower()
    blocks = [r for r in rows("block_finance.csv") if r["financial_year"] == fy and r["district_code"] == dc
              and r["is_portal_total"] == "no"]
    bacc = {r["block_code_validated"]: r for r in rows("block_accounting_status.csv")
            if r["financial_year"] == fy and r["district_code"] == dc}
    dacc = next(r for r in rows("district_accounting_status.csv")
                if r["financial_year"] == fy and r["district_code_validated"] == dc)
    months = [r for r in rows("monthly_finance.csv") if r["financial_year"] == fy and r["entity_code"] == dc]
    vch = [r for r in rows("monthly_vouchers.csv") if r["financial_year"] == fy and r["entity_code"] == dc]
    sch = [r for r in rows("district_scheme_finance.csv") if r["financial_year"] == fy and r["district_code_validated"] == dc]
    gp_rows = [r for r in rows("gp_finance.csv") if r["financial_year"] == fy and r["district_code"] == dc
               and r["is_portal_total"] == "no"]

    geo = {(r["level"], r["code"]): r for r in rows("geographic_reference.csv")}

    def bname_of(r):
        return geo.get(("block", r["block_code_validated"]), {}).get("name") or r["block"]

    out = ROOT / "docs" / "district_reports" / f"{name.lower().replace(' ', '_')}_{fy}"
    charts = out / "charts"

    # ---- figures
    T = {t: (AV(d, t), PD(d, t)) for t, _, _ in TIERS}
    S = {t: (AV(tot, t), PD(tot, t)) for t, _, _ in TIERS}
    all_av = sum(v[0] for v in T.values())
    all_pd = sum(v[1] for v in T.values())
    rank_pd = sorted(others, key=lambda r: -PD(r, "gp")).index(d) + 1
    rank_av = sorted(others, key=lambda r: -AV(r, "gp")).index(d) + 1
    gps, bps = int(f(dacc["gps"])), int(f(dacc["bps"]))
    gp_av_per = T["gp"][0] * 100 / gps
    gp_pd_per = T["gp"][1] * 100 / gps

    # charts
    fig, ax = plt.subplots(figsize=(7.2, 3.0))
    grouped(ax, [lab for _, lab, _ in TIERS], [T[t][0] for t, _, _ in TIERS], [T[t][1] for t, _, _ in TIERS],
            "Money available (opening balance + receipts)" if CRMODE else "Money received (receipts)",
            "Money paid out (payments)")
    ax.set_ylabel("Rs crore")
    save(fig, charts, "money_by_tier.png")

    bl = sorted(blocks, key=lambda r: AV(r, "gp"))
    fig, ax = plt.subplots(figsize=(7.2, 0.32 * len(bl) + 1.0))
    grouped(ax, [bname_of(r) for r in bl], [AV(r, "gp") for r in bl],
            [PD(r, "gp") for r in bl], AVW, "Money paid out", horizontal=True)
    ax.set_xlabel("Rs crore, all Gram Panchayats of the block")
    ax.tick_params(axis="y", labelsize=7.5)
    ax.legend(frameon=False, fontsize=8, loc="lower right")
    save(fig, charts, "gp_money_by_block.png")

    if months:
        fig, ax = plt.subplots(figsize=(7.2, 2.9))
        grouped(ax, [m["month"].split(",")[0][:3] for m in months], [f(m["receipts_rs"]) / 1e7 for m in months],
                [f(m["payments_rs"]) / 1e7 for m in months], "Received", "Paid out", fmt="{:,.1f}")
        ax.set_ylabel("Rs crore")
        save(fig, charts, "zp_monthly.png")

    # ---- text
    L = []
    w = L.append
    fy_end = datetime.date(int(fy[5:]), 3, 31)
    running = datetime.date.today() <= fy_end
    w(f"# {name} District: Panchayat Finances and Accounts, {fy_label(fy)}\n")
    w(f"A plain-language district profile from the Government of India's eGramSwaraj system · India By Numbers · "
      f"data as published by the portal (district statement generated {gen([d])})\n")
    if running:
        w(f"> **This financial year is still running** (it ends on 31 March {fy[5:]}). Every figure below covers only "
          f"the months up to the date the portal generated the report, and will grow as the year goes on.\n")
    w("## 1. The main points\n")
    w(f"- **{name} has {bps} Panchayat Samitis (block councils) and {gps} Gram Panchayats (village councils)** in the "
      f"{fy_label(fy)} accounts, plus one Zilla Parishad (district council).")
    if CRMODE:
        w(f"- **In {fy_label(fy)} its Panchayats together had Rs {cr(all_av)} crore available and paid out Rs "
          f"{cr(all_pd)} crore ({pct(all_av, all_pd)}).**")
    else:
        w(f"- **In {fy_label(fy)} its Panchayats together received Rs {cr(all_av)} crore and paid out Rs "
          f"{cr(all_pd)} crore.** (This year's statement uses a different measure from later years; see section 2.)")
    w(f"- **The Gram Panchayats had Rs {cr(T['gp'][0])} crore {'available' if CRMODE else 'of receipts'} and paid "
      f"out Rs {cr(T['gp'][1])} crore ({pct(*T['gp'])}).** {name} ranks **{rank_av} of {len(others)}** districts in "
      f"Bihar for money {'available to' if CRMODE else 'received by'} Gram Panchayats and **{rank_pd} of "
      f"{len(others)}** for money paid out by them.")
    w(f"- **An average Gram Panchayat in {name} had about Rs {gp_av_per:,.1f} lakh {'available' if CRMODE else 'of receipts'} "
      f"and paid out about Rs {gp_pd_per:,.1f} lakh** in the year (district totals divided by {gps} Gram Panchayats).")
    sch_names = {r["scheme_code"]: r["scheme"] for r in sch}
    own = [r for r in sch if r["scheme_code"] == "0"]
    own_total = sum(f(r["receipts_rs"]) or 0 for r in own)
    other_rec = {c: sum(f(r["receipts_rs"]) or 0 for r in sch if r["scheme_code"] == c) for c in sch_names
                 if c not in ("0", "3287")}
    if "3287" in sch_names:
        w("- **Almost all the money is the 15th Finance Commission grant.** The scheme-wise statement for "
          f"{name} lists: " + ", ".join(sorted(sch_names.values())) + ". "
          + ("" if not own else ("Own resources received nothing" if own_total == 0 else
             f"Own resources received Rs {cr(own_total / 1e7)} crore") + f" in {fy_label(fy)}. ")
          + "".join(f"{sch_names[c]} received {'nothing' if not v else 'Rs ' + cr(v / 1e7) + ' crore'}. "
                    for c, v in other_rec.items()))
    yb = int(f(dacc["gps_with_year_book_closed"]))
    ybp = int(f(dacc["bps_with_year_book_closed"]))
    zyb = dacc["zp_year_book_closed"] == "yes"
    done = yb == gps and ybp == bps and zyb
    w(f"- **Annual accounts {'are complete' if done else 'are not complete'}:** {yb} of {gps} Gram Panchayats, "
      f"{ybp} of {bps} Panchayat Samitis and the Zilla Parishad "
      f"({'closed' if zyb else 'not yet closed'}) have closed their year book in the system"
      + (" (normal while the year is still running)." if running and not done else "."))
    w(f"- **Official figures for each of the {len(gp_rows)} Gram Panchayats are in the Appendix.**" if gp_rows else
      "- **Official village-by-village figures for this year are on the portal but not yet collected;** the Appendix "
      "shows each Gram Panchayat's own voucher totals instead.")
    w("")
    w("## 2. How to read the money words\n")
    w("| Term | Meaning |\n|---|---|")
    if CRMODE:
        w("| **Money available** (portal: *OB + Receipts*) | Money left from last year (opening balance) plus money "
          "received during the year |")
    else:
        w("| **Money received** (portal: *Receipts*) | Money received during the year, as printed in rupees in the "
          f"{fy_label(fy)} statement. The report does not say whether last year's balance is included |")
    w("| **Money paid out** (portal: *Payments*) | Payments made from the Panchayat's own accounts during the year |")
    w("| **Crore / lakh** | 1 crore = 100 lakh = Rs 1,00,00,000 |")
    if not CRMODE:
        w("\n**Important:** from 2021-22 the portal changed this statement to *OB + Receipts* in crore. The "
          f"{fy_label(fy)} *Receipts* figure is a different measure, so it should not be compared directly with the "
          "*money available* of later years.")
    w("\nPayments are only what passed through Panchayat accounts. They are **not** all government spending in the "
      "district (state departments pay for many works directly).\n")

    w("## 3. Money at each level of Panchayat\n")
    w(f"![{AVW} and paid out by each level of Panchayat](charts/money_by_tier.png)\n")
    w(f"| Level | Bodies | {AVW} (Rs crore) | Paid out (Rs crore) | Paid out as share | {name}'s share "
      f"of Bihar ({avw.split()[1]}) |\n|---|---|---|---|---|---|")
    counts = {"zp": 1, "bp": bps, "gp": gps}
    for t, lab, desc in TIERS:
        w(f"| {lab} ({desc}) | {counts[t]} | {cr(T[t][0], 3)} | {cr(T[t][1], 3)} | {pct(*T[t])} | "
          f"{pct(S[t][0], T[t][0])} of Rs {cr(S[t][0], 0)} crore |")
    w(f"| **All levels** | | **{cr(all_av, 3)}** | **{cr(all_pd, 3)}** | **{pct(all_av, all_pd)}** | |\n")
    w(f"Source: District wise Receipt and Payment Statement, {fy_label(fy)}, Bihar (generated {gen([d])})"
      + ("" if CRMODE else "; amounts printed in rupees, shown here in crore") + ".\n")

    w("## 4. Block by block\n")
    w(f"![Money of Gram Panchayats in each block of {name}](charts/gp_money_by_block.png)\n")
    w("Figures for the Panchayat Samiti (block council) itself and for all Gram Panchayats of the block together.\n")
    w(f"| Block | Gram Panchayats | Gram Panchayats: {avw.split()[1]} (Rs crore) | Gram Panchayats: paid out | "
      "Share paid | Panchayat Samiti: " + avw.split()[1] + " | Panchayat Samiti: paid out |\n|---|---|---|---|---|---|---|")
    for r in sorted(blocks, key=bname_of):
        acc = bacc.get(r["block_code_validated"], {})
        g_av, g_pd = AV(r, "gp"), PD(r, "gp")
        w(f"| {bname_of(r)} | {acc.get('gps', '—')} | {cr(g_av, 3)} | {cr(g_pd, 3)} | {pct(g_av, g_pd)} | "
          f"{cr(AV(r, 'bp'), 3)} | {cr(PD(r, 'bp'), 3)} |")
    gsum_av = sum(AV(r, "gp") for r in blocks)
    shares = [PD(r, "gp") / AV(r, "gp") for r in blocks if AV(r, "gp")]
    hi = max(blocks, key=lambda r: AV(r, "gp"))
    lo = min(blocks, key=lambda r: AV(r, "gp"))
    txt = (f"\nThe blocks' Gram Panchayat figures add up to Rs {gsum_av:,.3f} crore (district statement: "
           f"Rs {cr(T['gp'][0], 3)} crore). The largest is **{bname_of(hi)}** (Rs {cr(AV(hi, 'gp'))} crore across "
           f"{bacc.get(hi['block_code_validated'], {}).get('gps', '?')} GPs), the smallest **{bname_of(lo)}** "
           f"(Rs {cr(AV(lo, 'gp'))} crore).")
    if shares and not any(shares):
        txt += f" None of the {len(shares)} blocks with money shows any Gram Panchayat payment."
    elif shares:
        txt += (f" The share of money paid out ranges from {min(shares) * 100:.0f}% to {max(shares) * 100:.0f}% "
                f"across the {len(shares)} blocks with money (middle block: {statistics.median(shares) * 100:.0f}%).")
    nz = sum(1 for r in blocks if not AV(r, "gp"))
    if nz:
        txt += f" In {nz} of {len(blocks)} blocks the Gram Panchayats show no money at all for this year."
    w(txt + " Blocks differ in the number and size of their Panchayats, so a larger amount does not by itself mean "
      "better or worse performance.\n")

    if months:
        ob = f(months[0]["opening_balance_rs"])
        rec = sum(f(m["receipts_rs"]) for m in months)
        pay = sum(f(m["payments_rs"]) for m in months)
        canc = sum(f(m["payment_cancellation_rejected_rs"]) for m in months)
        w("## 5. The Zilla Parishad month by month\n")
        w(f"![Money received and paid out by {name} Zilla Parishad each month](charts/zp_monthly.png)\n")
        net = (pay - canc) / 1e7
        same = T["zp"][1] is not None and abs(net - T["zp"][1]) < 0.005
        w(f"The district council (Zilla Parishad) started the year with **Rs {ob / 1e7:,.2f} crore** carried over, "
          f"received **Rs {rec / 1e7:,.2f} crore** during the year and paid out **Rs {pay / 1e7:,.2f} crore**"
          + (f" (Rs {canc / 1e7:,.2f} crore of payments were later cancelled or rejected, leaving Rs {net:,.2f} crore)"
             if canc else "")
          + (". This matches the annual statement.\n" if same else
             f". The annual statement shows Rs {cr(T['zp'][1])} crore paid out; the two reports were generated on "
             "different dates, so they need not agree exactly.\n"))
        if not pay and not rec:
            w("The Zilla Parishad recorded no money moving in any month of this year in this report.\n")
        w("| Month | Received (Rs lakh) | Paid out (Rs lakh) | Payment vouchers |\n|---|---|---|---|")
        vmap = {v["month"]: v for v in vch}
        for m in months:
            w(f"| {m['month']} | {f(m['receipts_rs']) / 1e5:,.2f} | {f(m['payments_rs']) / 1e5:,.2f} | "
              f"{vmap.get(m['month'], {}).get('payments', '—')} |")
        w("\nMonth names are shown exactly as the portal prints them.")
        busiest = max(months, key=lambda m: f(m["payments_rs"]))
        w((f"\nThe busiest month for payments was **{busiest['month']}** (Rs {f(busiest['payments_rs']) / 1e7:,.2f} "
           "crore)." if pay else "") +
          f" Source: Month Wise Payment and Receipt Statement (generated {gen(months[:1])})"
          + (f" and Month wise Summary Report (generated {gen(vch[:1])})" if vch else "") + ".\n")

    w("## 6. Where the money comes from\n")
    w("| Source (as named by the portal) | Zilla Parishad | Panchayat Samitis | Gram Panchayats |\n|---|---|---|---|")
    for code in sorted(sch_names, key=lambda c: (c != "3287", c)):
        cells = []
        for t, _, _ in TIERS:
            r = next((x for x in sch if x["scheme_code"] == code and x["tier"] == t), None)
            tot_t = sum(f(x["receipts_rs"]) or 0 for x in sch if x["tier"] == t)
            if r is None:
                cells.append("not listed")
            elif not f(r["receipts_rs"]):
                cells.append("0")
            else:
                cells.append(f"{100 * f(r['receipts_rs']) / tot_t:.0f}% of receipts")
        w(f"| {sch_names[code]} | " + " | ".join(cells) + " |")
    note = (f"\nOnly the {len(sch_names)} source(s) above are listed for the district. "
            + ("**Caution:** in the 2025-26 scheme-wise report the rupee amounts are exactly twice the district "
               "statement in every district (a fault found in the data check, Task 5), so only the shares are shown "
               "here, not the amounts." if fy == "2025-2026" else
               "Shares are calculated from the scheme-wise statement (generated " + gen(sch) + ")."))
    xvgp = next((x for x in sch if x["scheme_code"] == "3287" and x["tier"] == "gp"), None)
    if xvgp:
        note += (f" The same report counts {int(f(xvgp['rv'])):,} receipt vouchers and {int(f(xvgp['pv'])):,} payment "
                 f"vouchers for {name}'s Gram Panchayats under the XV FC grant.")
    w(note + "\n")

    w("## 7. How well the books are kept\n")
    w("| | Zilla Parishad | Panchayat Samitis | Gram Panchayats |\n|---|---|---|---|")
    w(f"| Number | 1 | {bps} | {gps} |")
    w(f"| Masters and opening balance entered | {dacc['zp_entered_masters']} / {dacc['zp_entered_opening_balance']} | "
      f"{dacc['bps_with_master_entry']} / {dacc['bps_with_opening_balance']} | {dacc['gps_with_master_entry']} / "
      f"{dacc['gps_with_opening_balance']} |")
    w(f"| Receipt vouchers recorded | {int(f(dacc['zp_rv'])):,} | {int(f(dacc['bp_rv'])):,} | {int(f(dacc['gp_rv'])):,} |")
    w(f"| Payment vouchers recorded | {int(f(dacc['zp_pv'])):,} | {int(f(dacc['bp_pv'])):,} | {int(f(dacc['gp_pv'])):,} |")
    w(f"| Day book closed | {dacc['zp_day_book_closed']} | {dacc['bps_with_day_book_closed']} of {bps} | "
      f"{dacc['gps_with_day_book_closed']} of {gps} |")
    w(f"| Month book closed | {dacc['zp_month_book_closed']} | {dacc['bps_with_month_book_closed']} of {bps} | "
      f"{dacc['gps_with_month_book_closed']} of {gps} |")
    w(f"| Year book (annual accounts) closed | {dacc['zp_year_book_closed']} | {dacc['bps_with_year_book_closed']} of "
      f"{bps} | {dacc['gps_with_year_book_closed']} of {gps} |")
    w(f"\nOn average each Gram Panchayat recorded about {int(f(dacc['gp_pv'])) / gps:,.0f} payment vouchers in the "
      f"year. Source: District Wise Summary Report (generated {gen([dacc])}).\n")

    # ---- vouchers (transaction level), if collected for this district-year
    vpath = V / "vouchers" / f"{dc}_{fy}.csv"
    if vpath.exists():
        vouch = [r for r in csv.reader(open(vpath, encoding="utf-8"))]
        vh = vouch[0]
        vrows = [dict(zip(vh, r)) for r in vouch[1:]]
        gp_codes = sorted({r["gp_code"] for r in vrows if r["level"] == "gp"})
        bp_codes = sorted({r["block_code"] for r in vrows if r["level"] == "bp"})
        def vsum(level=None, section=None, month=None):
            return sum(float(r["amount_rs"]) for r in vrows if (level is None or r["level"] == level)
                       and (section is None or r["section"] == section) and (month is None or int(r["month"]) == month))
        def vcount(level=None, section=None):
            return sum(1 for r in vrows if (level is None or r["level"] == level)
                       and (section is None or r["section"] == section))
        # which bodies' month-wise statements were opened (from the provenance log of the collection)
        checked = collections.defaultdict(set)
        for line in open(ROOT / "data" / "provenance.jsonl", encoding="utf-8"):
            if f"vouchers/{dc}_{fy}/" not in line or "ExpFY" not in line:
                continue
            m = re.search(r"FD=ExpFY\d{4}-\d{4}_\d+_name=(\d+)", json.loads(line).get("stored_path") or "")
            if m:
                checked["all"].add(m.group(1))
        n_gp_checked = len(checked["all"]) - 1 - len(blocks)
        w("## 8. Every receipt and payment (voucher level)\n")
        w(f"eGramSwaraj records each transaction as a **voucher**. For {name} in {fy_label(fy)} we opened the "
          f"month-wise statement of the Zilla Parishad, all {len(blocks)} Panchayat Samitis and "
          f"{n_gp_checked} Gram Panchayats, and collected every voucher-wise list they link to — {len(vrows):,} "
          f"voucher lines in all. Vouchers appear for **{len(bp_codes)} Panchayat Samitis and {len(gp_codes)} Gram "
          "Panchayats**; the others list no vouchers for this year."
          + (f" (The {fy_label(fy)} block pages link the month-wise statements of only {n_gp_checked} of the {gps} "
             "Gram Panchayats, so vouchers of the rest could not be reached. "
             + ("" if not gp_rows else
                ("Every Gram Panchayat that shows any money in the official village statement was among those reached. "
                 if not [o for o in gp_rows if (f(o["receipts_rs"]) or f(o["payments_rs"]))
                         and (o["gp_code_validated"] or o["gp_code"]) not in gp_codes] else
                 "Some Gram Panchayats with money in the official village statement were not reached. "))
             + "The official figure for every Gram Panchayat is in the Appendix.)" if n_gp_checked < gps else "")
          + " **No payee or vendor names are included** — only the voucher number, date, type and amount, exactly as "
          "the portal lists them.\n")
        w("| | Zilla Parishad | Panchayat Samitis | Gram Panchayats | Total collected |\n|---|---|---|---|---|")
        w(f"| Receipt vouchers | {vcount('zp', 'receipt'):,} | {vcount('bp', 'receipt'):,} | "
          f"{vcount('gp', 'receipt'):,} | {vcount(section='receipt'):,} |")
        w(f"| Payment vouchers | {vcount('zp', 'payment'):,} | {vcount('bp', 'payment'):,} | "
          f"{vcount('gp', 'payment'):,} | {vcount(section='payment'):,} |")
        w(f"| Amount received (Rs crore) | {vsum('zp', 'receipt') / 1e7:,.2f} | {vsum('bp', 'receipt') / 1e7:,.2f} | "
          f"{vsum('gp', 'receipt') / 1e7:,.2f} | {vsum(section='receipt') / 1e7:,.2f} |")
        w(f"| Amount paid (Rs crore) | {vsum('zp', 'payment') / 1e7:,.2f} | {vsum('bp', 'payment') / 1e7:,.2f} | "
          f"{vsum('gp', 'payment') / 1e7:,.2f} | {vsum(section='payment') / 1e7:,.2f} |")
        vp = vsum(section="payment") / 1e7
        w(f"\nPayments listed in vouchers (Rs {vp:,.2f} crore) are {100 * (vp - all_pd) / all_pd:+.0f}% compared with "
          f"the annual statement (Rs {cr(all_pd)} crore). The statement is the official total; the vouchers list "
          "somewhat more, probably because the statement is net of payments later cancelled, rejected or returned (the "
          "portal does not define this). Use the vouchers for detail and pattern, the statement for totals. A "
          "multi-year voucher report for the district is in `docs/district_reports/" +
          f"{name.lower().replace(' ', '_')}_vouchers/`.\n")
        vt = collections.Counter()
        for r in vrows:
            vt[r["voucher_type"] or "(blank)"] += 1
        w("**Types of voucher** (what the transaction was recorded as):\n")
        w("| Voucher type | Number | What it means |\n|---|---|---|")
        meaning = {"Expenditures": "A payment / expenditure", "Direct Receipts": "Money received directly",
                   "Reverse Receipt -PFMS": "A receipt reversed in the PFMS payment system",
                   "Refund of Excess Payment": "Money returned after an overpayment",
                   "OB Cancellation": "Cancellation of an opening-balance entry"}
        for ty, c in vt.most_common():
            w(f"| {ty} | {c:,} | {meaning.get(ty, 'as labelled by the portal')} |")
        big = sorted((r for r in vrows if r["section"] == "payment"), key=lambda r: -float(r["amount_rs"]))[:10]
        bname = {b["block_code_validated"]: bname_of(b) for b in blocks}
        w("\n**The ten largest single payments collected:**\n")
        w("| Voucher date | Voucher number | Level | Block | Amount (Rs) | Type |\n|---|---|---|---|---|---|")
        for r in big:
            lvl = {"zp": "Zilla Parishad", "bp": "Panchayat Samiti", "gp": "Gram Panchayat"}[r["level"]]
            w(f"| {r['voucher_date']} | {r['voucher_no']} | {lvl} | {bname.get(r['block_code'], r['block_code'])} | "
              f"{r['amount_as_served']} | {r['voucher_type']} |")
        pref = collections.Counter(r["voucher_no"].split("/")[0] for r in vrows)
        coll = sorted({r["source_file"].split("/")[3] for r in vrows})
        w("\n" + (f"All {len(vrows):,} voucher numbers begin with **XVFC**, confirming the money is the 15th Finance "
                  "Commission grant." if set(pref) == {"XVFC"} else
                  "Voucher numbers begin with: " + ", ".join(f"{k} ({v:,})" for k, v in pref.most_common()) + ".")
          + f" Every voucher is in the machine-readable file `data/validated/egs/vouchers/{dc}_{fy}.csv`, with its "
          f"source page. Source: Voucher Wise Summary Report pages, collected {', '.join(coll)}.\n")
    w("## 9. What this profile cannot tell you\n")

    w("| Not available | Why |\n|---|---|")
    if not gp_rows:
        w(f"| Official figures for each Gram Panchayat in {fy_label(fy)} | Published on the portal; not yet collected "
          "(planned follow-up collection). The Appendix shows voucher totals per Gram Panchayat instead |")
    w("| Population or households of the district's Panchayats | Not in any open eGramSwaraj report, so no per-person "
      "figures |")
    w("| Who each payment went to (the payee or vendor of each voucher) | On the individual voucher page, behind a security check (CAPTCHA); not collected. The voucher number, date, type and amount ARE collected (section 8) |")
    w("| Elected members of this district | Collected for Bihar as a whole only; district figures are a planned "
      "follow-up |")
    w("| Value of approved development plans | Only whether a plan was uploaded is public |")
    w("| Money left unspent at year end | Not printed as an official figure |\n")

    w("## 10. About these figures\n")
    w("- Every figure is copied from the government's own eGramSwaraj reports and was checked against the original "
      "pages in the data validation (Task 5). Totals in this profile add up to the portal's own totals.")
    w("- Each report is a snapshot taken on the date shown; later reports for the same year can differ slightly "
      "because accounts keep being updated.")
    w(f"- District code {dc}; block and Gram Panchayat codes are the portal's own. Data collected November 2026 from "
      "egramswaraj.gov.in. Machine-readable tables: `data/validated/egs/`.")
    w(f"- Reports for {name} in other years: `docs/district_reports/{name.lower().replace(' ', '_')}_index.md`.\n")
    appendix(w, dc, fy, name, gps, gp_rows, geo, blocks, bname_of)
    out.mkdir(parents=True, exist_ok=True)
    md = out / "report.md"
    md.write_text("\n".join(L) + "\n", encoding="utf-8")
    pdf(md, out / "report.pdf", f"{name} District: Panchayat Finances {fy_label(fy)}",
        f"India By Numbers · {name} district · {fy_label(fy)}")
    print("wrote", md, out / "report.pdf")


if __name__ == "__main__":
    main()
