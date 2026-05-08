# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fluxa** is a Next.js full-stack fintech application for managing cryptocurrency payments and charges (crypto-to-BRL conversions). The app lives in `fluxa-app/`.

## Commands

All commands run from `fluxa-app/`:

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm lint         # ESLint

# Database (Prisma)
npx prisma migrate dev --name <name>   # Create and apply migration
npx prisma db push                     # Sync schema without migration history
npx prisma generate                    # Regenerate Prisma client
npx prisma studio                      # Open DB browser UI
```

## Architecture

```
fluxa-app/
├── app/
│   ├── api/                 # Next.js route handlers (REST endpoints)
│   │   └── **/route.ts
│   ├── dashboard/           # Protected pages
│   ├── login/ register/ onboarding/ pay/
│   └── middleware.ts        # JWT auth guard for protected routes
├── components/
│   ├── ui/                  # Shadcn/Radix primitives
│   └── dashboard/           # Feature components
├── hooks/                   # Zustand stores + custom hooks
│   └── use-auth.ts          # Auth state (persisted to localStorage)
├── lib/
│   ├── services/auth.ts     # Business logic (service layer)
│   ├── db.ts                # Prisma client singleton
│   ├── swagger.ts           # OpenAPI spec config
│   └── types.ts             # Shared TypeScript interfaces
└── prisma/schema.prisma     # DB schema (PostgreSQL)
```

**Request flow:** Route handler → service function in `lib/services/` → Prisma → DB. Routes handle only HTTP concerns; business logic lives in services.

**Auth:** httpOnly JWT cookie (`fluxa-token`, 1-day expiry). Middleware uses `jose` to verify tokens. Public routes: `/`, `/login`, `/register`, `/api/login`, `/api/register`.

**State:** Zustand (`hooks/use-auth.ts`) persists auth state to localStorage.

## Stack

- **Framework:** Next.js (App Router) + React 19 + TypeScript
- **UI:** Tailwind CSS 4 + Shadcn/Radix UI + Lucide icons + Recharts
- **Auth:** JWT (jose/jsonwebtoken) + bcrypt
- **ORM:** Prisma 7 with PostgreSQL (PrismaPg adapter)
- **Forms:** React Hook Form + Zod
- **API Docs:** next-swagger-doc (Swagger UI at `/api/swagger`)

## API Standards

### Response format (`/api-response-standard` skill)
- **Success:** Return data directly at root level — no `message` wrapper. HTTP status communicates success.
- **Login:** Exception — return `{ user: {...}, token: "..." }` since there are two distinct objects.
- **Errors:** Always `{ "error": "message" }` with appropriate 4xx/5xx status.

### Swagger documentation (`/swagger-route-standard` skill)
Every route handler must have a `@swagger` JSDoc block immediately before it. Use OpenAPI 3.0.0 format. Summaries and descriptions must be in **Portuguese**. Tags must match those defined in `lib/swagger.ts` (`Autenticação`, `Usuário`).

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     tags: [Autenticação]
 *     summary: Breve resumo em português
 *     requestBody: ...
 *     responses:
 *       200:
 *         description: Sucesso
 *       400:
 *         description: Erro de validação
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: Request) { ... }
```

## Database

- UUID primary keys on all models
- DB uses snake_case columns mapped to camelCase via Prisma `@map()`
- Address has a 1-to-1 relation with User (cascade delete)
- Brazilian-specific fields: CNPJ (unique), formatted addresses

## Environment

Required env vars in `fluxa-app/.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for signing JWT tokens
