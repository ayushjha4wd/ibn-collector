"""Collect Bihar reports from AuditOnline (auditonline.gov.in), the audit module of the
eGramSwaraj suite of the Ministry of Panchayati Raj.

Task 4. AuditOnline's public report pages are Angular front-ends over unauthenticated
JSON endpoints (found in the pages' own JavaScript, e.g.
/resources/reportComponents/component/centerLevel/centerLevel.service.js). This script
calls those same endpoints for Bihar (LGD state code 10) and saves every response
exactly as served. No login, CAPTCHA or other access control is involved or bypassed.

Layout (same conventions as collect.py):
  data/raw/EGS-AO/<IST date>/<level>/<endpoint>/<params>.<ext>   original responses, read-only
  data/provenance.jsonl                                         one record per request

Deliberately NOT collected (personal data, see docs/task4 report):
  auditordetails / auditorAssignedDetails / centerLevelByYearAnddistrictAuditor
      (auditor names, e-mail addresses, mobile numbers)
  auditeeRegisteredDetails*  (named auditee officials and designations)

Usage:
  python scripts/egs_auditonline.py                       # default plan (see --help)
  python scripts/egs_auditonline.py --gp-years all        # GP-level for every year (~17k requests)
  python scripts/egs_auditonline.py --dry-run
Re-running on the same day skips responses already saved (resume after interruption).
"""
from __future__ import annotations

import argparse
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
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import IST, PROVENANCE, RAW, TOOL_VERSION, append_jsonl, now_stamps  # noqa: E402

BASE = "https://auditonline.gov.in/"
SOURCE_ID = "EGS-AO"
STATE = 10  # Bihar, LGD state code (as used by AuditOnline: centerLevelByYear.htm lists Bihar as code 10)
YEARS = ["2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026"]
# Years offered by the GP-count endpoint before audit plans began (registration counts only).
EARLY_YEARS = ["2015-2016", "2016-2017", "2017-2018", "2018-2019"]
UA = "Mozilla/5.0 (compatible; ibn-collector research; public reports only)"

# (report label, endpoint, params template). {y}=year, {s}=state, {d}=district code, {b}=block code
STATE_LEVEL = [  # all-India tables, one row per state (Bihar row included)
    ("Centre-level summary counts", "centerLevelCount.htm", "year={y}"),
    ("Audit plans: GPs and auditees by state", "centerLevelByYear.htm", "year={y}"),
    ("Registered auditees by state", "auditeeRegisteredStatewise.htm", "year={y}"),
    ("GPs with audit report generated, by state", "gpWithAuditReportGeneratedReportStateWise.htm", "year={y}"),
    ("Audit observations recorded, by state", "observationCountStateReport.htm", "year={y}"),
    ("Audit and settlement reports, by state (GP level)", "auditSettlementReportLevelWise.htm", "year={y}&level=G"),
]
BIHAR_LEVEL = [  # Bihar, one row per district (or per category)
    ("Audit plans: GPs and auditees by district", "centerLevelByYearAndState.htm", "year={y}&stateId={s}"),
    ("Registered auditees by district", "auditeeRegisteredDistrictwise.htm", "year={y}&stateCode={s}"),
    ("GPs with audit report generated, by district", "gpWithAuditReportGeneratedReportDistrictWise.htm", "year={y}&stateCode={s}"),
    ("Audit observations by district", "observationCountDistrictReport.htm", "year={y}&stateId={s}"),
    ("Audit observations by category (Bihar)", "observationCountCategoryReport.htm", "year={y}&stateId={s}"),
    ("Audit and settlement reports by district", "auditSettlementReportLevelWise.htm", "year={y}&stateCode={s}&level=G"),
    ("Action taken on settlement, by district", "actionTakenSettlementReport.htm", "year={y}&level=G&stateCode={s}&lbCode=0"),
]
DISTRICT_LEVEL = [  # per district: one row per block (or per GP where noted)
    ("Audit plans: GPs and auditees by block", "centerLevelByYearAndDistrict.htm", "year={y}&districtCode={d}&stateId={s}"),
    ("Audit plans of the Block Panchayats in the district (block-tier auditees)", "centerLevelByYearAndDistrictGP.htm", "year={y}&districtId={d}&stateCode={s}"),
    ("Registered auditees by block", "auditeeRegisteredBlockwise.htm", "year={y}&districtCode={d}"),
    ("GPs with audit report generated, by block", "gpWithAuditReportGeneratedReportBlockWise.htm", "year={y}&districtCode={d}"),
    ("Audit observations by block", "observationCountBlocktReport.htm", "year={y}&districtCode={d}"),
    ("Audit and settlement reports by block", "auditSettlementReportLevelWise.htm", "year={y}&districtCode={d}&stateCode={s}&level=G"),
    ("Action taken on settlement, by block", "actionTakenSettlementReport.htm", "year={y}&level=G&stateCode={s}&lbCode={d}"),
]
BLOCK_LEVEL = [  # per block: one row per GP
    ("Audit plans of every GP in the block", "centerLevelByYearAndBlock.htm", "year={y}&blockCode={b}&stateCode={s}"),
    ("GP audit report generated: per GP", "gpWithAuditReportGeneratedDetail.htm", "year={y}&blockCode={b}&stateCode={s}"),
    ("Audit observations per GP", "observationCountGPReport.htm", "year={y}&blockCode={b}&stateCode={s}"),
    ("Audit and settlement report status per GP", "auditSettlementReportLevelWise.htm", "year={y}&blockCode={b}&stateCode={s}&level=G"),
]


class Client:
    def __init__(self, out_root: Path, delay: float, timeout: int, dry: bool):
        self.cj = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))
        self.op.addheaders = [("User-Agent", UA), ("Accept", "application/json, text/html, */*")]
        self.out_root, self.delay, self.timeout, self.dry = out_root, delay, timeout, dry
        self.n_new = self.n_skip = self.n_err = 0

    def _open(self, url: str, data: bytes | None):
        last = None
        for attempt in range(4):
            try:
                with self.op.open(urllib.request.Request(url, data=data), timeout=self.timeout) as r:
                    return r.status, dict(r.headers), r.read()
            except urllib.error.HTTPError as e:
                return e.code, dict(e.headers), e.read()
            except Exception as e:  # network trouble: back off and retry
                last = e
                time.sleep(3 * (attempt + 1))
        raise last

    def get(self, level: str, report: str, endpoint: str, params: str, *, post: bool = False,
            ext: str | None = None, year: str | None = None) -> object | None:
        """Fetch one report response, save it untouched, log provenance. Returns parsed JSON or None."""
        slug = re.sub(r"[^A-Za-z0-9=_-]+", "_", re.sub(r"OWASP_CSRFTOKEN=[^&]*&?", "", params)
                      .replace("&", "__")) or "noparams"
        guess = ext or ("html" if post else "json")
        dest = self.out_root / level / endpoint.replace(".htm", "") / f"{slug}.{guess}"
        url = BASE + endpoint + ("" if post or not params else "?" + params)
        prior = [p for p in dest.parent.glob(dest.stem + ".*") if p.stem == dest.stem] if dest.parent.exists() else []
        if prior:  # saved earlier today (suffix may differ from the guess): resume
            self.n_skip += 1
            return _parse(prior[0])
        if self.dry:
            print("DRY", "POST" if post else "GET", url, params if post else "")
            return None
        time.sleep(self.delay)
        stamps = now_stamps()
        rec = {"source_id": SOURCE_ID, "tool": TOOL_VERSION, "report": report, "geo_level": level,
               "endpoint": endpoint, "params": dict(urllib.parse.parse_qsl(params)), "financial_year": year,
               "method": "POST" if post else "GET", "url": url, **stamps}
        try:
            status, headers, body = self._open(url, params.encode() if post else None)
        except Exception as e:
            self.n_err += 1
            append_jsonl(PROVENANCE, {**rec, "status": "error", "error": repr(e)})
            print("ERR ", url, e, file=sys.stderr)
            return None
        ctype = headers.get("Content-Type", "")
        is_json = "json" in ctype
        is_xlsx = "spreadsheetml" in ctype
        disp = re.findall(r'filename="?([^";]+)', headers.get("Content-Disposition", "") or "")
        # The server answers unknown/failed requests with an HTML error page and HTTP 200;
        # keep it (it is what was served) but mark it, so it is never mistaken for data.
        error_page = (not is_json and not is_xlsx and b"Lost Cloud - Error page" in body[:4000])
        if ext is None:
            # JSON replies carry "inline;filename=f.txt" (an anti-download header), so a JSON
            # content type wins over the served file name.
            served_ext = "" if is_json else (Path(disp[0]).suffix.lstrip(".").lower() if disp else "")
            dest = dest.with_suffix("." + (served_ext or ("json" if is_json else "xlsx" if is_xlsx
                                                          else "pdf" if "pdf" in ctype else "html")))
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)
        os.chmod(dest, 0o444)
        rec.update({"status": "error_page" if error_page else ("downloaded" if status == 200 else "http_error"),
                    "http_status": status, "content_type": ctype, "bytes": len(body),
                    "sha256": hashlib.sha256(body).hexdigest(),
                    "content_disposition": headers.get("Content-Disposition"),
                    "stored_path": str(dest.relative_to(RAW.parent.parent))})
        append_jsonl(PROVENANCE, rec)
        self.n_new += 1
        return _parse(dest)


def _parse(path: Path):
    if path.suffix != ".json":
        return None
    try:
        return json.loads(path.read_bytes())
    except ValueError:
        return None


def codes(rows) -> list[int]:
    return [r["code"] for r in rows or [] if isinstance(r, dict) and "code" in r]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--years", default="all", help="comma list of FYs like 2024-2025, or 'all' (2019-20 to 2025-26)")
    ap.add_argument("--gp-years", default="2020-2021,2024-2025",
                    help="years to collect at GP level (one request per block per report); 'all' or 'none'")
    ap.add_argument("--districts", default="all", help="comma list of district codes to limit block/GP calls")
    ap.add_argument("--delay", type=float, default=0.3, help="seconds between requests (be polite)")
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    years = YEARS if a.years == "all" else a.years.split(",")
    gp_years = {"all": set(YEARS), "none": set()}.get(a.gp_years, set(a.gp_years.split(",")))
    date = __import__("datetime").datetime.now(IST).date().isoformat()
    c = Client(RAW / SOURCE_ID / date, a.delay, a.timeout, a.dry_run)
    s = STATE
    c.get("portal", "AuditOnline home page", "welcome.do", "", ext="html")
    # Official documentation linked from the home page (definitions, process, SOPs).
    # Links carry a per-session CSRF token, so read them from a fresh copy of the page.
    if not a.dry_run:
        with c.op.open(BASE, timeout=a.timeout) as r:
            home = r.read().decode("utf-8", "ignore")
        for href, text in re.findall(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', home, re.S):
            text = re.sub(r"<[^>]+>|\s+", " ", text).strip()
            m = re.match(r"([A-Za-z]+(?:PPT|Manual|Template|SOP|Document))\.do\?(OWASP_CSRFTOKEN=.*)", href)
            if m:
                # the token changes per session; save under a stable name without it
                c.get("docs", f"Documentation: {text}", m.group(1) + ".do", m.group(2), ext=None)

    for y in EARLY_YEARS:  # GP universe registered before audits started
        c.get("district", "Audit plans: GPs and auditees by district", "centerLevelByYearAndState.htm",
              f"year={y}&stateId={s}", year=y)

    for y in years:
        print(f"== {y}", flush=True)
        for rep, ep, p in STATE_LEVEL:
            c.get("state", rep, ep, p.format(y=y, s=s), year=y)
        dist_rows = None
        for rep, ep, p in BIHAR_LEVEL:
            r = c.get("district", rep, ep, p.format(y=y, s=s), year=y)
            if ep == "centerLevelByYearAndState.htm":
                dist_rows = r
        # category -> sub-category breakdown of audit observations (Bihar)
        cats = c.get("district", "Audit observations by category (Bihar)", "observationCountCategoryReport.htm",
                     f"year={y}&stateId={s}", year=y)
        for cat in codes(cats):
            c.get("district", "Audit observations by sub-category (Bihar)", "observationCountSubCategoryReport.htm",
                  f"year={y}&stateId={s}&categoryId={cat}", year=y)
        # Server-rendered GP Level Audit Status Report (district rows) + its Excel export
        c.get("district", "GP Level Audit Status Report", "gpLevelAuditStatusReport.htm",
              f"stateCode={s}&lbtc=3&auditYear={y}", post=True, ext="html", year=y)
        c.get("district", "GP Level Audit Status Report (Excel export)", "gpAuditStatusExcel.htm",
              f"stateCode={s}&lbtc=3&auditYear={y}", ext="xlsx", year=y)
        c.get("district", "Year Book Not Closed (form)", "yearBookNotClosedDetails.htm",
              f"finYear={y}&stateCode={s}&localBodyTypeCode=3", post=True, ext="html", year=y)

        dcodes = codes(dist_rows)
        if a.districts != "all":
            dcodes = [d for d in dcodes if str(d) in a.districts.split(",")]
        for d in dcodes:
            blocks = None
            for rep, ep, p in DISTRICT_LEVEL:
                r = c.get("block", rep, ep, p.format(y=y, s=s, d=d), year=y)
                if ep == "centerLevelByYearAndDistrict.htm":
                    blocks = r
            if y not in gp_years:
                continue
            for b in codes(blocks):
                for rep, ep, p in BLOCK_LEVEL:
                    c.get("gp", rep, ep, p.format(y=y, s=s, b=b), year=y)
        print(f"   new={c.n_new} skipped={c.n_skip} errors={c.n_err}", flush=True)

    # One worked GP example of the per-GP category breakdown (block 2206 Araria, latest full year)
    gps = c.get("gp", "Audit observations per GP", "observationCountGPReport.htm",
                f"year=2024-2025&blockCode=2206&stateCode={s}", year="2024-2025")
    for g in codes(gps):
        c.get("gp_detail", "Audit observations per GP by category", "observationCountCategoryReportGPWise.htm",
              f"year=2024-2025&auditeeCode={g}", year="2024-2025")
        c.get("gp_detail", "Panchayat type lookup", "getPanchayatDetail.htm",
              f"panchayatType=V&panchayatCode={g}&stateCode={s}")
    print(f"done: new={c.n_new} skipped={c.n_skip} errors={c.n_err}")
    return 0 if c.n_err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
