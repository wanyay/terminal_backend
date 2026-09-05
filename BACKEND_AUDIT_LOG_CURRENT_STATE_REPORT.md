# TPMS Backend — Audit Log Current State Report

**Date:** 2026-09-03
**Scope:** Audit Logging system in the TPMS backend (`/home/wanyay/Code/terminal/backend`)
**Type:** Read-only audit. No source code was modified.

---

## 1. Executive Summary

The TPMS backend has the **scaffolding** for an Audit Logging system but **does not actually record any audit events**. Specifically:

- An `audit_logs` table exists in the migration with all the fields defined in AGENTS.md (user ID, username, action, module, timestamp, IP, user agent, old/new values).
- An `AuditLogsModule`, `AuditLogsService` (with a `log()` method), and an `AuditLogsController` (3 read endpoints) exist.
- **However, `AuditLogsService.log()` is never called by any business logic, authentication, or controller in the entire codebase.**

This means:

| Requirement (AGENTS.md) | Status |
|---|---|
| Audit table + fields | ✅ Scaffolded in migration/entity |
| Login / Logout auditing | ❌ Not implemented |
| Create / Update / Delete auditing | ❌ Not implemented (only `created_by`/`updated_by`/`deleted_by` audit-columns autopopulated) |
| Approve Record auditing | ❌ N/A — no approve flow exists |
| Export Report auditing | ❌ Not implemented |
| IP Address / User Agent capture | ❌ Not implemented |
| View API for audit logs | ✅ Implemented (read-only) |
| Pagination / Search / Sorting | ✅ Implemented; filtering minimal |
| RBAC/Permission on view API | ✅ Implemented |
| Soft-delete / retention | ⚠️ Partial (entity has soft-delete columns; no retention job) |
| Tests | ⚠️ Read-endpoint only; no write-path verification |

**Central conclusion:** The backend is **NOT currently ready** to power an Audit Logs UI for Admin and Supervisor roles, because although the read API and authorization exist and would render data, the data pipeline that produces audit records is empty — the UI would show an empty table. See Section 12 for the full readiness verdict.

---

## 2. Current Audit Log Architecture

### 2.1 Components

| Component | File | Purpose |
|---|---|---|
| Entity | `src/modules/audit-logs/entities/audit-log.entity.ts` | ORM model for `audit_logs` |
| Service | `src/modules/audit-logs/audit-logs.service.ts` | Read queries + `log()` write method |
| Controller | `src/modules/audit-logs/audit-logs.controller.ts` | 3 read endpoints |
| Module | `src/modules/audit-logs/audit-logs.module.ts` | Wires service + controller; exports service |
| AuditSubscriber | `src/core/database/subscribers/audit.subscriber.ts` | Auto-fills `created_by`/`updated_by`/`deleted_by` only |
| RequestContext | `src/shared/context/request-context.ts` | AsyncLocalStorage holding `userId`/`username` |
| Middleware | `src/shared/middleware/request-context.middleware.ts` | Initializes empty context per request |
| JwtStrategy | `src/shared/strategies/jwt.strategy.ts` | Sets `userId`/`username` into context |

### 2.2 Architecture type

- **Read path:** Centralized via the audit-logs module.
- **Write path:** Exists as a `log()` method on `AuditLogsService`, exported for DI, but **is not wired into any consumer** — it is effectively dead code. Auditing is neither centralized (no interceptor/middleware/subscriber that writes audit rows) nor duplicated (nothing audits at all).

### 2.3 How the pieces would be meant to fit (intended flow, not realized)

```
Action (controller) → AuditLogsService.log() → audit_logs table → API GET /api/v1/audit-logs → RBAC guard
```

The `AuditLogsService.log()` method is the intended single write point, but **nothing calls it**.

---

## 3. Database / Data Model

### 3.1 Table schema (from migration)

`src/core/database/migrations/1782382000000-InitialMigration.ts:188-208`

```sql
CREATE TABLE `audit_logs` (
  `id`          varchar(36) NOT NULL,          -- UUID PK
  `created_at`  datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`  datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE,
  `deleted_at`  datetime(6) NULL,              -- soft delete
  `created_by`  varchar(255) NULL,
  `updated_by`  varchar(255) NULL,
  `deleted_by`  varchar(255) NULL,
  `user_id`     varchar(255) NULL,
  `username`    varchar(255) NULL,
  `action`      varchar(255) NOT NULL,
  `module`      varchar(255) NOT NULL,
  `ip_address`  varchar(255) NULL,
  `user_agent`  text NULL,
  `old_values`  text NULL,
  `new_values`  text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB
```

### 3.2 Entity mapping

`src/modules/audit-logs/entities/audit-log.entity.ts`

- Extends `BaseEntity` (`src/core/database/entities/base.entity.ts`), inheriting `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy`.
- `oldValues` / `newValues` stored as `text` with a JSON transformer (`audit-log.entity.ts:24-44`).

### 3.3 Relationships

- **No ORM relations/FKs** to `users` (user_id is a plain nullable `varchar`, no foreign key constraint on `audit_logs.user_id`).
- The table only has a primary key; **no secondary indexes** (critical — see Section 8).

### 3.4 Finding summary (model)

| Severity | Finding |
|---|---|
| P1 | No indexes on `audit_logs` for the common query columns (`action`, `module`, `username`, `user_id`, `created_at`). The list endpoint defaults to `ORDER BY created_at` and filters by these columns unscanned except by full table scan. |
| P3 | `user_id` is not a FK and is `varchar(255)` while `users.id` is `varchar(36)` — no referential integrity; orphaned user references possible. |

---

## 4. Audited Actions

### 4.1 What is actually audited

**Nothing user-actionable is written to `audit_logs`.** Verified by:
- `grep` for `AuditLogsService` / `CreateAuditLogData` / `.log(` across `src` — the only references are within the audit-logs module itself (controller read + index barrel) and the module import in `app.module.ts`.
- Business modules (`trucks`, `vehicles`, `visitors`, `users`, `gates`, `blacklist`, `dashboard`, `roles`) contain **zero** references to auditing.

### 4.2 The AuditSubscriber's actual role

`src/core/database/subscribers/audit.subscriber.ts` is a TypeORM `EventSubscriber` that only:
- `beforeInsert` → sets `createdBy`/`updatedBy`
- `beforeUpdate` → sets `updatedBy`
- `beforeSoftRemove` → sets `deletedBy`

It does **NOT** insert a row into `audit_logs`. It populates the entity's own audit columns (`created_by` etc.), which are conceptually distinct from the `audit_logs` table.

### 4.3 Requirement-by-requirement status

| AGENTS.md example action | Implemented? | Evidence |
|---|---|---|
| Login | ❌ | `src/modules/auth/auth.service.ts:51-70` — no audit call |
| Logout | ❌ | `src/modules/auth/auth.service.ts:118-120` — only clears refresh token |
| Create Record | ❌ | e.g. `trucks.service.ts`, `vehicles.service.ts`, `visitors.service.ts` — no audit call |
| Update Record | ❌ | Same services — no audit call |
| Delete Record | ❌ | Same services — no audit call (only `softRemove` + subscriber sets `deletedBy`) |
| Approve Record | ❌ | No approve workflow exists in the backend |
| Export Report | ❌ | Trucks `export` endpoint (`trucks.controller.ts:83-112`) returns Excel with no audit; vehicles/visitors `exportToExcel` service methods have **no controller route at all** |

### 4.4 Detail: Export disparity

- Trucks exposes `GET /api/v1/trucks/export` (`trucks.controller.ts:83`).
- Vehicles/visitors define `exportToExcel()` in their services but **no corresponding controller route** exists (`vehicles.controller.ts`, `visitors.controller.ts` only have `GET /`, `GET /active`, `GET /:id`).
- None of the export paths log an audit entry even though "Export Report" is an AGENTS.md audit example.

---

## 5. API Endpoints

`src/modules/audit-logs/audit-logs.controller.ts` — all routes under `@Controller({ path: 'audit-logs', version: '1' })` → `GET /api/v1/audit-logs`.

| Method | Route | Description | Guarded |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | Paginated list (search + sort) | ✅ Roles + Permissions |
| GET | `/api/v1/audit-logs/user/:userId` | Filter by user (UUID) | ✅ Roles + Permissions |
| GET | `/api/v1/audit-logs/module/:module` | Filter by module | ✅ Roles + Permissions |

### 5.1 Pagination / Search / Filtering / Sorting

`src/modules/audit-logs/audit-logs.service.ts`

- **Pagination ✅** — via shared `paginate()` helper (`src/shared/helpers/paginate.ts`): `page`, `perPage`, `total`, `totalPages`.
- **Search ✅** — `searchableFields: ['action', 'module', 'username']` (LIKE `%term%`).
- **Sorting ✅** — `sortBy` + `sortOrder`; default `createdAt DESC` (from `PaginationQueryDto`).
- **Filtering ❌ (minimal)** — Only available by the dedicated `/user/:userId` and `/module/:module` routes. There is **no generic filtering by date range, action type, or user_id** on the main list endpoint. `PaginationQueryDto` (`src/shared/dto/pagination-query.dto.ts`) contains only `page`, `perPage`, `search`, `sortBy`, `sortOrder`.

### 5.2 Consistency with AGENTS.md API standards

The response format (via `TransformInterceptor`) follows `success/message/data/meta` ✅. The list endpoint path does not match the requirement that "All listing APIs must support filtering" — filtering is incomplete (only search).

---

## 6. Authorization / Permissions

### 6.1 Guards in place

`audit-logs.controller.ts:29` → class-level `@UseGuards(JwtAuthGuard)`, plus per-route `@UseGuards(RolesGuard, PermissionsGuard)`.

- `JwtAuthGuard` — authentication (passport-jwt, `jwt.strategy.ts`).
- `RolesGuard` — `@Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)` (route-level).
- `PermissionsGuard` — `@Permissions(Permission.VIEW_AUDIT_LOGS)` (route-level).

Both guards use AND-semantics (all guards must pass): user must have **SUPER_ADMIN or SUPERVISOR** role (RolesGuard `some`) **and** the `VIEW_AUDIT_LOGS` permission (PermissionsGuard `every`).

### 6.2 Permission seeding

`src/modules/roles/enums/permission.enum.ts:22` defines `VIEW_AUDIT_LOGS`.
`src/modules/roles/roles.service.ts`:
- `SUPER_ADMIN` gets **all** permissions, including `VIEW_AUDIT_LOGS` (`roles.service.ts:40`).
- `SUPERVISOR` gets `VIEW_AUDIT_LOGS` (`roles.service.ts:65`).
- `SECURITY_OFFICER` and `USER` do **not** get it.

### 6.3 Can ADMIN and SUPERVISOR view audit logs?

- **Yes.** Both can view (role requirement + permission requirement both satisfied for these two seeded roles).

### 6.4 Runtime permission resolution

`src/shared/strategies/jwt.strategy.ts:39-49` — permissions are flattened from `user.roles[].permissions[].name` into `request.user.permissions`, which is what `PermissionsGuard` checks. This depends on `UsersService.findOne` eagerly loading `roles.permissions` (verified via strategy usage).

### 6.5 Finding

| Severity | Finding |
|---|---|
| Info | Authorization is correctly implemented for read access; Admin and Supervisor can view. No role/permission currently has *write* audit control (there is no write API anyway). |

---

## 7. Security Findings

### 7.1 Audit write pipeline missing (P0)

- **Evidence:** No call site for `AuditLogsService.log()` anywhere in `src` (verified via grep across all business modules + auth). `app.module.ts:47` imports the module but nothing consumes the exported service.
- **Problem:** No actions are recorded, so audit logs are always empty in practice.
- **Impact:** Complete absence of accountability. Login, logout, create/update/delete, and export activity is silently unrecorded. Defeats the entire audit-logging and compliance purpose.
- **Recommendation:** Inject `AuditLogsService` (and IP/agent) into the relevant services (auth, trucks, vehicles, visitors, users, gates, blacklist, export) and call `.log()` after successful operations. Prefer a single interceptor/decorator for centralized, consistent capture.

### 7.2 Login / Logout not audited (P0)

- **Evidence:** `auth.service.ts:51-70` (`login`), `auth.service.ts:118-120` (`logout`). No audit call and no IP/UA capture.
- **Problem:** AGENTS.md explicitly lists Login and Logout as audited actions.
- **Impact:** No record of who accessed the system, from where, or at what time — the most basic security-accountability requirement.
- **Recommendation:** Audit successful (and ideally failed) login attempts and logouts, capturing IP address and user agent.

### 7.3 Export Report not audited (P1)

- **Evidence:** `trucks.controller.ts:83-112` returns Excel with no audit. Vehicles/visitors export service methods (`vehicles.service.ts:189`, `visitors.service.ts:185`) have no route.
- **Problem:** Sensitive data export is an auditable event per AGENTS.md; it is unrecorded; export paths are inconsistent across modules.
- **Recommendation:** Audit every export (and standardize export routes for all three modules).

### 7.4 IP Address / User Agent never captured (P1)

- **Evidence:** `request-context.middleware.ts:8` runs `requestContext.run({}, ...)` — initializes context with **no IP/agent**. `request-context.ts` only stores `userId`/`username` (no IP/agent fields). No code populates `ip_address`/`user_agent` columns.
- **Problem:** `ip_address` and `user_agent` columns exist but will always be NULL.
- **Impact:** Cannot attribute activity to a source IP or device; weaker forensic/regulatory value.
- **Recommendation:** Extend `RequestContext` to capture IP + user agent from the request, wire them into audit writes.

### 7.5 Sensitive data exposure in old/new values (P2)

- **Problem:** If implemented naively, `old_values`/`new_values` could persist sensitive fields (e.g., passwords, NRC/passport, refresh tokens). The write pipeline does not exist yet, so this is a forward-looking risk.
- **Recommendation:** Whitelist fields to be audited and redact secrets (never store password hashes, refresh tokens, or full NRC/passport in audit JSON).

### 7.6 No sensitive-field redaction / no PII minimization (P3)

- See 7.5; combine into redaction recommendation.

---

## 8. Performance Findings

### 8.1 No indexes on audit_logs (P1)

- **Evidence:** Migration `1782382000000-InitialMigration.ts:188-208` defines only `PRIMARY KEY (id)` on `audit_logs`. No index on `user_id`, `username`, `action`, `module`, or `created_at`.
- **Problem:** `paginate()` on audit logs does `ORDER BY entity.created_at` (default) plus optional search on `action/module/username` and filtering. With any volume, every query becomes a full table scan + filesort on an append-only high-velocity table.
- **Impact:** Audit log UI (default list, user filter, module filter) degrades quickly as rows accumulate; risks database load under heavy traffic (every Create/Update/Delete/Login would insert).
- **Recommendation:** Add indexes: `(created_at DESC)`, `(module)`, `(username)`, `(user_id)`, and a composite where useful for the common search/filter paths.

### 8.2 Write amplification when implemented (P2)

- **Problem:** No batching/queueing for audit writes is designed. High-frequency operations (entries/exits) would each add a synchronous insert.
- **Recommendation:** Consider asynchronous/batched audit writes with a retry/dead-letter strategy and a separate write path that doesn't block business transactions.

### 8.3 No retention / archival strategy (P2)

- **Evidence:** No `@nestjs/schedule`, `Cron`, or cleanup job in `src` (grep found none). `audit_logs` has no retention policy.
- **Problem:** Table grows unboundedly; older logs consume storage and degrade query performance.
- **Recommendation:** Implement retention (e.g., daily purge/archive of logs older than N months) with configurable retention period.

---

## 9. Testing Status

### 9.1 Existing tests

`test/audit-logs.e2e-spec.ts` — 4 tests, all read-only:
1. `GET /api/v1/audit-logs` — asserts 200 + shape.
2. `GET /api/v1/audit-logs?search=login` — asserts 200.
3. `GET /api/v1/audit-logs/user/:userId` — asserts 200.
4. `GET /api/v1/audit-logs/module/:module` — asserts 200.

### 9.2 Gaps

| Severity | Finding |
|---|---|
| P1 | **No test verifies that an audit record is actually created** by login, CRUD, or export. Tests only assert the read endpoints return 200 — they would pass even if the write pipeline produced zero rows. The `search=login` test in particular implies logging that doesn't happen. |
| P2 | No authorization-negative tests (that SECURITY_OFFICER/ USER / unauthenticated cannot view audit logs). |
| P3 | No test for `old_values`/`new_values` serialization or redaction. |
| P3 | No test for pagination boundaries/sorting on audit logs specifically. |

---

## 10. AGENTS.md Compliance

| Requirement | Status |
|---|---|
| Table exists with required fields (User ID, Username, Action, Module, Timestamp, IP, User Agent, Old/New Values) | ✅ Schema |
| Login audited | ❌ |
| Logout audited | ❌ |
| Create/Update/Delete audited | ❌ |
| Approve Record audited | ❌ (no flow) |
| Export Report audited | ❌ |
| IP Address stored | ❌ (column only) |
| User Agent stored | ❌ (column only) |
| View API | ✅ |
| Pagination / Search / Sorting on list | ✅ |
| Filtering on list (date/action/user) | ❌ (partial — only /user & /module routes) |
| RBAC + permission on view | ✅ |
| Soft-delete columns | ✅ (BaseEntity) |
| Retention behavior | ❌ |
| Tests for logging | ❌ (read-only) |

---

## 11. Missing / Incomplete Requirements

1. **Write pipeline absent** — no action invokes `AuditLogsService.log()` (P0).
2. **Login/logout auditing** absent (P0).
3. **CRUD auditing** absent (P1).
4. **Export auditing** absent + inconsistent export routes (P1).
5. **IP + User Agent capture** absent — columns never populated (P1).
6. **Indices on audit_logs** missing (P1).
7. **Generic filtering** (date range, action, user) missing on the main list endpoint (P2).
8. **Retention/archival/purge** absent (P2).
9. **Sensitive-field redaction** not designed/implemented (P2).
10. **Tests for the write path and authorization negatives** missing (P1/P2).
11. **Foreign-key integrity** between `audit_logs.user_id` and `users.id` absent (P3).
12. **Approve Record** workflow does not exist (N/A but listed in AGENTS.md).

---

## 12. Recommended Next Steps

### 12.1 Is the backend ready for an Admin/Supervisor Audit Logs UI?

**Not yet.** The read API and authorization are complete and correct — an Admin or Supervisor *could* open the Audit Logs pages and the endpoints would return a properly-shaped, paginated response. **However, the underlying `audit_logs` table will always be empty** because no part of the system writes audit records. A UI built today would render an empty table and provide no value, and the `search=login` example would return nothing.

### 12.2 Priority-ordered recommendations

1. **(P0) Wire the audit write pipeline.** Inject `AuditLogsService` into `AuthService` and the business services (trucks, vehicles, visitors, users, gates, blacklist) and call `.log()` on successful create/update/delete/login/logout/export. Capture module and action consistently.
2. **(P1) Capture IP + User Agent.** Extend `RequestContext` (and the middleware/JWT strategy) to carry `ipAddress` and `userAgent`; populate them on every audit write.
3. **(P1) Add database indexes** to `audit_logs` on `(created_at)`, `(module)`, `(username)`, `(user_id)`.
4. **(P1) Standardize + audit export.** Add export routes to vehicles and visitors (mirroring trucks) and audit all exports.
5. **(P2) Add generic filtering** (date range, action, user) to the audit list endpoint via a dedicated query DTO.
6. **(P2) Implement redaction** for old/new values (exclude passwords, refresh tokens, full NRC/passport) before persisting.
7. **(P2) Add retention/archival** (scheduled purge of logs older than N months).
8. **(P1) Expand tests** to assert audit rows are created end-to-end (login, CRUD, export), include authorization-negative cases, and verify redaction + serialization.

---

## Appendix — Key Files Reviewed

- `src/modules/audit-logs/audit-logs.controller.ts`
- `src/modules/audit-logs/audit-logs.service.ts`
- `src/modules/audit-logs/audit-logs.module.ts`
- `src/modules/audit-logs/entities/audit-log.entity.ts`
- `src/modules/audit-logs/index.ts`
- `src/core/database/subscribers/audit.subscriber.ts`
- `src/core/database/entities/base.entity.ts`
- `src/core/database/database.module.ts`
- `src/core/database/migrations/1782382000000-InitialMigration.ts`
- `src/modules/roles/roles.service.ts`
- `src/modules/roles/enums/permission.enum.ts`
- `src/modules/roles/enums/role.enum.ts`
- `src/modules/auth/auth.service.ts`, `auth.controller.ts`
- `src/shared/strategies/jwt.strategy.ts`
- `src/shared/context/request-context.ts`
- `src/shared/middleware/request-context.middleware.ts`
- `src/shared/guards/roles.guard.ts`, `permissions.guard.ts`
- `src/shared/helpers/paginate.ts`
- `src/shared/dto/pagination-query.dto.ts`
- `src/app.module.ts`
- `test/audit-logs.e2e-spec.ts`
- `src/modules/{trucks,vehicles,visitors}/*.controller.ts`, `*.service.ts`
