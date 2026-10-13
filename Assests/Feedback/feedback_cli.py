#!/usr/bin/env python3
"""feedback_cli.py -- the owner-side half of the main portfolio's feedback
widget (index.html's "Leave Feedback" section, driven by Assets/js/feedback.js).

The site is static (GitHub Pages, no server), so a visitor's feedback has
nowhere to land centrally the instant they click Submit -- the browser
widget stores it in that visitor's own localStorage, then lets them export
it as a real .sql file (literal INSERT INTO feedback (...) VALUES (...)
statements matching database.sql's schema) or a JSON file, and email either
one. This tool is what turns whichever of those actually reaches you into
one real local SQLite database you can query.

Usage:
    python feedback_cli.py init
    python feedback_cli.py import some_export.sql
    python feedback_cli.py import some_export.json
    python feedback_cli.py list [--min-rating N]
    python feedback_cli.py stats

Author: Imaad Ullah Khan Yameen <yameenimaad@gmail.com>
"""
import argparse
import json
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_DB = HERE / "feedback.db"
SCHEMA_SQL = HERE / "database.sql"

# A visitor's exported .sql file is untrusted input (anyone could hand-edit
# it before emailing it to you), so it is not blindly executescript()'d --
# every statement must be a plain INSERT into exactly this table, or the
# whole import is rejected before anything touches the real database.
_INSERT_RE = re.compile(r"^\s*INSERT\s+INTO\s+feedback\b", re.IGNORECASE)


def ensure_database(db_path: Path = DEFAULT_DB, schema_path: Path = SCHEMA_SQL) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(schema_path.read_text(encoding="utf-8"))
    conn.commit()
    return conn


def _split_statements(sql_text: str) -> list[str]:
    """Split on ';' terminators, dropping blank/comment-only statements.
    Good enough for this file's own narrow shape (one INSERT per statement,
    no semicolons inside string literals in anything the widget generates) --
    this is not a general SQL parser, and does not need to be one."""
    statements = []
    for raw in sql_text.split(";"):
        stripped = "\n".join(
            line for line in raw.splitlines() if not line.strip().startswith("--")
        ).strip()
        if stripped:
            statements.append(stripped)
    return statements


def import_sql(conn: sqlite3.Connection, path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    statements = _split_statements(text)
    if not statements:
        print("No statements found in that file -- nothing imported.")
        return 0

    bad = [s for s in statements if not _INSERT_RE.match(s)]
    if bad:
        print(
            f"Refusing to import: {len(bad)} statement(s) are not a plain "
            f"INSERT INTO feedback. First offending statement:\n  {bad[0][:120]}"
        )
        return 0

    imported = 0
    for stmt in statements:
        # imported_at is NOT in these statements -- it is filled in by the
        # column's own DEFAULT in database.sql the moment the row actually
        # lands, so it always reflects "when you ran the import", never
        # whatever the export file claims, and a multi-row VALUES list needs
        # no per-row rewriting here.
        cur = conn.execute(stmt)
        imported += cur.rowcount if cur.rowcount != -1 else 1
    conn.commit()
    return imported


def import_json(conn: sqlite3.Connection, path: Path) -> int:
    rows = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(rows, dict):
        rows = [rows]
    now = datetime.now(timezone.utc).isoformat()
    imported = 0
    for row in rows:
        rating = int(row["rating"])
        if not 1 <= rating <= 5:
            print(f"Skipping a row with out-of-range rating {rating!r}.")
            continue
        conn.execute(
            "INSERT INTO feedback (name, rating, comment, page, submitted_at, imported_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                row.get("name") or None,
                rating,
                row["comment"],
                row.get("page"),
                row.get("submitted_at", now),
                now,
            ),
        )
        imported += 1
    conn.commit()
    return imported


def cmd_init(args: argparse.Namespace) -> None:
    db_path = Path(args.db)
    if db_path.exists() and not args.force:
        print(f"{db_path} already exists -- pass --force to recreate it.")
        return
    conn = ensure_database(db_path)
    conn.close()
    print(f"Initialized {db_path}")


def cmd_import(args: argparse.Namespace) -> None:
    path = Path(args.file)
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    conn = ensure_database(Path(args.db))
    try:
        if path.suffix.lower() == ".json":
            count = import_json(conn, path)
        elif path.suffix.lower() == ".sql":
            count = import_sql(conn, path)
        else:
            print(f"Unrecognized extension {path.suffix!r} -- expected .sql or .json")
            sys.exit(1)
    finally:
        conn.close()
    print(f"Imported {count} feedback entr{'y' if count == 1 else 'ies'} from {path}")


def cmd_list(args: argparse.Namespace) -> None:
    conn = ensure_database(Path(args.db))
    query = "SELECT id, name, rating, comment, page, submitted_at FROM feedback"
    params: tuple = ()
    if args.min_rating is not None:
        query += " WHERE rating >= ?"
        params = (args.min_rating,)
    query += " ORDER BY submitted_at DESC"

    rows = conn.execute(query, params).fetchall()
    conn.close()

    if not rows:
        print("No feedback stored yet.")
        return

    for row_id, name, rating, comment, page, submitted_at in rows:
        stars = "*" * rating + "." * (5 - rating)
        who = name or "(anonymous)"
        print(f"#{row_id}  [{stars}]  {who}  --  {submitted_at}  ({page or 'unknown page'})")
        print(f"      {comment}")


def cmd_stats(args: argparse.Namespace) -> None:
    conn = ensure_database(Path(args.db))
    total, avg = conn.execute(
        "SELECT COUNT(*), AVG(rating) FROM feedback"
    ).fetchone()
    if not total:
        print("No feedback stored yet.")
        conn.close()
        return

    print(f"Total feedback: {total}")
    print(f"Average rating: {avg:.2f} / 5")
    print()
    print("Rating distribution:")
    histogram = dict(conn.execute(
        "SELECT rating, COUNT(*) FROM feedback GROUP BY rating ORDER BY rating DESC"
    ).fetchall())
    conn.close()
    for stars in range(5, 0, -1):
        n = histogram.get(stars, 0)
        bar = "#" * n
        print(f"  {stars} star{'s' if stars != 1 else ' '} | {bar} {n}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--db", default=str(DEFAULT_DB), help=f"Path to the SQLite database (default: {DEFAULT_DB})"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("init", help="Create the database from database.sql").set_defaults(func=cmd_init)
    p_init = sub.choices["init"]
    p_init.add_argument("--force", action="store_true", help="Recreate even if it already exists")

    p_import = sub.add_parser("import", help="Import a visitor's exported .sql or .json feedback file")
    p_import.add_argument("file", help="Path to the exported .sql or .json file")
    p_import.set_defaults(func=cmd_import)

    p_list = sub.add_parser("list", help="List stored feedback")
    p_list.add_argument("--min-rating", type=int, default=None, help="Only show feedback at or above this rating")
    p_list.set_defaults(func=cmd_list)

    sub.add_parser("stats", help="Show feedback count, average rating, and distribution").set_defaults(func=cmd_stats)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
