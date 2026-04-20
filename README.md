# VoltEdge

Demo front end for wind-site analytics: curtailment intelligence, load and storage sizing, and network/fiber latency checks. Built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and **Recharts**.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Next.js default port).

## Scripts

| Command | Description |
| -------- | ----------- |
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build (`.next/`) |
| `npm run start` | Run the production server locally |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

## Project layout

- `src/app/` — Next.js App Router routes only: `layout.tsx`, `page.tsx`, route pages (`curtailment/`, `load-and-storage/`, `network-and-fiber/`, `roi/`), `globals.css`
- `src/lib/backend/` — Data layer: repositories (`aeso/`, `scada/`, `turbine/`), analytics (`derived/siteAnalytics`), data transforms (`transforms/chartModels`), mocks (`dashboardMocks/`, `*.mock.charts.ts`)
- `src/lib/frontend/` — UI components and logic: `ui/` (AppShell, charts, components, hooks), type guards (`dashboard/guards`), theme constants (`ui/chartTheme`), demo data (`demoSite.ts`)

## Deployment (Vercel)

This repo is **Next.js**, not Vite. If Vercel still used the old **Vite / static** preset, the deployment can look “successful” but every URL returns **404** (no Next server, only static files).

**In the repo:** `vercel.json` sets `"framework": "nextjs"` and `npm run build` so new projects pick the right builder from Git.

**In the dashboard (if a project was created before the Next migration):**

1. **Settings → General → Framework Preset** → **Next.js** (override if needed).
2. **Settings → Build & Development** → **Output Directory** → **empty** (remove `dist`).
3. Redeploy.

**Root Directory** should stay empty unless this app lives in a monorepo subfolder.

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source this repo.
