# Contributing

This is a personal portfolio, not an open framework — the engineering
history, CV data, and project write-ups are specific to one person
(Imaad Ullah Khan Yameen) and aren't really "contributable" in the usual
open-source sense. That said, real bugs are real bugs, and a few parts of
this repo (the shared Web Games engine, the validation scripts, the
from-scratch JS/Python tools) are generic enough that a genuine fix is
welcome.

## What's welcome

- **Bug reports**: a broken link, a game that crashes, a lab that produces
  a wrong result, a validation script with a false positive/negative.
  Open an issue with steps to reproduce.
- **Small, scoped fixes**: a typo, an off-by-one in a tool, a missing
  `alt` attribute, an accessibility gap. A pull request is fine for these.
- **Security issues**: please follow [SECURITY.md](SECURITY.md) instead of
  a public issue or PR.

## What's probably not a fit

- Rewrites or framework migrations (this is deliberately hand-written
  HTML/CSS/vanilla JS plus a few from-scratch tools — that's the point of
  the portfolio, not an oversight to "modernize").
- New content sections, project write-ups, or CV/certification edits —
  those describe one person's real background and aren't something a PR
  can meaningfully contribute to.

## Before opening a PR

1. Run the validation suite — `powershell -File "Validation & Testing/qc_report.ps1"`
   from the repo root — and make sure it still reports `ACCEPT` (or that
   any new findings are ones your change intentionally introduces and
   explains).
2. If you touched a Web Game, `games_test.ps1` checks sprite references,
   dead art, and the fullscreen exit control specifically.
3. If you touched `index.html`'s expand-in-place cards, `interaction_test.ps1`
   checks the ARIA/keyboard contract and the group-scroll-track behaviour.
4. Keep commits scoped — one fix per PR is much easier to review than a
   bundle of unrelated changes.

## Code style

- No build step, no bundler, no framework dependency beyond what's already
  vendored in `Assets/vendor/`. If a fix needs a new dependency, open an
  issue first to discuss whether it's worth the trade-off.
- Match the surrounding file's existing comment density and naming —
  this codebase comments on *why*, not *what*, so a one-line rationale for
  a non-obvious fix is more useful than restating the code in prose.

## Questions

Open an issue, or email yameenimaad@gmail.com.
