"""Describe the eGramSwaraj (EGS-PORTAL) originals without changing them (Task 4).

Reads every EGS-PORTAL record in data/provenance.jsonl, re-checks each file's sha256, and
writes to data/analysis/egs/:
  portal_page_inventory.csv   one row per distinct page path: title, CAPTCHA in the form,
                              mentions Bihar, table headings, files saved, statuses
  portal_static_reports.csv   one row per saved FileRedirect.jsp report file: report family,
                              FY, state, district, caption, rows
  portal_bihar_values.csv     LONG copy of every Bihar table cell in the static reports and the
                              all-state closure reports' BIHAR rows: file, caption FY / state /
                              district, row label, heading path, value EXACTLY as served
  portal_api_values.csv       getMobileData JSON rows, as served
  portal_xhr_inventory.csv    JSON responses recorded by egs_bihar.py --steps xhr (if any)
Nothing is converted: "1,806,00,57,512.41" stays a string, "0" stays "0", empty stays empty.
Tables are re-read with rowspan/colspan so each value keeps its full heading.
"""
from __future__ import annotations

import collections
import csv
import hashlib
import json
import re
import sys
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROVENANCE, ROOT, read_jsonl  # noqa: E402

OUT = DATA / "analysis" / "egs"
CAPTION = re.compile(r"Financial Year\s*:-\s*(?P<fy>[\d-]+)(?:\s*State\s*:-\s*(?P<state>[^,\]]+?))?"
                     r"(?:\s*,\s*District\s*:-\s*(?P<district>[^,\]]+?))?(?:\s*,\s*Block\s*:-\s*(?P<block>[^,\]]+?))?\s*$")


class Grid(HTMLParser):
    """Tables as grids, honouring rowspan/colspan. Each cell: (text, is_th)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self._stack = [], []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "table":
            self._stack.append({"rows": [], "cell": None})
            self.tables.append(self._stack[-1]["rows"])
        elif not self._stack:
            return
        elif tag == "tr":
            self._stack[-1]["rows"].append([])
        elif tag in ("td", "th"):
            t = self._stack[-1]
            if not t["rows"]:
                t["rows"].append([])
            t["cell"] = {"text": [], "th": tag == "th", "rs": _int(d.get("rowspan")), "cs": _int(d.get("colspan"))}
            t["rows"][-1].append(t["cell"])

    def handle_endtag(self, tag):
        if tag == "table" and self._stack:
            self._stack.pop()
        elif tag in ("td", "th") and self._stack:
            self._stack[-1]["cell"] = None

    def handle_data(self, data):
        if self._stack and self._stack[-1]["cell"] is not None:
            self._stack[-1]["cell"]["text"].append(data)


def _int(v):
    try:
        return max(1, min(int(v), 200))
    except (TypeError, ValueError):
        return 1


def grids(html):
    g = Grid()
    try:
        g.feed(html)
    except Exception:
        pass
    out = []
    for rows in g.tables:
        grid, carry = [], {}
        for r in rows:
            line, col, cells = [], 0, list(r)
            while cells or col in carry:
                if col in carry:
                    txt, th, left = carry[col]
                    line.append((txt, th))
                    carry[col] = (txt, th, left - 1)
                    if left - 1 <= 0:
                        del carry[col]
                    col += 1
                    continue
                c = cells.pop(0)
                txt = " ".join("".join(c["text"]).split())
                for k in range(c["cs"]):
                    line.append((txt, c["th"]))
                    if c["rs"] > 1:
                        carry[col] = (txt, c["th"], c["rs"] - 1)
                    col += 1
            if any(t for t, _ in line):
                grid.append(line)
        out.append(grid)
    return out


def write(name, header, rows):
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"wrote {OUT / name} ({len(rows)} rows)")


def family(url):
    q = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))
    fd = q.get("FD", "")
    m = re.match(r"([A-Za-z]+?)(\d{4}-\d{4})?(?:/(.*))?$", fd)
    fam, fy, rest = (m.group(1), m.group(2) or "", m.group(3) or "") if m else (fd, "", "")
    return fam, fy, rest, q.get("name", "")


def table_values(grid):
    """Split a grid into heading rows (leading rows whose cells are not data) and data rows.
    Yields (row_label, heading_path, value) with value verbatim."""
    # caption-like rows: a single distinct text across the row
    body = [r for r in grid if len({t for t, _ in r if t}) > 1]
    if not body:
        return
    width = max(len(r) for r in body)
    heads, data = [], []
    for r in body:
        texts = [t for t, _ in r]
        numeric = sum(bool(re.fullmatch(r"[\d,.()/\-A-Za-z ]*\d[\d,.()/\-A-Za-z ]*", t)) for t in texts[1:])
        if not data and (all(th for _, th in r) or numeric == 0):
            heads.append(texts + [""] * (width - len(texts)))
        else:
            data.append(texts)
    for r in data:
        label = r[0]
        for i, v in enumerate(r[1:], start=1):
            path = " > ".join(dict.fromkeys(h[i] for h in heads if i < len(h) and h[i]))
            yield label, path, v


def main():
    recs = [r for r in read_jsonl(PROVENANCE) if r.get("source_id") == "EGS-PORTAL"]
    good, bad = [], 0
    for r in recs:
        sp = (r.get("stored_path") or "").replace("\\", "/")
        if not sp:
            continue
        p = ROOT / sp
        if not p.exists():
            continue
        body = p.read_bytes()
        if hashlib.sha256(body).hexdigest() != r.get("sha256"):
            bad += 1
            continue
        good.append((r, p, body))
    print(f"{len(good)} EGS-PORTAL originals checked, {bad} hash mismatches (skipped)")

    # ---- page inventory (crawl pages + xhr/manual records)
    inv = collections.OrderedDict()
    for r in recs:
        u = r.get("url") or ""
        if "FileRedirect.jsp" in u or "getMobileData" in u:
            continue
        path = urllib.parse.urlsplit(u).path or u
        i = inv.setdefault((urllib.parse.urlsplit(u).netloc, path), {"title": "", "steps": set(), "statuses": set(),
                                                                       "files": 0, "captcha": "", "bihar": "",
                                                                       "headings": ""})
        i["steps"].add(r.get("step", ""))
        i["statuses"].add(r.get("status", ""))
        i["title"] = i["title"] or (r.get("title") or "")
        if r.get("stored_path"):
            i["files"] += 1
    for r, p, body in good:
        u = r.get("url") or ""
        key = (urllib.parse.urlsplit(u).netloc, urllib.parse.urlsplit(u).path)
        if key in inv and p.suffix == ".html":
            t = body.decode("utf-8", "ignore")
            i = inv[key]
            in_form = bool(re.search(r'id="img_Capatcha"|captchaAnswer|src="captchaImage', t))
            i["captcha"] = "yes" if in_form or i["captcha"] == "yes" else "no"
            i["bihar"] = "yes" if ("bihar" in t.lower() or i["bihar"] == "yes") else "no"
            if not i["headings"]:
                hs = [c for g in grids(t) for row in g[:3] for c, th in row if th and c and "{{" not in c]
                i["headings"] = " | ".join(dict.fromkeys(hs))[:600]
            i["angular_template"] = "yes" if "{{" in t else i.get("angular_template", "no")
    write("portal_page_inventory.csv",
          ["host", "path", "title", "captcha_in_report_form", "page_mentions_bihar", "angular_template",
           "table_headings_as_served", "files_saved", "steps", "statuses"],
          [[h, pth, i["title"], i["captcha"], i["bihar"], i.get("angular_template", ""), i["headings"], i["files"],
            "|".join(sorted(i["steps"])), "|".join(sorted(i["statuses"]))] for (h, pth), i in inv.items()])

    # ---- static FileRedirect reports
    static_rows, values = [], []
    for r, p, body in good:
        u = r.get("url") or ""
        if "FileRedirect.jsp" not in u or p.suffix != ".html":
            continue
        fam, fy, rest, name = family(u)
        t = body.decode("utf-8", "ignore")
        gs = grids(t)
        cap = next((c for g in gs for row in g for c, _ in row if "Financial Year:-" in c), "")
        m = CAPTION.search(cap.strip()) if cap else None
        cfy = (m.group("fy") if m else "") or fy
        state = (m.group("state") or "").strip() if m else ""
        district = (m.group("district") or "").strip() if m else ""
        block = (m.group("block") or "").strip() if m and m.groupdict().get("block") else ""
        nrows = sum(len(g) for g in gs)
        generated = re.search(r"Report generated through eGramSwaraj\s*\([^)]*\)\s*on\s*([^<\n]+)", t)
        static_rows.append([fam, cfy, rest, name, state, district, block, cap, nrows,
                            generated.group(1).strip() if generated else "", r.get("retrieved_at_ist", ""),
                            r["stored_path"].replace("\\", "/"), u])
        is_bihar = state.lower() == "bihar" or rest.split("/")[:1] == ["10"]
        for gi, g in enumerate(gs):
            for label, path, v in table_values(g):
                if is_bihar or (fam == "priasoftOverview" and label.upper() == "BIHAR"):
                    values.append([fam, cfy, state or ("BIHAR" if fam == "priasoftOverview" else ""), district, block,
                                   gi, label, path, v, r["stored_path"].replace("\\", "/")])
    write("portal_static_reports.csv",
          ["report_family", "financial_year", "fd_path_after_year", "name", "caption_state", "caption_district",
           "caption_block", "caption", "table_rows", "report_generated_on (as printed)", "retrieved_at_ist",
           "stored_path", "url"], static_rows)
    write("portal_bihar_values.csv",
          ["report_family", "financial_year", "state", "district", "block", "table_index", "row_label",
           "column_heading_path", "value_as_served", "stored_path"], values)

    # ---- getMobileData API
    api = []
    for r, p, body in good:
        u = r.get("url") or ""
        if "getMobileData" not in u or p.suffix != ".json":
            continue
        try:
            d = json.loads(body)
        except ValueError:
            continue
        parts = urllib.parse.urlsplit(u).path.split("/")
        for row in d if isinstance(d, list) else [d]:
            if isinstance(row, dict):
                for k, v in row.items():
                    api.append([parts[2] if len(parts) > 2 else "", "/".join(parts[3:]), row.get("code", ""),
                                row.get("name", ""), k, "" if v is None else v, r["stored_path"].replace("\\", "/")])
    write("portal_api_values.csv", ["endpoint", "path_params", "code", "name", "field", "value_as_served", "stored_path"],
          api)

    # ---- XHR responses recorded by egs_bihar.py
    xhr = []
    for r, p, body in good:
        if r.get("step") != "xhr" or p.suffix != ".json":
            continue
        try:
            d = json.loads(body)
        except ValueError:
            d = None
        rows = d if isinstance(d, list) else (next((v for v in d.values() if isinstance(v, list)), [d])
                                              if isinstance(d, dict) else [])
        keys = sorted({k for x in rows if isinstance(x, dict) for k in x})
        xhr.append([r.get("report"), r.get("action"), r.get("url"), r.get("post_data") or "",
                    json.dumps(r.get("selections") or {}, ensure_ascii=False), len(rows), " ".join(keys)[:800],
                    r["stored_path"].replace("\\", "/")])
    write("portal_xhr_inventory.csv", ["report_page", "action", "request_url", "post_data", "selections", "rows",
                                       "fields", "stored_path"], xhr)


if __name__ == "__main__":
    main()
