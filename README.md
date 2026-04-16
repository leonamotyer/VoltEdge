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

- `src/app/` — App Router: `layout.tsx`, `page.tsx`, route segments (`curtailment`, `load-and-storage`, `network-and-fiber`), `error.tsx`, `not-found.tsx`, `globals.css`
- `src/ui/` — Client shell (`AppShell.tsx`), charts, dashboard views
- `src/lib/Backend/` — demo repositories (AESO, SCADA, turbine) and mocks
- `src/lib/frontEnd/` — shared `demoSite.ts`, loaders, chart transforms, `derived/` analytics, `dashboard/guards.ts`

## Deployment (Vercel)

This repo is **Next.js**, not Vite. Vercel must use the **Next.js** builder (it reads `.next/` for you). Do **not** point Output Directory at `dist/`.

1. **Project → Settings → General**
   - **Framework Preset:** choose **Next.js** (use **Override** if it still says Vite or “Other”).
   - **Root Directory:** leave blank unless this app lives in a subfolder of the Git repo.
2. **Build & Development Settings**
   - **Build Command:** leave default, or set `npm run build`.
   - **Output Directory:** leave **empty** (clear any old `dist` value from the Vite days).
   - **Install Command:** default `npm install` is fine.
3. Redeploy.

If you still see **“no public output directory”** or similar, the preset or an old **Output Directory** override is almost always the cause—Next does not emit a `dist` folder like Vite did.

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source this repo.
