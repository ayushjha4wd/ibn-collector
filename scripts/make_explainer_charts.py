"""Charts for docs/explainer (plain-language report on Bihar's eGramSwaraj data).

    python scripts/make_explainer_charts.py

Reads data/validated/egs/ only (values as served, portal Total rows used where the chart shows a state total)
and writes PNG files to docs/explainer/charts/. Palette: validated categorical slots 1-2 (blue, orange).
"""
from __future__ import annotations

import csv
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "data" / "validated" / "egs"
OUT = ROOT / "docs" / "explainer" / "charts"
BLUE, ORANGE, INK, INK2, GRID, SURF = "#2a78d6", "#eb6834", "#0b0b0b", "#52514e", "#e4e3df", "#fcfcfb"

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 9, "axes.edgecolor": GRID, "axes.labelcolor": INK2,
                     "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.facecolor": SURF, "figure.facecolor": SURF})


def rows(name):
    with open(V / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def fy_label(fy):
    return f"{fy[:4]}-{fy[7:]}"


def save(fig, name):
    OUT.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT / name, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print("wrote", OUT / name)


def money_by_year():
    tot = {r["financial_year"]: r for r in rows("district_finance.csv") if r["is_portal_total"] == "yes"}
    yrs = [y for y in sorted(tot) if tot[y]["gp_ob_plus_receipts_cr"]]
    avail = [float(tot[y]["gp_ob_plus_receipts_cr"]) for y in yrs]
    paid = [float(tot[y]["gp_payments_cr"]) for y in yrs]
    fig, ax = plt.subplots(figsize=(7.2, 3.4))
    x = range(len(yrs))
    w = 0.38
    ax.bar([i - w / 2 - 0.01 for i in x], avail, w, color=BLUE, label="Money available (opening balance + receipts)")
    ax.bar([i + w / 2 + 0.01 for i in x], paid, w, color=ORANGE, label="Money paid out (payments)")
    for i, (a, p) in enumerate(zip(avail, paid)):
        ax.text(i - w / 2, a + 60, f"{a:,.0f}", ha="center", fontsize=7.5, color=INK)
        ax.text(i + w / 2, p + 60, f"{p:,.0f}", ha="center", fontsize=7.5, color=INK)
    ax.set_xticks(list(x), [fy_label(y) + ("\n(year in progress)" if y == "2026-2027" else "") for y in yrs])
    ax.set_ylabel("Rs crore")
    ax.yaxis.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    ax.legend(frameon=False, loc="upper right", fontsize=8)
    ax.set_ylim(0, max(avail) * 1.18)
    save(fig, "gp_money_by_year.png")


def districts():
    d = [r for r in rows("district_finance.csv") if r["financial_year"] == "2024-2025" and r["is_portal_total"] == "no"]
    d.sort(key=lambda r: float(r["gp_payments_cr"]))
    fig, ax = plt.subplots(figsize=(7.2, 7.6))
    names = [r["district"] for r in d]
    vals = [float(r["gp_payments_cr"]) for r in d]
    ax.barh(names, vals, color=BLUE, height=0.72)
    for i, v in enumerate(vals):
        ax.text(v + 1.5, i, f"{v:,.0f}", va="center", fontsize=7, color=INK2)
    ax.set_xlabel("Rs crore paid out by all Gram Panchayats of the district, 2024-25")
    ax.xaxis.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    ax.tick_params(axis="y", labelsize=7.5)
    save(fig, "district_payments_2024_25.png")


def gp_spread():
    g = [float(r["receipts_rs"]) / 1e5 for r in rows("gp_finance.csv")
         if r["financial_year"] == "2024-2025" and r["is_portal_total"] == "no" and r["receipts_rs"]]
    fig, ax = plt.subplots(figsize=(7.2, 3.0))
    bins = list(range(0, 180, 20)) + [400]
    counts = [sum(1 for v in g if lo <= v < hi) for lo, hi in zip(bins[:-1], bins[1:])]
    labels = [f"{lo}–{hi}" if hi != 400 else f"{lo}+" for lo, hi in zip(bins[:-1], bins[1:])]
    ax.bar(range(len(counts)), counts, color=BLUE, width=0.86)
    for i, c in enumerate(counts):
        if c:
            ax.text(i, c + 25, f"{c:,}", ha="center", fontsize=7, color=INK2)
    ax.set_xticks(range(len(counts)), labels, fontsize=8)
    ax.set_xlabel("Money available to one Gram Panchayat in 2024-25 (Rs lakh)")
    ax.set_ylabel("Number of GPs")
    ax.yaxis.grid(True, color=GRID, linewidth=0.6)
    ax.set_axisbelow(True)
    save(fig, "gp_money_spread_2024_25.png")


def representatives():
    ind = {(r["endpoint"], r["field"]): float(r["value"]) for r in rows("state_indicators.csv")
           if r["endpoint"].startswith("ElectedStateReport") and r["value"] not in ("", None)}
    tiers = [("Zilla Parishad", "ElectedStateReportZp.do"), ("Panchayat Samiti", "ElectedStateReportBp.do"),
             ("Gram Panchayat", "ElectedStateReportGp.do")]
    fig, axes = plt.subplots(1, 3, figsize=(7.2, 2.6))
    for ax, (lab, ep) in zip(axes, tiers):
        f, m = ind[(ep, "femaleCount")], ind[(ep, "maleCount")]
        ax.bar([0], [f], color=ORANGE, width=0.6, label="Women")
        ax.bar([1], [m], color=BLUE, width=0.6, label="Men")
        top = max(f, m)
        for i, v in enumerate((f, m)):
            ax.text(i, v + top * 0.03, f"{v:,.0f}", ha="center", fontsize=7.5, color=INK)
        ax.set_title(lab, fontsize=9, color=INK)
        ax.set_xticks([0, 1], ["Women", "Men"])
        ax.set_yticks([])
        ax.spines["left"].set_visible(False)
        ax.set_ylim(0, top * 1.2)
    save(fig, "elected_representatives.png")


if __name__ == "__main__":
    money_by_year()
    districts()
    gp_spread()
    representatives()
