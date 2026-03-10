#!/usr/bin/env python
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_MANAGE = ROOT / "scrapay-backend" / "manage.py"
VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"


def main() -> int:
    if not BACKEND_MANAGE.exists():
        print("Backend manage.py not found at scrapay-backend/manage.py", file=sys.stderr)
        return 1

    if not VENV_PYTHON.exists():
        print(
            "Project virtual environment missing at .venv. "
            "Run: python -m venv .venv && .\\.venv\\Scripts\\python -m pip install -r .\\scrapay-backend\\requirements.txt",
            file=sys.stderr,
        )
        return 1

    args = [str(VENV_PYTHON), str(BACKEND_MANAGE), *sys.argv[1:]]
    return subprocess.call(args, cwd=str(ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
