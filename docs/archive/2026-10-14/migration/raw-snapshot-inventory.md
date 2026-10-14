> Tài liệu lịch sử, lưu để truy vết. Không dùng làm hướng dẫn hoặc bằng chứng cho bản hiện hành. Xem README của repository và docs hiện tại.

# Raw Snapshot Inventory — `archive/full-product-sandbox-ff026a3`

> **Purpose:** Machine-readable classification of every changed file family in the raw
> sandbox implementation, produced for the Next.js → NestJS / SQL Server migration.
> The raw snapshot is a **reference only**: business rules, API behavior, UI source,
> test expectations, AI schemas. It must NEVER be merged wholesale.
>
> - Archive ref: `archive/full-product-sandbox-ff026a3` = `ff026a3927e26a35897126fb36a2639c01889302`
> - Supplementary tip ref: `archive/full-product-sandbox-tip-327b0dc` = `327b0dc5da351aed4d93859ab3a650211d3a2ccf`
>   (adds only 2 `upload/*.txt` paste artifacts — no product code)
> - Base: `origin/main` = `5aa8ce6c79fb7ed6a0f0275192d7384cfc1ee9ac`
> - Diff: `1477 files changed, 298486 insertions(+), 9773 deletions(-)` (26 commits)
> - Historical chain: `git log --reverse origin/main..ff026a3` — 26 commits recorded, never rewritten

## 1. Summary counts

| Class          | Files (approx) | Verdict                                          |
| -------------- | -------------- | ------------------------------------------------ |
| KEEP / PORT    | ~250           | UI source, contracts, business-rule reference, valid tests, docs to update |
| DO NOT PORT    | ~1,200         | skills/** pollution, SQLite db, Next Route Handler APIs, server/** as production backend, upload artifacts |
| REVIEW         | ~30            | lib clients, prisma schema/seed, configs, docs   |

## 2. KEEP / PORT (reference for later milestones)

| Path (archive)                                | Count | Role in migration |
| --------------------------------------------- | ----- | ----------------- |
| `src/app/(auth)/**`                           | 4     | Approved auth screens (login/register/forgot) |
| `src/app/admin/**`                            | 11    | Approved Admin workspace pages |
| `src/app/instructor/**`                       | 11    | Approved Instructor workspace pages |
| `src/app/intern/**`                           | 16    | Approved Intern workspace pages (waiting/active) |
| `src/app/verify/**`                           | 1     | Public certificate verification page |
| `src/components/**`                           | 186   | Reusable visual primitives, charts, tables, shells |
| `src/lib/utils.ts`, `src/lib/csv.ts`, `src/lib/velocity*.ts` | ~6 | Pure helpers (framework-free) |
| `src/server/lib/__tests__/*.test.ts`          | 3     | csv / velocity / velocity-week unit tests — port to BE or FE |
| `src/server/modules/certificates/__tests__`   | 1     | verify-public test expectations |
| `src/server/modules/notifications/__tests__`  | 1     | preference-filter test expectations |
| AI prompts/scoring in `src/server/lib/ai/provider.ts`, `modules/ai/mentor-service.ts` | 2 | AI contract reference (keys must come from env in Nest) |
| Business-rule bodies of `src/server/modules/**/service.ts` | 26 | **Specification only** — reimplement in Nest services, never copy SQLite/Prisma assumptions |
| `docs/architecture/domain-model.md`, `docs/api/README.md`, `docs/database/SQLSERVER2019_SETUP.md`, `docs/DEVELOPMENT.md` | 4 | Rewritten per milestone (content = design intent) |

## 3. DO NOT PORT

| Path (archive)                  | Count | Reason |
| ------------------------------- | ----- | ------ |
| `skills/**`                     | ~1,076 | Sandbox tooling pollution — not application product files |
| `db/vintern.db`                 | 1     | SQLite binary — production DB is SQL Server 2019 |
| `src/app/api/v1/**`             | 81    | Next.js Route Handler business APIs — forbidden in target architecture; behavior reference only |
| `src/server/**` (as production) | 38    | Replaced by NestJS backend; keep only as business-rule spec |
| `upload/**`                     | 12    | Pasted-content artifacts, not product files |
| SQLite-specific config in `prisma/schema.prisma` (`provider = "sqlite"`, `url = "file:./dev.db"`) | — | SQL Server provider + migrations instead |
| `prisma/seed.ts` records        | 1     | Do not port SQLite demo records; replaced by idempotent dev seed in BE |
| worklog-only commits content    | —     | Process noise, excluded from product branches |
| `vitest.setup.ts`/`vitest.config.ts`/`eslint.config.mjs` sandbox tuning | 3 | Re-evaluate per target repo conventions |

## 4. REVIEW (decide during port)

| Path (archive)                    | Question |
| --------------------------------- | -------- |
| `src/lib/api/client.ts`, `use-api.ts` | Keep as FE API layer; must target `NEXT_PUBLIC_API_BASE_URL` (external Nest) instead of Next Route Handlers |
| `src/lib/auth/api-client.ts`, `auth-service.ts`, `session.ts`, `role-landing.ts`, `validation.ts` | Auth client must send credentials to Nest (`credentials: include` for refresh cookie); preserve role-landing map |
| `package.json` / `package-lock.json` | Do not copy dependency set wholesale; FE keeps UI deps, BE gets Nest deps |
| `prisma/schema.prisma` (43 models) | **Domain reference only** — see model list below |
| `next.config.ts`, `tsconfig.json`  | Merge-forward carefully; do not reintroduce sandbox paths |

## 5. Prisma 43-model domain reference (from `prisma/schema.prisma`)

Identity/RBAC: `User, Role, Permission, UserRole, RolePermission, UserGroup, GroupMember, GroupRole, RefreshToken`
System: `CatalogType, CatalogItem, SystemSetting, AuditLog, ActivityEvent`
Academic: `Class, ClassMember, InternshipSession, SessionInstructor, SessionMember, SessionMilestone`
Project/Sprint/Task: `Project, ProjectTemplate, ProjectMember, Sprint, Task, TaskComment, TaskStatusHistory, Assignment`
Recruitment: `RecruitmentProfile, InterviewQuestion, InterviewAnswer`
Evaluation: `Evaluation`
KPI/Salary/Certificates: `KpiPeriod, KpiMetric, KpiEntry, VirtualSalaryTransaction, Certificate`
Notifications: `Notification, NotificationPreference`
AI: `AIRun, AIMentorConversation, AIMentorMessage`
Reporting: `VelocitySnapshot`

> Phase 1 (NestJS platform core) implements only: Users, Roles, Permissions, UserRoles,
> RolePermissions, UserGroups, GroupMembers, GroupRoles, RefreshTokens, CatalogTypes,
> CatalogItems, SystemSettings, AuditLogs, ActivityEvents, Notifications,
> NotificationPreferences. All other domains are **PLANNED — NOT IMPLEMENTED YET**.

## 6. Known defects in raw snapshot (fix during later ports — do not reproduce)

1. `GET /api/v1/recruitment/questions` unauthenticated → must require auth when Recruitment is ported.
2. Onboarding mock identity (preview params) → never port; identity comes from Nest auth.
3. Dead `/admin/logs` sidebar link → correct target when porting Admin shell.
4. Certificate revoke service existed without a route → add route in its milestone.
5. Pagination varied by endpoint → single `{ data, meta: { page, pageSize, total, totalPages } }` contract.
6. Refresh-token rotation without family/reuse detection → improved in Nest auth (Phase 1).

## 7. Preservation pointers

- Local branches: `archive/full-product-sandbox-ff026a3`, `archive/full-product-sandbox-tip-327b0dc`
- Remote push: **BLOCKED** (no credentials in sandbox; read-only clone) — see final report
- Git bundles (verified, complete history):
  - `/home/z/backups/V-Intern-full-product-ff026a3.bundle`
  - `/home/z/backups/V-Intern-full-product-tip-327b0dc.bundle`
- Forensic evidence: `/tmp/v-intern-forensics/diff-stat-327b0dc.txt`, `diff-name-status-327b0dc.txt`
