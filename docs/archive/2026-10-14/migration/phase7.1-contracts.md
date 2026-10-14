> Tài liệu lịch sử, lưu để truy vết. Không dùng làm hướng dẫn hoặc bằng chứng cho bản hiện hành. Xem README của repository và docs hiện tại.

# Contract tích hợp Phase 7.1

> Các blocker runtime/visual dưới đây là trạng thái lịch sử Phase 7.1. Xem [xác minh live Phase 7.1.5](phase7.1.5-live-verification.md) cho kết quả mới: SQL 2025 thật, live suite PASS, visual ACCEPTABLE; SQL 2019 vẫn chưa xác minh.

Nguồn kiểm chứng: V-INTERN-BE HEAD 102b9afa0998bcb0237a8fed25c5908f4436c6f2. Backend không bị sửa. Không dùng archive làm nguồn contract.

## Transport và xác thực

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1. Base đã bao gồm version; client ghép path /auth/... hoặc /recruitment/..., credentials include, cache no-store. Access token chỉ nằm trong memory; refresh cookie vintern_refresh do Nest đặt HttpOnly, path /api/v1/auth. FE không đọc cookie, không lưu token/role vào localStorage.

POST /auth/login gửi email/password, nhận accessToken và user. POST /auth/refresh dùng cookie, nhận cùng shape. GET /auth/me xác nhận principal mới từ backend. POST /auth/logout trả 204. Refresh dùng một promise chia sẻ; 401 retry tối đa một lần, 403 không refresh và không giả thành công. Logout xóa memory ngay và chặn response /me hoặc refresh đang chạy phục hồi phiên đã xóa. Logout offline vẫn xóa memory nhưng chưa chứng minh thu hồi cookie phía server; cần kiểm chứng backend và kết nối khả dụng.

Principal gồm id, email, displayName, roles[], permissions[]. Chỉ dùng admin/instructor/intern; không alias teacher. Intern login giải lifecycle trước khi điều hướng. Guard đợi /me, không flash dashboard; mất mạng trả error/retry. Backend vẫn là ranh giới bảo mật.

Lỗi Nest: statusCode, code, message, details?, traceId?. HTTP status thật quyết định xử lý; message/details nội bộ không được hiển thị nguyên văn. Validation, config missing, network, 401/403/404/409/429/500/503 có thông báo riêng. Adapter phân trang chuẩn data + meta(page,pageSize,total,totalPages). Recruitment candidates trả items/total là ngoại lệ hiện tại, không áp adapter chung mù quáng.

## Recruitment

GET /recruitment/me; PATCH /recruitment/me/role với role frontend/backend/qa/business_analyst.
POST /recruitment/me/interviews trả session/questions.
GET /recruitment/me/interviews/:id/questions phục hồi session/questions.
PUT /recruitment/me/interviews/:id/answers/:questionId với answerText, 1..5000 ký tự.
POST /recruitment/me/interviews/:id/submit và /retry-evaluation trả session/result/errorCode?.
GET /recruitment/me/result đã có adapter; UI dùng result nhúng trong profile.

Profile status: not_started, role_selected, interview_in_progress, evaluation_pending, passed, failed. Attempts/cooldown lấy attemptNumber, attemptsRemaining, nextEligibleAt từ Nest. Reload kiểm tra lại cooldown; FE không tự cấp lượt. Role selection cập nhật backend trước khi start.

Session gồm status, serverNow, secondsRemaining, expiresAt và các thời điểm/attemptNumber/questionCount. Countdown chỉ hiển thị secondsRemaining trừ thời gian đã trôi qua; không tự submit hoặc tự xác nhận hết hiệu lực. Nest quyết định lưu/nộp hợp lệ.

Question chỉ có id, position, category, difficulty, prompt, answered, answeredAt. Không có answerText đã lưu: reload hiển thị cờ đã lưu và cho nhập câu trả lời thay thế; không bịa nội dung cũ. Submit chỉ sau khi các câu đã lưu. Draft giữ lại khi lưu thất bại.

Result render technicalScore, softSkillScore, overallScore, decision, feedback/criteria/strengths/weaknesses từ Nest; không tính 70/30 hay threshold ở FE. Evaluation_failed hoặc AI_UNAVAILABLE hiển thị lỗi/retry evaluation, không tạo fake score. Kết quả cũ không được dùng làm kết quả vòng đang pending.

## Workspace

GET /intern/me/workspace được parse unknown theo DTO thật. Các trường: status, assignment|null, recruitment|null, currentSprint|null, taskSummary, focusedTask|null.

| status                  | route/presentation                         |
| ----------------------- | ------------------------------------------ |
| recruitment_required    | welcome hoặc role nếu backend đã chọn role |
| recruitment_in_progress | interview; evaluation_pending sang result  |
| recruitment_failed      | result                                     |
| unassigned              | /intern Waiting                            |
| active                  | /intern Active entry                       |

Active yêu cầu assignment và recruitment passed. Unassigned yêu cầu passed, không assignment/sprint/task, task total=0. Unknown lifecycle và payload mâu thuẫn bị từ chối, không mặc định active.

Waiting giữ EmptyInternWorkspace của integration branch. Sáu hàng lấy role đã chọn, project/session Chưa phân công (DTO unassigned không cung cấp session riêng), sprint/task Chưa có, status Đang chờ phân công. Activity chỉ xuất hiện khi backend có recruitedAt; không fake notification, mentor hay lịch sử. Navigation business Phase 7.2 đều disabled. Active entry render assignment, currentSprint, taskSummary và focusedTask đúng payload; không 9-task demo.

## Contract gaps / giới hạn

- Chưa có endpoint public register, forgot/reset password, Google OAuth, newsletter. UI không giả thành công.
- Không gọi các endpoint archive /admin/overview, /instructor/overview, /reports/export, /activities/summary, /projects/tech-stats, /me/profile, /me/change-password hoặc velocity riêng. Không port đầy đủ màn hình ngoài Phase 7.1.
- GET questions không trả answerText đã lưu. Không tự mở quyền/endpoint lấy nội dung.
- Waiting DTO không có mentor, notification, activity feed hoặc session độc lập khi unassigned. Không tạo business data để lấp chỗ.
- Runtime Nest/SQL chưa được kiểm chứng: backend không có .env và startup thiếu JWT_SECRET/DB_PASSWORD. Không tạo secrets, seed data hoặc sửa BE để bỏ validation.
- Evidence browser là production FE với API test-contract được intercept trong script QA. Không phải chứng cứ live Nest/SQL.
- R01 visual PARTIAL: khác mascot scale/crop, illustration và topbar/sidebar. Không tuyên bố MATCH hay chốt visual gate.
- Logout offline chưa xác nhận thu hồi refresh cookie. Real auth/CORS/cookie rotation cần live QA.

## Mock authority audit

Production routes không import mock business dataset. Demo InternWorkspace chuyển vào src/test/intern-workspace-preview.tsx để giữ presentation regression. Các file mock cũ vẫn có thể tồn tại cho test/presentation cũ nhưng không được routes production sử dụng. Intern presentation chỉ import type từ file cũ (bị xóa khi compile), dữ liệu lấy adapter backend. RecruitmentProvider không có random score, fake timer authority hay memory lifecycle.

Không thêm Prisma/SQLite, src/server, business route handlers, AI provider hoặc secret file. .env.example chỉ có cấu hình công khai. scripts/phase71-browser-qa.mjs và src/test/nest-fixtures.ts là QA/test-only.

## Xác minh

Baseline: 20 suites / 185 tests. Sau tích hợp: 23 suites / 213 tests PASS; xem báo cáo cuối trong chat và phase7-evidence/browser-qa.json. Kiểm thử auth/API/lifecycle/recruitment có mocked API contract chỉ ở test. Browser desktop 1440x900 và mobile 390x844, menu focus/Escape, Active, error và 11 kịch bản chính được lưu evidence. Chưa được coi là release end-to-end.
