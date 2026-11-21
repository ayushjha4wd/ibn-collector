"""Unit tests for the Task 5 validation helpers (offline, no repository data needed).

    python -m unittest tests/test_egs_validate.py
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from egs_validate_lib import (FAIL, PASS, WARNING, Registers, fnum, grouping, norm_name, num,  # noqa: E402
                              numbers_in, page_rows, rows_labelled)
import egs_validate as v  # noqa: E402

PAGE = """<html><body><table>
<tr><td>Village Wise Summary Report Financial Year:-2024-2025 State:-Bihar,District:-Araria,Block:-Araria</td></tr>
<tr><th>Village Panchayat &amp; Equivalent</th><th>Receipts</th><th>Payments</th></tr>
<tr><td rowspan="2"><a href="FileRedirect.jsp?FD=ExpFY2024-2025/10&amp;name=93638.html">ArariaBasti</a></td>
    <td rowspan="2">38,83,407.00</td><td rowspan="2">23,51,361.36</td></tr><tr></tr>
<tr><td>Bangama</td><td>55,88,447.96</td><td></td></tr>
<tr><td>Total</td><td>94,71,854.96</td><td>23,51,361.36</td></tr>
<tr><td>Report generated through eGramSwaraj(https://egramswaraj.gov.in) on Friday, November 20, 2026 4:43 AM</td></tr>
</table></body></html>"""


class Numbers(unittest.TestCase):
    def test_indian_and_portal_grouping(self):
        self.assertEqual(num("3,861,03,59,497.17"), 38610359497.17)
        self.assertEqual(num("38,83,407.00"), 3883407.0)
        self.assertEqual(grouping("38,83,407.00"), "indian")
        self.assertEqual(grouping("3,861,03,59,497.17"), "portal")
        self.assertEqual(grouping("475,44,12,803.38"), "portal")
        self.assertEqual(grouping("500.00"), "plain")

    def test_empty_is_not_zero(self):
        self.assertIsNone(num(""))
        self.assertIsNone(fnum(""))
        self.assertIsNone(num("yes"))
        self.assertEqual(fnum("0"), 0.0)

    def test_names(self):
        self.assertEqual(norm_name("Araria Basti"), norm_name("ArariaBasti"))
        self.assertNotEqual(norm_name("Harari"), norm_name("Harra"))


class Pages(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "page.html"
        self.path.write_text(PAGE, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_row_values_and_links(self):
        rows = rows_labelled(self.path, "ArariaBasti")
        self.assertEqual(len(rows), 1)
        self.assertEqual(numbers_in(rows[0]), [3883407.0, 2351361.36])
        self.assertIn(("ExpFY2024-2025/10", "93638"), rows[0]["links"])

    def test_link_code(self):
        self.assertEqual(v.link_code(self.path, "ArariaBasti", ("ExpFY",)), ("93638", ""))
        self.assertEqual(v.link_code(self.path, "Bangama", ("ExpFY",))[0], "")
        self.assertEqual(v.link_code(self.path, "Nowhere", ("ExpFY",))[1], "label not found on page")

    def test_empty_cell_stays_empty(self):
        row = rows_labelled(self.path, "Bangama")[0]
        self.assertEqual(row["cells"][2], "")
        self.assertEqual(numbers_in(row), [5588447.96])

    def test_rowspan_padding_not_duplicated(self):
        labels = [r["cells"][0] for r in page_rows(self.path) if r["cells"]]
        self.assertEqual(labels.count("ArariaBasti"), 1)


class Reconciliation(unittest.TestCase):
    def test_tolerance(self):
        self.assertAlmostEqual(v.tol("cr", 10, "rs", 3), 0.001 + 1e-9)
        self.assertAlmostEqual(v.tol("cr", 10, "rs", 7), 1e-6 + 1e-9)  # Rs 10 floor
        self.assertAlmostEqual(v.tol("cr", 38, "cr", 2), 0.5 * 0.01 * 39 + 1e-9)
        self.assertEqual(v.tol("count", 5, "count"), 0)
        self.assertEqual(v.dec_of("17.27035", "4221.843"), 3)

    def _rec(self, child, parent, cg, pg, compatible=True):
        R, recs = Registers(), []
        st = v.recon_row(R, recs, "RX", "t", "2024-2025", "gp", "block", "1", "m", child, 3, parent, "rs", "rs",
                         cg, pg, "same", compatible, "f")
        return st, recs[0]

    def test_never_forced(self):
        st, rec = self._rec(100.0, 100.0, "2026-11-20 04:43", "2026-11-20 04:43")
        self.assertEqual(st, PASS)
        st, rec = self._rec(150.0, 100.0, "2026-11-20 04:43", "2026-11-20 04:43")
        self.assertEqual(st, FAIL)
        self.assertEqual(rec["parent_value"], "100")  # the source value is reported, not adjusted
        st, _ = self._rec(150.0, 100.0, "2026-11-20 04:43", "2026-11-21 00:50")
        self.assertEqual(st, WARNING)  # different snapshots: not called an error
        st, _ = self._rec(150.0, 100.0, "2026-11-20 04:43", "2026-11-20 04:43", compatible=False)
        self.assertEqual(st, WARNING)  # different definitions: not called an error

    def test_generation_time(self):
        self.assertEqual(v.ts_span(["… on Friday, November 20, 2026 4:43 AM"]), "2026-11-20 04:43")
        self.assertEqual(v.gen_date("on Wednesday, October 23, 2024 1:15 AM").isoformat(), "2024-10-23")


if __name__ == "__main__":
    unittest.main()
