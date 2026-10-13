# Accessibility Statement

This matches the rest of the site's approach to honesty about what's
actually implemented versus what's aspirational — see the
[Claude Code build log](./Assets/Claude%20Code/index.html), which is
explicit about what got built wrong, too. This statement follows the same
rule: everything below "Implemented" is enforced by an automated check in
`Validation & Testing/` and genuinely passes against the live site today;
everything under "Known gaps" has not been fixed, and is not being claimed.

## Implemented and automatically checked

- **Every image has `alt` text, every page has exactly one `<h1>`, a real
  `<title>`, a `<meta name="description">`, and a viewport meta tag** —
  enforced by `index_test.ps1` across all 25 `index.html`-pattern pages;
  CI-equivalent run on every change, not a one-time audit.
- **No duplicate `id` attributes** on any page — same script, same reason:
  a duplicate id silently breaks whichever script or anchor relied on it
  being unique.
- **The expand-in-place cards on the main index keep a full keyboard
  contract**: `role="button"`, `tabindex="0"`, `aria-expanded` kept in
  sync with the visual state, and Enter/Space both open and close a card
  exactly like a click would. Checked by `interaction_test.ps1`, which
  also mutation-tests itself (deliberately breaks the contract, confirms
  the check actually fires, then restores the file) rather than just
  asserting the happy path.
- **The group-scroll-track arrow buttons carry real `aria-label`s**
  ("Scroll AI Projects left", etc.) rather than an icon-only button with no
  accessible name.
- **`prefers-reduced-motion: reduce` is respected**: the card enlarge
  transform, the group-track smooth scrolling, and the certification
  marquee's auto-drift are all disabled for anyone who has asked their OS
  for less motion — this isn't a blanket "disable all CSS transitions"
  rule, each of those three was deliberately identified as actual
  continuous/automatic motion, as opposed to a one-off hover transition.
- **The certification marquee pauses** on hover, keyboard focus, touch,
  and manual scroll/wheel input — it never fights someone who is actually
  trying to read a card, and its duplicated-for-looping cards are marked
  `aria-hidden="true"` so a screen reader hears the certification list
  once, not twice.
- **Dark mode** is a real toggle with a persisted preference
  (`localStorage`), not solely `prefers-color-scheme` — useful for anyone
  whose OS-level preference doesn't match what they want from this one
  page.

## Known gaps — not yet fixed

- **No formal screen-reader testing.** The ARIA attributes above are
  correct by the HTML/ARIA spec and exercised by automated checks, but
  none of this has been walked through with NVDA, JAWS, or VoiceOver by an
  actual screen-reader user. If something announces badly, that's a real
  bug — see below for how to report it.
- **Color contrast has not been audited** against WCAG AA/AAA ratios.
  The industrial color palette (`#FF6B00` orange on white/dark backgrounds,
  the certification category colors) was chosen for visual theme, not
  measured contrast.
- **No skip-to-content link.** A keyboard or screen-reader user has to tab
  through the full nav bar on every page load before reaching the main
  content.
- **No custom `:focus-visible` styling.** Keyboard focus relies on the
  browser's default outline, which is functional but wasn't deliberately
  designed to stay visible against every background on the page (notably
  the dark-mode industrial-card backgrounds).
- **The in-browser labs** (regression, image processing, NLP, the Resume
  builder) have not been individually accessibility-audited the way the
  main index has — they inherit whatever Tailwind/base styling they use,
  without the same level of scrutiny applied above.

## Reporting an accessibility issue

If something on this site is genuinely hard or impossible to use with a
screen reader, keyboard-only, or at a higher zoom level: email
yameenimaad@gmail.com with what you were trying to do and what happened.
Real, reproducible reports will get fixed — this list of gaps is meant to
be shortened over time, not maintained indefinitely.
