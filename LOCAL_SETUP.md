# Local Setup

This repository now includes:

- a checked-in Prisma migration at `prisma/migrations/0001_init/migration.sql`
- a sample-data seed at `prisma/seed.ts`
- a local PostgreSQL container definition at `compose.yaml`

## Prerequisites

- Node.js `>=20.9.0`
- Docker Desktop or another Docker runtime

## Required Environment Variables

- `DATABASE_URL`
  Used by Prisma and all database-backed API routes.
  The sample value in `.env.example` targets the bundled Docker PostgreSQL instance on port `5433`.

- `NEXTAUTH_SECRET`
  Required by NextAuth credentials auth to sign and encrypt session/JWT data.

- `NEXTAUTH_URL`
  The base URL of the app.
  NextAuth uses this for callback/session URLs. If you change the app port, update this too.

## Setup Commands

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Then open `http://localhost:3000`.

## Demo Credentials

- Admin: `admin@erplite.com` / `admin123`
- Staff: `staff@erplite.com` / `staff123`

## Notes

- Use `.env`, not only `.env.local`, because Prisma CLI reads `.env` automatically.
- For a fresh local database, `npm run db:migrate:deploy` is enough. You do not need `scripts/init-db.sql`.
- `npm run db:migrate` is still available for future schema changes during development.
