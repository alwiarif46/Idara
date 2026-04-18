# ═══════════════════════════════════════════════════════════════
# My Idara App — Deploy to GitHub Pages
# Run from: repo folder containing this script (e.g. C:\Projects\Idara\MyIdaraApp)
# PowerShell 7
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { $PSScriptRoot.TrimEnd('\', '/') } else { "C:\Idara\MyIdaraApp" }

Write-Host "`n📖 My Idara App — Deployment Script" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════`n" -ForegroundColor DarkGray

# ── Step 1: Setup directory ────────────────────────────────────
Write-Host "📁 Step 1: Setting up directory..." -ForegroundColor Cyan
if (!(Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
Set-Location $root

# ── Step 2: Git init or clone ──────────────────────────────────
Write-Host "🔗 Step 2: Git setup..." -ForegroundColor Cyan
if (!(Test-Path "$root\.git")) {
    if (Test-Path "$root\README.md") {
        git init
        git remote add origin https://github.com/alwiarif46/Idara.git
    } else {
        git clone https://github.com/alwiarif46/Idara.git .
    }
}
git checkout main 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b main }

# ── Step 3: Generate manifest.json ─────────────────────────────
Write-Host "📋 Step 3: Generating manifest.json..." -ForegroundColor Cyan
$manifest = @'
{
  "name": "My Idara — ادارہ تحقیقات اسلامی",
  "short_name": "My Idara",
  "description": "Imam Azam College Academic Management",
  "start_url": "/Idara/",
  "scope": "/Idara/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0c2e2e",
  "background_color": "#0c2e2e",
  "dir": "rtl",
  "lang": "ur",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='100' fill='%230c2e2e'/><text x='256' y='320' font-size='260' text-anchor='middle' fill='%23d4af37'>📖</text></svg>",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
'@
[System.IO.File]::WriteAllText("$root\manifest.json", $manifest, [System.Text.UTF8Encoding]::new($false))

# ── Step 4–5: Keep version-controlled app shell (do NOT overwrite index.html / sw.js) ──
# The old script embedded a legacy vanilla app and a cache-first SW, which:
# - Replaced the real React `index.html` on disk before `git push`
# - Cached stale HTML and caused `thuMap` TDZ errors on GitHub Pages
Write-Host "⚙️  Step 4–5: Verifying index.html + sw.js (repo copies, not regenerated)..." -ForegroundColor Cyan
$ix = Join-Path $root 'index.html'
$swf = Join-Path $root 'sw.js'
if (!(Test-Path $ix)) { throw "Missing $ix — add the React monolith from this repo before deploy." }
if (!(Test-Path $swf)) { throw "Missing $swf — add sw.js from this repo before deploy." }
$kb = [math]::Round((Get-Item $ix).Length / 1024, 1)
Write-Host "   index.html — $kb KB" -ForegroundColor White
Write-Host "   sw.js — $([math]::Round((Get-Item $swf).Length / 1kb, 1)) KB" -ForegroundColor White
# ── Step 6: Verify files ──────────────────────────────────────
Write-Host "`n✅ Files generated:" -ForegroundColor Green
Get-ChildItem $root -File | ForEach-Object {
    $size = if ($_.Length -gt 1024) { "{0:N0} KB" -f ($_.Length/1024) } else { "$($_.Length) bytes" }
    Write-Host "   $($_.Name) — $size" -ForegroundColor White
}

# ── Step 7: Git add, commit, push ──────────────────────────────
Write-Host "`n🚀 Step 7: Pushing to GitHub..." -ForegroundColor Cyan
git add -A
git commit -m "Deploy My Idara App — PWA with offline support"
git push -u origin main

Write-Host "`n════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "✅ DEPLOYED!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor White
Write-Host "  https://alwiarif46.github.io/Idara/" -ForegroundColor Cyan
Write-Host ""
Write-Host "To enable GitHub Pages:" -ForegroundColor White
Write-Host "  1. Go to https://github.com/alwiarif46/Idara/settings/pages" -ForegroundColor Gray
Write-Host "  2. Source: Deploy from a branch" -ForegroundColor Gray
Write-Host "  3. Branch: main, folder: / (root)" -ForegroundColor Gray
Write-Host "  4. Click Save" -ForegroundColor Gray
Write-Host ""
Write-Host "Teacher PINs: 1234 | Admin PIN: 9999" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════`n" -ForegroundColor Yellow
