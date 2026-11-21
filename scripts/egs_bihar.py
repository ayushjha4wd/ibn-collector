"""Targeted Bihar collection from eGramSwaraj (Task 4, second pass). Run FROM INDIA.

The first pass (egs_explore.py, 20 Nov 2026) mapped the portal. It showed that much of
eGramSwaraj's Bihar finance data is published in four ways that need no login or CAPTCHA:

  static   Pre-generated report files served by FileRedirect.jsp, linked from the public
           pages. For Bihar (state code 10), per financial year:
             ExpenditureReport<FY>/10        District-wise Receipt and Payment Statement
                                             (OB + Receipts, Payments; ZP / BP / GP tier), links
                                             down to ExpFY<FY>/10/<district> ...
             SummaryReport<FY>/10            District-wise accounting status (masters, opening
                                             balance, vouchers, day/month/year book closed),
                                             links to /10/<district> (blocks) and
                                             FinancialYear<FY>/10/<block> (month-wise vouchers)
             SchemeWiseExpenditureReport<FY>/<scheme>   (national page; Bihar links followed)
           This step downloads those trees for Bihar only, down to --depth levels
           (default: district pages for every year, block pages for --deep-years).
  api      getMobileData JSON (year-book closure) for every year: state, district, block,
           and GP lists (GP lists for --deep-years).
  js       The Angular service/controller JavaScript of the public report pages. It holds
           the JSON endpoint URLs those pages call; saved so the endpoints are documented
           from the portal's own code.
  xhr      (needs Playwright) Opens each public Angular report page that has NO CAPTCHA,
           records every JSON response the page itself requests, selects Bihar (and a
           financial year) where offered, presses the report button, and for the pages in
           --drill-all clicks every district link in the Bihar result, recording the JSON.
  manual   (optional, needs Playwright, a person at the keyboard) Opens the report pages
           that DO have a CAPTCHA in a visible browser. YOU choose Bihar / year and type
           the CAPTCHA yourself; the script only saves what the page then shows. Nothing is
           solved or bypassed by the script.

Nothing behind login is touched. Responses that look like lists of people's contact
details (>= 5 distinct phone numbers or e-mail addresses) are not saved; only the URL and
counts are logged ("withheld_personal_data"). Every saved file is read-only and logged in
data/provenance.jsonl (source_id EGS-PORTAL) with URL, time (UTC + IST), parameters and sha256.
Re-running is safe: files already saved are skipped.

USAGE (inside the ibn-collector folder, on a computer in India)
  python scripts/egs_bihar.py                          # static + api + js   (standard library only)
  python scripts/egs_bihar.py --steps xhr              # needs: pip install playwright; python -m playwright install chromium
  python scripts/egs_bihar.py --steps manual           # optional, you type the CAPTCHAs
Then: git add data && git commit -m "eGramSwaraj Bihar pass 2" && git push   (or send the printed zip)
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import IST, PROVENANCE, RAW, ROOT, TOOL_VERSION, append_jsonl, now_stamps  # noqa: E402

SOURCE_ID = "EGS-PORTAL"
BASE = os.environ.get("EGS_BASE", "https://egramswaraj.gov.in/")  # override only for offline tests
STATE = "10"  # Bihar
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
PHONE = re.compile(r"(?<!\d)[6-9]\d{9}(?!\d)")
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
ALL_YEARS = [f"{y}-{y + 1}" for y in range(2012, 2027)]
# Scheme codes offered by schemeExpenditureReport.do (form saved 20 Nov 2026, Bihar selected)
SCHEMES = ["0", "165", "126", "2813", "20", "958", "71", "25", "127", "118", "34", "3", "70", "128", "115", "116",
           "113", "13", "15", "2042", "2896", "114", "3222", "18", "117", "2706", "487", "3302", "14", "129", "486",
           "2899", "12", "24", "3287"]
# Public Angular report pages without a CAPTCHA (from the 20 Nov 2026 crawl)
XHR_PAGES = ["ElectedRepresentativeReportZp.do", "ElectedRepresentativeReportBp.do", "ElectedRepresentativeReportVp.do",
             "gpProfileReport.do", "bpProfileReport.do", "zpProfileReport.do", "registrationVpReport.do",
             "getYearBook.do", "yearBookStatus.do", "tiedExpenditure.do", "ffcSectorWiseExpenditure.do",
             "ffcSectorWiseExpenditureNew.do", "ffcSchemeComponentOtherExp.do", "getExpenditureData.do",
             "themeWiseExpenditure.do", "planWiseActivitiesDetails.do", "gpdpUploadReport.do", "bpPlanUploadReport.do",
             "zpPlanUploadReport.do", "ongoingActivityReport.do", "assetDetails.do", "geoTaggingReport.do",
             "publicReport.do", "publicReportDate.do", "publicReportMannual.do", "receiptRectificationReport.do",
             "OfflinePaymentVoucherHome.do", "Gcmsbilldetails.do", "gcmBillReport.do", "bankPendingPaymentReport.do",
             "bankpendingavg.do", "SectorWiseAnalysis.do", "statusReportData.do", "timeProgressGraph.do",
             "weeklyProgressGraph.do", "stateProgressGraph.do", "getGpdpDashboard.do", "getSchemeWiseActivityDetails.do",
             "pfmsDashboardNew.do", "beneficiaryDashboardNew.do", "schemeWiseBeneficiaryCountReport.do",
             "internetConnectivityStatus.do", "schoolAssetStatus.do", "auditeePlandetails.do",
             "auditReportGeneratedReport.do", "observationCountReport.do", "majorHeadMappingReport.do",
             "subMajorHeadMappingReport.do", "minorHeadMappingReport.do", "minorObjectHeadMappingReport.do",
             "noeReport.do", "loginReport.do"]
DRILL_ALL = {"tiedExpenditure.do", "ffcSectorWiseExpenditure.do", "ffcSectorWiseExpenditureNew.do",
             "ffcSchemeComponentOtherExp.do", "ElectedRepresentativeReportVp.do", "gpProfileReport.do",
             "planWiseActivitiesDetails.do", "gpdpUploadReport.do", "getYearBook.do", "registrationVpReport.do",
             "getExpenditureData.do", "themeWiseExpenditure.do"}
# Report pages with a CAPTCHA in the report form (only for --steps manual)
MANUAL_PAGES = ["phyAndFinancialDetails.do", "panchayatWiseExpenditureReport.do", "AnnualRecieptsReport.do",
                "schemeWiseUnspendBalance.do", "consolidatedReceiptExpReport.do", "consolidatedExp.do",
                "percentageExpenditureReport.do", "objectHeadWiseExpenditureReport.do", "receiptHeadExpReport.do",
                "actionPlanReportForGP.do", "actionPlanReportForResourceEnvelope.do", "analyticalReportOnPDP.do",
                "basicProfileConsolidateReport.do", "knowYourPanchayat.do", "vendorReport.do",
                "voucherDetailsHeadTierWise.do", "remittanceBalanceReportHome.do", "demandCollection.do",
                "getPanchayatRevenuePotentialReport.do", "schemeWiseActivityReport.do", "cashBookPublic.do"]
BUTTON = re.compile(r"get|submit|show|view|go\b|search|report", re.I)
FY_TEXT = re.compile(r"20\d\d\s*-\s*(20)?\d\d")


class Collector:
    def __init__(self, a):
        self.a = a
        self.date = __import__("datetime").datetime.now(IST).date().isoformat()
        self.raw = RAW / SOURCE_ID / self.date / "egramswaraj.gov.in"
        cj = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
        self.op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-IN,en;q=0.9")]
        self.n = collections.Counter()

    # ---------- storage ----------
    def dest(self, sub: str, url: str, ext: str) -> Path:
        u = urllib.parse.urlsplit(url)
        stem = re.sub(r"[^A-Za-z0-9._=-]+", "_", (u.path.strip("/") or "index") + ("__" + u.query if u.query else ""))
        if len(stem) > 150:
            stem = stem[:110] + "_" + hashlib.sha1(stem.encode()).hexdigest()[:12]
        return self.raw / sub / f"{stem}.{ext}"

    def saved(self, sub, url):
        """Files already saved for this URL, in today's folder or any earlier dated folder (so a run
        that crosses midnight, or is restarted the next day, resumes instead of downloading again)."""
        d = self.dest(sub, url, "x")
        rel = d.relative_to(self.raw).parent
        for day in sorted((RAW / SOURCE_ID).glob("*-*-*"), reverse=True):
            folder = day / "egramswaraj.gov.in" / rel
            if folder.is_dir():
                hit = [q for q in folder.glob(glob_escape(d.stem) + ".*") if q.stem == d.stem]
                if hit:
                    return hit
        return []

    def have(self, sub, url):
        return bool(self.saved(sub, url))

    def save(self, path: Path, body: bytes, rec: dict):
        n = 1
        while path.exists():
            path = path.with_name(f"{path.stem}.{n}{path.suffix}")
            n += 1
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        os.chmod(path, 0o444)
        rec.update(stored_path=path.relative_to(ROOT).as_posix(), sha256=hashlib.sha256(body).hexdigest(),
                   bytes=len(body))

    def log(self, rec):
        append_jsonl(PROVENANCE, {"source_id": SOURCE_ID, "tool": TOOL_VERSION, **rec})
        self.n[rec.get("status")] += 1

    def personal(self, text: str):
        p, e = len(set(PHONE.findall(text))), len(set(EMAIL.findall(text)))
        return (p >= 5 or e >= 5), p, e

    def get(self, step, sub, url, report, params=None, data=None):
        """Download url once (skip if saved before). Returns body text or None."""
        hit = self.saved(sub, url)
        if hit:
            self.n["skipped"] += 1
            return hit[0].read_bytes().decode("utf-8", "ignore")
        time.sleep(self.a.delay)
        rec = {"step": step, "report": report, "url": url, "params": params or {}, "method": "POST" if data else "GET",
               **now_stamps()}
        try:
            req = urllib.request.Request(url, data=data.encode() if data else None,
                                         headers={"Referer": BASE + "welcome.do"})
            with self.op.open(req, timeout=self.a.timeout) as r:
                status, ctype, disp, body = r.status, r.headers.get("Content-Type", ""), \
                    r.headers.get("Content-Disposition"), r.read(80 << 20)
        except urllib.error.HTTPError as e:
            self.log({**rec, "status": "http_error", "http_status": e.code})
            return None
        except Exception as e:  # network trouble: log and carry on
            self.log({**rec, "status": "error", "error": repr(e)[:300]})
            print("  ERR", url, repr(e)[:120])
            return None
        rec.update(http_status=status, content_type=ctype, content_disposition=disp)
        text = body.decode("utf-8", "ignore")
        if "json" in ctype or text[:1] in "[{":
            ext = "json"
        elif "excel" in ctype or "spreadsheet" in ctype:
            ext = "xls"
        elif "pdf" in ctype:
            ext = "pdf"
        elif "javascript" in ctype or url.endswith(".js"):
            ext = "js"
        else:
            ext = "html"
        bad, p, e = self.personal(text) if ext in ("html", "json") else (False, 0, 0)
        if bad:
            self.log({**rec, "status": "withheld_personal_data", "distinct_phone_numbers": p, "distinct_emails": e})
            return None
        empty = ext == "html" and ("HTTP Status 404" in text or "File Not Found" in text or len(body) < 200)
        self.save(self.dest(sub, url, ext), body, rec)
        self.log({**rec, "status": "not_found_page" if empty else "downloaded"})
        return None if empty else text

    # ---------- static ----------
    def static(self):
        years = ALL_YEARS if self.a.years == "all" else self.a.years.split(",")
        deep = set(years if self.a.deep_years == "all" else self.a.deep_years.split(",")) if self.a.deep_years else set()
        seeds = []
        for fy in years:
            seeds.append((f"ExpenditureReport{fy}/{STATE}", f"{STATE}.html", "District-wise Receipt and Payment Statement", True, fy))
            seeds.append((f"SummaryReport{fy}/{STATE}", f"{STATE}.html", "District Wise Summary Report (accounting status)", True, fy))
            for s in SCHEMES:
                seeds.append((f"SchemeWiseExpenditureReport{fy}/{s}", f"{s}.html", f"Scheme Wise Expenditure Report (scheme {s})", False, fy))
        q = collections.deque((fd, name, rep, bihar, fy, 0) for fd, name, rep, bihar, fy in seeds)
        seen = set()
        while q:
            fd, name, rep, bihar, fy, depth = q.popleft()
            url = f"{BASE}FileRedirect.jsp?FD={fd}&name={name}"
            if url in seen:
                continue
            seen.add(url)
            text = self.get("static", "static", url, rep, {"FD": fd, "name": name, "financial_year": fy, "depth": depth})
            if not text:
                continue
            limit = self.a.depth + (1 if fy in deep else 0)
            for h in re.findall(r'href="(FileRedirect\.jsp\?FD=([^"&]+)&(?:amp;)?name=([^"]+))"', text):
                cfd, cname = h[1], h[2]
                if cfd.startswith("excelReport"):
                    if bihar and depth == 0:  # the Excel export of a Bihar state page (one copy)
                        q.append((cfd, cname, rep + " (Excel export)", True, fy, 99))
                    continue
                child_bihar = bihar or f"/{STATE}/" in cfd + "/" or cname == f"{STATE}.html"
                if child_bihar and depth < limit:
                    q.append((cfd, cname, rep, True, fy, depth + 1))
            if depth == 0 and bihar and self.a.voucher_samples:
                # month-wise voucher list pages (voucherWiseReport.do): a small sample only
                for v in re.findall(r'href="(voucherWiseReport\.do\?[^"]+)"', text)[: self.a.voucher_samples]:
                    self.get("static", "static", BASE + v.replace("&amp;", "&"), "Voucher-wise report (sample)")
            print(f"  static d{depth} {fd} {name}  [{dict(self.n)}]", flush=True)

    # ---------- api ----------
    def api(self):
        years = ALL_YEARS if self.a.years == "all" else self.a.years.split(",")
        deep = set(years if self.a.deep_years == "all" else self.a.deep_years.split(",")) if self.a.deep_years else set()
        g = BASE + "getMobileData/"
        for fy in years:
            self.get("api", "api", f"{g}getTotalBookClosed/{fy}/0", "Year book closed: national totals")
            for tier in ("GP", "BP", "ZP"):
                self.get("api", "api", f"{g}getYearBookClosedStateWise/{fy}/{tier}", f"Year book closed by state ({tier})")
            t = self.get("api", "api", f"{g}getYearBookClosedDistrictWise/{fy}/{STATE}/GP", "Year book closed: Bihar districts")
            for d in codes(t):
                b = self.get("api", "api", f"{g}getYearBookClosedBlockWise/{fy}/{STATE}/GP/{d}", "Year book closed: blocks of a district")
                if fy in deep:
                    for blk in codes(b):
                        self.get("api", "api", f"{g}getYearBookClosedGPWise/{fy}/{STATE}/{blk}", "Year book closed: GPs of a block")
            print(f"  api {fy} [{dict(self.n)}]", flush=True)

    # ---------- js ----------
    def js(self):
        srcs = set()
        for page in sorted(set(XHR_PAGES + MANUAL_PAGES)):
            t = self.get("js", "pages", BASE + page, f"Report page {page}")
            if t is None:
                hit = list((RAW / SOURCE_ID).glob(f"*/egramswaraj.gov.in/{page}.html"))
                t = hit[0].read_text("utf-8", "ignore") if hit else ""
            srcs |= set(re.findall(r'src="/?(resources/[^"]+\.js)"', t))
        for s in sorted(srcs):
            if re.search(r"(jquery|bootstrap|angular(\.min|-filter)|popper|pdfmake|vfs_fonts|datatables|excelexport|print)",
                         s, re.I):
                continue
            self.get("js", "js", BASE + s, "Report page JavaScript (endpoint definitions)")
        print(f"  js done [{dict(self.n)}]")

    # ---------- xhr / manual (Playwright) ----------
    def _browser(self, headed=False):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            sys.exit("Playwright missing: pip install playwright && python -m playwright install chromium")
        self._pw = sync_playwright().start()
        self._b = self._pw.chromium.launch(headless=not headed)
        ctx = self._b.new_context(user_agent=UA, accept_downloads=True, locale="en-IN")
        page = ctx.new_page()
        page.set_default_timeout(30000)
        page.goto(BASE + "welcome.do", wait_until="domcontentloaded")  # session cookie
        return page

    def _record(self, page, sink):
        def on_resp(r):
            try:
                if r.request.resource_type not in ("xhr", "fetch") or r.status != 200:
                    return
                body = r.body()
                sink.append((r.url, r.request.method, r.request.post_data, r.headers.get("content-type", ""), body))
            except Exception:
                pass
        page.on("response", on_resp)

    def _flush(self, sink, page_name, action, selections):
        for i, (url, method, post, ctype, body) in enumerate(sink):
            text = body.decode("utf-8", "ignore")
            rec = {"step": "xhr", "report": page_name, "url": url, "method": method, "post_data": post,
                   "action": action, "selections": selections, "content_type": ctype, **now_stamps()}
            bad, p, e = self.personal(text)
            if bad:
                self.log({**rec, "status": "withheld_personal_data", "distinct_phone_numbers": p, "distinct_emails": e})
                continue
            ext = "json" if text[:1] in "[{" else "html" if "<" in text[:200] else "txt"
            ep = re.sub(r"[^A-Za-z0-9._=-]+", "_", urllib.parse.urlsplit(url).path.strip("/"))[:80]
            key = hashlib.sha1(f"{url}|{post}".encode()).hexdigest()[:10]
            self.save(self.raw / "xhr" / page_name.replace(".do", "") / f"{ep}__{key}.{ext}", body, rec)
            self.log({**rec, "status": "downloaded"})
        sink.clear()

    def _choose(self, page, fy):
        """Select Bihar (and fy) in every drop-down that offers it. Returns {select: chosen text}."""
        chosen = {}
        for _ in range(3):  # cascading drop-downs fill in after a choice
            for sel in page.locator("select").all():
                try:
                    name = sel.get_attribute("id") or sel.get_attribute("name") or "?"
                    if name in chosen:
                        continue
                    opts = sel.evaluate("s => [...s.options].map(o => [o.value, (o.textContent||'').trim()])")
                    pick = next((o for o in opts if o[1].lower() == "bihar"), None)
                    if not pick:
                        pick = next((o for o in opts if FY_TEXT.search(o[1]) and o[1].replace(" ", "").startswith(fy[:5])
                                     and o[0]), None)
                    if pick:
                        sel.select_option(value=pick[0], force=True)
                        chosen[name] = pick[1]
                        page.wait_for_timeout(1500)
                except Exception:
                    continue
        return chosen

    def _press(self, page):
        for b in page.locator("button:visible, input[type=button]:visible, input[type=submit]:visible").all():
            label = (b.inner_text() if b.evaluate("e => e.tagName") == "BUTTON" else b.get_attribute("value")) or ""
            if BUTTON.search(label) and not re.search(r"login|logout|close|reset|clear|back", label, re.I):
                b.click()
                page.wait_for_load_state("networkidle")
                return label.strip()
        return None

    def xhr(self):
        page = self._browser()
        sink = []
        self._record(page, sink)
        pages = XHR_PAGES if self.a.pages == "all" else self.a.pages.split(",")
        for name in pages:
            try:
                page.goto(BASE + name, wait_until="networkidle")
                if page.locator("#img_Capatcha, img[src*=captcha]").count():
                    self.log({"step": "xhr", "report": name, "url": BASE + name, "status": "captcha_present_not_attempted",
                              **now_stamps()})
                    sink.clear()
                    continue
                self._flush(sink, name, "page load (national view)", {})
                sel = self._choose(page, self.a.fy)
                label = self._press(page)
                page.wait_for_timeout(2000)
                self._flush(sink, name, f"selected + pressed {label!r}", sel)
                self._save_dom(page, name, "bihar", sel)
                links = [t for t in page.locator("table a:visible").all_inner_texts() if t.strip()][:60]
                todo = links if name in DRILL_ALL else links[:1]
                for t in todo:
                    if re.search(r"logout|login|home|back|excel|pdf|print", t, re.I):
                        continue
                    try:
                        page.goto(BASE + name, wait_until="networkidle")
                        sink.clear()
                        self._choose(page, self.a.fy)
                        self._press(page)
                        page.wait_for_timeout(1500)
                        sink.clear()
                        page.locator("table a:visible", has_text=t.strip()).first.click()
                        page.wait_for_load_state("networkidle")
                        page.wait_for_timeout(1500)
                        self._flush(sink, name, f"drill: clicked {t.strip()!r}", sel)
                    except Exception as e:
                        print("   drill failed", name, t, repr(e)[:80])
                print(f"  xhr {name}: {len(todo)} drill clicks [{dict(self.n)}]", flush=True)
            except Exception as e:
                self.log({"step": "xhr", "report": name, "url": BASE + name, "status": "error", "error": repr(e)[:300],
                          **now_stamps()})
                print("  xhr ERR", name, repr(e)[:120])
        self._b.close()
        self._pw.stop()

    def _save_dom(self, page, name, tag, sel):
        html = page.content()
        bad, p, e = self.personal(html)
        rec = {"step": "xhr", "report": name, "url": page.url, "selections": sel, "action": "rendered page", **now_stamps()}
        if bad:
            self.log({**rec, "status": "withheld_personal_data", "distinct_phone_numbers": p, "distinct_emails": e})
            return
        self.save(self.raw / "rendered" / f"{name.replace('.do', '')}__{tag}.html", html.encode("utf-8"), rec)
        self.log({**rec, "status": "downloaded"})

    def manual(self):
        page = self._browser(headed=True)
        sink = []
        self._record(page, sink)
        print("\nA browser window opens for each report. In it: choose Bihar, the year and other filters,\n"
              "TYPE THE CAPTCHA YOURSELF, and press the report button. When the result shows, come back here\n"
              "and press Enter to save it (type s + Enter to skip, q + Enter to stop).\n")
        for name in MANUAL_PAGES:
            page.goto(BASE + name, wait_until="domcontentloaded")
            sink.clear()
            ans = input(f"[{name}] Enter = save, s = skip, q = quit: ").strip().lower()
            if ans == "q":
                break
            if ans == "s":
                continue
            sel = {}
            for s in page.locator("select").all():
                try:
                    sel[s.get_attribute("id") or s.get_attribute("name") or "?"] = s.evaluate(
                        "s => s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : ''")
                except Exception:
                    pass
            self._flush(sink, name, "manual: person filled the form and CAPTCHA", sel)
            self._save_dom(page, name, "manual_" + now_stamps()["retrieved_at_utc"][:19].replace(":", ""), sel)
            print("   saved", sel)
        self._b.close()
        self._pw.stop()

    def bundle(self):
        z = ROOT / f"egs_bihar_{self.date}.zip"
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as f:
            for p in (RAW / SOURCE_ID / self.date).rglob("*"):
                if p.is_file():
                    f.write(p, p.relative_to(ROOT).as_posix())
            recs = [l for l in PROVENANCE.read_text("utf-8").splitlines() if '"EGS-PORTAL"' in l]
            f.writestr("data/provenance_EGS-PORTAL.jsonl", "\n".join(recs) + "\n")
        print("zip:", z)


def glob_escape(s):
    return re.sub(r"([\[\]*?])", r"[\1]", s)


def codes(text):
    try:
        return [r["code"] for r in json.loads(text or "[]") if isinstance(r, dict) and "code" in r]
    except ValueError:
        return []


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--steps", default="static,api,js", help="any of static,api,js,xhr,manual")
    ap.add_argument("--years", default="all", help="FYs like 2024-2025, comma separated, or 'all' (2012-13 to 2026-27)")
    ap.add_argument("--depth", type=int, default=1, help="static: levels below the Bihar page (1 = district pages)")
    ap.add_argument("--deep-years", default="2020-2021,2024-2025",
                    help="years taken one level deeper (static: block pages; api: GP lists). '' for none")
    ap.add_argument("--voucher-samples", type=int, default=2, help="voucher-wise pages to sample per Bihar page")
    ap.add_argument("--fy", default="2024-2025", help="year chosen in the xhr step")
    ap.add_argument("--pages", default="all", help="xhr: comma list of report pages, or 'all'")
    ap.add_argument("--delay", type=float, default=0.7)
    ap.add_argument("--timeout", type=int, default=120)
    a = ap.parse_args()
    c = Collector(a)
    try:
        urllib.request.urlopen(urllib.request.Request(BASE, headers={"User-Agent": UA}), timeout=30).read(100)
    except Exception as e:
        sys.exit(f"Cannot reach {BASE} ({e!r}). This script must run from an Indian internet connection.")
    for step in a.steps.split(","):
        print(f"== {step}", flush=True)
        getattr(c, step.strip())()
    print("done:", dict(c.n))
    c.bundle()


if __name__ == "__main__":
    main()
