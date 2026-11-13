#!/usr/bin/env python3
"""Draw the charts for the Bihar Data Book from data/analysis/insights/*.csv.

Writes PNG files to docs/charts/. Run after insights.py; make_book.py embeds them.
Style: one or two series per chart (blue, then orange), thin marks, a recessive grid,
text in ink colours (never the series colour), units in the axis label.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.ticker import FuncFormatter  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, ROOT  # noqa: E402

IN = DATA / "analysis" / "insights"
OUT = ROOT / "docs" / "charts"
INK, MUTED, GRID, SURFACE = "#1d2a26", "#5b6b65", "#e3e8e6", "#ffffff"
BLUE, ORANGE, BLUE_LIGHT = "#2a78d6", "#eb6834", "#9ec5f4"

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 8.5, "text.color": INK, "axes.labelcolor": MUTED,
    "axes.edgecolor": GRID, "xtick.color": MUTED, "ytick.color": MUTED, "axes.titlesize": 9.5,
    "axes.titleweight": "bold", "axes.titlecolor": INK, "axes.titlelocation": "left", "axes.titlepad": 8,
    "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "grid.color": GRID,
    "grid.linewidth": 0.6, "axes.axisbelow": True, "legend.frameon": False, "legend.fontsize": 8,
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.dpi": 200,
})


def rows(name: str) -> list[dict]:
    return list(csv.DictReader(open(IN / name, encoding="utf-8")))


def thousands(x, _):
    return f"{x:,.0f}"


def save(fig, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT / name, bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    print(f"  {name}")


def gst():
    r = rows("gst_bihar.csv")
    fy = [x["financial_year"] for x in r]
    v = [float(x["bihar_gst_crore"]) for x in r]
    fig, ax = plt.subplots(figsize=(6.4, 2.7))
    colours = [BLUE_LIGHT if (i == 0 or i == len(r) - 1) else BLUE for i in range(len(r))]
    ax.bar(fy, v, width=0.55, color=colours)
    for i, val in enumerate(v):
        ax.text(i, val + 300, f"{val:,.0f}", ha="center", va="bottom", fontsize=7, color=MUTED)
    ax.set_ylabel("Rs crore")
    ax.yaxis.set_major_formatter(FuncFormatter(thousands))
    ax.grid(axis="x", visible=False)
    ax.set_title("GST collected in Bihar, by financial year")
    ax.tick_params(axis="x", labelsize=7.5)
    fig.text(0.01, -0.04, "Light bars are part years: 2017-18 from July (GST began 1 July 2017); 2026-27 to September.",
             fontsize=7, color=MUTED)
    save(fig, "gst.png")


def finances():
    r = rows("state_finances.csv")
    years = sorted({x["financial_year"] for x in r})

    def series(item):
        return [float(next(x for x in r if x["financial_year"] == y and x["item"] == item)["actual_crore"]) / 1000
                for y in years]
    rr, re_, cap = series("Revenue receipts"), series("Revenue expenditure"), series("Capital expenditure")
    fig, ax = plt.subplots(figsize=(6.4, 2.8))
    ax.plot(years, rr, color=BLUE, lw=2, marker="o", ms=4, label="Revenue receipts")
    ax.plot(years, re_, color=ORANGE, lw=2, marker="o", ms=4, label="Revenue expenditure")
    ax.text(len(years) - 1 + 0.08, rr[-1] - 6, f"{rr[-1]:,.0f}", fontsize=7.5, color=INK, va="center")
    ax.text(len(years) - 1 + 0.08, re_[-1] + 4, f"{re_[-1]:,.0f}", fontsize=7.5, color=INK, va="center")
    ax.set_ylabel("Rs thousand crore")
    ax.set_xlim(-0.3, len(years) - 0.4)
    ax.legend(loc="upper left")
    ax.set_title("Bihar's revenue receipts and revenue expenditure")
    save(fig, "finances.png")

    fd = [-v for v in series("Fiscal deficit (-)")]
    fig, ax = plt.subplots(figsize=(6.4, 2.4))
    ax.bar(years, fd, width=0.5, color=BLUE)
    for i, val in enumerate(fd):
        ax.text(i, val + 1, f"{val:,.1f}", ha="center", fontsize=7.5, color=MUTED)
    ax.set_ylabel("Rs thousand crore")
    ax.grid(axis="x", visible=False)
    ax.set_title("Fiscal deficit (net borrowing)")
    save(fig, "deficit.png")

    y = "2025-26"
    v = {x["item"]: float(x["actual_crore"]) for x in r if x["financial_year"] == y}
    parts = [("Share of central taxes", v["Share of union taxes"]),
             ("State's own taxes", v["Tax revenue"] - v["Share of union taxes"]),
             ("Grants from the Centre", v["Grants-in-aid"]),
             ("Non-tax revenue", v["Non-tax revenue"])]
    total = sum(p[1] for p in parts)
    fig, ax = plt.subplots(figsize=(6.4, 1.9))
    labels = [p[0] for p in parts][::-1]
    vals = [100 * p[1] / total for p in parts][::-1]
    ax.barh(labels, vals, height=0.5, color=BLUE)
    for i, val in enumerate(vals):
        ax.text(val + 0.8, i, f"{val:.1f}%", va="center", fontsize=7.5, color=INK)
    ax.set_xlim(0, max(vals) * 1.18)
    ax.set_xlabel("% of revenue receipts, 2025-26")
    ax.grid(axis="y", visible=False)
    ax.set_title("Where Bihar's revenue came from, 2025-26")
    save(fig, "revenue_mix.png")


def population():
    r = rows("population.csv")
    cen = [(int(x["year"]), int(x["population"]) / 1e6) for x in r if x["kind"] == "Census"]
    pro = [(int(x["year"]), int(x["population"]) / 1e6) for x in r if x["kind"] == "Projected"]
    fig, ax = plt.subplots(figsize=(6.4, 2.8))
    ax.plot([a for a, _ in cen], [b for _, b in cen], color=BLUE, lw=2, marker="o", ms=3.5, label="Census")
    ax.plot([cen[-1][0]] + [a for a, _ in pro], [cen[-1][1]] + [b for _, b in pro], color=BLUE, lw=2,
            ls=(0, (3, 2)), marker="o", ms=3.5, mfc=SURFACE, label="Projected (Technical Group)")
    for (yr, val), off in ((cen[0], (0, 7)), (cen[-1], (-22, 6)), (pro[-1], (0, 7))):
        ax.annotate(f"{val:,.1f} m", (yr, val), textcoords="offset points", xytext=off, ha="center",
                    fontsize=7.5, color=INK)
    ax.set_ylabel("people, million")
    ax.legend(loc="upper left")
    ax.set_title("Bihar's population, 1901–2036")
    save(fig, "population.png")


def srs():
    r = rows("srs_rates.csv")
    inds = ["Birth rate (per 1,000)", "Death rate (per 1,000)", "Infant mortality rate (per 1,000 live births)",
            "Total fertility rate (children per woman)"]
    fig, axes = plt.subplots(2, 2, figsize=(6.4, 4.4), sharex=True)
    for ax, ind in zip(axes.flat, inds):
        s = [x for x in r if x["indicator"] == ind]
        yrs = [int(x["year"]) for x in s]
        ax.plot(yrs, [float(x["bihar"]) for x in s], color=BLUE, lw=2, label="Bihar")
        ax.plot(yrs, [float(x["india"]) for x in s], color=ORANGE, lw=2, label="India")
        ax.set_title(ind, fontsize=8.5)
        ax.tick_params(labelsize=7)
        for series, col, dy in ((s, "bihar", 4), (s, "india", -9)):
            ax.annotate(f"{float(series[-1][col]):g}", (yrs[-1], float(series[-1][col])), textcoords="offset points",
                        xytext=(3, dy), fontsize=7, color=INK)
        ax.set_xlim(2008.5, 2025.5)
    fig.suptitle("Sample Registration System, 2009–2024: Bihar against India", x=0.01, ha="left",
                 fontsize=9.5, fontweight="bold", color=INK)
    handles, labels = axes[0, 0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper right", ncol=2, fontsize=7.5, bbox_to_anchor=(0.99, 1.0))
    fig.tight_layout()
    save(fig, "srs.png")


def devolution():
    r = rows("devolution.csv")
    fig, ax = plt.subplots(figsize=(6.4, 2.5))
    names = [x["commission"] for x in r]
    vals = [float(x["bihar_share_pct"]) for x in r]
    ax.bar(names, vals, width=0.5, color=BLUE)
    for i, val in enumerate(vals):
        ax.text(i, val + 0.2, f"{val:g}%", ha="center", fontsize=7.5, color=INK)
    pop = float(r[0]["population_share_2011_pct"])
    ax.axhline(pop, color=MUTED, lw=1, ls=(0, (4, 3)))
    ax.set_ylabel("% of states' share of central taxes")
    ax.set_ylim(0, max(vals) * 1.18)
    ax.grid(axis="x", visible=False)
    ax.set_title("Bihar's share of central tax devolution, by Finance Commission")
    fig.text(0.01, -0.04, f"Dashed line: Bihar's share of the population of these states, Census 2011 ({pop}%).\n"
             "The 11th FC award predates Jharkhand's separation (November 2000).", fontsize=7, color=MUTED)
    save(fig, "devolution.png")


def literacy():
    r = sorted(rows("census_districts.csv"), key=lambda x: float(x["literacy_pct"]))
    fig, ax = plt.subplots(figsize=(6.4, 6.6))
    names = [x["district"] for x in r]
    vals = [float(x["literacy_pct"]) for x in r]
    # dots, not bars: the axis starts at 40%, and a bar's length must start from zero
    ax.hlines(range(len(names)), 40, vals, color=GRID, lw=1)
    ax.plot(vals, range(len(names)), "o", color=BLUE, ms=5)
    ax.set_yticks(range(len(names)), names)
    ax.set_ylim(-0.7, len(names) - 0.3)
    ax.axvline(61.8, color=MUTED, lw=1, ls=(0, (4, 3)))
    ax.text(61.8, len(names) - 0.2, " Bihar 61.8%", fontsize=7, color=MUTED, va="bottom")
    for i, val in enumerate(vals):
        ax.text(val + 0.7, i, f"{val:.1f}", va="center", fontsize=6.5, color=MUTED)
    ax.set_xlim(40, 78)
    ax.tick_params(axis="y", labelsize=7)
    ax.set_xlabel("literacy rate, % of people aged 7 and over (Census 2011)")
    ax.grid(axis="y", visible=False)
    ax.set_title("Literacy by district, 2011")
    save(fig, "literacy.png")


def villages():
    r = rows("village_amenities.csv")
    b = r[0]
    keys = [k for k in b if k not in ("area", "inhabited_villages", "source_file")]
    pairs = sorted(((k, float(b[k])) for k in keys), key=lambda p: p[1])
    fig, ax = plt.subplots(figsize=(6.4, 3.6))
    ax.barh([p[0] for p in pairs], [p[1] for p in pairs], height=0.55, color=BLUE)
    for i, (_, val) in enumerate(pairs):
        ax.text(val + 1, i, f"{val:.1f}%", va="center", fontsize=7, color=INK)
    ax.set_xlim(0, 112)
    ax.set_xlabel(f"% of Bihar's {int(b['inhabited_villages']):,} inhabited villages with the amenity (2011)")
    ax.grid(axis="y", visible=False)
    ax.set_title("Amenities in Bihar's villages, 2011")
    save(fig, "villages.png")


def main():
    print(f"Writing {OUT.relative_to(ROOT)}/")
    for f in (gst, finances, population, srs, devolution, literacy, villages):
        f()


if __name__ == "__main__":
    main()
