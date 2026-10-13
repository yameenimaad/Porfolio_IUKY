# Security Policy

This is a personal engineering portfolio: a static site (GitHub Pages, no
build step) plus a handful of optional, **local-only** Python companion apps
(`Assets/gradio_app.py`, `Assets/streamlit_app.py`) that you run yourself if
you want a terminal/browser UI over the same tools the site demonstrates.
There is no server backend, no user accounts, no database behind the live
site, and no analytics or tracking beyond the cookie banner's own
`localStorage`/cookie preference, which is read by nothing but the page
itself.

## Scope

In scope:
- The static site at [danger-khan.github.io/Portfolio-IUKY](https://danger-khan.github.io/Portfolio-IUKY/)
  and its source in this repository (HTML/CSS/JS, the Python CLI companions,
  the PowerShell validation scripts).

Out of scope:
- Third-party services the site links to or embeds via CDN (Google Earth
  Engine apps, GitHub Pages infrastructure itself, Font Awesome, Tailwind,
  Three.js, React) — report those upstream, to their own maintainers.
- The optional local Gradio/Streamlit apps' own dependency chain (`gradio`,
  `streamlit` and what they pull in) — report issues in those libraries
  upstream as well, unless the issue is specifically in how this repo's code
  calls them.

## Reporting a Vulnerability

If you find a real security issue — something that could expose a visitor's
data, execute unintended code, or compromise the GitHub Pages deployment —
please report it privately rather than opening a public issue:

- **Email:** yameenimaad@gmail.com
- Please include: what you found, how to reproduce it, and what you think
  the impact is. A proof-of-concept is welcome but not required.

You should get an acknowledgement within a few days. This is a one-person
personal project maintained outside of full-time work, so turnaround on a
fix is best-effort rather than SLA-backed — but every genuine report will get
a reply and, where it applies to code in this repo, a fix.

## What Counts as a Real Finding Here

Given the site's actual shape, realistic categories include:
- An XSS vector through user-supplied input in one of the in-browser labs
  (the Resume/CV builder, Humanizer, NLP/Image labs) that could execute in
  another visitor's browser — note that these tools run entirely client-side
  and store drafts in `localStorage`, with nothing round-tripped through a
  server, which limits a lot of the usual attack surface by construction.
- A dependency with a known CVE in `Assets/requirements.txt`
  (`streamlit`/`gradio`) or in `Assets/vendor/` / `Assets/node_modules/`.
- Something in the Python CLI companions that would let a file path or
  argument escape its intended folder (path traversal) when run locally.

Low-value reports that will be closed without action: missing security
headers on a GitHub Pages static site (GitHub controls that layer, not this
repo), lack of a WAF/rate limiting on a personal portfolio, or theoretical
issues with no realistic exploitation path given there is no backend to
attack.
