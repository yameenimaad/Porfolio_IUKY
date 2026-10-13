#!/usr/bin/env python3
"""index.py -- one entry point into this portfolio, re-implemented here in
Python alongside index.sql, Index.php, index.c++, and Javascript.js: the same
small banner, printed by six different languages, each reading the real
<title>/<meta description> out of the live index.html next to this file
rather than hardcoding a copy that could drift out of sync with it.

Run: python index.py
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
INDEX_HTML = HERE / "index.html"


def read_banner_fields(path: Path) -> tuple[str, str]:
    """Pull <title> and <meta name="description" content="..."> straight out
    of index.html. A plain regex, not an HTML parser -- this file has exactly
    one of each tag near the top, and the goal is "prove this is live data",
    not build a general-purpose HTML parser."""
    html = path.read_text(encoding="utf-8", errors="replace")

    title_match = re.search(r"<title>(.*?)</title>", html, re.S)
    title = title_match.group(1).strip() if title_match else "(title not found)"

    desc_match = re.search(
        r'<meta\s+name="description"\s+content="(.*?)"\s*/?>', html, re.S
    )
    desc = desc_match.group(1).strip() if desc_match else "(description not found)"
    # The HTML has &amp; for a literal "&" -- undo just that one entity
    # rather than pulling in a full HTML-unescape for one case.
    desc = desc.replace("&amp;", "&")

    return title, desc


def main() -> None:
    if not INDEX_HTML.exists():
        print("index.html not found next to this script -- run it from the repo root.")
        return

    title, desc = read_banner_fields(INDEX_HTML)
    width = max(len(title), 60)

    print("=" * width)
    print(title)
    print("=" * width)
    print(desc)
    print()
    print("Read live from index.html by: index.py (this file)")
    print("Same banner, five other languages: index.sql, Index.php, index.c++,")
    print("Javascript.js, Index.css (a usable snippet, not a program)")


if __name__ == "__main__":
    main()
