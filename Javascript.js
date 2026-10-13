/* Javascript.js -- identical to index.js next to it; see that file's header
 * for why both names exist. Same entry-point banner as index.py, index.sql,
 * Index.php and index.c++, this time in JavaScript: reads the real <title>
 * and <meta name="description"> out of the live index.html next to this
 * file, rather than hardcoding a copy that could drift out of sync with it.
 * Not the site's real JS -- that's Assets/js/main.js.
 *
 * Run (Node):     node Javascript.js
 * Run (browser):  paste into the devtools console on any page of this site
 *                 -- there, index.html is already loaded as the DOM, so it
 *                 reads from document.title / the live meta tag directly
 *                 instead of from the filesystem.
 */
(function () {
    // A plain regex pass, not a full HTML parser -- this file has exactly
    // one <title> and one <meta name="description"> near the top, and the
    // point is "prove this is live data", not build a general-purpose
    // HTML parser.
    function extractFromHtml(html) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/s);
        const descMatch = html.match(
            /<meta\s+name="description"\s+content="(.*?)"\s*\/?>/s
        );
        return {
            title: titleMatch ? titleMatch[1].trim() : '(title not found)',
            description: descMatch
                ? descMatch[1].trim().replace(/&amp;/g, '&')
                : '(description not found)',
        };
    }

    function printBanner(title, description) {
        const width = Math.max(title.length, 60);
        const rule = '='.repeat(width);
        console.log(rule);
        console.log(title);
        console.log(rule);
        console.log(description);
        console.log('');
        console.log('Printed by: Javascript.js (this file, same as index.js)');
        console.log(
            'Same banner, five other languages: index.py, index.sql, Index.php,'
        );
        console.log('index.c++, Index.css (a usable snippet, not a program)');
    }

    const isNode =
        typeof module !== 'undefined' && typeof require !== 'undefined';

    if (isNode) {
        const fs = require('fs');
        const path = require('path');
        const indexPath = path.join(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
            console.log(
                'index.html not found next to this script -- run it from the repo root.'
            );
            return;
        }
        const html = fs.readFileSync(indexPath, 'utf8');
        const { title, description } = extractFromHtml(html);
        printBanner(title, description);
    } else if (typeof document !== 'undefined') {
        // Running in a browser (e.g. pasted into devtools on the live site):
        // read the already-loaded DOM instead of fetching a file.
        const title = document.title || '(title not found)';
        const descMeta = document.querySelector('meta[name="description"]');
        const description = descMeta
            ? descMeta.getAttribute('content')
            : '(description not found)';
        printBanner(title, description);
    } else {
        console.log(
            'Run this with Node (node Javascript.js) from the repo root, ' +
                'or paste it into a browser console on the live site.'
        );
    }
})();
