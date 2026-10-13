<#
.SYNOPSIS
    Control-phase checks for the expand-in-place cards on the main index.

    These cards deliberately are NOT links: clicking one enlarges it and
    reveals its detail panel in place. That design has three failure modes
    that no other script in this folder can see, because they are all
    "the page still renders perfectly, it just stops working":

      1. A card loses its ARIA/keyboard contract. The card is a <div
         role="button">, not a real <button>, so tabindex="0" and
         aria-expanded are the only things making it reachable and
         announceable. Drop either one and the card still looks identical
         while becoming invisible to keyboard and screen-reader users.

      2. A card loses the outbound link inside its panel. The whole point of
         expanding in place is that leaving the page becomes a deliberate
         second click -- so if the panel has no <a> in it, the destination
         has become unreachable rather than deferred.

      3. The expand panel loses its inner wrapper <div>. The open/close
         animation is a grid-template-rows 0fr -> 1fr transition, which
         needs exactly one clippable child; without it the panel does not
         collapse and every card renders permanently open.

    Also guards the IA decision that there is no "portfolios" section any
    more: every category lives under #projects or #hobbies, with the Claude
    Code build log in the footer.

.USAGE
    powershell -File interaction_test.ps1

    Exits 0 and prints a pass summary if the contract holds.
    Exits 1 and lists every issue if anything is off.
    Output format matches validate.ps1 so qc_report.ps1 can parse it.
#>
# Author: Imaad Ullah Khan Yameen <yameenimaad@gmail.com>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $root 'index.html'

if (-not (Test-Path -LiteralPath $indexPath)) {
    Write-Output "Main index.html not found at $indexPath - nothing to check."
    exit 0
}

$html = Get-Content -LiteralPath $indexPath -Raw
if ($null -eq $html) { $html = '' }

$issues = New-Object System.Collections.Generic.List[string]

# --- 1. Every expand-card carries its full ARIA + keyboard contract -------
# Matches each expand-card's opening tag, then the markup up to the start of
# the next card (or the end of the grid) as that card's body.
$cardTagPattern = [regex]'<div class="[^"]*\bexpand-card\b[^"]*"[^>]*>'
$cardTags = $cardTagPattern.Matches($html)

if ($cardTags.Count -eq 0) {
    $issues.Add("No .expand-card elements found at all - the expand-in-place cards for Hobbies > Programming and > E-Games have been removed or renamed")
}

$cardIndex = 0
foreach ($tag in $cardTags) {
    $cardIndex++
    $openTag = $tag.Value

    # Pull the card's own title so a failure names something recognisable
    # rather than just an index.
    $bodyStart = $tag.Index + $tag.Length
    $nextTag = $cardTagPattern.Match($html, $bodyStart)
    $bodyEnd = if ($nextTag.Success) { $nextTag.Index } else { $html.Length }
    $body = $html.Substring($bodyStart, $bodyEnd - $bodyStart)

    $titleMatch = [regex]::Match($body, '<h3[^>]*>(.*?)</h3>')
    $label = if ($titleMatch.Success) {
        [System.Net.WebUtility]::HtmlDecode($titleMatch.Groups[1].Value).Trim()
    } else {
        "expand-card #$cardIndex"
    }

    if ($openTag -notmatch 'role\s*=\s*"button"') {
        $issues.Add("Card `"$label`" is missing role=`"button`" - it is a <div>, so without the role it is announced as plain text")
    }
    if ($openTag -notmatch 'tabindex\s*=\s*"0"') {
        $issues.Add("Card `"$label`" is missing tabindex=`"0`" - it cannot be reached or opened by keyboard")
    }
    if ($openTag -notmatch 'aria-expanded\s*=\s*"(true|false)"') {
        $issues.Add("Card `"$label`" is missing aria-expanded - its open/closed state is not exposed to assistive tech, and the CSS keys the enlarge off this attribute")
    }

    # --- 2. The panel exists, holds its clippable wrapper, and has a link --
    $panelMatch = [regex]::Match($body, '(?s)<div class="card-expand">(.*)$')
    if (-not $panelMatch.Success) {
        $issues.Add("Card `"$label`" has no .card-expand panel - there is nothing for it to reveal, so the card does nothing when clicked")
    } else {
        $panel = $panelMatch.Groups[1].Value
        if ($panel -notmatch '(?s)^\s*<div>') {
            $issues.Add("Card `"$label`" .card-expand has no inner <div> wrapper - the 0fr->1fr row transition needs one clippable child or the panel never collapses")
        }
        if ($panel -notmatch '<a\s') {
            $issues.Add("Card `"$label`" .card-expand has no <a> inside it - expanding in place is only acceptable while the real destination is still reachable from the open panel")
        }
    }
}

# --- 3. The toggle script and its CSS are both still present --------------
# CSS/JS may be inline in <style>/<script>, or externalized to a linked file
# (main.css / main.js) -- this checks behaviour, not where the code happens to
# live, by following whichever <link>/<script src> tags are actually in the
# page and reading those files in too.
$cssText = [System.Text.StringBuilder]::new()
foreach ($m in [regex]::Matches($html, '(?s)<style[^>]*>(.*?)</style>')) { [void]$cssText.Append($m.Groups[1].Value) }
foreach ($m in [regex]::Matches($html, '<link[^>]+rel\s*=\s*"stylesheet"[^>]*>')) {
    $hrefMatch = [regex]::Match($m.Value, 'href\s*=\s*"([^"]+)"')
    if ($hrefMatch.Success -and $hrefMatch.Groups[1].Value -notmatch '^https?:') {
        $cssPath = Join-Path $root ($hrefMatch.Groups[1].Value -replace '/', '\')
        if (Test-Path -LiteralPath $cssPath) { [void]$cssText.Append((Get-Content -LiteralPath $cssPath -Raw)) }
        else { $issues.Add("index.html links a stylesheet (`"$($hrefMatch.Groups[1].Value)`") that does not exist at $cssPath") }
    }
}

$jsText = [System.Text.StringBuilder]::new()
foreach ($m in [regex]::Matches($html, '(?s)<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>')) { [void]$jsText.Append($m.Groups[1].Value) }
foreach ($m in [regex]::Matches($html, '<script[^>]+src\s*=\s*"([^"]+)"[^>]*>')) {
    $src = $m.Groups[1].Value
    if ($src -notmatch '^https?:') {
        $jsPath = Join-Path $root ($src -replace '/', '\')
        if (Test-Path -LiteralPath $jsPath) { [void]$jsText.Append((Get-Content -LiteralPath $jsPath -Raw)) }
        else { $issues.Add("index.html loads a script (`"$src`") that does not exist at $jsPath") }
    }
}
$cssAll = $cssText.ToString()
$jsAll = $jsText.ToString()

if ($jsAll -notmatch "querySelectorAll\('\.expand-card'\)") {
    $issues.Add("The .expand-card toggle script is gone - every card would render permanently collapsed with no way to open it")
}
if ($cssAll -notmatch '\.expand-card\[aria-expanded="true"\]') {
    $issues.Add("The .expand-card[aria-expanded=`"true`"] CSS rule is gone - cards would toggle their attribute but never visibly enlarge")
}
if ($jsAll -notmatch "e\.target\.closest\('a'\)") {
    $issues.Add("The toggle script no longer bails out on clicks landing on an <a> - clicking the link inside an open panel would collapse the card instead of navigating")
}

# --- 3b. The group scroll tracks (arrows + wheel) have the same shape of
#         risk as the expand-cards: markup that still renders but a behaviour
#         that silently stopped working. -------------------------------------
if ($html -match 'class="group-track"') {
    if ($jsAll -notmatch "querySelectorAll\('\.group-scroller'\)") {
        $issues.Add("The group-track scroll controller script is gone - the arrow buttons and wheel navigation would do nothing")
    }
    if ($cssAll -notmatch '\.group-track\s*\{') {
        $issues.Add("The .group-track CSS rule is gone - groups would fall back to normal document flow with no horizontal scrolling")
    }
    foreach ($navAttr in @('data-track-prev', 'data-track-next')) {
        if ($html -notmatch [regex]::Escape($navAttr)) {
            $issues.Add("No element carries $navAttr - a group's arrow button is missing")
        }
    }
}

# --- 4. IA: no portfolios section; categories live in projects/hobbies ----
if ($html -match '<section\s+id="portfolios"') {
    $issues.Add("A <section id=`"portfolios`"> is back in index.html - every category is supposed to live under #projects or #hobbies now")
}

$requiredAnchors = @(
    'projects-ai', 'projects-gis', 'projects-mechanical', 'projects-creative',
    'hobbies-programming', 'hobbies-diy', 'hobbies-egames'
)
foreach ($anchor in $requiredAnchors) {
    if ($html -notmatch "id=`"$anchor`"") {
        $issues.Add("Missing id=`"$anchor`" - the footer quick-links point at this anchor, so losing it silently breaks those links")
    }
}

# The Claude Code build log moved out of the card grid and into the footer.
$footerMatch = [regex]::Match($html, '(?s)<footer.*?</footer>')
if (-not $footerMatch.Success) {
    $issues.Add("No <footer> found in index.html")
} elseif ($footerMatch.Value -notmatch 'Claude Code/index\.html') {
    $issues.Add("The footer no longer links to the Claude Code build log - it was moved here out of the portfolios grid deliberately")
}

# --- Report ---------------------------------------------------------------
Write-Output "Interaction-checked $($cardTags.Count) expand-in-place card(s) in $indexPath"

if ($issues.Count -gt 0) {
    Write-Output ""
    Write-Output "--- index.html ---"
    foreach ($issue in $issues) { Write-Output "  [FAIL] $issue" }
    Write-Output ""
    Write-Output "RESULT: $($issues.Count) issue(s) found."
    exit 1
} else {
    Write-Output "RESULT: every expand-card keeps its role/tabindex/aria-expanded contract, a clippable panel with a reachable link, the toggle script and CSS are intact, and the projects/hobbies IA is in place."
    exit 0
}
