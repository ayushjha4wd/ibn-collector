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

echo "== verify"; python3 "$REPO/scripts/verify.py"
check "verify passes on untouched originals" 'python3 $REPO/scripts/verify.py >/dev/null'
check "inventory.csv written" '[ -s $IBN_ROOT/data/inventory.csv ]'

echo "== tamper with one original"
F="$(find $IBN_ROOT/data/raw -name '*.xlsx' | head -1)"; chmod u+w "$F"; echo x >> "$F"
check "verify detects modified original" '! python3 $REPO/scripts/verify.py >/dev/null'
check "extract refuses changed raw file" '! python3 $REPO/scripts/extract.py --force >/dev/null'
touch "$IBN_ROOT/data/raw/T-FILE/$IST_DATE/.part-leftover"
check "verify reports leftover partial files" 'python3 $REPO/scripts/verify.py | grep -q PARTIAL'

echo; echo "$pass passed, $fail failed"
[ $fail = 0 ]
