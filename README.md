# Warehouse SaaS

Warehouse and inventory management platform built as a full-stack portfolio project.

## Tech Stack

### Frontend

- TypeScript
- React
- Next.js
- Tailwind CSS

### Backend

- TypeScript
- Node.js
- NestJS

### Database

- PostgreSQL
- Prisma

### Infrastructure

- Docker
- AWS Lambda
- API Gateway
- Amazon RDS
- Amazon S3
- CloudWatch

## Applications

- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend

## Local development seed

The repository contains deterministic development credentials used only for
local development and automated testing.

### Local accounts

| Role | Email | Password |
| --- | --- | --- |
| OWNER | `admin@warehouse.local` | `warehouse-demo-password-2026` |
| WORKER | `worker@warehouse.local` | `warehouse-worker-password-2026` |

These credentials are intentionally public development fixtures. They are not
production secrets and must never be used for a deployed environment.

The development seed has several safety guards:

- `DEV_SEED_ENABLED=true` must be explicitly enabled.
- The seed refuses to run when `NODE_ENV=production`.
- The PostgreSQL host must be `localhost`, `127.0.0.1`, or `::1`.
- The database name must be `warehouse_db`.

Run the seed from `apps/api`:

```bash
npx prisma db seed --config prisma7.config.ts