# VictorOS — Backend Architecture Specification (Phase A)

## 1. Architecture Overview

VictorOS is a personal digital operating system and engineering showcase platform for Victor Kinyua. Phase A establishes the production-grade, strongly typed, modular backend foundation designed to power both the public VictorOS experience and the upcoming VictorOS Command Center.

### Tiered Request Flow

```text
┌─────────────────────────────────────────────────────────┐
│                    VictorOS UI Layer                    │
│   Public Portfolio Experience  │  Command Center (Next) │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP JSON / Server Actions
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Boundary Layer                        │
│      Route Handlers (Express / Next.js)                 │
│      createSafeAction (Validation, Auth, Error Trapping)│
└───────────────────────────┬─────────────────────────────┘
                            │ Validated Domain DTOs
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 Domain Service Layer                    │
│   ProjectService │ ArticleService │ LabService          │
│   KnowledgeService │ MediaService                       │
│   (Business Rules, Reading Times, Slugs, Permissions)  │
└───────────────────────────┬─────────────────────────────┘
                            │ Authorization Checks
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Authorization & Session Layer             │
│   getCurrentUser() │ getCurrentProfile()                │
│   canManageProjects() │ assertCanDelete()               │
└───────────────────────────┬─────────────────────────────┘
                            │ Domain Queries
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Repository Data-Access Layer              │
│   ProjectRepository │ ArticleRepository │ LabRepository │
│   KnowledgeRepository │ MediaRepository                 │
└───────────────────────────┬─────────────────────────────┘
                            │ Typed PostgreSQL Queries
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Supabase Database Engine                 │
│   PostgreSQL Schema │ Row Level Security (RLS)          │
│   Storage Buckets   │ Vector Search (pgvector)          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Supabase Client Architecture

To maintain strict security boundaries and prevent privilege escalation, VictorOS isolates Supabase clients into three dedicated contexts:

### 1. Browser Client (`src/lib/supabase/client.ts`)
- **Runtime Target**: Browser / Client Components.
- **Credentials**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Security Boundary**: Strictly subject to PostgreSQL Row Level Security (RLS) policies. Unauthenticated users cannot read draft or archived content.

### 2. Server Client (`src/lib/supabase/server.ts`)
- **Runtime Target**: Server Components, Express route handlers, and Server Actions.
- **Credentials**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Session Propagation**: Uses cookie stores or user access tokens (`Authorization: Bearer <jwt>`).
- **Security Boundary**: Executes within the caller's session context (`auth.uid()`). RLS policies are actively enforced on every query.

### 3. Service-Role Admin Client (`src/lib/supabase/admin.ts`)
- **Runtime Target**: Server-only internal workflows (machine-to-machine sync, system migrations, initial profile provisioning).
- **Credentials**: `SUPABASE_SERVICE_ROLE_KEY`.
- **Security Boundary**: **Completely bypasses Row Level Security**.
- **Guard**: Contains a runtime assertion `if (typeof window !== "undefined") throw new AppError(...)` that prevents the admin client from ever executing in a browser environment. It is never imported into UI components.

---

## 3. Environment Model (Public vs. Server-Only)

VictorOS enforces a strict environment boundary validated via Zod in `src/lib/shared/env.ts`:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser & Server | Supabase project API gateway endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser & Server | Safe public anonymous key (RLS enforced) |
| `APP_URL` | Public / Browser & Server | Base URL of the deployed application |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged admin key. Never exposed to browser |
| `GEMINI_API_KEY` | **Server-Only** | Server secret for Gemini AI system generation |

---

## 4. Authentication & Authorization Foundation

### Authentication vs. Authorization

* **Authentication ("Who are you?")**: Handled in `src/lib/auth/session.ts`. Verifies the user's Supabase identity token, resolving `auth.users` to an active session.
* **Authorization ("What are you permitted to do?")**: Handled in `src/lib/auth/authorization.ts`. Resolves the user's role from the `profiles` table and validates operational permissions. Authentication never implies authorization.

### Role Hierarchy (`src/lib/auth/roles.ts`)

VictorOS defines three standard system roles:

```text
       ┌──────────┐
       │  admin   │ (Weight: 30) - Full system control, role assignment, hard deletions
       └────┬─────┘
            │
       ┌────▼─────┐
       │  editor  │ (Weight: 20) - Content management (projects, articles, labs, media)
       └────┬─────┘
            │
       ┌────▼─────┐
       │  viewer  │ (Weight: 10) - Read-only access to published content
       └──────────┘
```

### Policy Rules
Permissions are defined declaratively without hardcoded emails or IDs:
- `canAccessCommandCenter(profile)`: `admin` and `editor`.
- `canManageProjects(profile)`: `admin` and `editor`.
- `canManageArticles(profile)`: `admin` and `editor`.
- `canManageLabs(profile)`: `admin` and `editor`.
- `canManageKnowledge(profile)`: `admin` and `editor`.
- `canManageMedia(profile)`: `admin` and `editor`.
- `canDeleteContent(profile)`: Strictly `admin`.

---

## 5. Domain Architecture: Separation of Concerns

Each domain (`projects`, `articles`, `labs`, `knowledge`, `media`) follows a strict 4-layer structure:

```text
src/lib/[domain]/
├── types.ts       # Domain DTOs and filtering interfaces
├── schemas.ts     # Zod validation schemas for all write and search boundaries
├── repository.ts  # Pure Supabase query execution & PostgreSQL error translation
└── service.ts     # Business logic, reading time computation, authorization assertions
```

### Responsibilities:
1. **Repository**:
   - Executes raw Supabase queries (`select`, `insert`, `update`, `delete`, pagination `range`).
   - Translates database errors into typed `DatabaseError` objects.
   - Contains zero business logic, authorization rules, or UI concerns.

2. **Service**:
   - Executes domain business rules (e.g. calculating reading time for articles, slug generation and conflict detection, assigning default statuses).
   - Enforces authorization assertions (`assertCanManageProjects`, `assertCanDelete`).
   - Restricts unauthenticated consumers to published items while allowing editors to view drafts.

3. **Route Handlers / Server Actions**:
   - Acts as the outer network protocol boundary (HTTP REST or Next.js Server Action).
   - Validates incoming parameters through Zod schemas.
   - Catches domain errors and formats standardized responses.

---

## 6. Error-Handling Architecture (`src/lib/shared/errors.ts`)

All errors inherit from a base `AppError` class containing status codes, machine-readable error codes, and operational flags:

| Error Class | Code | HTTP Status | Typical Cause |
| :--- | :--- | :--- | :--- |
| `AuthenticationError` | `UNAUTHENTICATED` | 401 | Missing or invalid user session |
| `AuthorizationError` | `FORBIDDEN` | 403 | Insufficient role permissions |
| `ValidationError` | `VALIDATION_ERROR` | 400 | Invalid payload rejected by Zod |
| `NotFoundError` | `NOT_FOUND` | 404 | Resource does not exist |
| `ConflictError` | `CONFLICT` | 409 | Duplicate slug or unique constraint |
| `DatabaseError` | `DATABASE_ERROR` | 500 | Failed SQL operation |
| `ExternalServiceError`| `EXTERNAL_SERVICE_ERROR`| 502 | Supabase Auth API or AI API error |

The `toSafeErrorResponse()` serializer converts any error into a safe JSON structure that never leaks database connection strings, credentials, or internal stack traces to the public web.

---

## 7. Structured Logging (`src/lib/shared/logger.ts`)

The backend logger outputs structured JSON entries with ISO 8601 timestamps and log level weighting (`debug`, `info`, `warn`, `error`).
- **Automated Credential Masking**: Automatically scans all logged payloads and redacts sensitive keys (`password`, `token`, `secret`, `authorization`, `service_role_key`, etc.) and JWT signatures.
- **Contextual Loggers**: Supports `.child({ domain: 'projects', requestId })` for tracing operations across domains.

---

## 8. Server Action Harness (`src/lib/actions/safeAction.ts`)

For upcoming Command Center workflows, `createSafeAction()` provides a declarative wrapper that guarantees:
1. Session resolution (`requireAuth: true`).
2. Role verification (`requireRole: ROLES.ADMIN`).
3. Zod input parsing.
4. Structured logging.
5. Error formatting without throwing unhandled promise rejections into UI components.

---

## 9. Future Command Center Readiness

Phase A directly prepares VictorOS for the Command Center:
- **Profiles & Roles**: Admin and Editor roles are modeled and enforced.
- **CRUD Services Ready**: `ProjectService`, `ArticleService`, `LabService`, `KnowledgeService`, and `MediaService` provide complete creation, update, and deletion methods.
- **Standardized API Endpoints**: Mounted at `/api/v1/*` (`/health`, `/projects`, `/articles`, `/labs`, `/knowledge`, `/auth/session`).
- **Zero Rework**: Future administrative dashboards will simply import the domain services or call the Server Action harness directly.
