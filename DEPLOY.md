# My Idara App — Deployment Guide
# ادارہ تحقیقات اسلامی — تنصیب

## Files You Have:
1. my_idara_app.jsx  — The app (use in Claude artifacts or convert to HTML)
2. Code.gs           — Google Apps Script backend
3. manifest.json     — PWA manifest
4. sw.js             — Service worker for offline
5. pwa_index.html    — PWA shell

## Option A: Use As-Is in Claude (Testing)
Just open my_idara_app.jsx artifact. Login with any teacher (PIN: 1234) or Admin (PIN: 9999).

## Option B: Deploy as PWA on GitHub Pages (Production)

### Step 1: Apps Script Backend
1. Go to https://script.google.com
2. Create new project, name it "IRI Backend"
3. Paste contents of Code.gs
4. Click Deploy → New Deployment
5. Type: Web App
6. Execute as: Me
7. Who has access: Anyone
8. Click Deploy → Copy the URL
9. This URL goes into the app as APPS_SCRIPT_URL

### Step 2: GitHub Pages Hosting
1. Create a new GitHub repo: "my-idara"
2. Upload these files to the repo:
   - index.html (rename pwa_index.html)
   - manifest.json
   - sw.js
3. Go to repo Settings → Pages → Source: main branch
4. Your app is live at: https://yourusername.github.io/my-idara/

### Step 3: Install on Teacher Phones
1. Open the GitHub Pages URL in Chrome on each phone
2. Chrome shows "Add to Home Screen" banner — tap it
3. Or: Chrome menu (⋮) → "Add to Home Screen"
4. App icon appears on home screen
5. Opens fullscreen, works offline

## Option C: Share APK (No Play Store)
1. Go to https://AnyWrap.com or https://pwabuilder.com
2. Upload your hosted URL
3. Download the generated APK
4. Send APK to teachers via WhatsApp
5. Each teacher: Settings → Security → Allow Unknown Sources → Install

## PINs:
- All teachers: 1234 (change after first login)
- Admin: 9999

## Test Results: 367 tests passing, 0 failures
- Module 0: Seed Data (87 tests)
- Module 1: Authentication (22 tests)
- Module 2: Calendar Engine (29 tests)
- Module 3: Thursday Scoring (31 tests)
- Module 5: Assignments (22 tests)
- Module 6: Daily Report (27 tests)
- Module 7: Dashboard (30 tests)
- Module 8: Sync Engine (20 tests)
- Module 9: Settings Manager (55 tests)
- Module 10: Offline Storage (32 tests)
- Module 13: Apps Script Backend (12 tests)
