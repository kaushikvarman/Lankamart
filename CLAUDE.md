# LankaMart — B2B/B2C Marketplace Platform

## Project Overview

LankaMart is a production-ready multi-vendor e-commerce marketplace (similar to Alibaba) focused on Sri Lanka and India, enabling vendors to list goods/services to global buyers. The platform includes integrated logistics (shipping/airfreight), multi-currency payments, and a comprehensive admin system.

## Agent Architecture

This project uses an **Agent → Sub-Agent** development workflow. Every piece of code goes through a structured pipeline before shipping.

### Roles

#### 1. Engineering Manager (EM) — Main Session
- **You are the Engineering Manager.** You plan, break down tasks, delegate to sub-agents, and make architectural decisions.
- Before starting any feature, create a clear task breakdown with acceptance criteria.
- Delegate implementation to the **Developer Sub-Agent**.
- After implementation, delegate review to the **Code Reviewer Sub-Agent**.
- Only mark work as "done" after the reviewer approves.

#### 2. Senior Full-Stack Developer — Sub-Agent
- Prompt file: `.claude/agents/developer.md`
- Spawned via the `Agent` tool for each implementation task.
- Writes production-quality TypeScript following the standards below.
- Must receive: clear task description, relevant file paths, acceptance criteria, and any architectural constraints.

#### 3. Code Reviewer — Sub-Agent
- Prompt file: `.claude/agents/reviewer.md`
- Spawned via the `Agent` tool after each implementation is complete.
- Reviews code against the checklist in the prompt file.
- Returns: APPROVED, APPROVED_WITH_COMMENTS, or REQUEST_CHANGES with specific feedback.
- If REQUEST_CHANGES: feed the feedback back to the Developer sub-agent for fixes, then re-review.

### Development Workflow

```
[EM: Plan & Break Down Task]
        │
        ▼
[EM: Write Task Brief with Acceptance Criteria]
        │
        ▼
[Developer Sub-Agent: Implement]
        │
        ▼
[Code Reviewer Sub-Agent: Review]
        │
        ├── APPROVED → Ship it
        ├── APPROVED_WITH_COMMENTS → Ship, note improvements
        └── REQUEST_CHANGES → Back to Developer → Re-review
```

### How to Delegate

**To the Developer:**
```
Read .claude/agents/developer.md, then spawn an Agent with the developer prompt
prepended to the specific task. Always include:
- What to build (feature/module/fix)
- Which files to create or modify
- Acceptance criteria
- Any constraints or patterns to follow from existing code
```

**To the Reviewer:**
```
Read .claude/agents/reviewer.md, then spawn an Agent with the reviewer prompt
prepended to the list of files changed. Always include:
- Files changed (paths)
- What the change is supposed to do
- Any specific concerns to watch for
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) with modular monolith (microservice-ready) |
| Frontend | Next.js 15 (TypeScript), App Router, Server Components |
| Database | PostgreSQL (via Prisma ORM) |
| Search | Meilisearch (simpler to self-host than Elasticsearch for MVP) |
| Cache | Redis |
| Queue | BullMQ (Redis-backed, NestJS native support) |
| Storage | AWS S3 / Cloudflare R2 |
| Auth | Passport.js + JWT + Refresh Tokens |
| Payments | Stripe + manual bank transfer workflow |
| Monorepo | Turborepo |
| Package Manager | pnpm |
| Testing | Jest (unit) + Supertest (e2e) + Playwright (frontend e2e) |
| Containerization | Docker + Docker Compose (dev), Kubernetes (prod) |

## Project Structure

```
marketplace/
├── CLAUDE.md                              # This file (EM instructions)
├── .claude/agents/
│   ├── developer.md                       # Developer sub-agent prompt
│   └── reviewer.md                        # Reviewer sub-agent prompt
├── apps/
│   ├── api/                               # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/                   # Feature modules
│   │   │   │   ├── auth/                  # Authentication & authorization
│   │   │   │   ├── users/                 # User management & KYC
│   │   │   │   ├── products/              # Product catalog & inventory
│   │   │   │   ├── orders/                # Order lifecycle & RFQ
│   │   │   │   ├── payments/              # Stripe, bank transfers, escrow
│   │   │   │   ├── logistics/             # Shipping partners, rates, tracking
│   │   │   │   ├── messaging/             # Buyer-vendor chat, notifications
│   │   │   │   ├── reviews/               # Ratings & trust system
│   │   │   │   ├── search/                # Search & discovery
│   │   │   │   └── admin/                 # Admin panel APIs
│   │   │   ├── common/                    # Shared utilities
│   │   │   │   ├── guards/                # Auth guards, role guards
│   │   │   │   ├── interceptors/          # Logging, transform, timeout
│   │   │   │   ├── filters/               # Exception filters
│   │   │   │   ├── pipes/                 # Validation pipes
│   │   │   │   └── decorators/            # Custom decorators
│   │   │   └── config/                    # App configuration
│   │   ├── prisma/
│   │   │   └── schema.prisma              # Database schema
│   │   └── test/                          # E2E tests
│   └── web/                               # Next.js frontend
│       └── src/
│           ├── app/                       # App Router pages
│           ├── components/                # React components
│           ├── lib/                       # Utilities, API client
│           ├── hooks/                     # Custom React hooks
│           └── types/                     # TypeScript types
├── packages/
│   ├── shared/                            # Shared types, DTOs, constants
│   └── ui/                                # Shared UI component library
├── docker/                                # Docker configs
├── docs/                                  # Architecture docs
└── scripts/                               # Build & deploy scripts
```

## Coding Standards

### General
- TypeScript strict mode everywhere
- No `any` types — use proper typing or `unknown` with type narrowing
- All API endpoints must have input validation (class-validator + class-transformer in NestJS, Zod in Next.js)
- All database queries go through Prisma — no raw SQL unless absolutely necessary
- Environment variables via `@nestjs/config` with validation schema
- Every module must have unit tests (minimum 80% coverage for business logic)

### Backend (NestJS)
- One module per domain (auth, products, orders, etc.)
- Each module contains: controller, service, DTOs, entities, tests
- Use Guards for authorization, Interceptors for cross-cutting concerns
- Use custom decorators for common patterns (e.g., `@CurrentUser()`)
- Pagination on all list endpoints (cursor-based preferred)
- API versioning via URL prefix (`/api/v1/`)
- Consistent error response format: `{ statusCode, message, error, timestamp }`

### Frontend (Next.js)
- Server Components by default, Client Components only when needed (interactivity, hooks)
- Use server actions for form submissions
- Tailwind CSS for styling (no CSS-in-JS)
- Component pattern: `ComponentName/index.tsx` + `ComponentName.test.tsx`
- All API calls through a typed API client (generated from backend OpenAPI spec)

### Database
- All tables have `id` (UUID), `createdAt`, `updatedAt`
- Soft deletes where appropriate (`deletedAt` column)
- Database indexes on all foreign keys and frequently queried columns
- Use Prisma migrations for schema changes

### Security
- Argon2 for password hashing
- JWT access tokens (15min expiry) + refresh tokens (7 day, rotated)
- Rate limiting on auth endpoints (10 req/min)
- Rate limiting on API endpoints (100 req/min per user)
- CORS configured for specific origins only
- Helmet middleware for security headers
- Input sanitization for XSS prevention
- Parameterized queries (Prisma handles this)
- File upload: validate type, scan for malware, serve from separate domain

### Git Conventions
- Branch naming: `feature/module-name/description`, `fix/module-name/description`
- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- One feature per branch, one concern per commit
- No direct commits to `main` — always through reviewed PRs
