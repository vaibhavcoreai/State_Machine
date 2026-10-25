# prompts.md — paste one at a time, in order

Setup (once): create the project folder, put AGENTS.md, plan.md, design.md in the root, and the two screenshots in /reference/. In Antigravity, use Planning mode for P0 and P1, then Fast mode for the rest. Start a NEW conversation per phase. Every prompt starts the same way, so the agent only loads what it needs.

## P0 — Audit
Read AGENTS.md, plan.md, design.md. Inspect this repo and answer in max 15 lines: (1) does a working React app exist, (2) which components/CSS are reusable for the scoresheet and report, (3) any existing backend. No code changes. If no source exists, say so and propose the scaffold from design.md.

## P1 — Database and auth
Do Phase P1 from plan.md. Use the Supabase MCP on the DEV project only: apply the design.md schema as a migration, add the triggers and RLS, then run the security advisors and fix any warnings. Scaffold Vite+React+TS if missing. Add src/lib/supabase.ts, .env.example, and an email+password login gate (no signup UI). Done when: build passes and I can log in with a dashboard-created user.

## P2 — Stats engine
Do P2. Implement src/lib/stats.ts exactly per design.md (points, percentages, validation, quarter delta, top performers with ties, result). Write Vitest tests including the Vivaan Rao case (expect 5 PTS), zero attempts, and invalid combos. Done when npm test passes.

## P3 — Manage Teams
Do P3. Build the Manage Teams screen: create/edit/delete teams and players, max 50 teams, 12 players, duplicate jersey error, version check on team edits. Only name, player name, jersey. Reuse existing button/table styles. Done when I can register a 12-player team and it survives refresh.

## P4 — Live scoresheet
Do P4. Port the live scoresheet to match design.md. Add the Team A/B dropdowns in the scoreboard headers (block same team on both sides). On selection, copy players into the match snapshot with stats at zero. Editable name/jersey per match without touching the roster. Wire derived PTS, validation messages, team scores, and the quarter model. No saving yet.

## P5 — Match records
Do P5. Add match save/resume/history list/new match/reset (with confirm, current match only). Implement version-checked saves with Saving/Saved/Save Failed states and the conflict dialog. Then implement design.md "Offline behaviour": add vite-plugin-pwa caching the app shell only (never cache or queue Supabase requests), IndexedDB draft autosave, "Recover unsaved match" prompt, Offline / Unsaved changes chip, and no automatic send on reconnect. Verify with `npm run build && npm run preview`, not the dev server. A new match must start with zero stats.

## P6 — Reports
Do P6. Build the team report per design.md for either side of a saved match. Everything calculated from saved data. Two entry buttons from the match: Report Team A, Report Team B. No medals, no date/court/category.

## P7 — Export
Do P7. CSV (properly escaped, one row per player, both teams, plus match metadata). Print Score Sheet and Export PDF via print.css: A4 landscape, one page per team report, no clipped columns. Export PDF opens the print dialog on the selected team's report only.

## P8 — QA
Do P8 using the Playwright MCP against the local dev server. Run the QA list in plan.md, items 1–4, 7–11, 13, 15. Screenshot each report and the print preview. Report pass/fail per item in a table, and fix only failures. I'll do items 5/6/12/14/16 by hand.

## P9 — Deploy
Do P9. Deploy to Vercel with env vars set (anon key only). Write README with, at the very top: "ONE scorer per match at a time. Never score the same match on two devices." Then setup, how to add the 7 users, and the offline limitation (app opens offline and keeps a local draft, but nothing reaches the database until the scorer presses Save online; iPhone Safari may clear local drafts after inactivity, so press Save before closing). Confirm no service-role key exists anywhere in the repo.

---

# MCP: what's worth it (each enabled MCP costs tokens every turn, so enable only what the phase needs)

| MCP | Use for | Phases |
|---|---|---|
| Supabase | migrations, RLS, security advisors, inspecting tables. Dev project only, never production data. | P1, P5 |
| Playwright | click through the app, take screenshots, run the QA list | P4–P8 |
| Chrome DevTools | print emulation and layout/overflow debugging on the A4 report | P7 |
| Context7 | current docs for Supabase JS and Vite so the agent doesn't guess APIs | P1, P5 |
| GitHub | commit per phase so you can roll back a bad agent run | all |

Design check without Figma: after P4 and P6, tell Playwright MCP: "Screenshot the page at 1600x800 and compare against /reference/live.png. List only visible differences in spacing, colour, or alignment, max 8 bullets." Fix those and stop.

Add MCP servers in Antigravity's settings (the MCP store / mcp_config.json; menu names vary by version, so check yours).
