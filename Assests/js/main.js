/* ============================================================================
   main.js -- behaviour for the portfolio index.
   Extracted out of index.html so the markup stays readable.

   Loaded at the end of <body>, so the DOM above it is already parsed and no
   DOMContentLoaded wrapper is needed -- the original inline blocks relied on
   exactly the same thing, and moving them kept that position.
   ============================================================================ */

        // Real-time Clock Logic
        function updatePKT() {
            const clock = document.getElementById("pk-clock");
            const now = new Date();
            const time = new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Karachi",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }).format(now);
            clock.innerText = `PKT: ${time}`;
        }
        setInterval(updatePKT, 1000);
        updatePKT();

        // Theme Toggle Persistence
        const btn = document.getElementById("theme-toggle");
        const icon = document.getElementById("theme-icon");
        const html = document.documentElement;

        // Check for saved theme
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            html.classList.add('dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        }

        btn.addEventListener("click", () => {
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                icon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            } else {
                html.classList.add('dark');
                icon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            }
        });
        const track = document.getElementById('certTrack');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');

        // Amount to scroll per click (width of one card + gap)
        const scrollAmount = 320;

        // Replaced by the marquee below when it starts; stays a no-op if the
        // reader has asked for reduced motion and the marquee never runs.
        let holdAutoScroll = () => {};

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            holdAutoScroll();
        });

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            holdAutoScroll();
        });

        /* Slow continuous right-to-left drift across the certification track.
         *
         * The cards are duplicated once, and the scroll position wraps back by
         * exactly one copy's width when it passes the halfway mark. Because
         * both copies are identical, the jump lands on a pixel-identical frame
         * and reads as one endless belt rather than a loop restarting.
         *
         * It yields to the reader: hovering, focusing a card, touching, or
         * using the arrows pauses it, so it never fights someone who is
         * actually trying to read a certificate. */
        (function initCertMarquee() {
            if (!track) return;

            // Someone who has asked their OS for less motion should not get a
            // page that moves on its own.
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (reduceMotion.matches) return;

            const originals = Array.from(track.children);
            if (!originals.length) return;

            const copy = document.createDocumentFragment();
            originals.forEach((node) => {
                const clone = node.cloneNode(true);
                // The duplicates are decoration; screen readers should hear the
                // list of certifications once, not twice.
                clone.setAttribute('aria-hidden', 'true');
                copy.appendChild(clone);
            });
            track.appendChild(copy);

            const SPEED = 22;          // px per second — a slow, readable drift
            const RESUME_DELAY = 2500; // ms of stillness after a manual nudge

            let paused = false;
            let holdUntil = 0;
            let last = performance.now();

            /* Distance from the first card to its clone — the exact scroll
             * period.
             *
             * Not scrollWidth/2: the track is a flex row with a 20px gap, so
             * 2N cards have 2N-1 gaps, and half of that is half a gap short of
             * one real copy. Wrapping by the short value nudges the belt
             * backwards a few pixels on every cycle. Measuring offsetLeft is
             * exact and stays correct if the card width changes.
             *
             * Cached because reading offsetLeft forces the browser to
             * recalculate layout, which is not something to do every frame. */
            let cachedLoop = 0;

            function loopWidth() {
                if (!cachedLoop) {
                    const first = track.children[0];
                    const firstClone = track.children[originals.length];
                    if (first && firstClone) {
                        cachedLoop = firstClone.offsetLeft - first.offsetLeft;
                    }
                }
                return cachedLoop;
            }

            window.addEventListener('resize', () => { cachedLoop = 0; });

            function step(now) {
                const dt = Math.min((now - last) / 1000, 0.1);
                last = now;

                const running = !paused && now > holdUntil && document.visibilityState === 'visible';
                if (running) {
                    track.scrollLeft += SPEED * dt;
                }

                const half = loopWidth();
                if (half > 0 && track.scrollLeft >= half) {
                    track.scrollLeft -= half;
                }

                requestAnimationFrame(step);
            }

            holdAutoScroll = () => {
                holdUntil = performance.now() + RESUME_DELAY;
            };

            const pause = () => { paused = true; };
            const resume = () => { paused = false; last = performance.now(); };

            track.addEventListener('mouseenter', pause);
            track.addEventListener('mouseleave', resume);
            track.addEventListener('focusin', pause);
            track.addEventListener('focusout', resume);
            track.addEventListener('pointerdown', pause);
            window.addEventListener('pointerup', resume);
            track.addEventListener('touchstart', pause, { passive: true });
            track.addEventListener('touchend', resume, { passive: true });
            // A wheel scroll is the reader taking over; give them the same grace
            // period the arrow buttons get.
            track.addEventListener('wheel', () => holdAutoScroll(), { passive: true });

            requestAnimationFrame(step);
        })();

        /* ---- Expand-in-place cards (Hobbies > Programming, > E-Games) ----
           The card itself toggles its detail panel open instead of being a
           link. Each card is a div with role="button", so the Enter/Space
           handling a real <button> would give for free has to be wired up
           here -- the trade is worth it because the panel holds an <a>, and
           interactive content nested inside a <button> is invalid HTML. */
        (function () {
            const cards = document.querySelectorAll('.expand-card');
            if (!cards.length) return;

            const toggle = (card) => {
                const open = card.getAttribute('aria-expanded') === 'true';
                card.setAttribute('aria-expanded', open ? 'false' : 'true');
            };

            cards.forEach((card) => {
                card.addEventListener('click', (e) => {
                    // A real link inside the panel must navigate, not collapse
                    // the panel out from under the click.
                    if (e.target.closest('a')) return;
                    toggle(card);
                });

                card.addEventListener('keydown', (e) => {
                    if (e.target.closest('a')) return;
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                        // Space would otherwise scroll the page.
                        e.preventDefault();
                        toggle(card);
                    }
                });
            });
        })();


/* ---- Group scroll tracks ------------------------------------------------
   Each category's items live in one horizontal track inside its group-card.
   Navigation is by the arrow buttons, by native touch/trackpad swipe, and by
   the mouse wheel while the pointer is over the track -- a vertical wheel
   gesture is translated into horizontal movement there, which is what makes
   the wheel useful for this layout at all.

   The arrows loop: clicking Next at the last card glides back to the first,
   and Prev at the first glides back to the last, so there is no dead end to
   disable a button at. Both edge fades stay on permanently as the visual
   cue that the track always has more in either direction. The mouse wheel
   is left alone at the true edges so it still hands off to normal page
   scrolling instead of trapping the page inside the track. */
(function () {
    const scrollers = document.querySelectorAll('.group-scroller');
    if (!scrollers.length) return;

    scrollers.forEach((scroller) => {
        const track = scroller.querySelector('.group-track');
        if (!track) return;
        const groupCard = scroller.closest('.group-card');
        const prev = groupCard ? groupCard.querySelector('[data-track-prev]') : null;
        const next = groupCard ? groupCard.querySelector('[data-track-next]') : null;

        // Scroll by one card plus its gap, so a click always lands cleanly on
        // the next card rather than halfway across two.
        const step = () => {
            const first = track.firstElementChild;
            if (!first) return track.clientWidth;
            const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
            return first.getBoundingClientRect().width + gap;
        };

        // 2px of slack: sub-pixel layout means scrollLeft rarely lands on
        // exactly 0 or exactly the maximum.
        const atStart = () => track.scrollLeft <= 2;
        const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;

        if (prev) {
            prev.addEventListener('click', () => {
                if (atStart()) {
                    track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: -step(), behavior: 'smooth' });
                }
            });
        }
        if (next) {
            next.addEventListener('click', () => {
                if (atEnd()) {
                    track.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: step(), behavior: 'smooth' });
                }
            });
        }

        track.addEventListener('wheel', (e) => {
            // Leave genuine horizontal gestures (trackpads, tilt wheels) alone.
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            // Only take over the wheel while there is somewhere left to go in
            // that direction, otherwise the page stops scrolling at the track.
            if ((e.deltaY < 0 && atStart()) || (e.deltaY > 0 && atEnd())) return;
            e.preventDefault();
            track.scrollLeft += e.deltaY;
        }, { passive: false });
    });
})();


  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  function hasConsent() { return getCookie('cookie_consent') === 'accepted'; }
  (function initCookieBanner() {
    var banner = document.getElementById('cookieBanner');
    var acceptBtn = document.getElementById('cookieAccept');
    var declineBtn = document.getElementById('cookieDecline');
    if (!banner) return;
    if (!getCookie('cookie_consent')) banner.style.display = 'flex';
    acceptBtn.addEventListener('click', function () {
      setCookie('cookie_consent', 'accepted', 365);
      banner.style.display = 'none';
    });
    declineBtn.addEventListener('click', function () {
      setCookie('cookie_consent', 'declined', 365);
      banner.style.display = 'none';
    });
  })();
