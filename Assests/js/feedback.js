/* ============================================================================
   feedback.js -- the "Leave Feedback" widget on the main portfolio page.

   This site is static (GitHub Pages, no server), so there is nowhere for a
   submission to land the instant someone clicks Submit. Entries are kept in
   this browser's own localStorage, and the widget's two export buttons are
   what actually get feedback to the site owner:
     - "Email This to Imaad" opens a mailto: link with everything as text.
     - "Download as SQL" generates real INSERT INTO feedback (...) VALUES (...)
       statements matching Assets/Feedback/database.sql's schema -- the
       owner-side Assets/Feedback/feedback_cli.py imports that file directly
       into a real local SQLite database.
   Neither path requires a backend this site doesn't have.
   ============================================================================ */
/* Author: Imaad Ullah Khan Yameen <yameenimaad@gmail.com> */
(function () {
    const STORAGE_KEY = 'portfolio_feedback';
    const OWNER_EMAIL = 'yameenimaad@gmail.com';

    const form = document.getElementById('feedback-form');
    if (!form) return; // widget not on this page

    const starsWrap = document.getElementById('feedback-stars');
    const stars = Array.from(document.querySelectorAll('.feedback-star'));
    const ratingValueInput = document.getElementById('feedback-rating-value');
    const nameInput = document.getElementById('feedback-name');
    const commentInput = document.getElementById('feedback-comment');
    const errorEl = document.getElementById('feedback-error');
    const listEl = document.getElementById('feedback-list');
    const emptyEl = document.getElementById('feedback-empty');
    const countEl = document.getElementById('feedback-count');
    const emailBtn = document.getElementById('feedback-email');
    const downloadBtn = document.getElementById('feedback-download');

    // ---- storage --------------------------------------------------------
    function loadEntries() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            // A private window, cleared site data, or corrupted JSON --
            // either way, treat it as "no feedback yet" rather than throwing.
            return [];
        }
    }

    function saveEntries(entries) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch {
            // Storage full or blocked -- the entry still rendered for this
            // page view, it just won't survive a refresh. Not fatal.
        }
    }

    // ---- star rating ------------------------------------------------------
    let selectedRating = 0;

    function paintStars(uptoValue) {
        stars.forEach((star) => {
            const value = Number(star.dataset.value);
            star.classList.toggle('is-filled', value <= uptoValue);
            star.setAttribute('aria-checked', String(value === selectedRating));
        });
    }

    stars.forEach((star) => {
        star.addEventListener('click', () => {
            selectedRating = Number(star.dataset.value);
            ratingValueInput.value = String(selectedRating);
            paintStars(selectedRating);
        });
        star.addEventListener('mouseenter', () => paintStars(Number(star.dataset.value)));
    });
    if (starsWrap) {
        starsWrap.addEventListener('mouseleave', () => paintStars(selectedRating));
    }

    // ---- rendering the visitor's own history -------------------------------
    function escapeHtml(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function renderEntries() {
        const entries = loadEntries();
        listEl.innerHTML = '';

        countEl.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
        emptyEl.hidden = entries.length > 0;
        emailBtn.disabled = entries.length === 0;
        downloadBtn.disabled = entries.length === 0;

        // Newest first.
        entries.slice().reverse().forEach((entry) => {
            const li = document.createElement('li');
            li.className = 'feedback-entry';
            const stars = '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating);
            const who = entry.name ? escapeHtml(entry.name) : '(anonymous)';
            const when = new Date(entry.submittedAt).toLocaleString();
            li.innerHTML =
                `<span class="feedback-entry-stars">${stars}</span> ` +
                `<strong>${who}</strong> <span class="opacity-40">-- ${when}</span>` +
                `<p class="mt-1 opacity-80">${escapeHtml(entry.comment)}</p>`;
            listEl.appendChild(li);
        });
    }

    // ---- submit -----------------------------------------------------------
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const rating = Number(ratingValueInput.value) || 0;
        const comment = commentInput.value.trim();

        if (rating < 1 || rating > 5) {
            errorEl.textContent = 'Please choose a star rating.';
            errorEl.hidden = false;
            return;
        }
        if (!comment) {
            errorEl.textContent = 'Please add a comment.';
            errorEl.hidden = false;
            return;
        }

        const entries = loadEntries();
        entries.push({
            name: nameInput.value.trim() || null,
            rating,
            comment,
            page: 'index.html',
            submittedAt: new Date().toISOString(),
        });
        saveEntries(entries);

        form.reset();
        selectedRating = 0;
        ratingValueInput.value = '';
        paintStars(0);
        renderEntries();
    });

    // ---- export: SQL --------------------------------------------------------
    function sqlQuote(value) {
        if (value === null || value === undefined) return 'NULL';
        // The one escaping rule SQL string literals actually need: double up
        // any single quote inside the value.
        return `'${String(value).replace(/'/g, "''")}'`;
    }

    function buildSqlExport(entries) {
        const lines = [
            '-- Exported from the portfolio feedback widget.',
            '-- Import with: python feedback_cli.py import <this file>',
            '',
        ];
        entries.forEach((entry) => {
            lines.push(
                'INSERT INTO feedback (name, rating, comment, page, submitted_at) VALUES ' +
                    `(${sqlQuote(entry.name)}, ${entry.rating}, ${sqlQuote(entry.comment)}, ` +
                    `${sqlQuote(entry.page)}, ${sqlQuote(entry.submittedAt)});`
            );
        });
        return lines.join('\n') + '\n';
    }

    downloadBtn.addEventListener('click', () => {
        const entries = loadEntries();
        if (!entries.length) return;
        const blob = new Blob([buildSqlExport(entries)], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-feedback-export.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // ---- export: email --------------------------------------------------------
    // mailto: links have no formal length limit, but mail clients and some
    // browsers start truncating or refusing well before any real limit is
    // hit, so only the most recent entries go in the body -- the SQL/JSON
    // download is the reliable path for a large history.
    const MAX_ENTRIES_IN_EMAIL = 10;

    emailBtn.addEventListener('click', () => {
        const entries = loadEntries();
        if (!entries.length) return;

        const recent = entries.slice(-MAX_ENTRIES_IN_EMAIL);
        const omitted = entries.length - recent.length;

        const body = recent
            .map((entry) => {
                const who = entry.name || '(anonymous)';
                const stars = '*'.repeat(entry.rating) + '.'.repeat(5 - entry.rating);
                return `[${stars}] ${who} -- ${entry.submittedAt}\n${entry.comment}`;
            })
            .join('\n\n') +
            (omitted > 0
                ? `\n\n(${omitted} older entr${omitted === 1 ? 'y' : 'ies'} omitted -- ` +
                  `use "Download as SQL" for the full history.)`
                : '');

        const subject = encodeURIComponent('Portfolio feedback');
        const encodedBody = encodeURIComponent(body);
        window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${encodedBody}`;
    });

    renderEntries();
})();
