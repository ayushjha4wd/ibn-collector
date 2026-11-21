"""One command for the eGramSwaraj follow-up collection (Task 5, section 10) on a computer in India.

    python scripts/run_followup.py --delay 0.3

Runs, in order (each step resumes on re-run; nothing already saved is downloaded again):
  1. egs_bihar.py --steps endpoints          XVFC tied-component report (ZP/BP/GP, all years from 2018-19,
                                             Bihar districts and GPs) and elected-representative counts for
                                             Bihar by district, block and GP, from the public JSON endpoints
                                             the portal's own pages call (no CAPTCHA; no member names)
  2. egs_bihar.py --steps static --deep-years all
                                             block and village (GP) pages for every year, not only 2020-21
                                             and 2024-25
  3. egs_portal_summary.py                   re-hashes every original (must say 0 hash mismatches)
  4. git add / commit / push                 to claude/quirky-pascal-0wuf5o (pulls and retries if rejected)
Never bypasses CAPTCHA or login and never changes a saved file. Extra options go to egs_bihar.py.
"""
from __future__ import annotations

import sys
import time

from run_pass2 import BRANCH, PY, out, run


def main():
    extra = sys.argv[1:]
    run(["git", "config", "core.autocrlf", "false"])
    for steps in (["--steps", "endpoints"], ["--steps", "static", "--deep-years", "all"]):
        code = run([PY, "scripts/egs_bihar.py", *extra, *steps])
        print(f"egs_bihar.py {' '.join(steps)} finished (exit {code})")
    run([PY, "scripts/egs_portal_summary.py"])
    run(["git", "add", "data", ".gitattributes"])
    if out(["git", "diff", "--cached", "--name-only"]):
        run(["git", "commit", "-q", "-m", "eGramSwaraj follow-up collection (tied report, elected representatives, "
                                         "GP pages for all years)"], check=True)
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
