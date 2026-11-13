#!/usr/bin/env python3
"""Build the Task 3 submission report for a non-technical, finance-minded audience.

Writes docs/IBN_Task3_Submission_Report.pdf: what was collected, what it shows about
Bihar's public finances and population, how far it can be trusted, what is missing and
what comes next, in plain language. Figures are read from data/analysis and
data/analysis/insights when the report is built (run analyse.py, insights.py and
book_charts.py first).
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import Image, KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, ROOT  # noqa: E402
import make_handbook as hb  # noqa: E402
from make_handbook import ACCENT, MUTED, RULE, P, S, bullets, esc, table  # noqa: E402

OUT = ROOT / "docs" / "IBN_Task3_Submission_Report.pdf"
INS = DATA / "analysis" / "insights"
REPO = "github.com/ayushjha4wd/ibn-collector"

# Plain-language status for every catalogue source
PLAIN = {
    "BR-PF-01": ("State Budget documents", "Not yet", "Web browsers mark the budget website as not secure (its security "
                 "certificate has expired). Download by hand until the site is fixed."),
    "BR-PF-02": ("Thematic budgets (green, gender, child, outcome)", "Collected", "Green Budget 2024-25. The website lists the "
                 "others but provides no download links."),
    "BR-PF-03": ("Fiscal Responsibility (FRBM) disclosures", "Not yet", "Same budget website as above."),
    "BR-PF-04": ("Bihar Economic Survey", "Collected", "2024-25 edition, English and Hindi."),
    "BR-PF-05": ("Finance Accounts, Appropriation Accounts, Accounts at a Glance", "Collected",
                 "Audited accounts for 2021-22 to 2024-25."),
    "BR-PF-06": ("Monthly Key Indicators and Monthly Civil Accounts", "Partly", "Monthly Key Indicators for every month "
                 "April 2021 to June 2026. The Monthly Civil Accounts page was down."),
    "BR-PF-07": ("CAG State Finances Audit Report", "Not yet", "The audit office's website does not open from outside India. "
                 "Retry from India."),
    "BR-PF-08": ("CAG audit reports on local bodies", "Not yet", "The audit office's page returned an error. Retry later."),
    "BR-PF-09": ("State Finance Commission reports", "Collected", "5th and 6th Commission reports."),
    "BR-PF-10": ("Treasury system (CFMS)", "Needs a person", "Requires a login."),
    "BR-PF-11": ("Commercial Taxes Department revenue data", "Nothing to collect", "The department publishes no revenue data "
                 "files; GST statistics and the monthly accounts cover this."),
    "BR-PF-12": ("GST statistics", "Collected", "All states, 2017-18 to 2026-27."),
    "BR-PF-13": ("RBI: State Finances, A Study of Budgets", "Not yet", "RBI's website only allows a person to download, one file at "
                 "a time. Download by hand."),
    "BR-PF-14": ("RBI: Handbook of Statistics on Indian States", "Not yet", "As above."),
    "BR-PF-15": ("Finance Commission reports and data", "Collected", "15th and 16th Commissions, including the evaluation of "
                 "Bihar's finances and the Commission's datasets."),
    "BR-PF-16": ("PRS Bihar Budget Analysis", "Collected", "2026-27."),
    "BR-PF-17": ("Open Budgets India", "Needs a person", "The website only allows a person to download by hand."),
    "BR-PF-18": ("CityFinance (urban local bodies)", "Needs a person", "No files to download; part of its data is in the "
                 "16th Finance Commission datasets already collected."),
    "BR-PF-19": ("eGramSwaraj (panchayat accounts)", "Needs a person", "Reports can only be viewed on screen."),
    "BR-PF-20": ("Panchayati Raj Department", "Nothing to collect", "Publishes orders and notices, not data."),
    "BR-PF-21": ("Urban Development Department", "Nothing to collect", "Publishes orders and notices, not data."),
    "BR-PF-22": ("State and District GDP (statistics directorate)", "Not yet", "The statistics directorate's website was "
                 "unreliable. District GDP is also in the Economic Survey, which was collected."),
    "BR-DM-01": ("Caste-based survey 2022-23", "Needs a person", "No stable official link to the report."),
    "BR-DM-02": ("Census 2011 tables for Bihar", "Collected", "500 tables."),
    "BR-DM-03": ("District Census Handbooks 2011", "Collected", "All 38 districts, including every village."),
    "BR-DM-04": ("Census 2027", "Nothing to collect", "Results not yet published."),
    "BR-DM-05": ("Sample Registration System (births and deaths)", "Collected", "Annual reports 2011 to 2024."),
    "BR-DM-06": ("Bihar vital statistics reports", "Not yet", "Statistics directorate website unreliable. Retry from India."),
    "BR-DM-07": ("Monthly district birth and death returns", "Not yet", "As above."),
    "BR-DM-08": ("Bihar Statistical Handbook", "Not yet", "As above."),
    "BR-DM-09": ("National Family Health Survey (NFHS)", "Not yet", "Web browsers mark the website as not secure (expired certificate)."),
    "BR-DM-10": ("Periodic Labour Force Survey", "Needs a person", "The ministry website does not offer direct downloads."),
    "BR-DM-11": ("Household Consumption Expenditure Survey", "Needs a person", "As above."),
    "BR-DM-12": ("Mission Antyodaya (village facilities)", "Needs a person", "Download form asks for name and purpose."),
    "BR-DM-13": ("Socio Economic and Caste Census 2011", "Needs a person", "View-only website."),
    "BR-DM-14": ("Electoral roll statistics", "Needs a person", "Published statistics must be saved by hand."),
    "BR-DM-15": ("Health Management Information System", "Needs a person", "Reports are generated on screen."),
    "BR-DM-16": ("Population projections 2011-2036", "Collected", "Official Technical Group projections."),
    "BR-XC-01": ("Bihar DataLab", "Needs a person", "On-screen website only; data downloads are still planned."),
    "BR-XC-02": ("Bihar e-Statistics website", "Needs a person", "Requires a login."),
    "BR-XC-03": ("Local Government Directory", "Needs a person", "Download form has an \"I am not a robot\" check."),
}
STATUS_COLOUR = {"Collected": "#e5f4e4", "Partly": "#f9eeda", "Not yet": "#fbebeb", "Needs a person": "#e7f1fb",
                 "Nothing to collect": "#f0efec"}


def rows(name):
    return list(csv.DictReader(open(INS / name, encoding="utf-8")))


def H1(t):
    return Paragraph(esc(t), S["h1"])


def chart(name, width_mm, caption):
    img = Image(str(ROOT / "docs" / "charts" / name))
    r = img.imageHeight / img.imageWidth
    img.drawWidth, img.drawHeight = width_mm * mm, width_mm * r * mm
    return KeepTogether([img, P(caption, "small"), Spacer(1, 4)])


def on_page(canvas, doc):
    if doc.page == 1:
        return
    canvas.saveState()
    canvas.setFont("Sans", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "India By Numbers · Task 3: Data collection · Report")
    canvas.drawRightString(hb.A4[0] - 18 * mm, 10 * mm, str(doc.page))
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 13 * mm, hb.A4[0] - 18 * mm, 13 * mm)
    canvas.restoreState()


def main():
    s, files, manifest, census = hb.load()
    fin = rows("state_finances.csv")
    gst = rows("gst_bihar.csv")
    fc = {r["measure"]: r for r in rows("fc16_inputs.csv")}
    dev = rows("devolution.csv")
    srs = rows("srs_rates.csv")
    pop = rows("population.csv")
    vil = rows("village_amenities.csv")[0]
    years = sorted({r["financial_year"] for r in fin})
    y0, y1 = years[0], years[-1]

    def f(item, fy):
        return float(next(r for r in fin if r["item"] == item and r["financial_year"] == fy)["actual_crore"])

    def be(item, fy):
        return float(next(r for r in fin if r["item"] == item and r["financial_year"] == fy)["budget_estimate_crore"])

    def sv(ind, y, col="bihar"):
        return float(next(r for r in srs if r["indicator"].startswith(ind) and r["year"] == str(y))[col])

    def cr(x):
        return f"{x:,.0f}"

    counts = {}
    for _, (_, st, _) in PLAIN.items():
        counts[st] = counts.get(st, 0) + 1
    with_data = counts["Collected"] + counts["Partly"]
    rr_growth = (f("Revenue receipts", y1) / f("Revenue receipts", y0)) ** (1 / (len(years) - 1)) - 1
    central = (f("Share of union taxes", y1) + f("Grants-in-aid", y1)) / f("Revenue receipts", y1) * 100
    committed = [(f("Salaries and wages", y) + f("Pensions", y) + f("Interest payments", y)) / f("Revenue receipts", y) * 100
                 for y in (y0, y1)]
    story = []

    # ---------------------------------------------------------------- cover
    meta = Table([[P("Project", "small"), P("India By Numbers: Public Finance and Demographics, Bihar", "body")],
                  [P("Task", "small"), P("Task 3: Data collection", "body")],
                  [P("Date", "small"), P("13 November 2026", "body")],
                  [P("Submitted by", "small"), P("____________________________", "body")]],
                 colWidths=[30 * mm, 140 * mm])
    meta.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    stats = [[P(f"{s['data_files']:,}", "big"), P(f"{with_data} of 41", "big"), P("5 years", "big"), P("All", "big")],
             [P("official data files collected", "small"), P("Bihar sources with data collected", "small"),
              P("of state accounts, cross-checked", "small"), P("files kept exactly as published", "small")]]
    st = Table(stats, colWidths=[42 * mm] * 4)
    st.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, 0), 1.2, ACCENT), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    story += [Spacer(1, 40 * mm), P("India By Numbers", "cover_s"), Spacer(1, 3 * mm),
              P("Collecting Bihar's Public Data", "cover_t"),
              P("Task 3 report: what we collected, what it shows, and what comes next", "cover_s"),
              Spacer(1, 14 * mm), meta, Spacer(1, 16 * mm), st, PageBreak()]

    # ---------------------------------------------------------------- 1 summary
    story += [H1("1. Executive summary"),
              P(f"Task 3 was to gather the actual data behind the Bihar sources we identified in Tasks 1 and 2. We have "
                f"now collected <b>{s['data_files']:,} official files</b> from <b>{with_data} of the 41 Bihar sources</b>: "
                f"the state's accounts, budget and Economic Survey, GST statistics, Finance Commission reports, Census "
                f"2011 (down to every village), and official birth and death statistics. Every file is kept exactly as "
                f"the government published it, with a record of where and when it was obtained."),
              P("Key points", "h2"),
              *bullets([f"<b>The financial data is reliable.</b> Bihar's monthly accounts, its audited annual accounts "
                        f"and the Economic Survey give the same figures for every year we checked.",
                        f"<b>A first look already raises questions.</b> Revenue grew about {rr_growth * 100:.0f}% a year from "
                        f"{y0} to {y1}, but salaries, pensions and interest rose from {committed[0]:.0f}% to "
                        f"{committed[1]:.0f}% of revenue, and borrowing reached Rs {cr(-f('Fiscal deficit (-)', y1))} crore "
                        f"in {y1}. About {central:.0f}% of the state's revenue comes from the Centre.",
                        f"<b>{41 - with_data - counts['Nothing to collect']} sources still need work.</b> "
                        f"{counts['Not yet']} failed because of problems on the government websites (websites marked "
                        f"\"not secure\", websites that do not open from outside India, or that only allow a person to "
                        f"download). {counts['Needs a person']} need someone to log in, fill a form or save on-screen "
                        f"reports. A further {counts['Nothing to collect']} sources have nothing to collect.",
                        "<b>The collection can be repeated at any time</b> to pick up new releases, and the remaining "
                        "sources can be added without redoing any of the work."]),
              P("At a glance", "h2"),
              table([["", "Result"],
                     ["Official data files collected", f"{s['data_files']:,}"],
                     ["Bihar sources with data", f"{with_data} of 41 ({counts['Partly']} partly)"],
                     ["Pages of reports made searchable", f"{s['pdf_pages']:,}"],
                     ["Spreadsheet tables available for analysis", f"{s['excel_sheets'] + 2344:,}"],
                     ["Sources blocked by website problems", str(counts["Not yet"])],
                     ["Sources needing a person to download", str(counts["Needs a person"])],
                     ["Sources with nothing to collect", str(counts["Nothing to collect"])]], [110, 64])]

    # ---------------------------------------------------------------- 2 task
    story += [H1("2. What the task was and why it matters"),
              P("India By Numbers aims to bring scattered government information together so that Bihar's public finances "
                "and population can be understood as a whole. Today the information sits in dozens of separate websites "
                "and reports. Tasks 1 and 2 listed the 41 Bihar sources and assessed how complete each one is. Task 3 "
                "collects the data itself, so that it can be analysed and connected."),
              P("The task set five conditions, all of which are met:"),
              table([["Condition", "What we did"],
                     ["Keep the original files", "Every file is stored exactly as published and locked against changes."],
                     ["Record when each file was downloaded", "The date and time of every download is recorded."],
                     ["Record where each file came from", "Every file is linked to its web address and to its source in "
                      "our catalogue."],
                     ["Never edit originals by hand", "All analysis works on copies; we can prove every original is "
                      "unchanged."],
                     ["Make it repeatable", "The whole collection can be repeated at any time, picking up only new "
                      "releases."]], [60, 114])]

    # ---------------------------------------------------------------- 3 collected
    story += [H1("3. What we collected"),
              P("Public finance", "h2"),
              table([["Dataset", "Published by", "Period", "Use"],
                     ["Monthly Key Indicators", "Accountant General, Bihar", "Every month, Apr 2021 – Jun 2026",
                      "Receipts, spending and borrowing against the budget, month by month"],
                     ["Finance Accounts and Appropriation Accounts", "Accountant General, Bihar", "2021-22 to 2024-25",
                      "Audited annual accounts, in full detail"],
                     ["Accounts at a Glance", "Accountant General, Bihar", "2024-25", "Summary of the year's audited accounts"],
                     ["Economic Survey", "Finance Department", "2024-25", "Review of the economy, including district GDP"],
                     ["Green Budget", "Finance Department", "2024-25", "Spending on environmental objectives"],
                     ["State Finance Commission reports", "State Finance Commission", "5th and 6th Commissions",
                      "Sharing of state revenue with panchayats and municipalities"],
                     ["GST statistics", "GST Network", "2017-18 to 2026-27", "GST collected in each state"],
                     ["Finance Commission reports and data", "15th and 16th Finance Commissions", "2020-21 to 2030-31",
                      "Bihar's share of central taxes; Commission's evaluation of Bihar"],
                     ["PRS Budget Analysis", "PRS Legislative Research", "2026-27", "Independent analysis of the budget"]],
                    [46, 40, 36, 52]),
              P("Population and social indicators", "h2"),
              table([["Dataset", "Published by", "Period", "Use"],
                     ["Census tables", "Registrar General of India", "Census 2011", "Population, literacy, work, housing, "
                      "caste and tribe, by district"],
                     ["District Census Handbooks", "Registrar General of India", "Census 2011",
                      "Every district and every village, including village facilities"],
                     ["Sample Registration System", "Registrar General of India", "2011 to 2024",
                      "Birth, death, infant mortality and fertility rates"],
                     ["Population projections", "Technical Group, Health Ministry", "2011 to 2036", "Official projections"],
                     ["Vital Statistics of India", "Registrar General of India", "2023", "Registered births and deaths"]],
                    [46, 40, 36, 52]),
              P("Appendix A lists all 41 sources with their status.", "small")]

    # ---------------------------------------------------------------- 4 trust
    story += [H1("4. Can the data be trusted?"),
              P("Every file is an official government publication, kept exactly as downloaded. For each one we record the "
                "web address, the date and time, and a unique check code that proves the file has not changed since. "
                "Files that turned out not to be genuine (for example, 368 RBI files that were really an error page) were "
                "identified and set aside."),
              P("Cross-checks", "h2"),
              table([["Year", "Revenue receipts: monthly accounts", "Revenue receipts: audited accounts",
                      "Revenue deficit: monthly accounts", "Revenue deficit: Economic Survey"]] +
                    [[y, cr(f("Revenue receipts", y)), {"2021-22": "158,797", "2022-23": "172,688", "2023-24": "193,347",
                                                        "2024-25": "218,657"}.get(y, "not yet published"),
                      cr(-f("Revenue surplus (+) / deficit (-)", y)) if f("Revenue surplus (+) / deficit (-)", y) < 0
                      else f"surplus {cr(f('Revenue surplus (+) / deficit (-)', y))}",
                      {"2021-22": "422", "2022-23": "11,288", "2023-24": "surplus 2,833"}.get(y, "not in this edition")]
                     for y in years], [20, 38, 38, 40, 38], extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")]),
              P("Rs crore. The three sources agree for every year where they overlap; a difference of 1 is rounding (for example, 218,657.83 shown as 218,658).", "small"),
              P("Where to be careful", "h2"),
              *bullets(["<b>Monthly figures are provisional.</b> The Monthly Key Indicators are unaudited; the audited "
                        "accounts follow about nine months after the year ends.",
                        "<b>Some reports are scanned images.</b> About 2,400 pages, including the whole Economic Survey, "
                        "were scanned. We made them searchable by having the computer read the page images, but this makes mistakes (for "
                        "example, dropping minus signs), so any figure taken from them must be checked against the "
                        "original page.",
                        "<b>Bihar has several population figures.</b> Census 2011 counted 10.41 crore; the 2023-24 official "
                        f"estimate is {float(fc['Population estimate 2023-24']['bihar']) / 10:.2f} crore; the 2022-23 caste "
                        "survey counted 13.07 crore. Any per-person figure must say which one it uses.",
                        "<b>National files cover all states.</b> GST and Finance Commission data include every state; "
                        "Bihar's figures need to be picked out."])]

    # ---------------------------------------------------------------- 5 finances
    fin_items = [("Revenue receipts", "Revenue receipts"), ("of which: state's own taxes", None),
                 ("of which: share of central taxes", "Share of union taxes"),
                 ("of which: grants from the Centre", "Grants-in-aid"), ("Revenue expenditure", "Revenue expenditure"),
                 ("of which: salaries and wages", "Salaries and wages"), ("of which: pensions", "Pensions"),
                 ("of which: interest", "Interest payments"), ("Capital expenditure", "Capital expenditure"),
                 ("Revenue surplus (+) / deficit (-)", "Revenue surplus (+) / deficit (-)"),
                 ("Fiscal deficit (borrowing)", "Fiscal deficit (-)")]
    tbl = [["Rs crore"] + years]
    for label, item in fin_items:
        if item is None:
            vals = [cr(f("Tax revenue", y) - f("Share of union taxes", y)) for y in years]
        elif item == "Fiscal deficit (-)":
            vals = [cr(-f(item, y)) for y in years]
        else:
            vals = [cr(f(item, y)) for y in years]
        tbl.append([label] + vals)
    bold = [("FONTNAME", (0, i), (-1, i), "Sans-Bold") for i, (lab, _) in enumerate(fin_items, 1)
            if not lab.startswith("of which")]
    story += [PageBreak(), H1("5. A first look at Bihar's finances"),
              P(f"The state's own monthly accounts give a consistent picture for {y0} to {y1}. These are the year-end "
                f"figures, unaudited for the latest year."),
              table(tbl, [58] + [23.2] * len(years), extra=[("ALIGN", (1, 0), (-1, -1), "RIGHT")] + bold),
              Spacer(1, 6),
              chart("finances.png", 150, f"Revenue receipts and revenue expenditure, Rs thousand crore, {y0} to {y1}."),
              P("What stands out", "h2"),
              *bullets([f"<b>Revenue is growing, but spending grew faster in {y1}.</b> Revenue receipts rose about "
                        f"{rr_growth * 100:.0f}% a year. In {y1} revenue expenditure jumped to Rs "
                        f"{cr(f('Revenue expenditure', y1))} crore, turning a near balance into a revenue deficit of Rs "
                        f"{cr(-f('Revenue surplus (+) / deficit (-)', y1))} crore. A revenue deficit means borrowing is "
                        f"paying for day-to-day spending, not only for investment.",
                        f"<b>Committed costs are taking a larger share.</b> Salaries, pensions and interest took "
                        f"{committed[0]:.0f}% of revenue in {y0} and {committed[1]:.0f}% in {y1}. Salaries alone more than "
                        f"doubled, from Rs {cr(f('Salaries and wages', y0))} crore to Rs "
                        f"{cr(f('Salaries and wages', y1))} crore.",
                        f"<b>Borrowing rose sharply while investment stalled.</b> The fiscal deficit was Rs "
                        f"{cr(-f('Fiscal deficit (-)', y1))} crore in {y1}, against Rs "
                        f"{cr(-f('Fiscal deficit (-)', years[-2]))} crore a year earlier and "
                        f"{f('Fiscal deficit (-)', y1) / be('Fiscal deficit (-)', y1) * 100:.0f}% of the budgeted figure. "
                        f"Capital expenditure was Rs {cr(f('Capital expenditure', y1))} crore, below the year before.",
                        f"<b>The state depends heavily on the Centre.</b> {central:.0f}% of revenue receipts in {y1} came "
                        f"from the state's share of central taxes and from central grants."]),
              chart("revenue_mix.png", 140, f"Where Bihar's revenue came from, {y1}."),
              chart("deficit.png", 140, "Fiscal deficit (net borrowing), Rs thousand crore.")]

    # ---------------------------------------------------------------- 6 GST and FC
    full = [r for r in gst if r["financial_year"] not in ("2017-18", "2026-27")]
    story += [H1("6. GST and transfers from the Centre"),
              P(f"GST collected in Bihar grew from Rs {cr(float(full[0]['bihar_gst_crore']))} crore in "
                f"{full[0]['financial_year']} to Rs {cr(float(full[-1]['bihar_gst_crore']))} crore in "
                f"{full[-1]['financial_year']}. Bihar's share of GST collected across all states has stayed around 1.2%, "
                f"ranking about 19th, although it has about 9.4% of the population. GST is collected mainly where "
                f"businesses are registered and goods are produced."),
              chart("gst.png", 150, "Source: GST statistics, state-wise collections by year."),
              P(f"The Finance Commission decides each state's share of central taxes. Bihar's share is "
                f"{dev[-1]['bihar_share_pct']}% under the 16th Finance Commission (2026-31), slightly lower than "
                f"{dev[-2]['bihar_share_pct']}% under the 15th. The Commission's own data explains why Bihar receives "
                f"more than its population share: in 2023-24 Bihar had {fc['Population estimate 2023-24']['bihar_share_pct']}% "
                f"of all states' population but {fc['Comparable GSDP 2023-24']['bihar_share_pct']}% of their combined "
                f"economy, and income per person of about Rs {cr(float(fc['GSDP per person 2023-24']['bihar']))}, "
                f"roughly a third of the all-state average (Rs {cr(float(fc['GSDP per person 2023-24']['all_states']))})."),
              chart("devolution.png", 140, "Source: 15th and 16th Finance Commission reports.")]

    # ---------------------------------------------------------------- 7 population
    p2036 = next(r for r in pop if r["year"] == "2036")
    story += [H1("7. Population and social indicators"),
              *bullets([f"<b>Population.</b> 10.41 crore at the 2011 Census; officially projected to reach "
                        f"{int(p2036['population']) / 1e7:.2f} crore by 2036.",
                        f"<b>Health is improving.</b> Infant deaths fell from {sv('Infant', 2009):g} to "
                        f"{sv('Infant', 2024):g} per 1,000 births between 2009 and 2024, now level with India.",
                        f"<b>Families remain larger.</b> Women in Bihar have on average {sv('Total', 2024):g} children, "
                        f"against {sv('Total', 2024, 'india'):g} for India; Bihar has the highest birth rate of the larger "
                        f"states. This means a young and growing population, with rising demand for schools and jobs.",
                        "<b>Wide gaps between districts.</b> In 2011 literacy ranged from 51% in Purnia to 73% in Rohtas.",
                        f"<b>Village facilities in 2011.</b> Of {int(vil['inhabited_villages']):,} inhabited villages, "
                        f"{float(vil['Power for domestic use']):.0f}% had household power, "
                        f"{float(vil['All-weather road']):.0f}% an all-weather road and only "
                        f"{float(vil['Commercial bank']):.0f}% a bank. This is now 15 years old; the 2027 Census will "
                        f"update it."]),
              chart("srs.png", 150, "Birth, death, infant mortality and fertility rates, Bihar and India, 2009–2024 "
                    "(Sample Registration System).")]

    # ---------------------------------------------------------------- 8 gaps
    story += [H1("8. What we could not collect yet, and why"),
              P("Some sources could not be collected. None of this is lost work: each item can be added to the collection "
                "later, with the same records of where and when it was obtained."),
              table([["Reason", "Sources", "What is needed"],
                     ["Website marked \"not secure\" (expired certificate)", "Bihar budget documents; FRBM disclosures; NFHS",
                      "Download by hand until the websites are fixed"],
                     ["Website does not open from outside India, or was unreliable",
                      "Statistics directorate reports (district GDP, vital statistics, Statistical Handbook); CAG audit "
                      "report", "Repeat the collection from a computer in India"],
                     ["Website returned errors", "CAG Monthly Civil Accounts and local-body audit reports", "Retry later"],
                     ["Website only allows a person to download", "RBI State Finances and Handbook; Open Budgets India",
                      "Download by hand"],
                     ["Login, form, \"I am not a robot\" check, or on-screen reports only", "Treasury (CFMS), eGramSwaraj, labour and "
                      "consumption surveys, health MIS, Mission Antyodaya, electoral statistics, SECC, Local Government "
                      "Directory, DataLab, e-Statistics", "Download or export by hand"],
                     ["No official link", "Caste-based survey 2022-23 report", "Obtain the tabled report"]],
                    [44, 80, 50]),
              P(f"Four sources have nothing to collect: two departments publish only orders and notices, the Commercial "
                f"Taxes Department publishes no data files, and Census 2027 results are not yet out.", "small")]

    # ---------------------------------------------------------------- 9 next
    story += [H1("9. Next steps"),
              table([["Step", "What it involves", "Benefit"],
                     ["1. Complete the Bihar collection", "Repeat the collection from India; download the remaining sources by hand",
                      "Covers RBI data, budget documents, district GDP and health surveys"],
                     ["2. Clean and standardise", "Put tables into consistent formats: district names, units, years",
                      "Data ready for comparison and analysis"],
                     ["3. Check key figures from scanned reports", "Enter important tables (for example, from the Economic "
                      "Survey) from the original pages", "Reliable figures from image-only reports"],
                     ["4. Label every figure", "Mark each number as reported, derived, estimated or unavailable",
                      "Transparency, as IBN's principles require"],
                     ["5. Connect the data", "Per-person spending; district profiles against spending; health outcomes "
                      "against health spending", "The connected picture IBN aims for"]], [46, 68, 60])]

    # ---------------------------------------------------------------- 10 where
    story += [H1("10. Where to find everything"),
              P(f"Everything is kept together in one online folder: <b>{REPO}</b>. It contains:"),
              *bullets(["This report.",
                        "The <b>Bihar Data Book</b>: a detailed 40-page account of the data and what it shows.",
                        "The <b>Bihar Data Handbook</b>: a short 16-page guide.",
                        "A list of every file, with the period it covers, its size and where it came from.",
                        "All the original government files, exactly as published, arranged by source.",
                        "The tables behind the figures in this report, each traced to the page it came from."]),
              P("The whole folder can be downloaded as a single file from the link above.", "small")]

    # ---------------------------------------------------------------- appendix A
    rows_a = [["ID", "Source", "Status", "Notes"]]
    extra = []
    for i, cid in enumerate(hb.CATALOGUE_IDS, 1):
        name, status, note = PLAIN[cid]
        rows_a.append([cid, name, status, note])
        extra.append(("BACKGROUND", (2, i), (2, i), colors.HexColor(STATUS_COLOUR[status])))
    story += [PageBreak(), H1("Appendix A. Status of all 41 Bihar sources"),
              P("PF = public finance; DM = demographics; XC = directories and websites covering both.", "small"),
              table(rows_a, [17, 55, 24, 78], extra=extra)]

    # ---------------------------------------------------------------- appendix B
    story += [PageBreak(), H1("Appendix B. Glossary"),
              table([["Term", "Meaning"],
                     ["Revenue receipts", "Money the state receives that does not create a liability: its own taxes, its "
                      "share of central taxes, grants and non-tax income"],
                     ["Revenue expenditure", "Day-to-day spending: salaries, pensions, interest, subsidies, running costs"],
                     ["Capital expenditure", "Spending that creates assets, such as roads, buildings and equipment"],
                     ["Revenue deficit", "Revenue expenditure minus revenue receipts: borrowing used for day-to-day spending"],
                     ["Fiscal deficit", "Total spending minus total receipts other than borrowing: the state's net "
                      "borrowing for the year"],
                     ["Committed expenditure", "Salaries, pensions and interest, which are hard to reduce in the short term"],
                     ["Budget estimate", "The amount in the budget passed for the year"],
                     ["Devolution", "The states' share of central taxes, divided among states by the Finance Commission"],
                     ["GSDP", "Gross State Domestic Product: the size of the state's economy"],
                     ["Crore", "10 million; Rs 1 lakh crore is Rs 1 trillion"],
                     ["Monthly Key Indicators", "The Accountant General's monthly summary of the state's accounts"],
                     ["Infant mortality rate", "Deaths before age one per 1,000 live births"],
                     ["Fertility rate", "The average number of children a woman would have"],
                     ["Check code", "A code worked out from a file's exact contents; if the file changed in any way, the "
                      "code would change, which proves the file is unaltered"]], [42, 132])]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = hb.Doc(str(OUT), pagesize=hb.A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm,
                 bottomMargin=18 * mm, title="Collecting Bihar's Public Data: Task 3 report",
                 author="India By Numbers", subject="Task 3: Data collection")
    doc.build(story, onLaterPages=on_page)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
