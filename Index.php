<?php
/**
 * Index.php -- the same entry-point banner as index.py, index.sql,
 * index.c++ and Javascript.js, this time in PHP: reads the real <title>
 * and <meta name="description"> out of the live index.html next to this
 * file, rather than hardcoding a copy that could drift out of sync with it.
 *
 * Run (CLI):    php Index.php
 * Run (served): point a PHP-enabled web server at this folder and open
 *               Index.php in a browser -- it echoes the same banner as
 *               plain HTML instead of a terminal print.
 */

function extract_from_html(string $html): array
{
    // A plain regex pass, not a full HTML parser -- this file has exactly
    // one <title> and one <meta name="description"> near the top, and the
    // point is "prove this is live data", not build a general-purpose
    // HTML parser.
    $title = '(title not found)';
    if (preg_match('/<title>(.*?)<\/title>/s', $html, $m)) {
        $title = trim($m[1]);
    }

    $description = '(description not found)';
    if (preg_match('/<meta\s+name="description"\s+content="(.*?)"\s*\/?>/s', $html, $m)) {
        $description = str_replace('&amp;', '&', trim($m[1]));
    }

    return [$title, $description];
}

function main(): void
{
    $indexPath = __DIR__ . '/index.html';
    if (!file_exists($indexPath)) {
        echo "index.html not found next to this script -- run it from the repo root.\n";
        return;
    }

    $html = file_get_contents($indexPath);
    [$title, $description] = extract_from_html($html);
    $width = max(strlen($title), 60);
    $rule = str_repeat('=', $width);

    $is_cli = (PHP_SAPI === 'cli');
    $nl = $is_cli ? "\n" : "<br>\n";

    if (!$is_cli) {
        echo "<pre style=\"font-family: monospace;\">\n";
    }

    echo $rule . $nl;
    echo htmlspecialchars($title) . $nl;
    echo $rule . $nl;
    echo htmlspecialchars($description) . $nl;
    echo $nl;
    echo "Read live from index.html by: Index.php (this file)" . $nl;
    echo "Same banner, five other languages: index.py, index.sql, index.c++," . $nl;
    echo "Javascript.js, Index.css (a usable snippet, not a program)" . $nl;

    if (!$is_cli) {
        echo "</pre>\n";
    }
}

main();
