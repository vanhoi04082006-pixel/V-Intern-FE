# Audit nguồn Admin và các trang hỗ trợ

Ngày đối chiếu: 26/10/2026. Phạm vi là source frontend hiện hành; chưa dùng báo cáo này để khẳng định đã nghiệm thu hình ảnh, tương phản hoặc responsive trên trình duyệt. Trang chủ `/` được giữ nguyên theo xác nhận của người dùng.

## Hệ thống đang có

- Next.js 16.4.2 App Router, React 19.2, TypeScript 5.9; Tailwind CSS 4.1 CSS-first, `framer-motion` 12.26.2 và `lucide-react` đã có.
- Chưa có Radix/shadcn dependency. Không cần thêm một thư viện chỉ để tạo bảng, divider, hàng thông tin hay disclosure.
- 28 route Admin dùng `WorkspaceGuard` (`admin`) → `workspace-ui aurora-workspace` → `ProductShell`. Một số route dùng chung component nghiệp vụ với giảng viên và sinh viên.
- Auth dùng `AuthShell`/`AuthCard` riêng. `/apply`, `/verify`, `/github/invitation` chưa dùng chung surface wrapper với app; cần đưa chúng về cùng token, không đưa chúng vào navigation riêng tư.
- Các API, trạng thái chờ/lỗi và retry đều đã hiện hữu. Không có lý do đổi backend hay API contract để thực hiện redesign.

## Bản đồ route và chủ sở hữu

| Route | Component chính | Chức năng phải giữ |
|---|---|---|
| `/admin` | `product/admin-management.tsx` → `AdminOverview` | Tổng số thật từ 4 API, hoạt động gần đây, 5 liên kết quản trị |
| `/admin/users` | `AdminUsers`, `UserForm`, `UserPicker`, `RoleChoices` | Search, lọc vai trò/trạng thái, phân trang danh sách và vai trò, tạo/sửa tài khoản, đổi trạng thái, chặn tự đổi trạng thái chính mình |
| `/admin/roles` | `AdminRoles` | Chọn vai trò, xem tất cả quyền, phân trang vai trò/quyền, tra cứu RBAC chỉ đọc |
| `/admin/groups` | `AdminGroups`, `GroupDetail`, `GroupRoleForm` | Tạo/sửa nhóm, thêm/gỡ thành viên, gán vai trò, xem quyền kế thừa, phân trang |
| `/admin/catalogs` | `AdminCatalogs` | Danh sách loại, chọn loại, tạo loại/giá trị, xem/sửa giá trị, thứ tự/trạng thái, phân trang độc lập |
| `/admin/settings` | `GithubRepositoryAdmin` + `AdminSettings embedded` | OAuth chung, webhook, cấu hình nghiệp vụ, chặn khóa dịch vụ nhạy cảm khỏi cấu hình nghiệp vụ |
| `/admin/audit` | `AdminAudit` | Người thực hiện, hành động, từ/đến, phân trang, xem toàn bộ chi tiết audit |
| `/admin/activity` | `AdminActivity` | Lọc module/actor, phân trang, dữ liệu hoạt động thật |
| `/admin/services` | `AdminServices` + `AdminSystemStatus` | Kiểm tra lại health, độ trễ/uptime, cấu hình OAuth/webhook/runner, trạng thái quét cảnh báo, AI 24 giờ, hợp đồng seal và repo theo phiên |
| `/admin/ai` | `admin/ai-configuration.tsx`, `business-agent-monitor.tsx` | Model ID/timeout/retry, fallback notice, lịch sử Agent metadata chỉ đọc, lọc và phân trang |
| `/admin/communications` | `admin/communications.tsx` | Hàng đợi, trạng thái giao nhận trung thực, preview bảo mật, gửi lại có điều kiện, xác nhận nguy cơ trùng và cooldown |
| `/admin/career-roles` | `career-roles.tsx`, `career-role-editor.tsx` | Search/status, bản nháp/xuất bản/lưu trữ, nhận hồ sơ, kỹ năng/trọng số 100%, lịch sử/version conflict |
| `/admin/questions` | `question-bank.tsx`, `question-editor.tsx` | Độ phủ, nghề/nhóm/trạng thái/search, tạo/sửa câu hỏi, đáp án/hướng dẫn riêng tư, ngừng sử dụng có xác nhận |
| `/admin/templates` | `templates-manager.tsx`, `template-editor.tsx` | Search/status, xem blueprint/tài liệu, tạo/sửa/nhân bản, lưu trữ/khôi phục có xác nhận, assessment được phân quyền riêng |
| `/admin/knowledge` | `knowledge/library.tsx` | Lọc trạng thái/loại/phạm vi/mục đích/nghề/search, preview, kiểm tra import, phân trang, quyền đọc/quản lý |
| `/admin/knowledge/new` | `knowledge/editor.tsx` | Biên soạn bản nháp, đa loại nội dung, nguồn, phạm vi; không tạo bản ghi trước khi lưu |
| `/admin/knowledge/[code]` | `knowledge/editor.tsx` | Lưu version, preview/publish/history/archive/restore/compare, dirty guard, quyền publish độc lập |
| `/admin/recruitment-rounds` | `applications/recruitment-rounds.tsx` | Tạo/mở/đóng đợt, khung giờ, hồ sơ/CV, lịch lại, gửi lại thông tin đăng nhập có preview/lý do/xác nhận |
| `/admin/sessions` | `admin/sessions.tsx` → `SessionList` + `AcademicDetail` | Danh sách phiên và chi tiết học thuật |
| `/admin/sessions/[id]` | `sessions/session-overview.tsx` | Chi tiết phiên; giữ `basePath=/admin` |
| `/admin/sprints` | `sessions/delivery-overview.tsx` | Project/session searchParams và delivery overview |
| `/admin/sprints/[id]` | `sessions/sprint-workspace.tsx` | Chi tiết Sprint và toàn bộ hành động theo quyền |
| `/admin/tasks` | `product/sprint-management.tsx` → `TaskManagement` | Quản lý task/review |
| `/admin/tasks/[id]` | `product/intern-work.tsx` → `TaskDetail managed` | Chi tiết task ở chế độ quản lý |
| `/admin/reports` | `sessions/reports-workspace.tsx` | Project/session searchParams và báo cáo |
| `/admin/performance` | `product/member-performance.tsx` | Project/session searchParams, `basePath=/admin` |
| `/admin/notifications` | `product/outcomes.tsx` → `Notifications` | Đọc thông báo, action liên kết, tùy chọn thông báo |
| `/admin/profile` | `product/outcomes.tsx` → `Profile` | Hồ sơ thật và cập nhật tài khoản |

Các trang hỗ trợ: `/login` → `LoginForm`; `/register` → `RegisterForm`; `/forgot-password` → `ForgotPasswordForm`; `/change-password` → `ChangePassword`; `/apply` → `PublicApplication`; `/verify?code=` → `Verify`; `/github/invitation?session=` → `SessionRepositoryCard` có guard cho cả ba vai.

## Phát hiện có bằng chứng trong source

| Mức | Phát hiện | Nguồn | Hướng xử lý sau token chung |
|---|---|---|---|
| P1 về tiêu chí redesign | Màu literal và biểu đồ theo palette nội bộ, không theo theme | `product/collection-insights.tsx:5`, `applications/public-application.tsx:146` | Chuyển màu chart/surface về token semantic tập trung. Google logo là màu thương hiệu bên thứ ba, cần waiver rõ nếu giữ. |
| P2 | Layout quản trị lặp metric thẻ → panel bảng → aside có donut → quick action → panel trống lịch sử. Mỗi collection có cùng composition dù công việc khác nhau. | `product/collection-insights.tsx:28`, `:153`; `product/admin-management.tsx:276`, `:1460`, `:1645` | Dùng stat strip + bảng/list làm nội dung chính. Gom nguồn/phạm vi số liệu thành chú thích. Đưa phụ trợ thành disclosure, giữ nội dung và liên kết. |
| P2 | Overview có 4 thẻ cùng trọng lượng và một list quick action được đóng hộp riêng từng hàng | `product/admin-management.tsx:60`, `:99` | Tiêu đề gọn, thống kê dạng dải, hoạt động là khối chính, shortcut dạng danh sách có divider. |
| P2 | Danh mục có 3 panel ngang và đồng thời mở modal khi chọn item; cần phân biệt chọn/xem/sửa rõ hơn trong layout | `product/admin-management.tsx:1023`, `:1064` | Giữ handler hiện tại trong lần redesign; dùng vùng chọn loại, collection trung tâm, metadata phụ trợ. Thay đổi ý nghĩa click cần xác minh riêng, không lén thay behavior. |
| P2 | Quyền và danh sách lựa chọn dùng nhiều hộp cùng kiểu; vùng role/perms chiếm hai cột cân nhau dù nhiệm vụ là tra cứu | `product/admin-management.tsx:563`, `:603`, `:193` | Navigator vai trò gọn và permission list có grouping; không biến trang tra cứu thành form cấp quyền mới. |
| P2 | Ngân hàng câu hỏi dùng 4 badge trên mọi dòng và một thẻ độ phủ cho mọi nghề; số nghề có thể tăng không giới hạn | `admin/question-bank.tsx:24`, `:26` | Chuyển độ phủ thành bảng có số/tiến độ thực; metadata ở một dòng trung tính, giữ từng giá trị. |
| P2 | Thư viện template là card lồng trong panel; 4 action màu/độ đậm giống nhau khó scan | `admin/templates-manager.tsx:21` | Template là object độc lập nên giữ card compact; tách primary view/edit với action thứ cấp. Không mất nhân bản/lưu trữ/materials. |
| P2 | Trang health nối hai lớp tổng quan/config và nhiều thẻ lồng nhau; status cấu hình khác status hoạt động nên phải đọc chú thích dài | `admin/system-status.tsx:14`, `:16`, `:17`; `product/admin-management.tsx:1764` | Health matrix + bảng tích hợp; đặt trạng thái và scope ngay cạnh tên. Giữ nguyên thông điệp chưa probe/chưa xác nhận truy vấn. |
| P2 | Lưu AI và phần lớn mutation Admin chỉ reload/đóng dialog, không có xác nhận thành công đọc được sau thao tác | `admin/ai-configuration.tsx:66`; `product/use-action.ts:17`; `product/admin-management.tsx:232` | Bổ sung status thông báo sau kết quả thành công thật, giữ in-flight guard và lỗi server. Cần kiểm thử feedback khi thêm state mới. |
| P2 | Auth vẫn có giant editorial area, background lớn, shadow/radius/font-size arbitrary; input và button một bộ riêng | `auth/auth-shell.tsx:54`, `:128`; `auth/auth-card.tsx:19`; `auth/auth-field.tsx:77` | Auth surface compact cùng token/type/radius; giữ tất cả form/Google/terms/recovery và test hooks. Không thay landing `/`. |
| P2 | Recruitment tabs dùng role tablist/tab nhưng chưa có quan hệ tabpanel/aria-controls và thao tác mũi tên | `applications/recruitment-rounds.tsx:235` | Hoàn thiện behavior tab bằng primitive hiện hữu hoặc pattern đúng; không cài package chỉ để đổi style. |
| Cần render | Các action inline chưa có min-height riêng, bảng có nhiều email/ID, grid có cột fixed | `admin/career-roles.tsx:35`; `admin/business-agent-monitor.tsx:130`; `product/admin-management.tsx:563` | Xác minh 375/480/768/1024/1280/1440 và keyboard; không khẳng định overflow/contrast từ source. Bảng Agent đã có scroll region riêng. |

Không chấm điểm contrast, visual hierarchy bằng ảnh hay responsive là “đạt” trong tài liệu này. Phải xem before/after thật sau khi parent chốt tokens và shell.

## Ràng buộc bảo toàn bắt buộc

1. Knowledge: `knowledge.read`, `knowledge.manage`, `knowledge.publish` được kiểm tra riêng; publish-only Admin vẫn được review/publish nhưng không author/import. Giữ staff-only/grading-only audience, dirty `beforeunload`, xác nhận đổi loại, so version conflict, restore phiên bản được chọn và các trường nâng cao không hiểu trong draft. Kho hiện ghi rõ chưa nối vào lượt AI; không sửa copy thành đã có tích hợp.
2. Email: SMTP accepted khác delivered. Preview credential/verify có thể bị redacted; không inject HTML ngoài sandbox hiện hữu. Gửi lại uncertain cần acknowledgement, chặn credentials/verify/expired, giữ 60 giây cooldown và in-flight guard. Không gọi model hay đổi password qua nút làm mới/gửi lại.
3. Template/question/career: giữ optimistic version, private reference/rubric, quyền `templates.assessment.manage`, English phase buộc `en`, chặn role identity đổi sau khi tạo, xác nhận retire/archive, snapshot phiên cũ. Thay layout không làm rơi metadata JSON.
4. Users/groups: giữ `Can users.create`, `Can groups.manage`, chính sách server, tự đổi trạng thái bị disable, search+pagination của picker và permission kế thừa. Không sửa phân quyền chỉ vì nút không hợp layout.
5. Public application: giữ token verify ở fragment và xóa khỏi URL, xử lý chỉ một lần trong StrictMode, candidate-session cookie, multipart CV, consent nguyên văn, lỗi không xóa input, bổ sung CV, hồ sơ cũ khi ứng tuyển đợt khác, logout candidate, hướng dẫn trễ 15 phút và tài khoản gửi riêng.
6. Change password: phiên hiện tại phải được kiểm tra, mật khẩu khớp/giới hạn, clear session + notify other tabs + redirect sau thành công thật.
7. Invitation: guard cả ba role, kiểm tra session GUID, câu nhắc đúng GitHub identity và liên kết về `/` giữ nguyên.
8. Auth: label/id/name/type, validation/focus lỗi, noValidate cùng custom messages, login role redirect, Google, remember me, terms và preview chỉ dev phải giữ. Không tạo UI success giả.

## Coverage tìm thấy, chưa chạy lại

- Admin overview: totals thật/zero/all-or-error/retry/links+activity.
- Career: tạo draft, version conflict giữ draft, archive confirmation/history.
- Question/template/assessment: version/private guidance, English phase, advanced JSON/metadata, malformed JSON, field editor.
- Knowledge: permission, publish-only, creation/navigate, unsaved guard, compare conflict, kind-change audience, restore confirmation, dry-run import, Markdown/source safety, unknown rubric fields.
- Communications: uncertain acknowledgement/double-click/server failure, redacted preview, expired resend.
- Contracts/Agent: nguồn và trạng thái thật, JSON draft không claim đã lưu, metadata/filter/error retry/empty.
- Public application: multipart double submit, giữ form khi lỗi, verify fragment/StrictMode/hashchange/expired, chuyển đợt giữ CV.
- Recruitment: CV evidence, credential resend không reset; recovery preview/reason/confirmation/ineligible/stale preview; rebooking attempt policy/career/reason/double-submit.
- Auth: tabs, back link, field validation/focus, password visibility, pending double submit, login success theo 3 role, server/auth error, disconnected honest state; registration terms/email/password/confirmation/success; guard stale role/network/logout.
- Chưa tìm thấy direct component test cho AdminUsers/Groups/Roles/Catalogs/Audit/Services, AiConfiguration, Questions list, Templates list, ForgotPassword, ChangePassword. Đây là thiếu coverage nguồn, không phải bằng chứng hỏng chức năng. Kiểm thử UI thật phải bổ sung vào ma trận nghiệm thu; không sửa test cũ để pass.

## Nhóm triển khai có thể tách sau khi foundation được chốt

| Nhóm | File nguồn | Ranh giới |
|---|---|---|
| Admin quản trị | `product/admin-management.tsx`, `product/collection-insights.tsx` | Không sửa shared primitives/shell/workspace CSS; dùng token và class được parent chốt |
| Thư viện | `admin/career-*`, `question-*`, `templates-manager.tsx`, editor fields | Không thay lib API; template vật liệu/blueprint shared giữ hành vi |
| Knowledge | `admin/knowledge/*.tsx` | Layout đã dùng list/disclosure tốt; tập trung token/type/hierarchy/forms, không thay workflow/permissions |
| Vận hành | `admin/ai-configuration.tsx`, `business-agent-monitor.tsx`, `communications.tsx`, `system-status.tsx`, `contracts-card.tsx` | Dữ liệu health/model/send trung thực; phản hồi mutation cần test |
| Auth và public | `auth/*.tsx` trừ guard/session logic, `applications/public-application.tsx`, `src/app/github/invitation/page.tsx` | Đưa về shared token wrapper; không sửa landing hay outcomes shared |
| Recruitment | `applications/recruitment-rounds.tsx`, recovery/rebooking | Dùng chung Admin/Instructor; không giao đồng thời hai người sửa |

Các owner shared như `outcomes`, profile, primitives, shell, workspace CSS, session reports/AI plan nằm ngoài nhóm chỉnh sửa của audit này và đang do parent điều phối.
