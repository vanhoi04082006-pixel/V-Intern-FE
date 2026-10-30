# Đối chiếu UI với capability BE — 29/10/2026

Tài liệu này nối các nhóm API nghiệp vụ ở BE với màn hình FE và nêu rõ những endpoint không phải màn hình sản phẩm. Danh sách 80 URL/source nằm trong [ROUTE-MAP](ROUTE-MAP.md); contract chi tiết và hành vi parser nằm trong [API-CONTRACTS](API-CONTRACTS.md). Quản lý lớp và chia sẻ phiên đã được gỡ khỏi FE/BE. Đây là bảng coverage từ source, không thay thế nghiệm thu browser từng route, trạng thái dữ liệu và quyền.

## Capability có giao diện

| Capability BE | API chính | Màn hình FE | Quyền và hành vi chính |
|---|---|---|---|
| Đăng nhập, phiên và hồ sơ | `auth/*`, `users/*`, `permissions`, `roles/*/permissions` | `/login`, `/register`, `/forgot-password`, `/change-password`, `/{admin,instructor,intern}/profile`, `/admin/users`, `/admin/roles` | Auth dùng refresh cookie; workspace guard và `Can` điều khiển màn hình; BE kiểm tra lại từng request. |
| Nộp hồ sơ và tuyển dụng | `applications/*`, `recruitment/*`, `recruitment-rounds/*`, `career-roles/*` | `/apply`, `/verify`, `/intern/onboarding/**`, `/admin/recruitment-rounds`, `/instructor/recruitment-rounds`, `/admin/career-roles` | Hồ sơ riêng tư; CV, lịch, retry, hủy và credential recovery đi qua thao tác có trạng thái. |
| Thư viện dự án và đánh giá mẫu | `projects/*`, `project-templates/*`, `project-changes/*` | `/instructor/projects`, `/instructor/projects/[id]`, `/admin/templates` | Assessment được nạp theo revision hoặc phiên bản đã ghim; quyền đọc tài liệu chấm riêng vẫn theo `templates.assessment.read`. |
| Phiên thực tập và phân công | `sessions/*`, `assignments/*`, `sessions/member-options`, `sessions/instructor-options` | `/instructor/sessions`, `/instructor/sessions/[id]`, `/instructor/sessions/[id]/setup`, `/admin/sessions`, `/admin/sessions/[id]` | Scope chủ sở hữu và điều kiện đủ được BE xác thực; AI plan là bản nháp trước khi phát hành. |
| Sprint, task và bài nộp | `sprints/*`, `tasks/*`, `submissions/*`, `ai-generations/*` | `/instructor/sprints/**`, `/instructor/tasks/[id]`, `/admin/sprints/**`, `/admin/tasks/**`, `/intern/sprint`, `/intern/work/**` | Board, dependency, spec/DoD, bài nộp, SHA, AI review và quyết định giảng viên giữ đúng state server. |
| GitHub và repository | `github/me`, `github/repository-account`, `sessions/*/github/*` | `/admin/settings`, `/admin/services`, `/instructor/github`, `/instructor/sessions/[id]`, `/intern/github`, `/github/invitation` | Owner, repository, provision, invitation, access reconciliation và activity có trạng thái thật; webhook đến là tích hợp server. |
| AI Mentor và gợi ý | `intern/me/ai-mentor/*`, `intern/me/ai-recommendations`, `performance/interns/*/ai-recommendations`, `admin/agents/*` | `/intern/mentor`, `/intern/recommendations`, `/instructor/performance`, `/admin/ai`, `/admin/knowledge/**` | Context được giới hạn theo principal/scope; trạng thái run có thể poll, cancel, resume hoặc retry qua API riêng. |
| Đánh giá, KPI, lương, chứng nhận | `evaluations/*`, `kpi-periods/*`, `kpi-results/*`, `virtual-salary/*`, `certificates/*` | `/instructor/evaluations`, `/intern/evaluations/**`, `/admin/kpi`, `/intern/kpi/**`, `/admin/salary`, `/intern/virtual-salary`, `/admin/certificates`, `/intern/certificates/**`, `/verify` | UI giữ null và provenance, phân biệt đề xuất với kết quả được xác nhận, xác nhận stale và thu hồi theo response BE. |
| Hiệu suất và báo cáo | `performance/*`, `reports/*`, `dashboard/*` | `/admin`, `/instructor`, `/intern`, các trang `/performance`, `/reports` của vai trò tương ứng | Ownership/filter/pagination nằm ở BE; export phản ánh snapshot và permission hiện hành. |
| Thông báo và audit | `notifications/*`, `activity-events`, `audit-logs` | `/{admin,instructor,intern}/notifications`, badge topbar, `/admin/activity`, `/admin/audit` | Đọc/đánh dấu/tùy chọn có feedback; activity và audit tách theo nguồn/permission. |
| Cấu hình hệ thống và tri thức | `settings`, `admin/system/*`, `admin/ai-configuration`, `admin/communications/*`, `admin/question-bank/*`, `admin/knowledge/*`, `catalogs/*`, `groups/*` | `/admin/settings`, `/admin/services`, `/admin/ai`, `/admin/communications`, `/admin/questions`, `/admin/knowledge/**`, `/admin/catalogs`, `/admin/groups` | Hiển thị lỗi có thể phục hồi; contract/health/repository và lịch gửi có khu vực vận hành riêng. |

## Endpoint không cần màn hình thao tác riêng

| Endpoint | Phân loại | Surface liên quan |
|---|---|---|
| `POST /auth/refresh` | Nội bộ phiên cookie; FE gọi khi access token hết hạn. | Mọi workspace đã xác thực. |
| `GET /github/callback` | OAuth callback/redirect, không phải trang thao tác người dùng. | Các nút kết nối GitHub dẫn qua callback rồi quay về màn hình nguồn. |
| `POST /github/webhook` | Webhook inbound từ GitHub; hệ thống xử lý sự kiện server-to-server. | `/admin/services` và màn GitHub theo dõi trạng thái/kết quả, không chỉnh payload webhook. |
| `GET /health` | Probe vận hành; không có nghiệp vụ CRUD. | `/admin/services` hiển thị trạng thái dịch vụ. |
| `GET /reference-screens` và `GET /reference-screens/:key` | Ảnh tham chiếu được gắn nhãn để xem trong công cụ audit; không phải dữ liệu vận hành hoặc màn hình sản phẩm. | Không có route sản phẩm. |

`GET /tasks/:id/spec/source` không thuộc nhóm endpoint ẩn: component `TaskSpec` dùng nó để mở/đóng phần spec nguồn bên cạnh tiêu chí đã dựng, và BE vẫn giới hạn principal. `POST /sessions/:id/github/webhook` là thao tác cấu hình webhook cho phiên, được gọi từ UI quản lý GitHub.

## Phát hiện audit và giới hạn

- Route `/admin/classes` và `/instructor/sharing` đã bị gỡ; `/instructor/classes` giữ redirect tương thích về `/instructor/projects`. Không còn adapter FE cho API quản lý lớp hoặc chia sẻ phiên.
- Scanner tĩnh có thể báo sai với path được ghép bằng helper/encodeURIComponent và `method` chọn theo điều kiện. Các trường hợp cần xem tận adapter là `saveMilestone`, `saveGroup`, `saveCatalogItem`, `updateImportedReview` và các API `base`/`path(code)`. Trước khi kết luận mismatch, đối chiếu route decorator BE, method runtime trong adapter và component gọi adapter.
- Inventory sau khi gỡ hai capability có 80 source routes. Bảng này ghi coverage từ source; nghiệm thu runtime từng trang và trạng thái dữ liệu cần gắn với lượt browser audit tương ứng.

Trang chủ `/` vẫn nằm ngoài phạm vi redesign theo yêu cầu đã duyệt.
