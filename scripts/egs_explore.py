"""Explore and sample the eGramSwaraj portal suite for Bihar (Task 4).

WHY THIS SCRIPT EXISTS
  egramswaraj.gov.in and its report hosts refuse connections from outside India
  (verified 20 Nov 2026 from a cloud machine: empty replies / connection resets / no route,
  while auditonline.gov.in answered normally). So this script is meant to be run ONCE
  from a computer in India. It saves everything it sees, untouched, with provenance,
  and packs it into one zip to hand back for analysis.

WHAT IT DOES (all public pages; nothing behind login or CAPTCHA is touched)
  1. crawl   Breadth-first crawl of the public pages of
             egramswaraj.gov.in, reportingonline.gov.in, accountingonline.gov.in,
             planningonline.gov.in. Saves each page as served, records every link,
             menu item and form (fields + every drop-down option), and downloads linked
             report files (pdf/xls/xlsx/csv/doc/zip).
  2. api     Calls the eGramSwaraj JSON endpoints that AuditOnline's own public JavaScript
             calls (getMobileData/getYearBookClosed*), for Bihar (state code 10).
  3. forms   (optional, needs Playwright) For each report form found in step 1 that offers
             BIHAR in a drop-down: select Bihar and a financial year, submit, save the result
             and any Excel/PDF/CSV export, then click down through the result table
             (district -> block -> GP) a few levels, saving each level.

PERSONAL DATA
  Pages that look like lists of people's contact details (many phone numbers or e-mail
  addresses) are NOT saved: only their URL, title, column headings and row count are logged
  (status "withheld_personal_data"). Elected representatives' names on profile pages are
  public-office information and are kept; phone numbers on them are what trigger withholding.

USAGE (from a computer in India, inside the ibn-collector folder)
  python scripts/egs_explore.py                 # steps 1 and 2 (standard library only)
  pip install playwright && python -m playwright install chromium
  python scripts/egs_explore.py --forms         # steps 1, 2 and 3
  -> prints the path of egs_explore_<date>.zip ; send that file back (or git add + push data/).

Options: --max-pages N (default 1500), --delay SECONDS (default 1.0), --fy 2024-2025
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
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import IST, PROVENANCE, RAW, ROOT, TOOL_VERSION, append_jsonl, now_stamps  # noqa: E402

SOURCE_ID = "EGS-PORTAL"
HOSTS = {"egramswaraj.gov.in", "www.egramswaraj.gov.in", "reportingonline.gov.in",
         "accountingonline.gov.in", "planningonline.gov.in"}
SEEDS = ["https://egramswaraj.gov.in/", "https://reportingonline.gov.in/",
         "https://accountingonline.gov.in/", "https://planningonline.gov.in/"]
SKIP = re.compile(r"(?i)(logout|login\.do\?|signup|register\.do|forgot|changepass|\.(mp4|avi|mov|jpg|jpeg|png|gif|svg|"
                  r"ico|css|js|woff2?|ttf)(\?|$)|javascript:|mailto:|tel:)")
FILE_EXT = re.compile(r"(?i)\.(pdf|xls|xlsx|csv|doc|docx|zip|ppt|pptx|ods|odt)(\?|$)")
PHONE = re.compile(r"(?<!\d)[6-9]\d{9}(?!\d)")
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
BIHAR = 10


class PageParser(HTMLParser):
    """Collect links (with text), forms (fields, options), title and table headings."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.forms, self.headers, self.title = [], [], [], ""
        self._a = None
        self._form = None
        self._select = None
        self._opt = None
        self._in = collections.Counter()
        self.text_bits = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self._in[tag] += 1
        if tag == "a":
            self._a = {"href": d.get("href") or "", "onclick": d.get("onclick"), "text": ""}
        elif tag == "form":
            self._form = {"action": d.get("action"), "method": (d.get("method") or "get").lower(),
                          "id": d.get("id") or d.get("name"), "fields": []}
            self.forms.append(self._form)
        elif tag in ("input", "textarea") and self._form is not None:
            self._form["fields"].append({"tag": tag, "name": d.get("name") or d.get("id"),
                                         "type": d.get("type"), "value": d.get("value")})
        elif tag == "select":
            self._select = {"tag": "select", "name": d.get("name") or d.get("id"), "id": d.get("id"),
                            "options": []}
            (self._form["fields"] if self._form is not None else self.__dict__.setdefault("loose_selects", [])
             ).append(self._select)
        elif tag == "option" and self._select is not None:
            self._opt = {"value": d.get("value"), "text": ""}
            self._select["options"].append(self._opt)
        elif tag == "img" and re.search(r"(?i)captcha", " ".join(str(v) for v in d.values())):
            self.__dict__["captcha"] = True

    def handle_endtag(self, tag):
        self._in[tag] -= 1
        if tag == "a" and self._a is not None:
            self._a["text"] = re.sub(r"\s+", " ", self._a["text"]).strip()
            self.links.append(self._a)
            self._a = None
        elif tag == "form":
            self._form = None
        elif tag == "select":
            self._select = None
        elif tag == "option":
            self._opt = None

    def handle_data(self, data):
        if self._a is not None:
            self._a["text"] += data
        if self._opt is not None:
            self._opt["text"] += data.strip()
        if self._in["title"] > 0:
            self.title += data.strip()
        if self._in["th"] > 0 and data.strip():
            self.headers.append(data.strip())
        if len(self.text_bits) < 4000:
            self.text_bits.append(data)


class Explorer:
    def __init__(self, a):
        self.a = a
        self.date = __import__("datetime").datetime.now(IST).date().isoformat()
        self.raw = RAW / SOURCE_ID / self.date
        self.meta = ROOT / "data" / "egs_explore" / self.date
        self.meta.mkdir(parents=True, exist_ok=True)
        self.cj = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))
        self.op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-IN,en;q=0.9")]
        self.saved = 0

    # ---------- storage ----------
    def _dest(self, url: str, ext: str) -> Path:
        u = urllib.parse.urlsplit(url)
        stem = re.sub(r"[^A-Za-z0-9._=-]+", "_", (u.path.strip("/") or "index") + ("__" + u.query if u.query else ""))
        if len(stem) > 150:
            stem = stem[:110] + "_" + hashlib.sha1(stem.encode()).hexdigest()[:12]
        return self.raw / u.netloc / f"{stem}.{ext}"

    def save(self, url: str, body: bytes, ext: str, rec: dict) -> Path:
        dest = self._dest(url, ext)
        n = 1
        while dest.exists():  # never overwrite
            dest = dest.with_name(f"{dest.stem}.{n}{dest.suffix}")
            n += 1
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)
        os.chmod(dest, 0o444)
        rec.update(stored_path=str(dest.relative_to(ROOT)), sha256=hashlib.sha256(body).hexdigest(), bytes=len(body))
        self.saved += 1
        return dest

    def log(self, rec: dict):
        append_jsonl(PROVENANCE, {"source_id": SOURCE_ID, "tool": TOOL_VERSION, **rec})

    def fetch(self, url, data=None, referer=None):
        req = urllib.request.Request(url, data=data)
        if referer:
            req.add_header("Referer", referer)
        for attempt in range(3):
            try:
                with self.op.open(req, timeout=self.a.timeout) as r:
                    return r.status, r.geturl(), dict(r.headers), r.read(60 << 20)
            except urllib.error.HTTPError as e:
                return e.code, url, dict(e.headers), e.read(1 << 20)
            except Exception as e:
                err = e
                time.sleep(5 * (attempt + 1))
        raise err

    # ---------- step 1 ----------
    def crawl(self):
        queue = collections.deque((u, 0, None, "seed") for u in self.a.seeds)
        seen = set()
        pages = open(self.meta / "pages.jsonl", "a", encoding="utf-8")
        links_out = open(self.meta / "links.jsonl", "a", encoding="utf-8")
        forms_out = open(self.meta / "forms.jsonl", "a", encoding="utf-8")
        n = 0
        while queue and n < self.a.max_pages:
            url, depth, parent, text = queue.popleft()
            key = re.sub(r"[?&](OWASP_CSRFTOKEN|_csrf|jsessionid)=[^&]*", "", url, flags=re.I)
            if key in seen:
                continue
            seen.add(key)
            n += 1
            time.sleep(self.a.delay)
            rec = {"step": "crawl", "url": url, "parent_page": parent, "link_text": text, "depth": depth,
                   "method": "GET", **now_stamps()}
            try:
                status, final, headers, body = self.fetch(url, referer=parent)
            except Exception as e:
                self.log({**rec, "status": "error", "error": repr(e)})
                print("ERR", url, e)
                continue
            ctype = headers.get("Content-Type", "")
            rec.update(http_status=status, final_url=final, content_type=ctype,
                       content_disposition=headers.get("Content-Disposition"))
            is_html = "html" in ctype and not FILE_EXT.search(final)
            if not is_html:
                ext = (re.findall(r'filename="?[^";]*\.(\w+)', headers.get("Content-Disposition") or "") or
                       FILE_EXT.findall(final)[:1] and [FILE_EXT.findall(final)[0][0]] or ["bin"])[0].lower()
                self.save(final, body, ext, rec)
                self.log({**rec, "status": "downloaded"})
                print(f"[{n}] FILE {final}")
                continue
            html = body.decode("utf-8", "ignore")
            p = PageParser()
            try:
                p.feed(html)
            except Exception:
                pass
            phones, emails = len(set(PHONE.findall(html))), len(set(EMAIL.findall(html)))
            summary = {"url": final, "title": p.title, "depth": depth, "parent": parent, "http_status": status,
                       "n_links": len(p.links), "n_forms": len(p.forms), "table_headers": p.headers[:200],
                       "captcha": bool(p.__dict__.get("captcha")) or bool(re.search(r"(?i)captcha", html)),
                       "login_form": bool(re.search(r'(?i)type="password"', html)),
                       "distinct_phone_numbers": phones, "distinct_emails": emails,
                       "mentions_bihar": "bihar" in html.lower(), "retrieved_at_ist": rec["retrieved_at_ist"]}
            if phones >= 5 or emails >= 5:
                summary["withheld"] = True
                self.log({**rec, "status": "withheld_personal_data", "title": p.title,
                          "table_headers": p.headers[:100], "distinct_phone_numbers": phones,
                          "distinct_emails": emails})
                print(f"[{n}] WITHHELD (contact details) {final}")
            else:
                self.save(final, body, "html", rec)
                self.log({**rec, "status": "downloaded", "title": p.title})
                print(f"[{n}] PAGE d{depth} {p.title[:60]!r} {final}")
            pages.write(json.dumps(summary, ensure_ascii=False) + "\n")
            for f in p.forms + [{"action": None, "loose": True, "fields": p.__dict__.get("loose_selects", [])}]:
                if f["fields"]:
                    forms_out.write(json.dumps({"page": final, "title": p.title, **f}, ensure_ascii=False) + "\n")
            for l in p.links:
                href = l["href"].strip()
                absu = urllib.parse.urljoin(final, href) if href and not href.startswith("#") else ""
                links_out.write(json.dumps({"page": final, "text": l["text"], "href": href, "abs": absu,
                                            "onclick": l["onclick"]}, ensure_ascii=False) + "\n")
                if not absu or SKIP.search(absu):
                    continue
                host = urllib.parse.urlsplit(absu).netloc.lower()
                if host in HOSTS and depth < self.a.max_depth:
                    queue.append((absu.split("#")[0], depth + 1, final, l["text"]))
            for f in (pages, links_out, forms_out):
                f.flush()
        print(f"crawl done: {n} URLs visited, {len(queue)} left in queue")

    # ---------- step 2 ----------
    def api(self):
        fys = [self.a.fy, self.a.fy[:5] + self.a.fy[-2:]]  # 2024-2025 and 2024-25
        for fy in fys:
            calls = [f"getTotalBookClosed/{fy}/0", f"getYearBookClosedStateWise/{fy}/GP",
                     f"getYearBookClosedDistrictWise/{fy}/{BIHAR}/GP"]
            for c in calls:
                self._api_call("https://egramswaraj.gov.in/getMobileData/" + c)
            # drill one district and one block to show GP-level granularity
            d = self._api_call(f"https://egramswaraj.gov.in/getMobileData/getYearBookClosedDistrictWise/{fy}/{BIHAR}/GP",
                               save=False)
            dcode = _first_code(d)
            if dcode:
                b = self._api_call(f"https://egramswaraj.gov.in/getMobileData/getYearBookClosedBlockWise/{fy}/{BIHAR}/GP/{dcode}")
                bcode = _first_code(b)
                if bcode:
                    self._api_call(f"https://egramswaraj.gov.in/getMobileData/getYearBookClosedGPWise/{fy}/{BIHAR}/{bcode}")

    def _api_call(self, url, save=True):
        time.sleep(self.a.delay)
        rec = {"step": "api", "url": url, "method": "GET", **now_stamps()}
        try:
            status, final, headers, body = self.fetch(url)
        except Exception as e:
            self.log({**rec, "status": "error", "error": repr(e)})
            return None
        rec.update(http_status=status, content_type=headers.get("Content-Type", ""))
        if save:
            self.save(url, body, "json" if "json" in rec["content_type"] else "txt", rec)
            self.log({**rec, "status": "downloaded"})
            print("API", status, url, len(body))
        try:
            return json.loads(body)
        except ValueError:
            return None

    # ---------- step 3 ----------
    def forms(self):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            print("--forms needs Playwright: pip install playwright && python -m playwright install chromium")
            return
        forms_file = self.meta / "forms.jsonl"
        targets = collections.OrderedDict()
        for line in open(forms_file, encoding="utf-8") if forms_file.exists() else []:
            f = json.loads(line)
            if any("bihar" in (o.get("text") or "").lower() for fld in f["fields"] for o in fld.get("options", [])):
                targets.setdefault(f["page"], f)
        print(f"forms: {len(targets)} pages offer BIHAR in a drop-down")
        out = open(self.meta / "form_results.jsonl", "a", encoding="utf-8")
        with sync_playwright() as pw:
            br = pw.chromium.launch()
            ctx = br.new_context(accept_downloads=True, user_agent=UA)
            warm = ctx.new_page()  # several report pages only render their form inside a session
            for u in self.a.seeds:
                try:
                    warm.goto(u, timeout=120000)
                except Exception:
                    pass
            for page_url, f in targets.items():
                res = {"page": page_url, "title": f.get("title"), **now_stamps(), "selections": {}, "levels": []}
                pg = ctx.new_page()
                try:
                    pg.goto(page_url, timeout=120000)
                    if pg.locator("img[src*=aptcha], input[name*=aptcha], img[id*=aptcha]").count():
                        res["status"] = "captcha_present_not_attempted"
                        out.write(json.dumps(res, ensure_ascii=False) + "\n"); out.flush(); pg.close()
                        print("CAPTCHA, skipped", page_url)
                        continue
                    res["n_selects"] = pg.locator("select").count()
                    self._choose(pg, res)
                    self._submit(pg)
                    self._capture_level(pg, res, 0)
                    for depth in range(1, self.a.drill_depth + 1):  # district -> block -> GP
                        link = self._drill_link(pg)
                        if link is None:
                            break
                        res["levels"].append({"click": link.inner_text().strip()})
                        try:
                            with ctx.expect_page(timeout=5000) as newp:
                                link.click()
                            pg = newp.value
                        except Exception:
                            pass
                        pg.wait_for_load_state("networkidle", timeout=120000)
                        self._capture_level(pg, res, depth)
                    res["status"] = "ok"
                except Exception as e:
                    res["status"] = "error"
                    res["error"] = str(e).splitlines()[0]
                out.write(json.dumps(res, ensure_ascii=False) + "\n")
                out.flush()
                print("FORM", res["status"], page_url)
                for p_ in ctx.pages:
                    if p_ is not warm:
                        p_.close()
            br.close()

    def _choose(self, pg, res):
        """Select Bihar, then the requested FY (or latest), waiting for dependent drop-downs.
        Reads options from the DOM (selects hidden by select2/chosen plugins have no inner text)
        and sets them via the DOM + a change event, which is what the page's own handlers expect."""
        js_opts = "s => [...s.options].map(o => [o.value, (o.textContent || '').trim()])"
        js_set = "(s, v) => { s.value = v; s.dispatchEvent(new Event('change', {bubbles: true})); }"
        for _ in range(3):  # repeat: choosing a state often fills the next drop-downs
            for sel in pg.locator("select").all():
                try:
                    opts = sel.evaluate(js_opts)
                except Exception:
                    continue
                name = sel.get_attribute("name") or sel.get_attribute("id")
                if name in res["selections"]:
                    continue
                pick = next((o for o in opts if o[1].upper() == "BIHAR"), None)
                if pick is None:
                    fy = [o for o in opts if re.search(r"20\d\d\s*-\s*(20)?\d\d", o[1])]
                    pick = next((o for o in fy if self.a.fy[:4] in o[1]), fy[0] if fy else None)
                if pick is None:
                    continue
                try:
                    sel.select_option(value=pick[0], timeout=5000)
                except Exception:
                    sel.evaluate(js_set, pick[0])
                res["selections"][name] = pick[1]
                pg.wait_for_timeout(3000)

    def _drill_link(self, pg):
        """First data link in the largest visible table (skip logos, menus, logout)."""
        best, rows = None, 0
        for t in pg.locator("table:visible").all():
            n = t.locator("tr").count()
            if n > rows:
                best, rows = t, n
        if best is None or rows < 3:
            return None
        for a in best.locator("td a:visible").all():
            href = (a.get_attribute("href") or "") + (a.get_attribute("onclick") or "")
            text = a.inner_text().strip()
            if text and not re.search(r"(?i)logout|login|home|welcome", href + text):
                return a
        return None

    def _submit(self, pg):
        btn = pg.locator("input[type=submit], button[type=submit], input[type=button], button").filter(
            has_text=re.compile(r"get|submit|show|view|go|search|report", re.I)).first
        if not btn.count():
            btn = pg.locator("input[type=submit], input[type=button][value]").first
        if btn.count():
            btn.click()
            pg.wait_for_load_state("networkidle", timeout=180000)

    def _capture_level(self, pg, res, depth):
        html = pg.content().encode("utf-8")
        rec = {"step": "forms", "url": pg.url, "method": "browser", "form_page": res["page"],
               "selections": res["selections"], "drill_depth": depth, **now_stamps()}
        phones = len(set(PHONE.findall(html.decode("utf-8", "ignore"))))
        if phones >= 5:
            self.log({**rec, "status": "withheld_personal_data", "distinct_phone_numbers": phones})
            res["levels"].append({"depth": depth, "url": pg.url, "withheld": True})
            return
        d = self.save(pg.url + f"#form_d{depth}", html, "html", rec)
        self.log({**rec, "status": "downloaded"})
        lvl = {"depth": depth, "url": pg.url, "stored_path": str(d.relative_to(ROOT)), "exports": []}
        for b in pg.locator("a:visible, button:visible, input[type=button]:visible, input[type=image]:visible").all():
            label = " ".join(filter(None, [b.inner_text() if b.evaluate("e=>e.tagName")!="INPUT" else "",
                                           b.get_attribute("value"), b.get_attribute("title"),
                                           b.get_attribute("alt"), b.get_attribute("src")]))
            if not re.search(r"(?i)excel|xls|pdf|csv|export", label or ""):
                continue
            try:
                with pg.expect_download(timeout=30000) as dl:
                    b.click(timeout=5000)
                dlv = dl.value
                tmp = Path(dlv.path())
                body = tmp.read_bytes()
                erec = {**rec, "step": "forms_export", "export_label": label.strip()[:80],
                        "suggested_filename": dlv.suggested_filename, "url": dlv.url}
                ext = Path(dlv.suggested_filename).suffix.lstrip(".") or "bin"
                p = self.save(pg.url + f"#export_d{depth}_{len(lvl['exports'])}", body, ext, erec)
                self.log({**erec, "status": "downloaded"})
                lvl["exports"].append({"label": label.strip()[:80], "file": str(p.relative_to(ROOT))})
            except Exception as e:
                lvl["exports"].append({"label": (label or "").strip()[:80], "error": str(e).splitlines()[0]})
            if len(lvl["exports"]) >= 3:
                break
        res["levels"].append(lvl)

    def bundle(self) -> Path:
        z = ROOT / f"egs_explore_{self.date}.zip"
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
            for base in (self.raw, self.meta):
                for f in base.rglob("*"):
                    if f.is_file():
                        zf.write(f, f.relative_to(ROOT))
            zf.writestr("data/provenance_EGS-PORTAL.jsonl",
                        "".join(l for l in open(PROVENANCE, encoding="utf-8") if f'"source_id": "{SOURCE_ID}"' in l))
        return z


def _first_code(d):
    rows = d if isinstance(d, list) else next((v for v in (d or {}).values() if isinstance(v, list)), []) \
        if isinstance(d, dict) else []
    for r in rows:
        if isinstance(r, dict):
            for k in r:
                if re.search(r"(?i)(zp|bp|district|block|lb)?_?code$", k) and r[k] not in (None, 0, "0", BIHAR):
                    return r[k]
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--max-pages", type=int, default=1500)
    ap.add_argument("--max-depth", type=int, default=5)
    ap.add_argument("--delay", type=float, default=1.0)
    ap.add_argument("--timeout", type=int, default=120)
    ap.add_argument("--fy", default="2024-2025")
    ap.add_argument("--forms", action="store_true", help="also fill Bihar report forms with Playwright")
    ap.add_argument("--drill-depth", type=int, default=3)
    ap.add_argument("--skip-crawl", action="store_true")
    ap.add_argument("--seeds", nargs="+", default=SEEDS, help="start pages (default: the four portal hosts)")
    ap.add_argument("--no-api", action="store_true")
    a = ap.parse_args()
    HOSTS.update(urllib.parse.urlsplit(u).netloc.lower() for u in a.seeds)
    e = Explorer(a)
    try:
        status, *_ = e.fetch(a.seeds[0])
        print(a.seeds[0], "reachable, HTTP", status)
    except Exception as ex:
        print("egramswaraj.gov.in is NOT reachable from this computer:", ex)
        print("The portal refuses connections from outside India; run this from an Indian connection.")
        return 2
    if not a.skip_crawl:
        e.crawl()
    if not a.no_api:
        e.api()
    if a.forms:
        e.forms()
    z = e.bundle()
    print(f"\nSaved {e.saved} files. Send back this one file:\n  {z}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
