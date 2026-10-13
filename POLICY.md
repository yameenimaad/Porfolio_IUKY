# Site Policy

Plain terms for what this site does and doesn't do with anything you give it.

## What this site is

A personal engineering portfolio. It is static (served by GitHub Pages),
has no server-side backend, no user accounts, and no database behind the
live site. Every interactive "lab" (regression, image processing, NLP,
the Resume/CV builder, the Humanizer, the Slicer, the Py Compiler, the
G-code Slicer Lab) runs **entirely in your browser**. Nothing you type into
any of them is uploaded, logged, or sent anywhere — there is nowhere for it
to go, because there is no server on the other end of this site to receive
it.

## Cookies & local storage

- A cookie banner asks for consent once; your choice is stored either as a
  cookie (`cookie_consent`) or in `localStorage`, whichever the page used —
  either way, that preference stays on your device.
- Several labs autosave your in-progress draft to `localStorage`
  (the Resume/CV builder, for instance) purely so a refresh doesn't lose
  your work. That data never leaves your browser.
- The theme toggle (light/dark) is also remembered via `localStorage`.
- No cookie or storage value on this site is read by any third party, and
  none of it is used for tracking, advertising, or analytics.

## Third-party content

A few pages embed or link out to third-party services, each governed by its
own policy, not this one:
- **Google Earth Engine** apps (the GIS projects) — governed by Google's
  terms and privacy policy.
- **CDN-hosted libraries** (Tailwind Play CDN, Font Awesome, Three.js,
  React, Google Fonts) — loaded as static assets to render the page; see
  each project's own licence in `Assets/vendor/LICENSES.txt`.
- **GitHub Pages** itself, which serves this site and necessarily sees
  standard web server logs (IP, user agent, requested path) per
  [GitHub's own privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement) —
  this repository's owner has no access to those logs beyond what GitHub's
  own repository insights expose.

## The optional local apps

`Assets/gradio_app.py` and `Assets/streamlit_app.py` are companion apps you
run yourself, locally, if you want a non-browser UI over the same tools.
They make no network calls of their own beyond what Gradio/Streamlit's own
local dev server does, and nothing you type into them is sent anywhere by
this project's code.

## Contact

Questions about this policy, or a request about data you believe this site
holds about you (there generally isn't any, per the above): email
yameenimaad@gmail.com. See [SECURITY.md](SECURITY.md) for reporting an
actual security vulnerability instead.

## Changes

This file may be updated as the site changes. Significant changes will be
reflected here directly — there is no separate mailing list or changelog
for policy updates on a site this size.
