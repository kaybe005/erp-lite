<div align="center">

# ERP Lite

**A production-grade, full-stack Business Management System**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

A lightweight ERP for small and medium businesses — built with modern full-stack engineering practices and containerised for production-style deployment.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Author](#-author)

</div>

---

## Features

### Inventory & Products
- Full product CRUD with SKU, category, unit price, stock quantity, and reorder level
- **Reorder List** — automatically surfaces products at or below their reorder threshold, showing current stock, shortage quantity, and linked suppliers
- Supplier–product linking: assign multiple suppliers to each product via a many-to-many relationship; only linked suppliers appear in purchase order dropdowns

### Supplier Management
- Supplier directory with contact details (name, email, phone, address)
- Supplier–product relationship management — configure which products each supplier can supply, enforced at both the UI and API levels

### Purchase Orders
- Create purchase orders scoped to a supplier's linked products only — invalid supplier–product combinations are rejected inside a Prisma transaction with a clear error message
- One-click reorder from the Reorder List pre-fills the supplier and product automatically
- Order lifecycle: **Pending → Received → Cancelled**

### Sales Orders
- Create sales orders with multiple line items; stock is automatically decremented on confirmation
- Customer name, order date, notes, and per-item pricing

### Analytics Dashboard
- **Revenue vs Costs** — 6-month area chart (confirmed sales vs non-cancelled purchase orders)
- **Top Products by Revenue** — ranked leaderboard with proportional progress bars
- **Order Overview** — live counts for pending POs, confirmed SOs, and low-stock items
- 30-day KPI cards with month-over-month revenue trend

### Platform
- **Dark / light mode** — system-aware by default, toggle persisted per user, smooth 150ms transitions across the entire UI
- **Command Palette** (⌘K / Ctrl+K) — navigate to any page or trigger quick actions from anywhere in the app
- **Role-based access control** — Admin and Staff roles; the Users page is restricted to Admins
- **Inventory Insights card** on the dashboard — rule-based alerts for low stock, unlinked products, and healthy states
- Glassmorphism header with backdrop blur, collapsible sidebar, responsive layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.7 (strict) |
| Database | PostgreSQL 16 |
| ORM | Prisma 5.10 with Neon serverless adapter |
| Auth | NextAuth v4 (credentials provider, bcrypt) |
| Styling | Tailwind CSS v4, OKLch design tokens |
| Components | Radix UI primitives + shadcn/ui |
| Charts | Recharts 2.15 |
| Data Fetching | SWR |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Theme | next-themes |
| Containerisation | Docker + Docker Compose |
| Analytics | Vercel Analytics |

---

## Architecture

```
Browser
  │
  ▼
Next.js App Router  (SSR + Client Components)
  │  ├── /app/(dashboard)/*        Protected pages
  │  ├── /app/api/*                REST API route handlers
  │  └── /components/*             UI component library
  │
  ▼
Service Layer  (services/*.service.ts)
  │  ├── ProductService
  │  ├── SupplierService
  │  ├── PurchaseOrderService      enforces supplier-product constraints
  │  ├── SalesOrderService
  │  ├── DashboardService
  │  └── AnalyticsService
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL  (Docker container / Neon serverless)
```

### Key Design Decisions

- **Supplier–product enforcement at two levels.** The UI filters product dropdowns to only show items linked to the selected supplier. `PurchaseOrderService` validates the same constraint inside a Prisma transaction before writing — so even direct API calls cannot bypass it.
- **Service layer pattern.** All database logic lives in `services/`, keeping API route handlers thin and making business logic independently testable.
- **SWR for client data.** Stale-while-revalidate keeps the UI snappy without prop drilling or global state management.
- **Prisma migrations via `migrate deploy`.** Migrations are applied with the production command (not `migrate dev`), mirroring a real deployment pipeline.

---

## Database Schema

```
User ──< PurchaseOrder ──< PurchaseOrderItem >── Product
User ──< SalesOrder    ──< SalesOrderItem    >── Product
Supplier ──< PurchaseOrder
Supplier ──< SupplierProduct >── Product          (junction table)
```

Core models: `User`, `Product`, `Supplier`, `SupplierProduct`, `PurchaseOrder`, `PurchaseOrderItem`, `SalesOrder`, `SalesOrderItem`

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- Node.js 20+ (for local development without Docker)

---

### Option A — Docker (recommended)

```bash
# 1. Clone
git clone https://github.com/kaybe005/erp-lite.git
cd erp-lite

# 2. Configure environment
cp .env.example .env
# Edit .env if needed — defaults work out of the box with Docker

# 3. Start the database
docker compose up -d db

# 4. Apply schema migrations
docker compose run --rm app npm run db:migrate:deploy

# 5. Seed initial data
docker compose run --rm app npm run db:seed

# 6. Start the app
docker compose up --build app
```

Open [http://localhost:3000](http://localhost:3000)

---

### Option B — Local development

```bash
# 1. Clone and install
git clone https://github.com/kaybe005/erp-lite.git
cd erp-lite
npm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL to your local PostgreSQL instance

# 3. Apply schema and seed
npx prisma migrate deploy
npx prisma db seed

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Default Credentials

| Role  | Email |
|-------|-------|
| Admin | admin@erplite.com |
| Staff | staff@erplite.com |

Passwords are defined in `prisma/seed.ts`.

---

### Useful Scripts

```bash
npm run dev                   # Start dev server (Turbopack)
npm run build                 # Production build
npm run db:migrate            # Create and apply a new migration
npm run db:migrate:deploy     # Apply existing migrations (production)
npm run db:seed               # Seed the database with sample data
npm run db:push               # Push schema without a migration file (dev only)
npm run lint                  # Run ESLint
```

---

## Project Structure

```
erp-lite/
├── app/
│   ├── (auth)/                    # Login page
│   ├── (dashboard)/               # Protected app pages
│   │   ├── dashboard/             # Overview + inventory insights
│   │   ├── analytics/             # Revenue, costs, top products
│   │   ├── products/              # Product CRUD
│   │   ├── reorder/               # Reorder list
│   │   ├── suppliers/             # Supplier CRUD
│   │   ├── purchase-orders/       # PO management
│   │   ├── sales-orders/          # SO management
│   │   └── users/                 # User management (Admin only)
│   └── api/                       # REST API route handlers
│       ├── analytics/
│       ├── dashboard/
│       ├── products/
│       │   ├── [id]/suppliers/    # Supplier–product link management
│       │   └── low-stock/
│       ├── suppliers/
│       │   └── [id]/products/
│       ├── purchase-orders/
│       ├── sales-orders/
│       └── users/
├── components/
│   ├── dashboard/                 # StatsCard, RecentOrders
│   ├── layout/                    # Sidebar, Header, PageWrapper, CommandPalette
│   ├── products/                  # ProductForm (with supplier multi-select)
│   ├── purchase-orders/           # PurchaseOrderForm
│   ├── sales-orders/
│   ├── suppliers/
│   ├── users/
│   └── ui/                        # shadcn/ui component library
├── services/                      # Business logic layer
│   ├── analytics.service.ts
│   ├── dashboard.service.ts
│   ├── product.service.ts
│   ├── purchase-order.service.ts
│   ├── sales-order.service.ts
│   └── supplier.service.ts
├── lib/                           # Auth config, DB client, Zod schemas, utils
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── Dockerfile
├── compose.yaml
└── .env.example
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats (counts, recent orders) |
| GET | `/api/analytics` | Revenue trend, top products, KPI summary |
| GET / POST | `/api/products` | List / create products |
| GET / PUT / DELETE | `/api/products/[id]` | Get / update / delete a product |
| GET | `/api/products/low-stock` | Products at or below reorder level |
| GET / PUT | `/api/products/[id]/suppliers` | Get / sync supplier links for a product |
| GET / POST | `/api/suppliers` | List / create suppliers |
| GET / PUT / DELETE | `/api/suppliers/[id]` | Get / update / delete a supplier |
| GET | `/api/suppliers/[id]/products` | Products linked to a supplier |
| GET / POST | `/api/purchase-orders` | List / create purchase orders |
| GET / PATCH | `/api/purchase-orders/[id]` | Get / update PO status |
| GET / POST | `/api/sales-orders` | List / create sales orders |
| GET / PATCH | `/api/sales-orders/[id]` | Get / update SO status |
| GET / POST | `/api/users` | List / create users (Admin only) |
| PATCH / DELETE | `/api/users/[id]` | Update / deactivate a user |

All routes require an authenticated session. Role-restricted routes return `403` for non-Admin users.

---

## Docker Overview

```yaml
services:
  app:   # Next.js application (multi-stage build)
  db:    # PostgreSQL 16
```

- **Multi-stage `Dockerfile`** — a builder stage compiles the app; the runner stage copies only the `.next` output for a minimal production image
- Services communicate over an internal Docker bridge network
- Environment variables injected at runtime via `.env`
- Migrations and seeding run as separate one-off commands (not baked into the startup process) — mirrors real-world deployment pipelines

---

## Author

**Kalash Bijukchhe**

- 🌐 [kalashbijukchhe.com](https://kalashbijukchhe.com)
- 💼 Full-Stack & DevOps Engineer — scalable systems, FinTech, cloud-native architecture

---

<div align="center">

If this project was useful, a ⭐ is appreciated.

</div>
