"""One command, on a computer in India, to collect every receipt and payment voucher list of one district for one
financial year, then check, commit and push.

    python scripts/run_vouchers.py --district 203 --fy 2025-2026 --delay 0.3      # Patna, 2025-26

It runs egs_bihar.py --steps vouchers (month-wise statements of the Zilla Parishad, every Panchayat Samiti and every
Gram Panchayat, and the voucher-wise lists they link to), egs_portal_summary.py (hash check), then git add /
commit / push. Resumable; never bypasses a CAPTCHA (if the voucher list asks for one, it stops and says so).
"""
from __future__ import annotations

import sys
import time

from run_pass2 import BRANCH, PY, out, run


def main():
    args = sys.argv[1:]
    run(["git", "config", "core.autocrlf", "false"])
    code = run([PY, "scripts/egs_bihar.py", "--steps", "vouchers", *args])
    print(f"egs_bihar.py --steps vouchers finished (exit {code})")
    run([PY, "scripts/egs_portal_summary.py"])
    passthrough = []  # forward --district and --fy to the extractor (drop collection-only flags like --delay)
    for flag in ("--district", "--fy"):
        if flag in args:
            passthrough += [flag, args[args.index(flag) + 1]]
    run([PY, "scripts/egs_vouchers_extract.py", *passthrough])
    run(["git", "add", "data", ".gitattributes"])
    if out(["git", "diff", "--cached", "--name-only"]):
        run(["git", "commit", "-q", "-m", "eGramSwaraj voucher lists " + " ".join(args)], check=True)
    for attempt in range(1, 5):
        if run(["git", "push", "origin", BRANCH]) == 0:
            print("\nDONE: pushed", out(["git", "log", "--oneline", "-1"]))
            return
        print(f"push rejected or failed (attempt {attempt}); pulling and retrying")
        if run(["git", "pull", "--no-rebase", "--no-edit", "origin", BRANCH]) != 0:
            raise SystemExit("stopped: merge conflict in\n" + out(["git", "diff", "--name-only", "--diff-filter=U"]) +
                             "\nSend this message to Claude.")
        time.sleep(5 * attempt)
    raise SystemExit("stopped: could not push after 4 attempts; check the internet and run again")


if __name__ == "__main__":
    main()
