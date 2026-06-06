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
   - `puzzle` (text)
   - `passed` (boolean)
   - `score` (integer)
   - `created_at` (timestamp with time zone, default `now()`)
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Restart the dev server after updating `.env`.

## Deployment

Deploy this project as a static site on Vercel from the GitHub repository.
