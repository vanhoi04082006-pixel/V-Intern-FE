# Bản đồ route Frontend

Đối chiếu trực tiếp 70 file `src/app/**/page.tsx` ngày 24/10/2026, gồm catalog nghề và ba route kho tri thức mới. Đây là bản đồ source, không phải tuyên bố tất cả route đã nghiệm thu trên trình duyệt. Route có `[id]` cần ID thật trong đúng scope.

| URL | Source | Component được import trực tiếp |
|---|---|---|
| `/forgot-password` | [page](../src/app/%28auth%29/forgot-password/page.tsx) | `auth/auth-card`, `auth/forgot-password-form` |
| `/login` | [page](../src/app/%28auth%29/login/page.tsx) | `auth/auth-card`, `auth/auth-tabs`, `auth/login-form`, `auth/login-form` |
| `/register` | [page](../src/app/%28auth%29/register/page.tsx) | `auth/auth-card`, `auth/auth-tabs`, `auth/register-form`, `auth/register-form` |
| `/admin/activity` | [page](../src/app/admin/activity/page.tsx) | `product/admin-management` |
| `/admin/ai` | [page](../src/app/admin/ai/page.tsx) | `admin/ai-configuration` |
| `/admin/audit` | [page](../src/app/admin/audit/page.tsx) | `product/admin-management` |
| `/admin/catalogs` | [page](../src/app/admin/catalogs/page.tsx) | `product/admin-management` |
| `/admin/groups` | [page](../src/app/admin/groups/page.tsx) | `product/admin-management` |
| `/admin/notifications` | [page](../src/app/admin/notifications/page.tsx) | `product/outcomes` |
| `/admin` | [page](../src/app/admin/page.tsx) | `product/admin-management` |
| `/admin/performance` | [page](../src/app/admin/performance/page.tsx) | `product/member-performance` |
| `/admin/profile` | [page](../src/app/admin/profile/page.tsx) | `product/outcomes` |
| `/admin/questions` | [page](../src/app/admin/questions/page.tsx) | `admin/question-bank` |
| `/admin/career-roles` | [page](../src/app/admin/career-roles/page.tsx) | `admin/career-roles`, [hướng dẫn](CAREER-ROLES.md) |
| `/admin/knowledge` | [page](../src/app/admin/knowledge/page.tsx) | `admin/knowledge/library`, [hướng dẫn](KNOWLEDGE-LIBRARY.md) |
| `/admin/knowledge/new` | [page](../src/app/admin/knowledge/new/page.tsx) | `admin/knowledge/editor`, tạo draft |
| `/admin/knowledge/[code]` | [page](../src/app/admin/knowledge/%5Bcode%5D/page.tsx) | `admin/knowledge/editor`, current/history/lifecycle |
| `/admin/reports` | [page](../src/app/admin/reports/page.tsx) | `sessions/reports-workspace` |
| `/admin/roles` | [page](../src/app/admin/roles/page.tsx) | `product/admin-management` |
| `/admin/services` | [page](../src/app/admin/services/page.tsx) | `product/admin-management` |
| `/admin/sessions/[id]` | [page](../src/app/admin/sessions/%5Bid%5D/page.tsx) | `sessions/session-overview` |
| `/admin/sessions` | [page](../src/app/admin/sessions/page.tsx) | `admin/sessions` |
| `/admin/settings` | [page](../src/app/admin/settings/page.tsx) | `product/admin-management`, `product/github-connection`, `product/primitives` |
| `/admin/sprints/[id]` | [page](../src/app/admin/sprints/%5Bid%5D/page.tsx) | `sessions/sprint-workspace`, `product/primitives` |
| `/admin/sprints` | [page](../src/app/admin/sprints/page.tsx) | `sessions/delivery-overview` |
| `/admin/tasks/[id]` | [page](../src/app/admin/tasks/%5Bid%5D/page.tsx) | `product/intern-work`, `product/primitives` |
| `/admin/tasks` | [page](../src/app/admin/tasks/page.tsx) | `product/sprint-management`, `product/primitives` |
| `/admin/templates` | [page](../src/app/admin/templates/page.tsx) | `admin/templates-manager` |
| `/admin/users` | [page](../src/app/admin/users/page.tsx) | `product/admin-management` |
| `/instructor/classes` | [page](../src/app/instructor/classes/page.tsx) | Xem route source |
| `/instructor/evaluations` | [page](../src/app/instructor/evaluations/page.tsx) | `product/evaluation-management` |
| `/instructor/github` | [page](../src/app/instructor/github/page.tsx) | `product/github-connection`, `instructor/instructor-ui`, `product/primitives` |
| `/instructor/notifications` | [page](../src/app/instructor/notifications/page.tsx) | `product/outcomes` |
| `/instructor` | [page](../src/app/instructor/page.tsx) | `sessions/instructor-home` |
| `/instructor/performance` | [page](../src/app/instructor/performance/page.tsx) | `product/member-performance` |
| `/instructor/profile` | [page](../src/app/instructor/profile/page.tsx) | `product/outcomes` |
| `/instructor/projects/[id]` | [page](../src/app/instructor/projects/%5Bid%5D/page.tsx) | `projects/template-detail` |
| `/instructor/projects` | [page](../src/app/instructor/projects/page.tsx) | `projects/project-library` |
| `/instructor/reports` | [page](../src/app/instructor/reports/page.tsx) | `sessions/reports-workspace` |
| `/instructor/sessions/[id]` | [page](../src/app/instructor/sessions/%5Bid%5D/page.tsx) | `sessions/session-overview` |
| `/instructor/sessions/[id]/setup` | [page](../src/app/instructor/sessions/%5Bid%5D/setup/page.tsx) | `sessions/session-setup` |
| `/instructor/sessions` | [page](../src/app/instructor/sessions/page.tsx) | `sessions/session-list` |
| `/instructor/sharing` | [page](../src/app/instructor/sharing/page.tsx) | `sessions/session-sharing` |
| `/instructor/sprints/[id]` | [page](../src/app/instructor/sprints/%5Bid%5D/page.tsx) | `sessions/sprint-workspace`, `product/primitives` |
| `/instructor/sprints` | [page](../src/app/instructor/sprints/page.tsx) | `sessions/delivery-overview` |
| `/instructor/tasks/[id]` | [page](../src/app/instructor/tasks/%5Bid%5D/page.tsx) | `product/intern-work`, `instructor/instructor-ui` |
| `/intern/certificates/[id]` | [page](../src/app/intern/certificates/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/certificates` | [page](../src/app/intern/certificates/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/evaluations/[id]` | [page](../src/app/intern/evaluations/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/evaluations` | [page](../src/app/intern/evaluations/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/github` | [page](../src/app/intern/github/page.tsx) | `product/intern-entry`, `intern/student-github` |
| `/intern/kpi/[id]` | [page](../src/app/intern/kpi/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/kpi` | [page](../src/app/intern/kpi/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/mentor` | [page](../src/app/intern/mentor/page.tsx) | `product/intern-entry`, `product/mentor` |
| `/intern/notifications` | [page](../src/app/intern/notifications/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/onboarding/interview` | [page](../src/app/intern/onboarding/interview/page.tsx) | `intern/onboarding/interview-step`, `intern/onboarding/onboarding-shell` |
| `/intern/onboarding` | [page](../src/app/intern/onboarding/page.tsx) | `intern/onboarding/onboarding-shell`, `intern/onboarding/welcome-step` |
| `/intern/onboarding/result` | [page](../src/app/intern/onboarding/result/page.tsx) | `intern/onboarding/onboarding-shell`, `intern/onboarding/recruitment-result` |
| `/intern/onboarding/role` | [page](../src/app/intern/onboarding/role/page.tsx) | `intern/onboarding/onboarding-shell`, `intern/onboarding/role-selection-step` |
| `/intern` | [page](../src/app/intern/page.tsx) | `auth/workspace-guard`, `intern/intern-workspace`, `intern/intern-workspace-context` |
| `/intern/performance` | [page](../src/app/intern/performance/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/profile` | [page](../src/app/intern/profile/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/project` | [page](../src/app/intern/project/page.tsx) | `product/intern-entry` |
| `/intern/recommendations` | [page](../src/app/intern/recommendations/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/sprint` | [page](../src/app/intern/sprint/page.tsx) | `product/intern-entry` |
| `/intern/virtual-salary` | [page](../src/app/intern/virtual-salary/page.tsx) | `product/intern-entry`, `product/outcomes`, `intern/student-outcome-heading` |
| `/intern/work/[id]` | [page](../src/app/intern/work/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/intern-work`, `intern/student-ui` |
| `/intern/work` | [page](../src/app/intern/work/page.tsx) | `product/intern-entry`, `product/intern-work` |
| `/` | [page](../src/app/page.tsx) | `v-intern/navbar`, `v-intern/hero`, `v-intern/how-it-works`, `v-intern/audience-cards`, `v-intern/workflow`, `v-intern/footer` |
| `/verify` | [page](../src/app/verify/page.tsx) | `product/outcomes` |

Guard và layout nằm ở các thư mục cha; đọc [HANDOVER](HANDOVER.md) trước khi thay route hoặc quyền.
