# 🚀 ERP Lite — Full-Stack Dockerized Business Management System

A modern, production-ready **ERP (Enterprise Resource Planning) Lite application** built with **Next.js, Prisma, PostgreSQL**, and fully containerized using **Docker & Docker Compose**.

Designed to simulate real-world business workflows including inventory, suppliers, and order lifecycle — while showcasing **full-stack + DevOps engineering practices**.

---

## ✨ Highlights

- 🔐 Authentication system (NextAuth)
- 📦 Product & supplier management
- 🧾 Order lifecycle (create → reserve → dispatch → cancel)
- ⚠️ Low-stock alert system
- 🧠 Clean Prisma schema & relational data modeling
- 🐳 Fully Dockerized (App + DB)
- ⚙️ Production-style migration & seeding flow

---

## 🛠️ Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend    | Next.js (App Router) |
| Backend     | Next.js API Routes |
| Database    | PostgreSQL |
| ORM         | Prisma |
| Auth        | NextAuth |
| DevOps      | Docker, Docker Compose |
| Styling     | Tailwind CSS |

---

## 🏗️ Architecture
Client (Browser)
↓
Next.js App (Container)
↓
Prisma ORM
↓
PostgreSQL (Container)

- Services are isolated via Docker
- Communication via internal Docker network
- Environment-based configuration

---

## ⚡ Getting Started (Local Setup)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/erp-lite.git
cd erp-lite
```

### 2. Setup environment variables
```bash
cp .env.example .env
```
Update values if needed.

---
### 3. Start database
```bash
docker compose up -d db
```
---

### 4. Apply database schema
```bash
docker compose run --rm app npm run db:migrate:deploy
```
---

### 5. Seed initial data
```bash
docker compose run --rm app npm db:seed
```
---

### 6. Start the application
```bash
docker compose up --build app
```
---

### 7. Open in browser
```bash
http://localhost:3000
```
---


### 🔑 Default Credentials (Seeded)
| Role	        |  Email       |
| ----------|-----------|
| Admin	    |   admin@erplite.com|
|Staff	|staff@erplite.com|

(Passwords defined in seed script)

---

## 🐳 Docker Overview
### Services
- app → Next.js application
- db → PostgreSQL database
### Key Concepts
- Multi-stage Docker build (optimized image)
- .dockerignore used to reduce build size
- Environment variables injected at runtime
- Prisma migrations run separately (clean DevOps flow)
---

## 🧠 DevOps Workflow
```bash
Start DB → Apply Migrations → Seed Data → Run App
```
This mimics real production deployment pipelines.

---
## 📁 Project Structure
```bash
erp-lite/
├── app/                
├── components/         
├── lib/                
├── prisma/             
├── public/             
├── services/           
├── Dockerfile
├── compose.yaml
└── .env.example
```

---

### ⚠️ Notes
- .env is required (not committed for security)
- Seed script uses upsert → safe to run multiple times
- Prisma migrations must be applied before running the app
---
### 📈 Future Improvements
- 🔒 Role-based access control (RBAC)
- 📊 Dashboard analytics
- 🌐 CI/CD pipeline (GitHub Actions)
- ⚡ Performance optimization
- ☁️ Cloud-native deployment (ECS / Kubernetes)
---

## 👨‍💻 Author

### Kalash Bijukchhe

🌐 https://kalashbijukchhe.com
- 💼 Aspiring Full-Stack / DevOps Engineer
- 🚀 Focus: Scalable systems, FinTech, Cloud Engineering
---

### ⭐ Final Note

This project demonstrates:

- real-world system design
- containerized architecture
- database lifecycle management
- production-style workflows