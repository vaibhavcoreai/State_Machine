# AGENTS.md — read first on every task

Project: Vidya Valley U-16 basketball scorekeeping app.
Specs: `plan.md` (order + decisions), `design.md` (UI, schema, formulas). They replace the original brief. Do not ask for the brief again.

## Token rules
- Do ONE phase from plan.md per task. Stop when its "done" check passes.
- Open only files you need. No repo-wide scans after Phase 0.
- Do not re-read /reference/*.png. design.md already holds the tokens. Look at an image only when I ask for a pixel check.
- No new libraries without asking, except these pre-approved: @supabase/supabase-js, vitest, vite-plugin-pwa. No refactors, extra features, or animations.
- Final reply max 5 lines: files changed, tests run, open issues.

## Stack
Vite + React + TypeScript, Supabase (Postgres + Auth), Vitest, Vercel. Print via CSS @page A4 landscape.

## Hard rules
- Frontend uses only VITE_SUPABASE_URL and the anon key. Never a service-role key.
- Store raw counts only (makes/attempts, ast, fls, stl, reb, to). PTS, %, team score are always derived in `src/lib/stats.ts`.
- Match screen never writes to teams/players tables. A match owns a snapshot.
- UI shows "Saved" only after the DB write returns success. Otherwise "Save Failed". Local drafts are "Unsaved changes", never "Saved".
- Service worker caches the app shell only. Never cache or queue Supabase requests. No background sync.
- Updates use the `version` check (optimistic lock). On conflict, show a dialog; never overwrite silently.
- After each phase: `npm run build` and `npm test` must pass, then tick the box in plan.md.
- Keep existing CSS class names and structure when porting UI; match design.md exactly.
