# publish.ps1 — commit any new/changed news files and push to GitHub.
# The push triggers the "Build & Deploy Daily News" GitHub Action, which
# rebuilds the site and deploys it to GitHub Pages.
#
# Call this from your Claude scheduled task AFTER it writes the day's
# news-YYYY-MM-DD.json and .md files, e.g.:
#     powershell -ExecutionPolicy Bypass -File "C:\Users\oumar\Desktop\News\scripts\publish.ps1"

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path $PSScriptRoot "..")

git add -A

# Only commit + push if something actually changed.
if (git status --porcelain) {
    $today = Get-Date -Format "yyyy-MM-dd"
    git commit -m "news: update $today"
    git push
    Write-Host "Published news for $today."
} else {
    Write-Host "No changes to publish."
}
