# SumSprint

A simple browser-based addition practice game with no-carry three-digit puzzles.

## Features

- Name input for PDF export
- `New Game` resets score and session history
- `New Puzzle` generates a fresh puzzle without carrying
- `Check` validates answers and advances to the next puzzle
- Score persists until the page is refreshed
- Share/export results as a PDF file

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Supabase integration

This project includes a Supabase integration for admin analytics and monthly usage reporting.

1. Create a Supabase project at https://app.supabase.com.
2. Add a new table named `attempts` with columns:
   - `id` (UUID, primary key, default `gen_random_uuid()` or `uuid_generate_v4()`)
   - `player_name` (text)
   - `session_id` (text)
   - `puzzle` (text)
   - `passed` (boolean)
   - `score` (integer)
   - `created_at` (timestamp with time zone, default `now()`)
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_KEY`
4. Restart the dev server after updating `.env`.

## Supabase row-level security

If the admin dashboard loads but shows no data, your Supabase `anon` key may still be blocked from reading the `attempts` table.

Run the SQL in `supabase-policy-setup.sql` from the Supabase SQL editor, or add these policies manually:

- Enable row-level security on `public.attempts`
- Allow `anon` to `INSERT` rows with `WITH CHECK (true)`
- Allow `anon` to `SELECT` rows with `USING (true)`

This ensures browser-based inserts and dashboard reads work with the current app setup.

## Deployment

Deploy this project as a static site on Vercel from the GitHub repository.

## Architecture & Tools

- **Framework**: React + Vite (TypeScript)
- **UI**: Plain CSS (src/style.css) with responsive layout
- **Persistence / Analytics**: Supabase (table: `attempts`) for storing attempt records and generating admin metrics
- **Export**: `html2canvas` + `jspdf` to generate PNG and PDF reports from the UI
- **Dev tooling**: `npm`, `vite`, `typescript`

Project structure (important files):
- `index.html` — app entry
- `src/main.tsx`, `src/App.tsx` — app bootstrap and main UI
- `src/AdminDashboard.tsx` — in-app admin console (protected by `VITE_ADMIN_KEY`)
- `src/supabaseClient.ts` & `src/supabaseApi.ts` — Supabase client and analytics helpers
- `src/style.css` — application styling and responsive rules
- `.env.example` — example environment vars (Vite-prefixed)
- `supabase-policy-setup.sql` — SQL to enable RLS policies for browser access

## Vercel deployment

1. Push the repository to GitHub (already done for `fix/admin-dashboard-report-session`).
2. Sign in to https://vercel.com/ and import the GitHub repository.
3. Set environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_KEY`
4. Build & Output Settings (Vercel):
   - Framework Preset: `Other` or `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy. Vercel will build and serve the static `dist` folder.

Notes:
- Keep your Supabase service_role key secret — only use `VITE_SUPABASE_ANON_KEY` in the browser.
- If admin analytics are empty after deploy, ensure RLS policies from `supabase-policy-setup.sql` are applied and the `attempts` table has the `session_id` column.

