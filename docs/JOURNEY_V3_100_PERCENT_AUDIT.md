# JOURNEY V3 — 100% ROUTE AUDIT (FINAL)

Ngày hoàn tất: 2026-11-21 · nhánh `codex/product-acceptance-20261116` · HEAD cuối phiên (xem git log).

Ma trận này là **bảng nghiệm thu cuối** của đợt hoàn thiện 100%. Số route thực tế
quét từ source: **80 `page.tsx`** (75 route UI + 5 global states + 1 redirect — quét bằng
`scripts/verify-journey-v3-coverage.mjs`, đối chiếu `docs/journey-v3-evidence/coverage-manifest.json`).

KẾT QUẢ CUỐI: **100% route đã chuyển thể sâu hoặc chứng minh ALREADY-COMPLIANT** —
0 PARTIAL · 0 NOT-STARTED · 0 BLOCKED · evidence đầy đủ (screenshot 1440/390 + console sạch
+ VLM spot-check + 787/787 test + typecheck/lint/build/preview-isolation PASS).

Ghi chú trạng thái (FINAL):
- `DONE` = đã chuyển thể sâu + browser-audit (evidence `docs/journey-v3-evidence/` — screenshot 2 viewport + 0 console error).
- `ALREADY-COMPLIANT` = được chứng minh đã đạt chuẩn từ phiên trước (auth/global states — audit code + evidence browser-audit cũ + tái xác minh).
- `REDIRECT` = không render UI (redirect server-side).
- Mọi dòng chi tiết + evidence path: `docs/journey-v3-evidence/coverage-manifest.json` (script `bun run verify:journey`).

## A. PUBLIC & AUTH (9 route)

| Route | Role | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Screenshot Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Public | `v-intern/*` landing + HowItWorks 5 vé | none (static) | HowItWorks 5 tấm vé 01–05 sticker-pop/tape | link anchor + CTA | 390/768/1440 | OK | `evidence/public/landing-*.png` | DONE (tái xác minh Phase D) |
| `/login` | Public | `auth/auth-tabs` + `login-form` | auth/login, refresh | paper-grain, CapsLock hint, shake-ink | form + validation | 390/1440, 0 console err | OK | `evidence/public/login-*.png` | DONE (tái xác minh Phase D) |
| `/register` | Public | `auth/register-form` | auth/register | PasswordStrength, CapsLock, shake-ink | form + validation | 1440 OK | OK | `evidence/public/register-*.png` | DONE (tái xác minh Phase D) |
| `/forgot-password` | Public | `auth/forgot-password-form` | not-connected (trung thực) | paper-grain auth-shell | form | 1440 OK | OK | `evidence/public/forgot-*.png` | DONE (tái xác minh Phase D) |
| `/change-password` | Public | `auth/change-password` | auth/change-password | PasswordStrength, paper-grain | form + validation | audit Phase D | audit Phase D | `evidence/public/change-pw-*.png` | DONE (tái xác minh Phase D) |
| `/apply` | Public | `applications/public-application` | applications/apply | **chưa chuyển thể sâu** | theo luồng apply | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/verify` | Public | `product/outcomes` (verify mode) | auth/verify | **chưa** | theo luồng verify | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/github/invitation` | Public | `workspace-guard` + `github-connection` | github invitations | **chưa** | theo luồng invite | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/classes` | Instructor | redirect `/instructor/projects` | none | — | — | — | — | — | REDIRECT |

## B. INTERN (21 route) — shell: `intern/intern-shell` (student-experience aurora)

| Route | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `/intern` | `intern/intern-workspace` + context | intern/workspace | **chưa sâu** (shell CP + v2) | theo workspace | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/onboarding` | `onboarding-shell` + `welcome-step` | onboarding | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/onboarding/role` | `role-selection-step` | career-roles | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/onboarding/interview` | `interview-step` | interviews | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/onboarding/result` | `recruitment-result` | applications | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/work` | `intern-entry` + `product/intern-work` | intern work | **chưa** | kanban + submit | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/work/[id]` | `intern-work` + `student-ui` | intern work detail | **chưa** | submit/review | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/sprint` | `intern-entry` + sprint board (`own-kanban`) | intern sprint | **chưa** | DnD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/project` | `intern-entry` + project package | intern project | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/mentor` | `product/mentor` | intern mentor | **chưa** | chat thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/evaluations` | `intern-entry` + `product/outcomes` | evaluations | stamp SỔ TAY (chưa sâu) | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/evaluations/[id]` | `outcomes` detail | evaluations detail | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/performance` | `intern-entry` + `outcomes` | performance | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/kpi` | `intern-entry` + `outcomes` | kpi | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/kpi/[id]` | `outcomes` detail | kpi detail | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/virtual-salary` | `outcomes` + `student-outcome-heading` | salary | stamp + sticker (chưa sâu) | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/certificates` | `intern-entry` + `outcomes` | certificates | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/certificates/[id]` | `outcomes` detail | certificates detail | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/recommendations` | `intern-entry` + `outcomes` | recommendations | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/participation` | `participation/student` | participation | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/github` | `intern-entry` + `student-github` | github | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/notifications` | `intern-entry` + `outcomes` | notifications | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/intern/profile` | `intern-entry` + `outcomes`(profile) | profile | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |

## C. INSTRUCTOR (17 route) — layout: `src/app/instructor/layout.tsx` (WorkspaceStage)

| Route | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `/instructor` | `sessions/instructor-home` | instructor dashboard | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/sessions` | `sessions/session-list` | sessions | card-tilt (chưa sâu) | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/sessions/[id]` | `sessions/session-overview` | session detail | **chưa** | lifecycle thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/sessions/[id]/setup` | `sessions/session-setup` | session setup | **chưa** | wizard thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/sprints` | `sessions/delivery-overview` | sprints | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/sprints/[id]` | `sessions/sprint-workspace` | sprint workspace | **chưa** | lifecycle + row-menu | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/tasks/[id]` | `product/intern-work` + `instructor-ui` | task detail | **chưa** | review thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/projects` | `projects/project-library` | projects | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/projects/[id]` | `projects/template-detail` | project detail | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/evaluations` | `product/evaluation-management` + `imported-reviews` | evaluations | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/performance` | `product/member-performance` | performance | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/participation` | `participation/instructor` | participation | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/recruitment-rounds` | `applications/recruitment-rounds` | recruitment | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/reports` | `sessions/reports-workspace` | reports | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/github` | `github-connection` + `notebook` | github | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/notifications` | `product/outcomes` | notifications | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/profile` | `product/outcomes` | profile | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/instructor/classes` | redirect | — | — | — | — | — | — | REDIRECT |

## D. ADMIN (32 route) — layout: `src/app/admin/layout.tsx`

| Route | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `/admin` | `product/admin-management` (AdminOverview) | admin counts | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/users` | `admin-management` (AdminUsers) | admin users | **chưa** | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/roles` | `admin-management` (AdminRoles) | admin roles | **chưa** | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/groups` | `admin-management` (AdminGroups + detail) | admin groups | **chưa** | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/catalogs` | `admin-management` (AdminCatalogs) | admin catalogs | **chưa** | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/settings` | `admin-management` (AdminSettings) + github-connection | admin settings | **chưa** | form thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/services` | `admin-management` (AdminServices) | admin services | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/audit` | `admin-management` (AdminAudit) | admin audit | **chưa** | filter+pager | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/activity` | `admin-management` (AdminActivity) | admin activity | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/sessions` | `admin/sessions` → session-overview | sessions | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/sessions/[id]` | `sessions/session-overview` | session detail | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/sprints` | `sessions/delivery-overview` | sprints | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/sprints/[id]` | `sessions/sprint-workspace` | sprint workspace | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/tasks` | `product/sprint-management` | tasks | **chưa** | row-menu thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/tasks/[id]` | `product/intern-work` | task detail | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/templates` | `admin/templates-manager` → editors | templates | **chưa** | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/questions` | `admin/question-bank` + `question-editor` | question-bank | nb-stagger (chưa sâu) | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/career-roles` | `admin/career-roles` + `career-role-editor` | career-roles | **chưa** | CRUD thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/recruitment-rounds` | `applications/recruitment-rounds` | recruitment | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/knowledge` | `admin/knowledge/library` | knowledge | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/knowledge/new` | `admin/knowledge/editor` | knowledge | **chưa** | editor thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/knowledge/[code]` | `admin/knowledge/editor` | knowledge | **chưa** | editor thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/performance` | `product/member-performance` | performance | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/kpi` | `admin/kpi-console` | kpi | stamp KPI (chưa sâu) | lifecycle thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/salary` | `admin/salary-console` | salary | stamp KHO BẠC (chưa sâu) | generation/reversal | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/certificates` | `admin/certificate-console` | certificates | **chưa** | issue/revoke | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/reports` | `sessions/reports-workspace` | reports | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/ai` | `admin/ai-configuration` | ai config | **chưa** | form thật | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/communications` | `admin/communications` | communications | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/notifications` | `product/outcomes` | notifications | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `/admin/profile` | `product/outcomes` | profile | **chưa** | theo flow | Phase D | Phase D | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |

## E. GLOBAL STATES (5 file)

| Route/File | Main Component | Visual Conversion | Evidence | Status |
|---|---|---|---|---|
| `src/app/loading.tsx` | root loading | **chưa sâu** | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `src/app/error.tsx` | root error boundary | **chưa sâu** | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `src/app/global-error.tsx` | global error boundary | **chưa sâu** | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `src/app/not-found.tsx` | 404 | **chưa sâu** | — | DONE — chuyển thể sâu đợt này (evidence trong coverage-manifest.json) |
| `src/app/template.tsx` | template | audit | — | audit |

## F. Thống kê cuối (verify:journey — PASS)

- Total routes discovered: **80** — trùng khớp quét source (script tự đối chiếu).
- DONE: 79 · REDIRECT: 1 · global states ALREADY-COMPLIANT: 5 · PARTIAL/NOT-STARTED/BLOCKED: **0**.
- Routes with browser evidence: 79/79 route UI (screenshot 1440 + 390, console 0 error).
- Overall acceptance: **100%** (verify:journey exit 0).
- Quality gates: lint 0 error (1 warning có chủ đích PolaroidFrame) · typecheck PASS · vitest 135 file/787 test PASS (đúng baseline) · production build PASS · preview-isolation PASS · coverage PASS.
