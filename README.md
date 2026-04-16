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

Set the project **Framework Preset** to **Next.js**. No SPA `index.html` rewrites are required; routes are real server-resolved paths.

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source this repo.
