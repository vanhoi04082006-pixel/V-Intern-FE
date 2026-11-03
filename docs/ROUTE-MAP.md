# Bản đồ route Frontend

Đối chiếu **80 file `src/app/**/page.tsx`** ngày 02/11/2026:

| Nhóm | Số route | Ghi chú |
|---|---:|---|
| Công khai / auth | 8 | Landing, đăng nhập, đăng ký, ứng tuyển, xác minh |
| Admin | 31 | Console quản trị |
| Giảng viên | 18 | Trong đó `/instructor/classes` là redirect |
| Sinh viên | 23 | Onboarding + workspace học tập |

Đây là **inventory source**, không phải bằng chứng đã click kiểm thử mọi route. URL có `[id]`/`[code]` cần dữ liệu và quyền thật; không dùng chuỗi placeholder để nghiệm thu.

## 1. Công khai và xác thực

| URL | Source | Component chính |
|---|---|---|
| `/` | [page](../src/app/page.tsx) | `v-intern/navbar`, `hero`, `how-it-works`, `audience-cards`, `workflow`, `footer` |
| `/login` | [page](../src/app/%28auth%29/login/page.tsx) | `auth/auth-card`, `auth/auth-tabs`, `auth/login-form` |
| `/register` | [page](../src/app/%28auth%29/register/page.tsx) | `auth/auth-card`, `auth/auth-tabs`, `auth/register-form` |
| `/forgot-password` | [page](../src/app/%28auth%29/forgot-password/page.tsx) | `auth/auth-card`, `auth/forgot-password-form` |
| `/change-password` | [page](../src/app/%28auth%29/change-password/page.tsx) | `auth/change-password` |
| `/apply` | [page](../src/app/apply/page.tsx) | `applications/public-application` |
| `/github/invitation` | [page](../src/app/github/invitation/page.tsx) | `auth/workspace-guard`, `product/github-connection`, `shared/data-state` |
| `/verify` | [page](../src/app/verify/page.tsx) | `product/outcomes` |

## 2. Quản trị viên — 31 route

| URL | Source | Component chính |
|---|---|---|
| `/admin` | [page](../src/app/admin/page.tsx) | `product/admin-management` |
| `/admin/activity` | [page](../src/app/admin/activity/page.tsx) | `product/admin-management` |
| `/admin/ai` | [page](../src/app/admin/ai/page.tsx) | `admin/ai-configuration` |
| `/admin/audit` | [page](../src/app/admin/audit/page.tsx) | `product/admin-management` |
| `/admin/career-roles` | [page](../src/app/admin/career-roles/page.tsx) | `admin/career-roles` |
| `/admin/catalogs` | [page](../src/app/admin/catalogs/page.tsx) | `product/admin-management` |
| `/admin/certificates` | [page](../src/app/admin/certificates/page.tsx) | `admin/certificate-console` |
| `/admin/communications` | [page](../src/app/admin/communications/page.tsx) | `admin/communications` |
| `/admin/groups` | [page](../src/app/admin/groups/page.tsx) | `product/admin-management` |
| `/admin/knowledge` | [page](../src/app/admin/knowledge/page.tsx) | `admin/knowledge/library` |
| `/admin/knowledge/new` | [page](../src/app/admin/knowledge/new/page.tsx) | `admin/knowledge/editor` |
| `/admin/knowledge/[code]` | [page](../src/app/admin/knowledge/%5Bcode%5D/page.tsx) | `admin/knowledge/editor` |
| `/admin/kpi` | [page](../src/app/admin/kpi/page.tsx) | `admin/kpi-console` |
| `/admin/notifications` | [page](../src/app/admin/notifications/page.tsx) | `product/outcomes` |
| `/admin/performance` | [page](../src/app/admin/performance/page.tsx) | `product/member-performance` |
| `/admin/profile` | [page](../src/app/admin/profile/page.tsx) | `product/outcomes` |
| `/admin/questions` | [page](../src/app/admin/questions/page.tsx) | `admin/question-bank` |
| `/admin/recruitment-rounds` | [page](../src/app/admin/recruitment-rounds/page.tsx) | `applications/recruitment-rounds` |
| `/admin/reports` | [page](../src/app/admin/reports/page.tsx) | `sessions/reports-workspace` |
| `/admin/roles` | [page](../src/app/admin/roles/page.tsx) | `product/admin-management` |
| `/admin/salary` | [page](../src/app/admin/salary/page.tsx) | `admin/salary-console` |
| `/admin/services` | [page](../src/app/admin/services/page.tsx) | `product/admin-management` |
| `/admin/sessions` | [page](../src/app/admin/sessions/page.tsx) | `admin/sessions` |
| `/admin/sessions/[id]` | [page](../src/app/admin/sessions/%5Bid%5D/page.tsx) | `sessions/session-overview` |
| `/admin/settings` | [page](../src/app/admin/settings/page.tsx) | `product/admin-management`, `product/github-connection`, `product/primitives` |
| `/admin/sprints` | [page](../src/app/admin/sprints/page.tsx) | `sessions/delivery-overview` |
| `/admin/sprints/[id]` | [page](../src/app/admin/sprints/%5Bid%5D/page.tsx) | `sessions/sprint-workspace`, `product/primitives` |
| `/admin/tasks` | [page](../src/app/admin/tasks/page.tsx) | `product/sprint-management`, `product/primitives` |
| `/admin/tasks/[id]` | [page](../src/app/admin/tasks/%5Bid%5D/page.tsx) | `product/intern-work`, `product/primitives` |
| `/admin/templates` | [page](../src/app/admin/templates/page.tsx) | `admin/templates-manager` |
| `/admin/users` | [page](../src/app/admin/users/page.tsx) | `product/admin-management` |

## 3. Giảng viên — 18 route

| URL | Source | Component chính |
|---|---|---|
| `/instructor` | [page](../src/app/instructor/page.tsx) | `sessions/instructor-home` |
| `/instructor/projects` | [page](../src/app/instructor/projects/page.tsx) | `projects/project-library` |
| `/instructor/projects/[id]` | [page](../src/app/instructor/projects/%5Bid%5D/page.tsx) | `projects/template-detail` |
| `/instructor/sessions` | [page](../src/app/instructor/sessions/page.tsx) | `sessions/session-list` |
| `/instructor/sessions/[id]` | [page](../src/app/instructor/sessions/%5Bid%5D/page.tsx) | `sessions/session-overview` |
| `/instructor/sessions/[id]/setup` | [page](../src/app/instructor/sessions/%5Bid%5D/setup/page.tsx) | `sessions/session-setup` |
| `/instructor/sprints` | [page](../src/app/instructor/sprints/page.tsx) | `sessions/delivery-overview` |
| `/instructor/sprints/[id]` | [page](../src/app/instructor/sprints/%5Bid%5D/page.tsx) | `sessions/sprint-workspace`, `product/primitives` |
| `/instructor/tasks/[id]` | [page](../src/app/instructor/tasks/%5Bid%5D/page.tsx) | `product/intern-work`, `instructor/instructor-ui` |
| `/instructor/evaluations` | [page](../src/app/instructor/evaluations/page.tsx) | `product/evaluation-management` |
| `/instructor/performance` | [page](../src/app/instructor/performance/page.tsx) | `product/member-performance` |
| `/instructor/participation` | [page](../src/app/instructor/participation/page.tsx) | `participation/instructor` |
| `/instructor/reports` | [page](../src/app/instructor/reports/page.tsx) | `sessions/reports-workspace` |
| `/instructor/recruitment-rounds` | [page](../src/app/instructor/recruitment-rounds/page.tsx) | `applications/recruitment-rounds` |
| `/instructor/github` | [page](../src/app/instructor/github/page.tsx) | `product/github-connection`, `instructor/instructor-ui`, `product/primitives` |
| `/instructor/notifications` | [page](../src/app/instructor/notifications/page.tsx) | `product/outcomes` |
| `/instructor/profile` | [page](../src/app/instructor/profile/page.tsx) | `product/outcomes` |
| `/instructor/classes` | [page](../src/app/instructor/classes/page.tsx) | **Redirect** → `/instructor/projects` |

## 4. Sinh viên — 23 route

| URL | Source | Component chính |
|---|---|---|
| `/intern` | [page](../src/app/intern/page.tsx) | `auth/workspace-guard`, `intern/intern-workspace`, `intern/intern-workspace-context` |
| `/intern/onboarding` | [page](../src/app/intern/onboarding/page.tsx) | `intern/onboarding/onboarding-shell`, `welcome-step` |
| `/intern/onboarding/role` | [page](../src/app/intern/onboarding/role/page.tsx) | `intern/onboarding/onboarding-shell`, `role-selection-step` |
| `/intern/onboarding/interview` | [page](../src/app/intern/onboarding/interview/page.tsx) | `intern/onboarding/interview-step`, `onboarding-shell` |
| `/intern/onboarding/result` | [page](../src/app/intern/onboarding/result/page.tsx) | `intern/onboarding/onboarding-shell`, `recruitment-result` |
| `/intern/work` | [page](../src/app/intern/work/page.tsx) | `product/intern-entry`, `product/intern-work` |
| `/intern/work/[id]` | [page](../src/app/intern/work/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/intern-work`, `intern/student-ui` |
| `/intern/sprint` | [page](../src/app/intern/sprint/page.tsx) | `product/intern-entry` |
| `/intern/project` | [page](../src/app/intern/project/page.tsx) | `product/intern-entry` |
| `/intern/mentor` | [page](../src/app/intern/mentor/page.tsx) | `product/intern-entry`, `product/mentor` |
| `/intern/evaluations` | [page](../src/app/intern/evaluations/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/evaluations/[id]` | [page](../src/app/intern/evaluations/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/performance` | [page](../src/app/intern/performance/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/kpi` | [page](../src/app/intern/kpi/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/kpi/[id]` | [page](../src/app/intern/kpi/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/virtual-salary` | [page](../src/app/intern/virtual-salary/page.tsx) | `product/intern-entry`, `product/outcomes`, `intern/student-outcome-heading` |
| `/intern/certificates` | [page](../src/app/intern/certificates/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/certificates/[id]` | [page](../src/app/intern/certificates/%5Bid%5D/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/recommendations` | [page](../src/app/intern/recommendations/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/participation` | [page](../src/app/intern/participation/page.tsx) | `participation/student` |
| `/intern/github` | [page](../src/app/intern/github/page.tsx) | `product/intern-entry`, `intern/student-github` |
| `/intern/notifications` | [page](../src/app/intern/notifications/page.tsx) | `product/intern-entry`, `product/outcomes` |
| `/intern/profile` | [page](../src/app/intern/profile/page.tsx) | `product/intern-entry`, `product/outcomes` |

## 5. Guard và layout

| Nhánh | Layout/guard | Hành vi |
|---|---|---|
| `(auth)` | `(auth)/layout.tsx` | Form công khai; người đã đăng nhập có thể được chuyển về landing theo vai |
| `admin` | `admin/layout.tsx` + `WorkspaceGuard` | Chỉ Admin |
| `instructor` | `instructor/layout.tsx` + `WorkspaceGuard` | Chỉ Giảng viên |
| `intern` | `intern/layout.tsx` + `InternEntry` | Sinh viên; lifecycle quyết định onboarding/chờ/workspace |
| `intern/onboarding` | `intern/onboarding/layout.tsx` | Chỉ luồng tuyển dụng, chưa cần assignment |
| Toàn cục | `app/error.tsx`, `loading.tsx`, `not-found.tsx` | Error boundary, loading, 404 |

`/instructor/classes` chỉ là redirect tương thích. Không thêm màn quản lý lớp hoặc chia sẻ dữ liệu nếu BE không có contract tương ứng.

## 6. Khi thêm hoặc đổi route

1. Xác định vai trò và guard của nhánh.
2. Thêm `page.tsx` mỏng; component nghiệp vụ đặt đúng thư mục.
3. Không bọc lại shell nếu layout đã có.
4. Cập nhật bảng này và test route/permission liên quan.
5. Kiểm tra landing sau đăng nhập, deep link và trạng thái lifecycle.
6. Chạy [quality gate](TESTING.md); route private cần browser check, không chỉ unit test.

Đọc thêm [ARCHITECTURE](ARCHITECTURE.md) và [API-CONTRACTS](API-CONTRACTS.md).
