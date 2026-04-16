# VoltEdge

Demo front end for wind-site analytics: curtailment intelligence, load and storage sizing, and network/fiber latency checks. Built with **React 19**, **Vite 7**, **TypeScript**, **React Router**, and **Recharts**.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended)

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the dev server with hot reload |
| `npm run build`    | Typecheck and production build       |
| `npm run preview`  | Serve the `dist/` build locally      |
| `npm test`         | Run unit tests once                  |
| `npm run test:watch` | Run tests in watch mode            |
| `npm run typecheck` | TypeScript check only (no emit)    |

## Project layout

- `src/main.tsx` — app entry
- `src/ui/` — React shell, router, charts
- `src/lib/Backend/` — demo repositories (AESO, SCADA, turbine) and mocks
- `src/lib/frontEnd/` — route loaders, chart transforms, and `derived/` analytics helpers

Production output is written to `dist/`.

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source this repo.
