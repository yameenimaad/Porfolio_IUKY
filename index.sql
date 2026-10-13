-- index.sql -- the same entry-point banner as index.py, Index.php, index.c++
-- and Javascript.js, this time in SQL: SQL has no file-I/O or regex of its
-- own to read index.html's real <title>/<meta description> the way the
-- other five do, so this version is the honest exception -- a self-
-- contained schema + query that stores and selects the same banner fields
-- instead, written in a dialect any SQLite build understands.
--
-- Run:  sqlite3 < index.sql
--  (or, interactively:  sqlite3
--                       .read index.sql )

DROP TABLE IF EXISTS portfolio;

CREATE TABLE portfolio (
    id          INTEGER PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    url         TEXT NOT NULL
);

INSERT INTO portfolio (title, description, url) VALUES (
    'IMAAD YAMEEN | INDUSTRIAL TERMINAL',
    'Imaad Ullah Khan Yameen - Industrial Engineer, CAD designer, and Six '
    || 'Sigma/ISO 9001 practitioner. Real, working AI, GIS & mechanical '
    || 'projects, plus a 3D/creative portfolio and an off-the-clock look '
    || 'at programming, DIY electronics, and gaming.',
    'https://danger-khan.github.io/Portfolio-IUKY/'
);

.print '============================================================'
SELECT title FROM portfolio WHERE id = 1;
.print '============================================================'
SELECT description FROM portfolio WHERE id = 1;
.print ''
SELECT url FROM portfolio WHERE id = 1;
.print ''
.print 'Stored and selected by: index.sql (this file)'
.print 'Same banner, five other languages: index.py, Index.php, index.c++,'
.print 'Javascript.js, Index.css (a usable snippet, not a program)'
