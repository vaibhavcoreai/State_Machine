# design.md — UI, data, formulas

## Visual tokens (approximate from the references; verify once with a single image read if colours look off)
- Navy header/panels: #0B2545. Orange accent (ball, active quarter Q2): #F28C28. Page bg: #F4F7FB. Card border: #D9E2EC.
- Team A accent blue #1F5FBF. Team B accent red #D64550. WIN badge green #1E9E4A. LOSS red. TIE grey.
- Stat column pastels (rows): PTS green tint, AST peach, FLS lavender, FT/FG/3P pale yellow, STL/REB/TO light blue/pink. Copy from the existing CSS if it exists.
- Font: bold condensed caps for titles (e.g. Barlow Condensed/Oswald), clean sans for tables (Inter). Tabular numbers in tables.

## Live scoresheet (screen 1)
Top: navy header with logo + title left; metadata fields right: Date (dd/mm/yyyy), Tip-off, Court (select), Category (select), Statistician 1, Statistician 2.
Scoreboard bar: Team A shield + "TEAM A" label + team dropdown (shows name) | big score | Q1 Q2 Q3 Q4 FINAL toggle + "CURRENT QUARTER" | big score | Team B.
Two tables side by side. Header: team name, "+ Add Player", "Jersey #" toggle.
Columns: Jersey # | Name | PTS | AST | FLS | FT M/A | FG M/A | 3P M/A | STL | REB | TO | trash.
M/A cells are two small number inputs "made / attempted". PTS is read-only and derived.
Footer buttons: Save Game (navy), Download CSV, Print Score Sheet, Export PDF, Reset Game (red outline).
Status chip near Save: Saving… / Saved ✓ / Save Failed / Offline / Unsaved changes / Draft recovered.

## Report (screen 2, one per team, 1 page A4 landscape)
Navy header: logo + "VIDYA VALLEY SCHOOL / U-16 NATIONAL BASKETBALL TOURNAMENT" left; "TEAM STATISTICS REPORT / {TEAM NAME}" right. NO date, court, category, medals, trophies.
Row 1: shield + title; FINAL SCORE card "{A score} - {B score}", both team names under, WIN/LOSS/TIE badge for the selected team.
Row 2 left: Individual Player Statistics table (# jersey, Name, PTS, AST, FLS, FT M/A, FG M/A, 3P M/A, STL, REB, TO), selected team only.
Row 2 right: Shooting Summary (3 donut rings: FG%, 3P%, FT% with made/attempted below) above Quarter table (Q1–Q4 + Final, both teams).
Row 3 left: Key Team Statistics cards (Points, Rebounds, Assists, Turnovers, Fouls, Steals). Right: Top Performers (most PTS, REB, AST; ties show all names comma-separated; all-zero shows "—").

## Schema (Supabase, RLS on, authenticated users only)
```sql
create table teams(
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  version int not null default 1,
  updated_at timestamptz not null default now());
create unique index teams_name_ci on teams (lower(name));

create table players(
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  jersey int not null check (jersey between 0 and 99),
  unique (team_id, jersey));

create table matches(
  id uuid primary key default gen_random_uuid(),
  match_date date, tipoff time, court int, category text,
  statistician1 text, statistician2 text,
  team_a_id uuid references teams(id) on delete set null,
  team_b_id uuid references teams(id) on delete set null,
  quarter text not null default 'Q1' check (quarter in ('Q1','Q2','Q3','Q4','FINAL')),
  status text not null default 'live' check (status in ('scheduled','live','final')),
  data jsonb not null,
  version int not null default 1,
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  check (team_a_id is distinct from team_b_id));
```
Also add: triggers (max 50 teams; max 12 players per team); a BEFORE UPDATE trigger on teams and matches that sets `version = old.version + 1` and `updated_at = now()`; RLS policy `for all to authenticated using (true) with check (true)` on all three tables; disable public signups in Auth settings.

## matches.data shape
```json
{"A":{"name":"Team X","players":[{"id":"uuid","jersey":7,"name":"Arjun","ast":0,"fls":0,"ftm":0,"fta":0,"fgm":0,"fga":0,"tpm":0,"tpa":0,"stl":0,"reb":0,"to":0}],"q":{"Q1":0,"Q2":0,"Q3":0,"Q4":0}},
 "B":{ ...same... }}
```
Team names and players are copied here at selection time. This copy is the historical truth.

## Formulas and validation (src/lib/stats.ts, pure functions)
- PTS = 2*(FGM − 3PM) + 3*3PM + FTM. Team score = sum of player PTS.
- FG% = FGM/FGA*100, 3P% = 3PM/3PA*100, FT% = FTM/FTA*100. Attempts 0 → show "—", never NaN.
- Inputs: non-negative integers only. Reject: FGM>FGA, 3PM>3PA, FTM>FTA, 3PM>FGM, 3PA>FGA. Show inline red message, don't save the invalid value.
- Jersey: 0–99 integer, unique within each side of the match. Name: non-empty.

## Quarter model (simplest reliable)
On every stat edit: delta = newTeamScore − oldTeamScore; `q[currentQuarter] += delta`.
Invariant: sum(q) === team score; no quarter below 0. If an edit would push the current quarter below 0, block it with "Switch to the quarter where this score was made."
FINAL button sets status = final. Result: higher score wins; equal = TIE.

## Save states
Saving… → write with `.eq('version', v)` and `.select()`. 1 row back → "Saved ✓" and store the new version. 0 rows → conflict dialog (Reload latest / Keep mine as copy). Error → "Save Failed". Autosave the draft to IndexedDB every change, clear it only after a confirmed save.

## Offline behaviour (no background sync)
- App shell: vite-plugin-pwa precaches the built JS/CSS/HTML/fonts/icons only. Supabase requests are NEVER cached or queued.
- Offline: chip shows "Offline". Scoring continues; every change is written to the IndexedDB draft (keyed by match id, with the last known `version`).
- Reload/reopen (online or offline): if a draft exists, prompt "Recover unsaved match" (Recover / Discard).
- Back online: chip shows "Unsaved changes — press Save". Nothing is sent automatically. Save runs the normal version-checked write; conflict dialog if someone saved first.
- Unsaved draft is never shown as "Saved". Download CSV works offline from the local data.
- Test the service worker only with `npm run build && npm run preview`.

## Folders
src/lib/{supabase,stats,csv,draft}.ts · src/components/{Header,Scoreboard,TeamTable,Report,TeamsManager,MatchList}.tsx · src/styles/{app,print}.css · src/lib/stats.test.ts · vite.config.ts (PWA plugin)
