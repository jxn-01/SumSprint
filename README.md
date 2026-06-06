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
