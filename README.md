# StockFlow MVP

Minimal multi-tenant SaaS inventory app built to the Phase 1 — 6-hour MVP PRD.

**Stack:** Node.js + Express + Prisma + SQLite (API) · React + Vite + React Router + Tailwind (SPA) · JWT cookie auth · bcrypt.

```
stockflow-mvp/
├── prisma/                 # Prisma schema + SQLite db + migrations
├── server/                 # Express API (TypeScript, ESM)
│   ├── src/
│   │   ├── index.ts        # Express bootstrap, CORS, static SPA in prod
│   │   ├── auth.ts         # JWT cookie helpers + requireAuth middleware
│   │   ├── auth.routes.ts  # /api/auth/{signup,login,logout,session,me}
│   │   ├── products.routes.ts # /api/products + /:id + /:id/adjust
│   │   ├── settings.routes.ts # /api/settings
│   │   ├── dashboard.routes.ts # /api/dashboard
│   │   ├── validation.ts   # zod schemas
│   │   └── db.ts, env.ts
│   └── package.json
└── client/                 # React SPA
    ├── src/
    │   ├── App.tsx, main.tsx, auth.tsx, api.ts, types.ts
    │   ├── components/AppLayout.tsx
    │   └── pages/{Login,Signup,Dashboard,Products,ProductForm,Settings}.tsx
    └── package.json
```

## Features (mapped to PRD)

| PRD  | Feature |
|------|---------|
| FR-1 | Email + password signup & login |
| FR-2 | Organization created on signup; all queries scoped by `organizationId` |
| FR-3 | Product model (Name, SKU unique per org, description, qty, prices, threshold) |
| FR-4 | Product CRUD with confirm-on-delete |
| FR-5 | Edit qty in form **or** inline +/- adjust; tracks `lastUpdatedBy` / `updatedAt` |
| FR-6 | Dashboard: total products, total units, low-stock list |
| FR-7 | Settings: org-wide default low-stock threshold |

## Run locally

Prereq: Node 18+.

```bash
# 1. Install deps for both apps
npm run install:all

# 2. Apply DB migrations (creates prisma/dev.db)
npm run db:migrate

# 3. Terminal A — API on :4000
npm run dev:server

# 4. Terminal B — SPA on :5173 (Vite proxies /api -> :4000)
npm run dev:client
```

Open http://localhost:5173.

## Production build (single service)

The Express server serves the built SPA from `client/dist`, so you can deploy just the `server/` process.

```bash
npm run build         # builds client then compiles server
npm start             # serves API + SPA on $PORT (default 4000)
```

Required env vars in production (`server/.env` or platform secrets):

- `JWT_SECRET` — 32+ char random string
- `DATABASE_URL` — `file:./dev.db` for SQLite, or a Postgres URL (also change `provider` in `prisma/schema.prisma`)
- `PORT` — default `4000`
- `CORS_ORIGIN` — comma-separated allowed origins (only needed if SPA is served separately)

## Deploy options

- **Render / Railway / Fly.io** — deploy `server/` as a Node service; SQLite needs a persistent volume mounted at `prisma/`. Build: `npm run install:all && npm run build`. Start: `npm start`.
- **Vercel + serverless DB** — split deploys (SPA on Vercel, API on Render/Fly). Swap the Prisma provider to `postgresql` for hosted Postgres (Neon, Supabase, Vercel Postgres).

## API reference

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST   | `/api/auth/signup`        | – | `{ email, password, organizationName }` |
| POST   | `/api/auth/login`         | – | `{ email, password }` |
| POST   | `/api/auth/logout`        | – | – |
| GET    | `/api/auth/session`       | – | `{ user, organization } \| { user: null }` |
| GET    | `/api/dashboard`          | ✓ | – |
| GET    | `/api/products?q=`        | ✓ | – |
| POST   | `/api/products`           | ✓ | product fields |
| GET    | `/api/products/:id`       | ✓ | – |
| PUT    | `/api/products/:id`       | ✓ | partial product fields |
| DELETE | `/api/products/:id`       | ✓ | – |
| POST   | `/api/products/:id/adjust`| ✓ | `{ delta: number, note?: string }` |
| GET    | `/api/settings`           | ✓ | – |
| PUT    | `/api/settings`           | ✓ | `{ defaultLowStockThreshold: number }` |

All authenticated endpoints filter by the org embedded in the session cookie, so cross-tenant access is impossible.

## Out of scope (per PRD §4)

Multi-warehouse, variants, channel integrations, orders, purchase orders, email notifications, CSV imports, external API keys, RBAC beyond single owner, audit logs, billing.
