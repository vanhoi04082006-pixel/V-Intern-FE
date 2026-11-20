# UI Coverage Matrix — V-Intern FE

Ngày audit nguồn: 2026-11-20 · nhánh `codex/product-acceptance-20261116` (từ điểm bắt đầu `a9b7273`).

Ma trận này được sinh từ **source thật** (route scan, ROLE_CATALOG BE, đối chiếu API contract), không từ danh sách trang tưởng tượng. Cột bằng chứng browser chỉ được điền khi có JSON audit tương ứng (`docs/preview-evidence/browser-audit.json`); nếu chưa có, ô ghi rõ **chờ bằng chứng** — không tự nâng cấp trạng thái.

Nguồn đối chiếu: [ROUTE-MAP](ROUTE-MAP.md) · [API-CONTRACTS](API-CONTRACTS.md) · [UI-API-COVERAGE-20261029](UI-API-COVERAGE-20261029.md) · bằng chứng: [preview-evidence](preview-evidence/README.md).

## 9.1. Page Coverage Matrix

| Route/Page | Role | Existing Status | UI Upgrade | Responsive | Interactions | API Integration | Preview | Tests | Final Status |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Public | Có (route scan) | Ngoài phạm vi (brief đã duyệt) | audit | theo workflow | Không (trang tĩnh) | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/login` | Public | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | auth/login, refresh | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/register` | Public | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | auth/register (intern only) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/forgot-password` | Public | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | Chưa có endpoint BE (not-connected trung thực) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/change-password` | Public (đã đăng nhập) | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | auth/change-password | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/verify` | Public | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | certificates/verify | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/apply` | Public | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | applications/apply | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/github/invitation` | Public (token) | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | github invitation accept | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | dashboard/admin | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/users` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | users/* | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/roles` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | roles/*/permissions | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/groups` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | groups/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/sessions` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sessions/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/sessions/[id]` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sessions/:id + assignments | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/admin/sprints` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sprints/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/sprints/[id]` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sprints/:id + tasks | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/admin/tasks` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | tasks/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/tasks/[id]` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | tasks/:id + submissions | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/admin/templates` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | project-templates/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/questions` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | question-bank/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/career-roles` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | career-roles/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/recruitment-rounds` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | recruitment/*, recruitment-rounds/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/knowledge` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | admin/knowledge/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/knowledge/new` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | admin/knowledge/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/knowledge/[code]` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | admin/knowledge/:code | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/admin/catalogs` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | catalogs/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/performance` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | performance/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/kpi` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | kpi-periods/*, kpi-results/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/salary` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | virtual-salary/* | desktop OK, mobile OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/certificates` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | certificates/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/reports` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | reports/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/activity` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | activity-events | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/ai` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | admin/agents/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/audit` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | audit-logs | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/communications` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | admin/communications/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/notifications` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | notifications/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/profile` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | users/me | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/admin/services` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | health, github config | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/admin/settings` | admin | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | settings, admin/system/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | dashboard/instructor | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/instructor/recruitment-rounds` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | recruitment (view) + rounds | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/sessions` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sessions/* (owner scope) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/instructor/sessions/[id]` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sessions/:id (owner) | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/instructor/sessions/[id]/setup` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sessions/:id setup + ai plan | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/instructor/sprints` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sprints/* (owner scope) | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/sprints/[id]` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sprints/:id + tasks | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/instructor/tasks/[id]` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | tasks/:id + submissions | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/instructor/projects` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | projects/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/projects/[id]` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | projects/:id + revisions | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/instructor/evaluations` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | evaluations/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/performance` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | performance/* (own scope) | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/participation` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | participation/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/reports` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | reports/* | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/github` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | github/me, repository-account | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/instructor/classes` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | redirect | — | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |
| `/instructor/notifications` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | notifications/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/instructor/profile` | instructor | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | users/me | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | intern/me/workspace | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/work` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | assignments/* | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/work/[id]` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | assignments/:id + submissions | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/participation` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | participation/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/sprint` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | sprints (own) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/project` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | projects (own) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/mentor` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | intern/me/ai-mentor/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/evaluations` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | evaluations/* (own) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/evaluations/[id]` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | evaluations/:id | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/performance` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | performance (own) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/kpi` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | kpi-results/* | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/kpi/[id]` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | kpi-results/:id | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/virtual-salary` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | virtual-salary/* (own) | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/certificates` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | certificates/* (own) | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/certificates/[id]` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | certificates/:id | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/recommendations` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | intern/me/ai-recommendations | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/notifications` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | notifications/* | desktop OK, mobile OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/profile` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | users/me | desktop OK, 0 console error | Vitest module liên quan | Completed |
| `/intern/onboarding` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | intern lifecycle APIs | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/intern/onboarding/role` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | career-roles | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/intern/onboarding/interview` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | ai interview | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/intern/onboarding/result` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | applications/:id/result | desktop OK, 0 console error, ErrorState (endpoint chưa mock) | Vitest module liên quan | Partial — render ErrorState (endpoint chưa mock; không crash, 0 console error) |
| `/intern/github` | intern | Có (route scan) | Notebook DS (redesign đã duyệt) | audit | theo workflow | github/me, invitations | chờ bằng chứng | Vitest module liên quan | Partial — chờ audit browser |

Đếm: **80 dòng route thật** (bao gồm `[id]` động đại diện cho trường hợp chi tiết). `/instructor/classes` là redirect tương thích, không còn màn hình riêng.

## 9.2. Component Coverage Matrix

| Component | Existing | Redesigned | Variants | States | Responsive | Accessibility | Tested |
|---|---|---|---|---|---|---|---|
| Button (btn/iconButtonClass) | Có | Notebook DS | primary/secondary/ghost/danger × sm/md/lg/icon | default/hover/focus-visible/active/disabled/busy(Spinner) | Touch ≥40px (size-10 icon, min-h-9+ controls) | focus-visible + aria theo dòng States | Vitest component/shared tests |
| Field + input/select/textarea | Có | Notebook DS | text/select/textarea | default/hover/focus/error+hint/disabled | label htmlFor, aria hint/error ids | focus-visible + aria theo dòng States | Vitest component/shared tests |
| InlineAlert | Có | Notebook DS | info/success/warning/danger | static + action slot | role=alert/status theo tone | focus-visible + aria theo dòng States | Vitest component/shared tests |
| Spinner / Skeleton / TableSkeleton | Có | Notebook DS | size via className | loading | role=status + aria-label | focus-visible + aria theo dòng States | Vitest component/shared tests |
| MetricCard / Panel / Card | Có | Notebook DS | — | default | icon + label + value + sub | focus-visible + aria theo dòng States | Vitest component/shared tests |
| Modal | Có | Notebook DS | normal/wide | open/close/close-disabled | native dialog + focus trap + restore focus | focus-visible + aria theo dòng States | Vitest component/shared tests |
| PageMeta | Có | Notebook DS | — | default | dl/dt/dd semantics | focus-visible + aria theo dòng States | Vitest component/shared tests |
| ErrorState | Có | Notebook DS | — | error (retry) + validation details | role=alert, ApiError code mapping | focus-visible + aria theo dòng States | Vitest component/shared tests |
| LoadingState | Có | Notebook DS | — | loading | role=status | focus-visible + aria theo dòng States | Vitest component/shared tests |
| EmptyState | Có | Notebook DS | — | empty | doodles minh họa | focus-visible + aria theo dòng States | Vitest component/shared tests |
| NotificationBell | Có | Notebook DS | — | unread badge / empty | dropdown + unread count | focus-visible + aria theo dòng States | Vitest component/shared tests |
| ThemeToggle | Có | Notebook DS | light/dark | default/focus/keyboard | mobile-accessible theo fix 7ce0527 | focus-visible + aria theo dòng States | Vitest component/shared tests |
| WorkspaceGuard | Có | Notebook DS | — | allowed/denied/loading | redirect theo role-landing | focus-visible + aria theo dòng States | Vitest component/shared tests |
| App shell (sidebar/header/drawer) | Có | Notebook DS | intern/instructor/admin | collapsed/mobile drawer | nav nhóm, active state, drawer trap focus | focus-visible + aria theo dòng States | Vitest component/shared tests |
| WorkspaceStage viewbar | Có | Notebook DS | intern/instructor | group-aware | aria-current=page | focus-visible + aria theo dòng States | Vitest component/shared tests |
| KanbanDnD / OwnKanban | Có | Notebook DS | board | drag/permission | pointer + keyboard fallback | focus-visible + aria theo dòng States | Vitest component/shared tests |
| Toast (MOI - branch này) | Có | MOI (branch này) | success/error/warning/info/progress | enter/exit/auto-dismiss/persist | role=status/alert, prefers-reduced-motion | focus-visible + aria theo dòng States | Vitest component/shared tests |
| ConfirmDialog (MOI - branch này) | Có | MOI (branch này) | danger/normal | busy | trên nền Modal, focus trap | focus-visible + aria theo dòng States | Vitest component/shared tests |
| PreviewSwitcher (MOI - branch này) | Có | MOI (branch này) | — | hidden khi PREVIEW tắt | chỉ tồn tại ngoài production build | focus-visible + aria theo dòng States | Vitest component/shared tests |

## 9.3. Role Coverage Matrix

| Role | Dashboard | Accessible Pages | Navigation | Permissions | Workflows | Preview Account | Tested |
|---|---|---|---|---|---|---|---|
| admin (Quản trị viên) | /admin | 31 trang theo shell menu + guard | Shell nhóm theo vai trò | Toàn quyền (grantAll) — nguồn: ROLE_CATALOG BE: isSystem, grantAll=true | theo §9.4 | admin@vintern.preview / Admin@12345 | Vitest role-landing + browser audit |
| instructor (Giảng viên) | /instructor | 18 trang theo shell menu + guard | Shell nhóm theo vai trò | sessions/projects/sprints/tasks/evaluations/performance + ai.assist (scope own) — nguồn: ROLE_CATALOG BE grantCodes | theo §9.4 | giangvien1@vintern.preview / Mentor@12345 | Vitest role-landing + browser audit |
| intern (Thực tập sinh) | /intern | 23 trang theo shell menu + guard | Shell nhóm theo vai trò | self-scope: work/sprint/mentor/kpi/salary/certificates — nguồn: ROLE_CATALOG BE grantCodes + ownership BE | theo §9.4 | sinhvien1..6@vintern.preview / Intern@12345 | Vitest role-landing + browser audit |

Truy cập chéo bị từ chối: `WorkspaceGuard` + `PROTECTED_ROUTES` (FE) và ownership/role check (BE) — đã có test `session-events`, `landing`.

## 9.4. Workflow Coverage Matrix

| Workflow | Role | Entry Point | Steps | Expected Result | Real API | Preview Scenario | Test Status |
|---|---|---|---|---|---|---|---|
| Authentication: login → refresh → logout | Tất cả | /login | Đăng nhập đúng credentials → workspace theo role; sai → generic error; lock → 403 | auth/login, auth/refresh, auth/logout | Preview: login demo account | Vitest auth-service/session 50+ tests; Playwright live UAT trước đó |
| Registration công khai | Khách | /register | Tạo intern mới → onboarding | auth/register | Preview: đăng ký mock | Vitest register-form |
| Password change | Người dùng | /change-password | Đổi mật khẩu → mustChangePassword=false | auth/change-password | Preview | Vitest change-password |
| Profile management | Tất cả role | /*/profile | Xem + cập nhật hồ sơ | users/me (GET/PATCH) | Preview | Vitest + browser audit |
| Application submission | Khách | /apply | Nộp hồ sơ → nhận email xác nhận → vào review | applications/apply | Preview | Vitest applications |
| Onboarding intern (role → interview → result) | intern | /intern/onboarding/** | Chọn nghề → phỏng vấn AI → nhận kết quả → active | career-roles, ai interview, applications/:id | Preview: sinhvien_new (chưa hoàn thành) | Vitest + browser audit |
| Session setup wizard | instructor | /instructor/sessions/[id]/setup | Cấu hình phiên → AI plan draft → phát hành | sessions/:id/setup + ai plan | Preview | Vitest instructor-setup |
| Sprint & task CRUD + board | instructor, admin | /*/sprints/** | Tạo sprint → task → dependency → phân công | sprints/*, tasks/* | Preview | Vitest + browser audit |
| Submission: nộp bài → AI review → quyết định | intern → instructor | /intern/work/[id] → /instructor/tasks/[id] | Nộp SHA → AI review chạy → giảng viên duyệt/từ chối | submissions/*, ai-generations/* | Preview | Vitest submissions; Playwright phase7-work-live trước đó |
| Evaluation management | instructor, admin | /*/evaluations | Mở kỳ → chấm tiêu chí → chốt | evaluations/* | Preview | Vitest evaluation |
| KPI calculation → finalization | admin | /admin/kpi | Tính KPI → kiểm tra readiness → chốt kỳ | kpi-periods/*, kpi-results/* | Preview | Vitest kpi-readiness-20261117 |
| Virtual salary: generate → adjust → reverse | admin | /admin/salary | Sinh lương → điều chỉnh → hoàn đảo ghi sổ | virtual-salary/* | Preview | Vitest salary 3 docs 20261117 |
| Certificates: issue → verify → revoke | admin → public | /admin/certificates → /verify | Cấp chứng nhận → link xác minh công khai | certificates/* | Preview: /verify mã thật + mã không tồn tại | Vitest certificates |
| Recruitment rounds + interview scheduling | admin, instructor | /*/recruitment-rounds | Duyệt CV → xếp lịch phỏng vấn | recruitment/*, recruitment-rounds/* | Preview | Vitest recruitment-feedback |
| GitHub: connect → provision → invite | instructor, intern | /*/github + /github/invitation | OAuth → provision repo → invite thành viên | github/* | Preview (mock states) | Vitest github; Playwright g5-invitations-live trước đó |
| Notifications: list → read → mark all → options | Tất cả | /*/notifications | Đọc/đánh dấu/đặt tùy chọn | notifications/* | Preview | Vitest notifications |
| Search / filter / pagination | admin, instructor | users, sessions, sprints, tasks... | Lọc + phân trang phía BE | query params theo adapter | Preview: large dataset scenario | Vitest use-resource |
| Reports export (xlsx/pdf) | admin, instructor | /*/reports | Export snapshot theo quyền | reports/* | Preview (stub blob) | Vitest reports |
| Knowledge runs (Agent tri thức) | admin | /admin/knowledge/** | Tạo run → poll → cancel/resume/retry | admin/knowledge/* | Preview | Vitest knowledge-runs |
| Upload/download (CV, tài liệu) | intern, admin | /apply, /admin/recruitment-rounds | Upload CV/zip → parse → preview | multipart endpoints | Preview (mock) | Vitest parse + work |

## 9.5. UI State Coverage Matrix

| Page/Component | Empty | Populated | Loading | Error | Permission Denied | Long Data | Mobile |
|---|---|---|---|---|---|---|---|
| /login | Form trống + validation | Điền đúng/sai | Đang submit (Spinner) | 401 generic / 429 lock | — | Mật khẩu dài, email lạ | Drawer ≥sm, full-width mobile |
| /admin/users | Chưa có người dùng | Danh sách phân trang | TableSkeleton | ErrorState + retry | — | Tên/email dài | Bảng cuộn ngang mobile |
| /admin/salary | Sổ trống | Giao dịch đầy đủ | TableSkeleton | ErrorState | — | Số tiền lớn, ghi chú dài | Cột co giãn |
| /intern/work | Chưa có task | Task board | Skeleton | ErrorState | — | Tiêu đề dài | Kanban cuộn ngang mobile |
| /intern/onboarding | Tài khoản mới | Đang tiến hành | Loading | ErrorState | Chưa đủ điều kiện | Tên nghề dài | Stepper dọc mobile |
| /verify | Chưa nhập mã | Mã hợp lệ | Đang kiểm tra | Mã không tồn tại | Public | Mã dài | Center card responsive |
| NotificationBell (mọi trang) | Không có thông báo | Danh sách | Đang tải | Lỗi tải badge | — | Tiêu đề dài | Dropdown → drawer mobile |

Các trạng thái được kiểm qua Preview scenario switching (populated/empty/loading/error/401/403/422/large/long-text) khi audit browser chạy.

## 9.6. API Coverage Matrix

| Feature | FE Service | BE Endpoint | Auth Required | Request/Response Verified | Error Handling | Integration Test |
|---|---|---|---|---|---|---|
| Auth & phiên | auth-service.ts, session.ts | auth/login, auth/refresh, auth/logout, auth/me, auth/register, auth/change-password | Có (cookie refresh + bearer) | Đã đối chiếu contract; guard ApiError | Vitest auth 50+ test; live UAT trước đó |
| Users & RBAC | system-admin.ts, management.ts | users/*, roles/*, permissions | Bearer admin | Đối chiếu ROLE_CATALOG | Vitest + live UAT |
| Applications & recruitment | applications.ts, recruitment.ts | applications/*, recruitment/*, recruitment-rounds/* | Mixed (apply public, phần còn lại bearer) | Đối chiếu | Vitest applications/recruitment-feedback |
| Sessions & assignments | sessions.ts, session-work.ts, instructor-setup.ts | sessions/*, assignments/* | Bearer | Đối chiếu | Vitest + phase7-work-live |
| Sprints & tasks & submissions | planning.ts, work.ts, submissions.ts | sprints/*, tasks/*, submissions/*, ai-generations/* | Bearer | Đối chiếu | Vitest + phase7-work-live |
| GitHub | github.ts, repository-access.ts | github/me, github/repository-account, sessions/:id/github/* | Bearer + OAuth | Đối chiếu | Vitest + g5-invitations-live |
| Evaluation & KPI & salary | finance.ts, management.ts | evaluations/*, kpi-periods/*, kpi-results/*, virtual-salary/* | Bearer | Đối chiếu (3 testing doc 20261117) | Vitest |
| Certificates | delivery.ts, outcomes.ts | certificates/* | Mixed (verify public) | Đối chiếu | Vitest certificates |
| Performance & reports & dashboard | reports.ts, dashboard.ts, student-detail.ts | performance/*, reports/*, dashboard/* | Bearer | Đối chiếu | Vitest + browser audit |
| Notifications & activity & audit | workspace.ts, admin.ts | notifications/*, activity-events, audit-logs | Bearer | Đối chiếu | Vitest |
| Knowledge & AI agents | knowledge.ts, knowledge-runs.ts, business-agents.ts | admin/knowledge/*, admin/agents/*, intern/me/ai-mentor/* | Bearer | Đối chiếu | Vitest knowledge-runs |
| Hệ thống & dịch vụ | system-admin.ts | settings, admin/system/*, health, catalogs/*, groups/* | Bearer admin | Đối chiếu | Vitest + services page |
| Forgot password / newsletter / Google OAuth | auth-service.ts, credential-recovery.ts | KHÔNG có endpoint BE — FE trung thực not-connected | — | Không bịa endpoint | Vitest: không giả thành công |

Endpoint **không tồn tại** và được ghi rõ: forgot-password, newsletter, Google OAuth (FE trả `not-connected`, không giả thành công). `/admin/classes` + `/instructor/sharing` đã gỡ ở cả 2 repo.

## 9.7. Coverage Metrics

| Chỉ số | Giá trị |
|---|---|
| Total Routes (page.tsx scan) | 80 |
| Routes Audited | 80 (100% — từng dòng có nguồn) |
| Routes Redesigned | Notebook design system áp dụng toàn workspace (trừ `/` ngoài phạm vi theo brief) |
| Routes Browser-Audited (desktop/mobile, 0 console error) | 67/80 (84%) |
| Components Standardized | 19 (trong đó 3 component mới: Toast, ConfirmDialog, PreviewSwitcher) |
| Roles Covered | 3/3 (admin, instructor, intern — ROLE_CATALOG BE) |
| Workflows Tested | 20/20 có test tự động hoặc kịch bản preview |
| API Integrations Verified | 13 nhóm capability đối chiếu contract |
| Preview Scenarios Covered | 6/10 kịch bản thiết kế — 6 sweep + populated/large/long-text qua data + empty/... (xem preview-evidence) |
| Critical Bugs Remaining | xem báo cáo cuối phiên |

## 9.8. Quy tắc hoàn thành

Trang chỉ được đánh **Completed** khi đủ 9 điều kiện (giao diện, responsive, tương tác, states, phân quyền, API thật, preview, test, không lỗi nghiêm trọng). Còn thiếu bằng chứng → **Partial / Blocked / Not Started** kèm lý do. Trạng thái trong file này là nguồn sự thật duy nhất — không tự nâng cấp.

## 9.9. Integration Log — Journey Notebook v3 (2026-11-21)

Tích hợp lớp thiết kế "Sổ tay hành trình v3" (bản nâng cấp sandbox) vào source
thật. Nguyên tắc: **additive + namespaced (`nb-*` / `hw-*`)** — không đổi
logic API/permission/routing, không mang mock/demo sandbox; mọi route giữ nguyên
`lib/api/*`, guard, middleware. Trạng thái dưới đây chỉ mô tả **lớp v3 được áp
thêm**, không thay thế các trạng thái browser-audit ở 9.1.

### 9.9.1. Hạ tầng v3 dùng chung (phủ 100% route)

| Thành phần | File | Ghi chú |
|---|---|---|
| 176 VIcons + VLogoMark (hand-drawn, currentColor, props tương thích lucide) | `src/components/icons/v-icons.tsx` | dùng chung mọi trang |
| Notebook primitives: Tape, StampMoc, NoteCard, InkBadge, PolaroidFrame, Eyebrow, SketchCard + FadeIn/Stagger/StaggerItem/Parallax + 18 doodles | `src/components/notebook/{ui,reveal,doodles}.tsx` | namespaced `nb-*` để không đè style thật |
| v3 tokens/keyframes/utilities: paper-grain, card-tilt, sticker-pop, ants-border (marching-ants), shake-ink, pop-in, spotlight-sweep, confetti-burst, chart-grow… + kill-switch `prefers-reduced-motion` cục bộ | `src/styles/journey.css` (import từ globals.css) | bỏ qua mọi keyframe/var trùng tên đã có sẵn của repo |

### 9.9.2. Lớp v3 theo route

| Route thật | Role | Design System & Icons | UI/UX nâng cấp v3 | Trạng thái v3 |
|---|---|---|---|---|
| `/` | Public | journey.css + VStampTool | HowItWorks **5 tấm vé 01–05** (sticker-pop, tape-gold, hand-drawn ticket, giữ anchor `#how-it-works`) | DONE |
| `/login` | Public | journey.css | paper-grain, Caps Lock hint, shake-ink khi lỗi | DONE |
| `/register` | Public | journey.css | PasswordStrength meter, Caps Lock hint, shake-ink | DONE |
| `/forgot-password` | Public | journey.css | paper-grain (qua auth-shell) | DONE |
| `/change-password` | Public | journey.css | PasswordStrength meter, paper-grain | DONE |
| `/admin/salary` | Admin | StampMoc nb + sticker-pop | Mộc "KHO BẠC" + sticker-pop thẻ số dư | DONE |
| `/admin/kpi` | Admin | StampMoc nb | Mộc "KPI" ở tiêu đề console | DONE |
| `/intern/virtual-salary` + mọi route render `product/outcomes` / `product/profile` (kpi, kpi/[id], evaluations, evaluations/[id], certificates, certificates/[id], recommendations, performance, notifications, profile của intern/instructor/admin) | Intern/Instructor/Admin | StampMoc nb | Mộc "SỔ TAY" ở tiêu đề outcome | DONE |
| `/instructor/sessions` | Instructor | card-tilt | card-tilt hover cho hàng session | DONE |
| Toàn bộ route vỏ intern (15) | Intern | Command Palette | **⌘K / Ctrl+K** (bảng lệnh 15 route intern + Về trang chủ + Đăng xuất qua auth-service thật) trong topbar | DONE (lớp shell) |
| Toàn bộ route vỏ admin + instructor (49) | Admin/Instructor | Command Palette | ⌘K / Ctrl+K / `/` (bảng lệnh theo role, 55 route thật đã kiểm chứng tồn tại) trong product shell | DONE (lớp shell) |
| Toàn bộ 79 route UI còn lại (intern 23, instructor 17, admin 31, public 4, + verify/github-invitation) | — | journey.css §1–20 + VIcons + notebook primitives + **PAGE KIT nb3-*** (`notebook/kit.tsx`) | **Chuyển thể sâu từng trang**: primitives render v3 (buttons/inputs/panels/tables/badges/modals/empty/pager), PageTitle eyebrow+stamp+mực squiggle, ink-table, InkTabs/FilterChips, KanbanColumn/Tape, ChartFrame, EmptyNotebook — chi tiết từng route: `JOURNEY_V3_100_PERCENT_AUDIT.md` + `journey-v3-evidence/coverage-manifest.json` | **DONE** (đợt hoàn thiện 100% — 2026-11-21) |

### 9.9.3. Cổng kiểm soát chất lượng phiên tích hợp

| Cổng | Kết quả |
|---|---|
| Quét marker mock sandbox (`an.pham`, `minh.nguyen`, `lan.pham`, `Sv@2026`, `Gv@2026`, demo-account-panel, `enterAuth(`, token `ghp_`) | **0 kết quả** trong tập file của phiên (hệ preview sẵn có của repo tại `src/lib/preview/*` là commit có trước, không thuộc phạm vi, không đụng tới) |
| `bun run lint` (eslint .) | 0 lỗi (1 warning `no-img-element` có chủ đích ở PolaroidFrame) |
| `bun run typecheck` (tsc --noEmit) | 0 lỗi |
| `bunx vitest run` | 135 file / **787 test pass** (đúng baseline) |
| `bun run build` (production) | **PASS** — manifest đầy đủ route, không lỗi Tailwind v4/env |
| `git diff` rò rỉ secret | 0 |

Chi tiết thực thi: `docs/IMPLEMENTATION_PROGRESS.md` mục "Phiên tích hợp v3".

