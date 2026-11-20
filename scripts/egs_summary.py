"""Describe the AuditOnline (EGS-AO) originals without changing them (Task 4, section 6).

Reads every EGS-AO record in data/provenance.jsonl, re-checks each file's sha256,
and writes to data/analysis/egs/:
  field_catalogue.csv     one row per (endpoint, field): JSON type(s), rows seen, nulls,
                          "0"-string placeholders, empty strings, example value
  report_inventory.csv    one row per endpoint: report name, geographic level, years, files, rows
  coverage_by_year.csv    Bihar, per financial year: districts, GPs registered, audit plans,
                          audit reports, observations, settlement/action-taken counts
  district_by_year.csv    Bihar district x year: GP count and audit-plan (auditee) count
  gp_coverage.csv         for years collected at GP level: distinct GP codes per report vs GPs registered
  inconsistencies.csv     things in the data that do not add up (reported, never corrected)
Values are copied as served; nothing is cleaned or standardised. Empty is not zero.
"""
from __future__ import annotations

import collections
import csv
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, PROVENANCE, ROOT, read_jsonl  # noqa: E402

OUT = DATA / "analysis" / "egs"


def rows_of(obj):
    if isinstance(obj, list):
        return [r for r in obj if isinstance(r, dict)]
    if isinstance(obj, dict):
        lists = [v for v in obj.values() if isinstance(v, list)]
        return [obj] if not lists else [obj]
    return []


def jtype(v):
    return {type(None): "null", bool: "boolean", int: "integer", float: "number", str: "string",
            list: "array", dict: "object"}[type(v)]


def write(name, header, rows):
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"wrote {OUT / name} ({len(rows)} rows)")


def main():
    recs = [r for r in read_jsonl(PROVENANCE) if r.get("source_id") == "EGS-AO" and r.get("stored_path")]
    data = []  # (rec, parsed)
    bad_hash = 0
    for r in recs:
        p = ROOT / r["stored_path"]
        if not p.exists():
            continue
        body = p.read_bytes()
        if hashlib.sha256(body).hexdigest() != r["sha256"]:
            bad_hash += 1
            continue
        parsed = None
        if p.suffix == ".json":
            try:
                parsed = json.loads(body)
            except ValueError:
                pass
        data.append((r, parsed))
    print(f"{len(data)} originals checked, {bad_hash} hash mismatches (skipped)")

    # ---- field catalogue + report inventory
    fields = collections.OrderedDict()
    inv = collections.OrderedDict()
    for r, d in data:
        key = (r["endpoint"], r["geo_level"])
        i = inv.setdefault(key, {"report": r["report"], "years": set(), "files": 0, "rows": 0,
                                 "types": set(), "statuses": set()})
        i["files"] += 1
        i["statuses"].add(r["status"])
        i["types"].add(Path(r["stored_path"]).suffix.lstrip("."))
        if r.get("financial_year"):
            i["years"].add(r["financial_year"])
        rows = rows_of(d)
        i["rows"] += len(rows) if isinstance(d, list) else (1 if rows else 0)
        for row in rows:
            for k, v in row.items():
                f = fields.setdefault((r["endpoint"], k), {"types": set(), "seen": 0, "null": 0, "zero_str": 0,
                                                           "empty": 0, "example": None, "levels": set()})
                f["types"].add(jtype(v))
                f["levels"].add(r["geo_level"])
                f["seen"] += 1
                f["null"] += v is None
                f["zero_str"] += v == "0"
                f["empty"] += v == ""
                if f["example"] is None and v not in (None, "", "0", 0) and not isinstance(v, (list, dict)):
                    f["example"] = v
                elif f["example"] is None and isinstance(v, list) and v:
                    f["example"] = json.dumps(v[:3])
    write("field_catalogue.csv", ["endpoint", "field", "json_types", "geo_levels", "rows_seen", "null",
                                  "string_0_placeholder", "empty_string", "example_value"],
          [[e, k, "|".join(sorted(f["types"])), "|".join(sorted(f["levels"])), f["seen"], f["null"],
            f["zero_str"], f["empty"], f["example"]] for (e, k), f in fields.items()])
    write("report_inventory.csv", ["endpoint", "geo_level", "report", "financial_years", "files", "rows",
                                   "file_types", "statuses"],
          [[e, lv, i["report"], " ".join(sorted(i["years"])), i["files"], i["rows"], "|".join(sorted(i["types"])),
            "|".join(sorted(i["statuses"]))] for (e, lv), i in inv.items()])

    # ---- Bihar coverage by year
    by = collections.defaultdict(dict)
    dist = collections.defaultdict(dict)
    incons = []
    gp_sets = collections.defaultdict(lambda: collections.defaultdict(set))
    for r, d in data:
        y, e, lv = r.get("financial_year"), r["endpoint"], r["geo_level"]
        if not y or not isinstance(d, (list, dict)):
            continue
        rows = d if isinstance(d, list) else []
        if e == "centerLevelByYearAndState.htm":
            by[y]["districts"] = len(rows)
            by[y]["gps_registered"] = sum(x.get("gpCount") or 0 for x in rows)
            by[y]["gps_with_audit_plan"] = sum(x.get("auditeeCount") or 0 for x in rows)
            for x in rows:
                dist[(x["code"], x["name"])][y] = (x.get("gpCount"), x.get("auditeeCount"))
        elif e == "auditeeRegisteredDistrictwise.htm":
            by[y]["registered_auditees"] = sum(x.get("auditeeCount") or 0 for x in rows)
        elif e == "gpWithAuditReportGeneratedReportDistrictWise.htm":
            by[y]["gps_audit_report_generated"] = sum(x.get("count") or 0 for x in rows)
        elif e == "observationCountDistrictReport.htm":
            by[y]["audit_observations"] = sum(x.get("count") or 0 for x in rows)
        elif e == "auditSettlementReportLevelWise.htm" and lv == "district":
            by[y]["settlement_reports"] = sum(x.get("auditSettlementReportCount") or 0 for x in rows)
            by[y]["audit_reports_generated"] = sum(x.get("auditGeneratedReportCount") or 0 for x in rows)
            for x in rows:
                if (x.get("auditGeneratedReportCount") or 0) > (x.get("count") or 0):
                    incons.append([y, e, x.get("code"), x.get("name"),
                                   f"audit reports generated ({x.get('auditGeneratedReportCount')}) exceed "
                                   f"panchayat count ({x.get('count')})"])
        elif e == "actionTakenSettlementReport.htm" and lv == "district":
            by[y]["gps_with_action_taken"] = sum(x.get("action_taken_count") or 0 for x in rows)
        elif e == "centerLevelByYear.htm":
            b = [x for x in rows if x.get("code") == 10]
            if b:
                by[y]["state_row_gpCount"] = b[0].get("gpCount")
                by[y]["state_row_auditeeCount"] = b[0].get("auditeeCount")
        elif lv == "gp" and isinstance(d, list):
            for x in rows:
                code = x.get("code") or x.get("auditeeCode")
                if code is not None:
                    gp_sets[y][e].add(code)
        elif e == "centerLevelByYearAndDistrictGP.htm":
            for x in rows:
                gp_sets[y]["centerLevelByYearAndDistrictGP.htm (Block Panchayat auditees, not GPs)"].add(x.get("auditeeCode"))
    cols = ["districts", "gps_registered", "state_row_gpCount", "gps_with_audit_plan", "state_row_auditeeCount",
            "registered_auditees", "gps_audit_report_generated", "audit_reports_generated", "audit_observations",
            "settlement_reports", "gps_with_action_taken"]
    write("coverage_by_year.csv", ["financial_year"] + cols,
          [[y] + [by[y].get(c, "") for c in cols] for y in sorted(by)])
    years = sorted({y for v in dist.values() for y in v})
    write("district_by_year.csv", ["district_code", "district_name"] +
          [f"{y} {k}" for y in years for k in ("gpCount", "auditeeCount")],
          [[c, n] + [v for y in years for v in (dist[(c, n)].get(y) or ("", ""))] for (c, n) in sorted(dist)])
    gprows = []
    for y in sorted(gp_sets):
        for e, s in gp_sets[y].items():
            gprows.append([y, e, len(s), by[y].get("gps_registered", "")])
    write("gp_coverage.csv", ["financial_year", "endpoint", "distinct_codes", "gps_registered (district table)"],
          gprows)
    write("inconsistencies.csv", ["financial_year", "endpoint", "code", "name", "issue"], incons)


if __name__ == "__main__":
    main()
