"""Create a fake 'government portal' for offline testing of the pipeline."""
import sys
from pathlib import Path

import openpyxl
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

site = Path(sys.argv[1])
version = sys.argv[2] if len(sys.argv) > 2 else "1"
(site / "reports").mkdir(parents=True, exist_ok=True)

doc = SimpleDocTemplate(str(site / "reports" / "Vital Stats 2023.pdf"), pagesize=A4)
rows = [["District", "Births registered", "Deaths registered"],
        ["Patna", "120000", "41000"], ["Gaya", "98000", "30500"],
        ["Sheohar", "14000" if version == "1" else "14250", "4100"]]
doc.build([Paragraph(f"Annual Vital Statistics Report (test fixture v{version})", getSampleStyleSheet()["Title"]),
           Table(rows, style=[("GRID", (0, 0), (-1, -1), 0.5, "black")])])

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Statement 1"
ws.append(["State", "2023-24", "2024-25"])
ws.append(["Bihar", 2.5, 3.1])
wb.create_sheet("Notes").append(["Figures in Rs lakh crore (fixture)"])
wb.save(site / "reports" / "state_finances.xlsx")

(site / "reports" / "gst.csv").write_bytes("state,collection\nBihar,32801\n".encode("cp1252"))
(site / "index.html").write_text("""<html><body><h1>Reports</h1>
<a href="reports/Vital%20Stats%202023.pdf">Vital statistics 2023</a>
<a href="/reports/state_finances.xlsx">State finances</a>
<a href="reports/gst.csv">GST</a>
<a href="https://example.org/elsewhere.html">Not a file</a>
<table><tr><th>Year</th><th>Report</th></tr><tr><td>2023</td><td>Vital stats</td></tr></table>
</body></html>""", encoding="utf-8")
print("fixtures v" + version)
