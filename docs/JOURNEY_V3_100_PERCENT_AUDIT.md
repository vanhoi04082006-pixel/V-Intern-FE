# JOURNEY V3 — 100% ROUTE AUDIT (working matrix)

Ngày khởi tạo: 2026-11-21 · nhánh `codex/product-acceptance-20261116` · FE HEAD `cfcf9e2` (trên `5d5b114`).

Ma trận này là **checklist nghiệm thu sống** cho đợt hoàn thiện 100%. Số route thực tế
quét từ source: **80 `page.tsx`** (không tính redirect `/instructor/classes` là trang UI).
Chuẩn "DONE" theo master prompt V4: giao diện chính **được chuyển thể sâu** (không tính
shell/CSS toàn cục/stamp đơn lẻ), chức năng thật giữ nguyên, responsive + a11y + browser
evidence. Trạng thái sẽ được cập nhật liên tục; mỗi dòng DONE phải kèm evidence file.

Ghi chú trạng thái:
- `DONE` = đã chuyển thể sâu + đã browser-audit (evidence trong `docs/journey-v3-evidence/`).
- `NOT STARTED` = chỉ đang hưởng hạ tầng dùng chung (journey.css, VIcons, shell, Command Palette).
- `REDIRECT` = không render UI (redirect server-side).

## A. PUBLIC & AUTH (9 route)

| Route | Role | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Screenshot Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Public | `v-intern/*` landing + HowItWorks 5 vé | none (static) | HowItWorks 5 tấm vé 01–05 sticker-pop/tape | link anchor + CTA | 390/768/1440 | OK | `evidence/public/landing-*.png` | DONE (tái xác minh Phase D) |
| `/login` | Public | `auth/auth-tabs` + `login-form` | auth/login, refresh | paper-grain, CapsLock hint, shake-ink | form + validation | 390/1440, 0 console err | OK | `evidence/public/login-*.png` | DONE (tái xác minh Phase D) |
| `/register` | Public | `auth/register-form` | auth/register | PasswordStrength, CapsLock, shake-ink | form + validation | 1440 OK | OK | `evidence/public/register-*.png` | DONE (tái xác minh Phase D) |
| `/forgot-password` | Public | `auth/forgot-password-form` | not-connected (trung thực) | paper-grain auth-shell | form | 1440 OK | OK | `evidence/public/forgot-*.png` | DONE (tái xác minh Phase D) |
| `/change-password` | Public | `auth/change-password` | auth/change-password | PasswordStrength, paper-grain | form + validation | audit Phase D | audit Phase D | `evidence/public/change-pw-*.png` | DONE (tái xác minh Phase D) |
| `/apply` | Public | `applications/public-application` | applications/apply | **chưa chuyển thể sâu** | theo luồng apply | Phase D | Phase D | — | NOT STARTED |
| `/verify` | Public | `product/outcomes` (verify mode) | auth/verify | **chưa** | theo luồng verify | Phase D | Phase D | — | NOT STARTED |
| `/github/invitation` | Public | `workspace-guard` + `github-connection` | github invitations | **chưa** | theo luồng invite | Phase D | Phase D | — | NOT STARTED |
| `/instructor/classes` | Instructor | redirect `/instructor/projects` | none | — | — | — | — | — | REDIRECT |

## B. INTERN (21 route) — shell: `intern/intern-shell` (student-experience aurora)

| Route | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `/intern` | `intern/intern-workspace` + context | intern/workspace | **chưa sâu** (shell CP + v2) | theo workspace | Phase D | Phase D | — | NOT STARTED |
| `/intern/onboarding` | `onboarding-shell` + `welcome-step` | onboarding | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/onboarding/role` | `role-selection-step` | career-roles | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/onboarding/interview` | `interview-step` | interviews | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/onboarding/result` | `recruitment-result` | applications | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/work` | `intern-entry` + `product/intern-work` | intern work | **chưa** | kanban + submit | Phase D | Phase D | — | NOT STARTED |
| `/intern/work/[id]` | `intern-work` + `student-ui` | intern work detail | **chưa** | submit/review | Phase D | Phase D | — | NOT STARTED |
| `/intern/sprint` | `intern-entry` + sprint board (`own-kanban`) | intern sprint | **chưa** | DnD thật | Phase D | Phase D | — | NOT STARTED |
| `/intern/project` | `intern-entry` + project package | intern project | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/mentor` | `product/mentor` | intern mentor | **chưa** | chat thật | Phase D | Phase D | — | NOT STARTED |
| `/intern/evaluations` | `intern-entry` + `product/outcomes` | evaluations | stamp SỔ TAY (chưa sâu) | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/evaluations/[id]` | `outcomes` detail | evaluations detail | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/performance` | `intern-entry` + `outcomes` | performance | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/kpi` | `intern-entry` + `outcomes` | kpi | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/kpi/[id]` | `outcomes` detail | kpi detail | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/virtual-salary` | `outcomes` + `student-outcome-heading` | salary | stamp + sticker (chưa sâu) | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/certificates` | `intern-entry` + `outcomes` | certificates | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/certificates/[id]` | `outcomes` detail | certificates detail | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/recommendations` | `intern-entry` + `outcomes` | recommendations | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/participation` | `participation/student` | participation | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/github` | `intern-entry` + `student-github` | github | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/notifications` | `intern-entry` + `outcomes` | notifications | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/intern/profile` | `intern-entry` + `outcomes`(profile) | profile | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |

## C. INSTRUCTOR (17 route) — layout: `src/app/instructor/layout.tsx` (WorkspaceStage)

| Route | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `/instructor` | `sessions/instructor-home` | instructor dashboard | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/sessions` | `sessions/session-list` | sessions | card-tilt (chưa sâu) | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/sessions/[id]` | `sessions/session-overview` | session detail | **chưa** | lifecycle thật | Phase D | Phase D | — | NOT STARTED |
| `/instructor/sessions/[id]/setup` | `sessions/session-setup` | session setup | **chưa** | wizard thật | Phase D | Phase D | — | NOT STARTED |
| `/instructor/sprints` | `sessions/delivery-overview` | sprints | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/sprints/[id]` | `sessions/sprint-workspace` | sprint workspace | **chưa** | lifecycle + row-menu | Phase D | Phase D | — | NOT STARTED |
| `/instructor/tasks/[id]` | `product/intern-work` + `instructor-ui` | task detail | **chưa** | review thật | Phase D | Phase D | — | NOT STARTED |
| `/instructor/projects` | `projects/project-library` | projects | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/projects/[id]` | `projects/template-detail` | project detail | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/evaluations` | `product/evaluation-management` + `imported-reviews` | evaluations | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/performance` | `product/member-performance` | performance | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/participation` | `participation/instructor` | participation | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/recruitment-rounds` | `applications/recruitment-rounds` | recruitment | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/reports` | `sessions/reports-workspace` | reports | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/github` | `github-connection` + `notebook` | github | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/notifications` | `product/outcomes` | notifications | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/profile` | `product/outcomes` | profile | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/instructor/classes` | redirect | — | — | — | — | — | — | REDIRECT |

## D. ADMIN (32 route) — layout: `src/app/admin/layout.tsx`

| Route | Main Component | API | Visual Conversion | Functional QA | Responsive | A11y | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| `/admin` | `product/admin-management` (AdminOverview) | admin counts | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/users` | `admin-management` (AdminUsers) | admin users | **chưa** | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/roles` | `admin-management` (AdminRoles) | admin roles | **chưa** | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/groups` | `admin-management` (AdminGroups + detail) | admin groups | **chưa** | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/catalogs` | `admin-management` (AdminCatalogs) | admin catalogs | **chưa** | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/settings` | `admin-management` (AdminSettings) + github-connection | admin settings | **chưa** | form thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/services` | `admin-management` (AdminServices) | admin services | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/audit` | `admin-management` (AdminAudit) | admin audit | **chưa** | filter+pager | Phase D | Phase D | — | NOT STARTED |
| `/admin/activity` | `admin-management` (AdminActivity) | admin activity | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/sessions` | `admin/sessions` → session-overview | sessions | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/sessions/[id]` | `sessions/session-overview` | session detail | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/sprints` | `sessions/delivery-overview` | sprints | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/sprints/[id]` | `sessions/sprint-workspace` | sprint workspace | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/tasks` | `product/sprint-management` | tasks | **chưa** | row-menu thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/tasks/[id]` | `product/intern-work` | task detail | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/templates` | `admin/templates-manager` → editors | templates | **chưa** | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/questions` | `admin/question-bank` + `question-editor` | question-bank | nb-stagger (chưa sâu) | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/career-roles` | `admin/career-roles` + `career-role-editor` | career-roles | **chưa** | CRUD thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/recruitment-rounds` | `applications/recruitment-rounds` | recruitment | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/knowledge` | `admin/knowledge/library` | knowledge | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/knowledge/new` | `admin/knowledge/editor` | knowledge | **chưa** | editor thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/knowledge/[code]` | `admin/knowledge/editor` | knowledge | **chưa** | editor thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/performance` | `product/member-performance` | performance | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/kpi` | `admin/kpi-console` | kpi | stamp KPI (chưa sâu) | lifecycle thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/salary` | `admin/salary-console` | salary | stamp KHO BẠC (chưa sâu) | generation/reversal | Phase D | Phase D | — | NOT STARTED |
| `/admin/certificates` | `admin/certificate-console` | certificates | **chưa** | issue/revoke | Phase D | Phase D | — | NOT STARTED |
| `/admin/reports` | `sessions/reports-workspace` | reports | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/ai` | `admin/ai-configuration` | ai config | **chưa** | form thật | Phase D | Phase D | — | NOT STARTED |
| `/admin/communications` | `admin/communications` | communications | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/notifications` | `product/outcomes` | notifications | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |
| `/admin/profile` | `product/outcomes` | profile | **chưa** | theo flow | Phase D | Phase D | — | NOT STARTED |

## E. GLOBAL STATES (5 file)

| Route/File | Main Component | Visual Conversion | Evidence | Status |
|---|---|---|---|---|
| `src/app/loading.tsx` | root loading | **chưa sâu** | — | NOT STARTED |
| `src/app/error.tsx` | root error boundary | **chưa sâu** | — | NOT STARTED |
| `src/app/global-error.tsx` | global error boundary | **chưa sâu** | — | NOT STARTED |
| `src/app/not-found.tsx` | 404 | **chưa sâu** | — | NOT STARTED |
| `src/app/template.tsx` | template | audit | — | audit |

## F. Thống kê hiện tại (sẽ cập nhật)

- Total routes discovered: **80** (+1 redirect) — trùng khớp quét source.
- DONE: 5 (public/auth, chờ tái xác minh Phase D) · REDIRECT: 2 · NOT STARTED: 73 · PARTIAL: 0.
- Overall acceptance (theo chuẩn V4): **6.25%** — đợt này sẽ đưa 100% còn lại sang DONE hoặc ALREADY COMPLIANT có bằng chứng.
