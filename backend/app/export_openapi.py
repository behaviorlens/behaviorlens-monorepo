"""Write the API's OpenAPI spec to stdout or a file.

Usage: python -m app.export_openapi [output.json]
"""

import json
import sys

from app.main import app


def main() -> None:
    spec = json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"
    if len(sys.argv) > 1:
        with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as handle:
            handle.write(spec)
    else:
        sys.stdout.write(spec)


if __name__ == "__main__":
    main()
