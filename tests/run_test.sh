#!/usr/bin/env bash
# Offline end-to-end test: fake portal on localhost -> collect -> re-collect -> new version
# -> manual registration -> extract -> verify -> tamper detection.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$HERE")"
WORK="$(mktemp -d)"
SITE="$WORK/site"
export IBN_ROOT="$WORK/ibn"
mkdir -p "$SITE" "$IBN_ROOT"
PORT=8765

python3 "$HERE/make_fixtures.py" "$SITE" 1 >/dev/null
( cd "$SITE" && exec python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 ) &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; rm -rf "$WORK"' EXIT
sleep 1

cat > "$WORK/manifest.csv" <<EOF
source_id,title,mode,url,link_pattern,max_files,priority,notes
T-PAGE,Fake portal page,page,http://127.0.0.1:$PORT/index.html,(?i)\.(pdf|xlsx|csv)(\?|$),10,1,
T-FILE,Fake direct PDF,file,http://127.0.0.1:$PORT/reports/Vital%20Stats%202023.pdf,,,1,
T-404,Missing file,file,http://127.0.0.1:$PORT/nope.pdf,,,1,
T-MAN,Manual source,manual,,,,1,Needs login
EOF

pass=0; fail=0
check() { if eval "$2"; then echo "PASS  $1"; pass=$((pass+1)); else echo "FAIL  $1"; fail=$((fail+1)); fi; }
C="python3 $REPO/scripts/collect.py --manifest $WORK/manifest.csv --delay 0 --retries 1"
P="$IBN_ROOT/data/provenance.jsonl"

echo "== dry run"; $C --dry-run >/dev/null
check "dry run writes nothing (no log, no raw folder)" '[ ! -e $P ] && [ ! -e $IBN_ROOT/data/raw ]'

echo "== run 1"; $C
check "page snapshot + 3 linked files + direct file saved (5)" '[ "$(grep -c "\"status\": \"saved\"" $P)" = 5 ]'
check "off-pattern link not fetched" '! grep -q elsewhere.html $P'
check "404 logged as error" 'grep -q "\"status\": \"error\"" $P'
check "manual source logged as skipped" 'grep -q skipped_manual $P'
check "originals are read-only" '[ -z "$(find $IBN_ROOT/data/raw -type f -perm -u+w)" ]'
check "download time recorded in UTC and IST" 'grep -q retrieved_at_ist $P'
check "CAPTCHA page served for an .xlsx link logged as blocked" '[ "$(grep rbi_table $P | grep -c "\"status\": \"blocked\"")" = 1 ]'
check "CAPTCHA page not kept in data/raw" '[ -z "$(find $IBN_ROOT/data/raw -name "rbi_table*")" ]'

echo "== link cleanup"
L="import sys; sys.path.insert(0, '$REPO/scripts'); from collect import clean_links as c"
check "two URLs in one href become two links" 'python3 -c "$L; assert c(\"https://x.in/p\", \"http://a.in/1.pdf http://a.in/2.pdf\") == [\"http://a.in/1.pdf\", \"http://a.in/2.pdf\"]"'
check "spaces in a relative href are encoded" 'python3 -c "$L; assert c(\"https://x.in/p/\", \" r/Vital Stats 2023.pdf \") == [\"https://x.in/p/r/Vital%20Stats%202023.pdf\"]"'
check "existing %XX escapes and query strings kept" 'python3 -c "$L; assert c(\"https://x.in/\", \"a%20b.pdf?x=1&y=2\") == [\"https://x.in/a%20b.pdf?x=1&y=2\"]"'

echo "== run 2 (nothing changed upstream)"; $C >/dev/null
check "no new copies on unchanged re-run" '[ "$(grep -c "\"status\": \"saved\"" $P)" = 5 ]'
check "unchanged files logged" '[ "$(grep -c "\"status\": \"unchanged\"" $P)" = 5 ]'

echo "== run 3 (portal publishes a revised PDF)"
python3 "$HERE/make_fixtures.py" "$SITE" 2 >/dev/null
$C >/dev/null
check "revised PDF saved as new version, old kept" '[ "$(find $IBN_ROOT/data/raw -name "Vital_Stats_2023*.pdf" | wc -l)" = 4 ]'
check "--resume skips file rows already saved" '$C --resume --dry-run | grep -q "Resuming: 1 file row(s) already saved"'

echo "== manual registration"
echo "fake tabled report" > "$WORK/report.pdf"
python3 "$REPO/scripts/register_manual.py" --source-id T-MAN --file "$WORK/report.pdf" --url https://example.gov.in/r.pdf --obtained-on 2026-11-13 --note test
python3 "$REPO/scripts/register_manual.py" --source-id T-MAN --file "$WORK/report.pdf" --obtained-on 2026-11-13 >/dev/null
check "manual file registered once" '[ "$(grep -c "\"status\": \"manual\"" $P)" = 1 ]'
R="python3 $REPO/scripts/register_manual.py --source-id T-MAN --file $WORK/report.pdf"
check "rejects path-like --obtained-on (../x)" '! $R --obtained-on ../x >/dev/null 2>&1'
check "rejects malformed --obtained-on (13-11-2026)" '! $R --obtained-on 13-11-2026 >/dev/null 2>&1'
check "rejects impossible date (2026-02-30)" '! $R --obtained-on 2026-02-30 >/dev/null 2>&1'
check "rejects path-like --source-id" '! python3 $REPO/scripts/register_manual.py --source-id ../evil --file $WORK/report.pdf --obtained-on 2026-11-13 >/dev/null 2>&1'
check "nothing written outside data/raw/<id>/<date>" '[ -z "$(find $IBN_ROOT -name report.pdf -not -path "*/data/raw/T-MAN/2026-11-13/*")" ]'

printf "source_id,title,mode,url,link_pattern,max_files,priority,notes\n../evil,Bad,file,http://127.0.0.1:$PORT/index.html,,,1,\n" > "$WORK/bad.csv"
check "collect rejects path-like source_id in manifest" '! python3 $REPO/scripts/collect.py --manifest $WORK/bad.csv --delay 0 >/dev/null 2>&1 && [ ! -e "$IBN_ROOT/data/evil" ]'

H="source_id,title,mode,url,link_pattern,max_files,priority,notes"
printf "$H\nT-M,a,file,http://x/1.xls,,,1,\nT-M,b,file,http://x/2.xls,,,1,\n" > "$WORK/multi_ok.csv"
printf "$H\nT-M,a,page,http://x/1,,,1,\nT-M,b,page,http://x/2,,,1,\n" > "$WORK/multi_page.csv"
printf "$H\nT-M,a,file,http://x/1.xls,,,1,\nT-M,b,file,http://x/1.xls,,,1,\n" > "$WORK/multi_same.csv"
LM="import sys; sys.path.insert(0, '$REPO/scripts'); from common import load_manifest; from pathlib import Path"
check "several file rows for one source are allowed" 'python3 -c "$LM; load_manifest(Path(\"$WORK/multi_ok.csv\"))"'
check "repeated page rows for one source are refused" '! python3 -c "$LM; load_manifest(Path(\"$WORK/multi_page.csv\"))" 2>/dev/null'
check "the same source and URL twice is refused" '! python3 -c "$LM; load_manifest(Path(\"$WORK/multi_same.csv\"))" 2>/dev/null'

echo "== folder dates use IST"
IST_DATE="$(python3 -c "import datetime as d;print(d.datetime.now(d.timezone(d.timedelta(hours=5,minutes=30))).date())")"
check "raw folders named with IST date" '[ -d "$IBN_ROOT/data/raw/T-FILE/$IST_DATE" ]'

echo "== connection dropped mid-download"
DPORT=8766
python3 "$HERE/drop_server.py" $DPORT & DROP=$!
sleep 1
printf "source_id,title,mode,url,link_pattern,max_files,priority,notes\nT-DROP,Dropped,file,http://127.0.0.1:$DPORT/big.pdf,,,1,\n" > "$WORK/drop.csv"
python3 "$REPO/scripts/collect.py" --manifest "$WORK/drop.csv" --delay 0 --retries 2 >/dev/null
kill $DROP 2>/dev/null
check "dropped download logged as error" '[ "$(grep "T-DROP" $P | grep -c "\"status\": \"error\"")" = 1 ]'
check "no .part- temp files left behind" '[ -z "$(find $IBN_ROOT/data/raw -name ".part-*")" ]'

echo "== extract"; python3 "$REPO/scripts/extract.py"
E="$IBN_ROOT/data/processed"
check "PDF table extracted to CSV" 'grep -rq Sheohar $E --include=*.csv'
check "Excel sheets extracted" '[ -n "$(find $E -path "*sheets*" -name "Statement_1.csv")" ]'
check "cp1252 CSV re-encoded to UTF-8" 'grep -rq 32801 $E --include=data.csv'
check "HTML table extracted" '[ -n "$(find $E -name table_1.csv)" ]'
check "sidecar links back to raw sha256 and URL" 'grep -rq raw_sha256 $E --include=extraction.json'
echo "== extract again"; python3 "$REPO/scripts/extract.py" | tail -1
X="$IBN_ROOT/data/extractions.jsonl"
check "extraction not repeated (exactly 8 ok, 1 not_extracted)" '[ "$(grep -c "\"status\": \"ok\"" $X)" = 8 ] && [ "$(grep -c not_extracted $X)" = 1 ]'

echo "== flag a bad original saved by an older version (like the Nov 2026 RBI files)"
LEG="data/raw/T-OLD/2026-11-13/table.XLSX"
mkdir -p "$IBN_ROOT/$(dirname $LEG)"
printf '<!DOCTYPE html><html><body>Please enable JavaScript. Your support ID is: 99.</body></html>' > "$IBN_ROOT/$LEG"
chmod 444 "$IBN_ROOT/$LEG"
python3 -c "
import sys; sys.path.insert(0,'$REPO/scripts')
from common import *; from pathlib import Path
append_jsonl(PROVENANCE, {'source_id':'T-OLD','url':'https://x.in/table.XLSX','role':'linked_file','status':'saved',
  'sha256':sha256_file(ROOT/'$LEG'),'bytes':1,'stored_path':'$LEG','retrieved_at_utc':'2026-11-13T07:00:00+00:00'})"
F="python3 $REPO/scripts/flag.py"
$F --auto >/dev/null
check "flag --auto is a dry run by default" '! grep -q "\"status\": \"invalid\"" $P'
$F --auto --apply
check "flag --auto finds the bot-check original (and only it)" '[ "$(grep -c "\"status\": \"invalid\"" $P)" = 1 ]'
check "flagged file kept, unchanged, in data/raw" '[ -f "$IBN_ROOT/$LEG" ]'
check "extract skips flagged files" 'python3 $REPO/scripts/extract.py | grep -q "Skipping 1 flagged" && ! grep -q T-OLD $X'
OFF="$(find $IBN_ROOT/data/raw/T-PAGE -name "gst*.csv" | head -1 | sed "s#$IBN_ROOT/##")"
check "flag --path needs --reason" '! $F --path $OFF >/dev/null 2>&1'
$F --path "$OFF" --reason "off-target test" --apply >/dev/null
check "flag --path records reason" 'grep -q "off-target test" $P'

echo "== register a folder of hand-downloaded files"
mkdir -p "$WORK/browser"; printf 'a,b\n1,2\n' > "$WORK/browser/t1.csv"; printf 'c\n3\n' > "$WORK/browser/t2.csv"
cp "$SITE/reports/rbi_table.xlsx" "$WORK/browser/captcha.xlsx"
python3 "$REPO/scripts/register_manual.py" --source-id T-DIR --dir "$WORK/browser" --obtained-on 2026-11-13 --url https://x.in/p
check "folder registration exits non-zero when a file is refused" '! python3 $REPO/scripts/register_manual.py --source-id T-DIR --dir $WORK/browser --obtained-on 2026-11-13 >/dev/null'
check "real files registered, CAPTCHA page refused" '[ "$(grep T-DIR $P | grep -c "\"status\": \"manual\"")" = 2 ] && [ -z "$(find $IBN_ROOT/data/raw/T-DIR -name "captcha*")" ]'

echo "== verify"; python3 "$REPO/scripts/verify.py"
check "inventory marks flagged files invalid with reason" 'grep T-OLD $IBN_ROOT/data/inventory.csv | grep -q ",no,bot-check"'
check "verify passes on untouched originals" 'python3 $REPO/scripts/verify.py >/dev/null'
check "inventory.csv written" '[ -s $IBN_ROOT/data/inventory.csv ]'

echo "== zip of district tables"
python3 - "$WORK/tables.zip" <<'PYZIP'
import io, sys, zipfile, openpyxl
wb = openpyxl.Workbook(); wb.active.title = "T01"; wb.active.append(["District", "Population"]); wb.active.append(["Khagaria", "1666886"])
buf = io.BytesIO(); wb.save(buf)
with zipfile.ZipFile(sys.argv[1], "w") as z:
    z.writestr("1021-Khagaria/T01_1021.xlsx", buf.getvalue())
    z.writestr("../../evil.csv", "a,b\n1,2\n")
    z.writestr("1021-Khagaria/readme.txt", "notes")
PYZIP
python3 "$REPO/scripts/register_manual.py" --source-id T-ZIP --file "$WORK/tables.zip" --obtained-on 2026-11-13 >/dev/null
python3 "$REPO/scripts/extract.py" --only T-ZIP >/dev/null
check "spreadsheet inside a zip extracted to CSV" 'grep -rq 1666886 $IBN_ROOT/data/processed/T-ZIP --include=T01.csv'
check "zip member names cannot escape the output folder" '[ -z "$(find $WORK $IBN_ROOT -name evil.csv -not -path "*/data/processed/T-ZIP/*")" ]'
check "non-spreadsheet zip members are listed" 'grep -rq readme.txt $IBN_ROOT/data/processed/T-ZIP --include=members.txt'

echo "== tamper with one original"
F="$(find $IBN_ROOT/data/raw -name '*.xlsx' | head -1)"; chmod u+w "$F"; echo x >> "$F"
check "verify detects modified original" '! python3 $REPO/scripts/verify.py >/dev/null'
check "extract refuses changed raw file" '! python3 $REPO/scripts/extract.py --force >/dev/null'
touch "$IBN_ROOT/data/raw/T-FILE/$IST_DATE/.part-leftover"
check "verify reports leftover partial files" 'python3 $REPO/scripts/verify.py | grep -q PARTIAL'

echo; echo "$pass passed, $fail failed"
[ $fail = 0 ]
