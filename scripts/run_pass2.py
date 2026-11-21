"""One command for the eGramSwaraj Bihar pass 2 on a computer in India.

    python scripts/run_pass2.py                 (extra options go to egs_bihar.py, e.g. --delay 0.3)

Runs, in order, and keeps going even if one step stops part-way (every step resumes on re-run):
  1. egs_bihar.py                 static archives, getMobileData API, page scripts
  2. egs_bihar.py --steps xhr     JSON behind browser-built reports (installs Playwright if missing)
  3. egs_portal_summary.py        re-hashes the originals (must say 0 hash mismatches)
  4. git add / commit / push      to claude/quirky-pascal-0wuf5o; on a rejected push it pulls
                                  (data/provenance.jsonl merges by keeping every line of both sides)
Never bypasses CAPTCHA or login, and never changes downloaded files. Safe to run again.
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRANCH = "claude/quirky-pascal-0wuf5o"
PY = sys.executable


def run(cmd, check=False):
    print("\n>>>", " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=ROOT)
    if check and r.returncode:
        raise SystemExit(f"stopped: {' '.join(cmd)} exited {r.returncode}")
    return r.returncode


def out(cmd):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True).stdout.strip()


def main():
    run(["git", "config", "core.autocrlf", "false"])

    extra = sys.argv[1:]
    code = run([PY, "scripts/egs_bihar.py", *extra])
    print(f"egs_bihar.py finished (exit {code})")

    if run([PY, "-c", "import playwright"]) != 0:
        run([PY, "-m", "pip", "install", "playwright"])
    run([PY, "-m", "playwright", "install", "chromium"])
    code = run([PY, "scripts/egs_bihar.py", *extra, "--steps", "xhr"])
    print(f"egs_bihar.py --steps xhr finished (exit {code})")

    run([PY, "scripts/egs_portal_summary.py"])

    run(["git", "add", "data", ".gitattributes"])
    if out(["git", "diff", "--cached", "--name-only"]):
        run(["git", "commit", "-q", "-m", "eGramSwaraj Bihar pass 2"], check=True)
    for attempt in range(1, 5):
        if run(["git", "push", "origin", BRANCH]) == 0:
            print("\nDONE: pushed", out(["git", "log", "--oneline", "-1"]))
            return
        print(f"push rejected or failed (attempt {attempt}); pulling and retrying")
        if run(["git", "pull", "--no-rebase", "--no-edit", "origin", BRANCH]) != 0:
            conflicted = out(["git", "diff", "--name-only", "--diff-filter=U"])
            raise SystemExit("stopped: merge conflict in\n" + conflicted + "\nSend this message to Claude.")
        time.sleep(5 * attempt)
    raise SystemExit("stopped: could not push after 4 attempts; check the internet and run again")


if __name__ == "__main__":
    main()
