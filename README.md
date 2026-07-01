# Row Buddy 🚣

A rowing workout tracker. Log erg and on-water sessions, then watch your
volume and split trends over time.

## Features

- **Session logging** — date, erg or on-water, distance, duration, stroke
  rate, and notes. Average /500m split is computed live as you type.
- **Dashboard stats** — total distance, session count and time, best average
  split, and average weekly volume.
- **Charts** — weekly volume bars and a split-trend line (higher = faster),
  with hover tooltips and full light/dark support.
- **Filters** — date-range presets (30/90 days, this year, all time) and
  erg/water type filters that scope every stat, chart, and table row.
- **Local-first** — sessions are stored in your browser's localStorage; no
  account or backend required.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Load sample data**
on the empty state to explore the dashboard.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- Hand-rolled SVG charts (no chart library)

## Deploy

Deployed on [Vercel](https://vercel.com). Any push to `main` redeploys.
