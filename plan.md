# plan.md — Vidya Valley Stats Machine

Goal: 7 authorised users score U-16 games, save to a shared DB, and print two separate team reports.

## Decisions (final — do not revisit)
- Stack: Vite + React + TS, Supabase (Postgres + Auth), Vercel.
- Rosters = `teams` + `players` tables. A match = ONE row with a jsonb snapshot (players, stats, quarter scores).
- PDF export = print dialog ("Save as PDF") on the selected team's report, A4 landscape CSS. No html2canvas/jsPDF.
- Offline v1 is NOT full sync. Ship: (a) service worker caching the app shell only (vite-plugin-pwa), so the app opens with no network; (b) autosave of the draft to IndexedDB, "Recover unsaved match" on reload; (c) CSV export; (d) Online/Offline badge showing Offline / Unsaved changes / Saved. No queued background sync. Document in README.
- Reconnect behaviour: when the network returns, show "Unsaved changes — press Save". Nothing is sent automatically. The scorer presses Save once; the version check runs; conflict dialog if someone else saved first.
- Operating rule (README, top section): ONE scorer per match at a time. Never score the same match on two devices. Offline use is only safe under this rule.
- Conflicts: `version` column, optimistic lock.
- Users: 7 accounts created manually in Supabase dashboard. Public signup disabled. No roles; all 7 equal.
- Team logos: static shields (Team A blue, Team B red). Not stored per team.

## Phases (tick when build + tests pass)
- [ ] P0 Audit repo (no code changes)
- [x] P1 Supabase schema, RLS, auth gate
- [x] P2 stats engine + unit tests
- [x] P3 Manage Teams screen
- [x] P4 Live scoresheet (dropdowns, snapshot, validation, quarters)
- [x] P5 Save / resume / history / new / reset / conflict / draft recovery
- [x] P6 Two team reports
- [x] P7 CSV, Print, PDF
- [ ] P8 QA (list below)
- [ ] P9 Deploy to Vercel + README (limitations + one-scorer rule)

## QA list (P8)
1 Register team with 12 players. 2 New match, select it: names + jerseys fill. 3 All stats 0.
4 Enter shooting, check PTS. 5 Save, refresh, reopen. 6 Open on a second device/browser profile.
7 Edit roster: old report unchanged. 8 Second match starts at zero. 9 Both reports render.
10 Both scores on each report. 11 %, totals, quarter sums reconcile. 12 CSV opens in Excel; PDF correct team.
13 A4 landscape: one page per team, nothing clipped. 14 Log in as each of 7 users; logged-out access denied.
15 Reset asks confirmation, touches only this match; two tabs editing -> conflict dialog. 16 Offline: edit, close, reopen, draft recovered.

## Known traps
1. Reference image error: Vivaan Rao has FGM 2, 3PM 1, FTM 0 → formula gives 5 PTS, image shows 6, so the image's 62 total is really 61. The formula wins. Seed/demo data must be self-consistent.
2. Report image uses jerseys 1–12. Real reports use jerseys from the match snapshot.
3. Deleting a team must not change past matches (snapshot keeps names).
4. Each team report is its own DOM block with a CSS page break, or print will clip/blank-page.
5. Never claim offline data reached the DB.
