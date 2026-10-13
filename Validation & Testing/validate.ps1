<#
.SYNOPSIS
    Validates the portfolio site: checks every .html file for unbalanced
    <div> tags, broken local links/assets (href, src, and CAD viewer
    "model=" query parameters), invalid mailto: addresses, and - as a
    best-effort secondary pass - asset file paths referenced from inline
    <script> blocks (e.g. Three.js loader.load('*.glb') calls). A
    download="whatever.png" attribute (or a JS `.download = '...'`
    assignment) is excluded from that pass -- it's a save-as filename the
    browser writes, not a file this repo needs to contain.

.USAGE
    powershell -File validate.ps1
    (or, from inside PowerShell:  .\validate.ps1)

    Exits 0 and prints a pass summary if everything checks out.
    Exits 1 and lists every issue, grouped by file, if anything is broken.
#>
# Author: Imaad Ullah Khan Yameen <yameenimaad@gmail.com>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$htmlFiles = Get-ChildItem -Path $root -Recurse -Filter *.html -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' }

$assetExtensions = 'glb|gltf|stl|step|stp|igs|iges|sldprt|sldasm|dxf|png|jpg|jpeg|gif|svg|mp4|pdf|docx|xlsx|mp3|wav'
$hrefDoubleQuoted = [regex]'(?:href|src)\s*=\s*"([^"]*)"'
$hrefSingleQuoted = [regex]"(?:href|src)\s*=\s*'([^']*)'"
$assetStringPattern = [regex]"(?<!download\s{0,4}=\s{0,4})['""]([^'""]+?\.(?:$assetExtensions))['""]"

$filesChecked = 0
$totalIssues = 0
$reportLines = New-Object System.Collections.Generic.List[string]

# Index every id="..." in every page up front, so a link carrying a #fragment
# can be checked against the ids that actually exist in its target.
# This was a real blind spot: a link whose FILE resolves but whose fragment
# does not is reported as fine by a path-only check, while the visitor lands
# at the top of the page instead of the section they clicked for. It is
# exactly how "#portfolios" survived that section being deleted.
$idPattern = [regex]'\bid\s*=\s*["'']([^"'']+)["'']'
$idsByFile = @{}
foreach ($f in $htmlFiles) {
    $raw = Get-Content -LiteralPath $f.FullName -Raw
    if ($null -eq $raw) { $raw = '' }
    $set = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($m in $idPattern.Matches($raw)) { [void]$set.Add($m.Groups[1].Value) }
    $idsByFile[$f.FullName.ToLower()] = $set
}

foreach ($file in $htmlFiles) {
    $filesChecked++
    # Get-Content -Raw returns $null (not "") for a 0-byte file — treat that
    # as an empty, still-being-written scaffold rather than crashing on it.
    $text = Get-Content -LiteralPath $file.FullName -Raw
    if ($null -eq $text) { $text = '' }
    $dir = $file.DirectoryName
    $fileIssues = New-Object System.Collections.Generic.List[string]

    # --- 1. Structural check: <div> / </div> balance ---------------------
    $openDivs = ([regex]::Matches($text, '<div\b')).Count
    $closeDivs = ([regex]::Matches($text, '</div>')).Count
    if ($openDivs -ne $closeDivs) {
        $fileIssues.Add("Unbalanced <div> tags: $openDivs opening vs $closeDivs closing")
    }

    # --- 2. href / src attribute resolution -------------------------------
    $attrMatches = New-Object System.Collections.Generic.List[System.Text.RegularExpressions.Match]
    foreach ($m in $hrefDoubleQuoted.Matches($text)) { $attrMatches.Add($m) }
    foreach ($m in $hrefSingleQuoted.Matches($text)) { $attrMatches.Add($m) }

    foreach ($m in $attrMatches) {
        $raw = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
        if ($raw -eq '') { continue }

        # A same-page anchor still has to point at an id that exists here.
        if ($raw.StartsWith('#')) {
            $frag = $raw.Substring(1)
            if ($frag -ne '' -and -not $idsByFile[$file.FullName.ToLower()].Contains($frag)) {
                $fileIssues.Add("Dead anchor: `"$raw`" - no element with id=`"$frag`" on this page")
            }
            continue
        }

        if ($raw -match '^(https?:|mailto:|tel:|data:|javascript:)') {
            if ($raw -match '^mailto:') {
                $addr = $raw.Substring(7)
                $atCount = ([regex]::Matches($addr, '@')).Count
                if ($atCount -ne 1 -or $addr -match '\s') {
                    $fileIssues.Add("Invalid mailto address: `"$raw`"")
                }
            }
            continue
        }

        # Split off fragment (#...) then query (?...) before resolving the path.
        $pathPart = $raw
        $queryPart = $null
        $hashIdx = $pathPart.IndexOf('#')
        if ($hashIdx -ge 0) { $pathPart = $pathPart.Substring(0, $hashIdx) }
        $qIdx = $pathPart.IndexOf('?')
        if ($qIdx -ge 0) {
            $queryPart = $pathPart.Substring($qIdx + 1)
            $pathPart = $pathPart.Substring(0, $qIdx)
        } elseif ($raw.Contains('?')) {
            # '?' came after a literal '#' was stripped above - recover it from the original.
            $afterHash = $raw
            if ($hashIdx -ge 0) { $afterHash = $raw.Substring($hashIdx) }
            $qIdx2 = $afterHash.IndexOf('?')
            if ($qIdx2 -ge 0) { $queryPart = $afterHash.Substring($qIdx2 + 1) }
        }

        if ($pathPart -ne '') {
            $decoded = [System.Uri]::UnescapeDataString($pathPart)
            $target = Join-Path $dir $decoded
            if (-not (Test-Path -LiteralPath $target)) {
                $fileIssues.Add("Broken link: `"$raw`" -> not found at $target")
                if ($raw.Contains('#') -and -not $raw.Contains('%23')) {
                    $fileIssues.Add("  (this href contains a literal '#' - if the target path really has a '#' in it, it needs to be escaped as %23)")
                }
            } elseif ($hashIdx -ge 0 -and $decoded -match '\.html?$') {
                # The file resolves - now make sure the #fragment does too.
                $frag = $raw.Substring($hashIdx + 1)
                $frag = $frag.Split('?')[0]
                $targetIds = $idsByFile[(Resolve-Path -LiteralPath $target).Path.ToLower()]
                if ($frag -ne '' -and $null -ne $targetIds -and -not $targetIds.Contains($frag)) {
                    $fileIssues.Add("Dead anchor: `"$raw`" - $decoded exists but has no element with id=`"$frag`"")
                }
            }
        }

        # CAD viewer links pass the real model file in a ?model=... query param.
        # viewer.html resolves that path client-side against its OWN location, not
        # against whatever page linked to it -- so the base for Join-Path has to be
        # the viewer's directory ($target's parent), not $dir (this file's own
        # directory). Those were the same directory for every pre-existing link
        # (CADCAMCAE/index.html linking to its own-folder viewer.html); they stop
        # being the same the first time some OTHER page links cross-directory into
        # a viewer.html elsewhere in the repo.
        if ($queryPart) {
            foreach ($kv in ($queryPart -split '&')) {
                if ($kv -like 'model=*') {
                    $modelDecoded = [System.Uri]::UnescapeDataString($kv.Substring(6))
                    $viewerDir = Split-Path $target -Parent
                    $modelTarget = Join-Path $viewerDir $modelDecoded
                    if (-not (Test-Path -LiteralPath $modelTarget)) {
                        $fileIssues.Add("Broken viewer model reference: `"$modelDecoded`" -> not found at $modelTarget")
                    }
                }
            }
        }
    }

    # --- 3. Heuristic: asset paths referenced from inline JS --------------
    # This pattern is a blind raw-text scan (it has no idea whether a match sits
    # inside a <script> block or an href="..." attribute), so a match can arrive
    # HTML-entity-encoded exactly like the href/src values in check 2 -- it needs
    # the same HtmlDecode pass before UnescapeDataString, or a folder name like
    # "GIS & Remote Sensing" (which the browser sees as plain "&") gets checked
    # against the literal text "&amp;" and never matches anything on disk.
    $seen = @{}
    foreach ($m in $assetStringPattern.Matches($text)) {
        $raw = $m.Groups[1].Value
        if ($raw -match '^(https?:|data:)') { continue }
        if ($seen.ContainsKey($raw)) { continue }
        $seen[$raw] = $true

        $decoded = [System.Uri]::UnescapeDataString([System.Net.WebUtility]::HtmlDecode($raw))
        $leafName = Split-Path $decoded -Leaf
        $candidate1 = Join-Path $dir $decoded
        $candidate2 = Join-Path (Join-Path $dir 'Assets') $leafName
        $found = (Test-Path -LiteralPath $candidate1) -or (Test-Path -LiteralPath $candidate2)
        if (-not $found) {
            # Not every page keeps its assets under one "Assets" child -- some
            # (room.html, world.html) sit a plain base-path string next to a
            # set of topic-named sibling folders (RoomKit/, Outside/) with no
            # intermediate "Assets" layer at all. So beyond that one common
            # layout, fall back to a recursive search rooted at the HTML
            # file's own directory, which covers both shapes.
            $assetsRoot = Join-Path $dir 'Assets'
            if (Test-Path -LiteralPath $assetsRoot) {
                $nestedHit = Get-ChildItem -LiteralPath $assetsRoot -Recurse -File -Filter $leafName -ErrorAction SilentlyContinue |
                    Select-Object -First 1
                if ($nestedHit) { $found = $true }
            }
        }
        if (-not $found) {
            $siblingHit = Get-ChildItem -LiteralPath $dir -Recurse -File -Filter $leafName -ErrorAction SilentlyContinue |
                Select-Object -First 1
            if ($siblingHit) { $found = $true }
        }
        if (-not $found) {
            $fileIssues.Add("[heuristic] Script references `"$raw`" - not found next to this file, in its Assets folder, or anywhere else under its own directory")
        }
    }

    if ($fileIssues.Count -gt 0) {
        $relPath = $file.FullName.Substring($root.Length).TrimStart('\')
        $reportLines.Add("")
        $reportLines.Add("--- $relPath ---")
        foreach ($issue in $fileIssues) {
            $reportLines.Add("  [FAIL] $issue")
            $totalIssues++
        }
    }
}

Write-Output "Validated $filesChecked HTML file(s) under $root"

if ($reportLines.Count -gt 0) {
    foreach ($line in $reportLines) { Write-Output $line }
    Write-Output ""
    Write-Output "RESULT: $totalIssues issue(s) found."
    exit 1
} else {
    Write-Output "RESULT: all checks passed - no unbalanced tags, broken links, dead anchors, or invalid mailto addresses found."
    exit 0
}
