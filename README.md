# Row Buddy 🚣

A digital logbook for a rowing coach — athletes, erg tests, personal bests,
and training sessions, out of the notebook and onto the phone.

Built as a gift: warm empty states, big tap targets, works great on a phone at
the boathouse.

> **Assumptions made where the brief was blank** — the app is built for the
> coach (one or two shared logins), tracking: athletes (age group, side,
> weight class), erg tests (2k / 5k / 6k / 30min) with automatic personal-best
> detection, and training sessions (water / erg / weights / cross-training)
> with optional per-athlete times. The dashboard answers "who's fastest right
> now" and "who's improving." Boat lineups and regatta results were left out
> of v1 to keep it simple — easy to add later. Charts are hand-rolled SVG
> instead of a chart library (fewer dependencies, same result).

## What's inside

- **Dashboard** — fastest 2k/5k/6k/30min leaderboard, who's improving
  (last two tests compared), team weekly volume, recent sessions.
- **Athletes** — the squad with 2k PBs at a glance; each athlete has a page
  with PBs per test, a progress chart, full test history, and their sessions.
- **Erg tests** — log a time (or meters for 30min); the /500m split is worked
  out automatically and new PBs get a little celebration.
- **Sessions** — date, type, distance, who was there, optional per-athlete
  time and stroke rate.
- **Login** — a single shared account (or a couple), passwords properly
  hashed. Every page requires sign-in.

## Deploying to Vercel (no developer needed)

You'll end up with a private URL you can put on the coach's phone home screen.

1. **Put the code on GitHub** (already done if you're reading this there).
2. Go to **[vercel.com](https://vercel.com)** and sign up — "Continue with
   GitHub" is easiest.
3. Click **Add New… → Project**, find **row-buddy** in the list, click
   **Import**, then **Deploy**. The first deploy will show a database error —
   that's expected, two more steps.
4. **Add the database:** open the project, go to the **Storage** tab, click
   **Create Database → Neon (Postgres)** and accept the defaults. Vercel
   connects it to the project automatically.
5. **Add the secrets:** go to **Settings → Environment Variables** and add:
   - `AUTH_SECRET` — a long random string (40+ characters of keyboard
     mashing is fine, or run `openssl rand -base64 32` in a terminal).
   - `SEED_USERNAME` — the login name, e.g. `coach`.
   - `SEED_PASSWORD` — the login password.
6. Open **Deployments** and click **Redeploy** on the latest one. That's it —
   on its first start the app creates its own tables, sets up your login,
   and fills in a demo squad so it looks alive. Sign in with the username
   and password from step 5. 🎉

Every future `git push` to `main` deploys automatically.

### The terminal way (optional)

```bash
npm i -g vercel
vercel login
vercel link          # pick/create the project
vercel install neon  # provisions the database
vercel env add AUTH_SECRET && vercel env add SEED_USERNAME && vercel env add SEED_PASSWORD
vercel deploy --prod
```

## Everyday things

- **Change the password** — edit the `SEED_PASSWORD` env var in Vercel and
  redeploy; the account updates itself on the next start.
- **Add another login** (e.g. an assistant coach) — change `SEED_USERNAME`
  and `SEED_PASSWORD` in Vercel and redeploy; a new account is created
  alongside the old one (or run `npm run db:seed` locally against the
  production `DATABASE_URL`).
- **Add an athlete** — in the app: Athletes → "+ Add athlete". No code needed.
- **Remove the sample data** — delete sessions/tests in the app, or reset the
  database in Neon and re-run step 6 with your real squad.

## Running it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `coach`
/ `row-buddy` (the defaults when `SEED_USERNAME`/`SEED_PASSWORD` aren't set).
No database install or setup commands needed — on first start the app
migrates and seeds itself, using an embedded Postgres
([PGlite](https://pglite.dev)) stored in `.pglite/`. Set `DATABASE_URL` in
`.env.local` if you'd rather point at a real Postgres.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS · Drizzle ORM ·
Neon Postgres (via the Vercel Marketplace) · hand-rolled SVG charts ·
signed-cookie sessions (jose) with bcrypt-hashed passwords.
