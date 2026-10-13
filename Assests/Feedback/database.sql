-- database.sql
-- Schema for visitor feedback collected from the main portfolio page.
--
-- This site is static (GitHub Pages, no server), so there is nowhere for a
-- visitor's feedback to land centrally the moment they click Submit -- the
-- browser widget (Assets/js/feedback.js) stores each entry in that visitor's
-- own localStorage, then offers it back to them as a real SQL export (the
-- INSERT statements below are the exact shape it generates) or a pre-filled
-- email. feedback_cli.py loads whichever of those actually reaches you into
-- one real local SQLite database.

CREATE TABLE IF NOT EXISTS feedback (
  id           INTEGER PRIMARY KEY,
  name         TEXT,              -- optional -- NULL if left blank
  rating       INTEGER NOT NULL,  -- 1-5
  comment      TEXT NOT NULL,
  page         TEXT,              -- which page the widget was submitted from
  submitted_at TEXT NOT NULL,     -- ISO 8601, set by the browser at submit time
  -- ISO 8601, stamped automatically the moment a row is actually inserted --
  -- an export's own INSERT only ever needs to name the five columns above,
  -- so a multi-row VALUES list from the widget needs no per-row rewriting
  -- on the way in.
  imported_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback (rating);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON feedback (submitted_at);
