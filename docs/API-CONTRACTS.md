# API và lifecycle frontend

> Bộ bàn giao theo lộ trình đọc: [HANDOVER](HANDOVER.md). Trang này là chương tra cứu chuyên sâu; kết quả chạy thực tế xem [VERIFICATION](VERIFICATION.md).


Admin chọn tài khoản tạo repo chung qua `POST /github/repository-account` (không nhận mật khẩu/token trong body; dùng chính GitHub đã liên kết của Admin). Yêu cầu `settings.update` và vai trò Admin; GET cùng đường dẫn yêu cầu `settings.read`, trả configured/connected/login/ready. OAuth của Admin xin read:user public_repo, callback về /admin/settings; giảng viên/sinh viên xin read:user để xác minh danh tính và nhận lời mời. Start tự tạo repo; worker mỗi60giây xử lý tối đa3phiên và5lời mời/phiên. Nút đồng bộ của chủ trì dùng credential owner đã ghi, không yêu cầu quyền tạo repo từ giảng viên. Repo cũ giữ owner/URL; scope không đủ hoặc danh tính đổi phải báo lỗi. GitHub gửi lời mời/email qua tài khoản numeric ID đã liên kết; không đoán username từ email ứng dụng.

Task detail giữ tên/code sprint đã validate và ưu tiên tiếng Việt. `/tasks/:id/spec` phục vụ hiển thị dependency status; `/tasks/:id/spec/source` xuất raw snapshot để operator seal runner, không dùng thay display API. Notification chỉ chấp nhận route nội bộ đúng vai trò, giữ nguyên task ID kể cả GUID viết hoa; mark-read không đổi trạng thái nghiệp vụ. AI review lưu kết luận gốc, UI ghép thêm trạng thái bài nộp để không hiện chờ duyệt sau quyết định cuối.

Task list cung cấp metadata Sprint và `repository: {status,fullName}|null` của đúng phiên. Kanban dùng dữ liệu đã hydrate của trang, hiển thị Sprint/tiến độ/trạng thái repository mà không gọi task detail hoặc GitHub cho từng thẻ. Parser chỉ nhận `provisioning/ready/failed`; trạng thái không hợp lệ bị từ chối. Response cũ thiếu trường này vẫn đọc được.

Danh sách phiên gửi `sortBy=startDate|endDate|name|progress` và `sortDirection=asc|desc`; đổi sắp xếp/trạng thái/tìm kiếm trở về trang đầu. Backend tìm cả dự án và sắp xếp trước phân trang. UI đọc `currentSprint` và `alerts` từ API; planned không được gọi là đang chạy, cảnh báo chỉ hiện khi có dữ liệu thật. Response cũ không có các trường bổ sung vẫn đọc được.

Chi tiết phiên dùng `/sessions/:id/work` cho từng trang task và `/sessions/:id/timeline` cho lịch sử theo target. Role lấy từ assignment của phiên. Task có bộ lọc trạng thái/ưu tiên/người nhận và nút lọc theo từng Sprint; nội dung bài nộp giữ SHA/PR và tách đề xuất AI khỏi điểm/quyết định giảng viên. Link source chỉ mở HTTPS GitHub hợp lệ. Mục tiêu/đầu ra trong snapshot đọc cả cấu trúc object và array. Hiệu suất và báo cáo nhúng chỉ tải khi mở, khóa project/session của trang và giữ permission gate; không thay thế kiểm tra quyền backend. Không tự gọi provider, tạo repo hay sửa kết quả khi xem phiên.

Base lấy NEXT_PUBLIC_API_BASE_URL gồm /api/v1. Mọi request dùng credentials:include và Bearer access token khi cần. Refresh cookie HttpOnly; access token ở memory. Adapter kiểm tra field/type/nullable; response sai không render như dữ liệu hợp lệ.

| Nhóm adapter | Hành vi |
|---|---|
| workspace/recruitment | Lifecycle, profile, own session, conversation next/clarify, answer, submit/retry |
| templates/sessions | Library/detail/create run, eligible members, Start, plan history/publish |
| work/submissions | Own tasks/specs/comments/history, nộp/rút bài, AI review và rubric cuối |
| github | Trạng thái kết nối, authorize redirect, repo/provision/invitation, webhook setup và activity phân trang |
| sharing | Xin xem, approve/deny/revoke, snapshot chỉ đọc |
| mentor | Own conversation/history, selected own taskId |
| reports/performance | Scope quản lý, phân trang, PDF/XLSX |

Lỗi 401 xóa phiên và yêu cầu đăng nhập;403 từ chối quyền;409 reload dữ liệu và cho xử lý xung đột;429/5xx hiển thị retry. Refresh bị throttled/transport error không giả thành logout; cookie invalid/revoked vẫn fail closed.

Sinh viên đã passed nhưng chưa assignment chỉ dùng route chờ, notifications, profile và github. requireAssignment là gate trước mount, không phải bảo mật duy nhất: API BE vẫn xác thực sở hữu. Sau assignment phải lấy workspace mới; không tự đặt active trong local state.

Ngoại lệ lịch sử có căn cứ: workspace trả hasAssignmentHistory từ EXISTS assignment của chính sinh viên. Khi không còn active nhưng đã có lịch sử, các trang own evaluations/performance/KPI/salary/certificates và route chi tiết vẫn đọc được. Task/sprint/project/Mentor/recommendations không mount. Người chưa từng được phân công giữ waiting gọn; các API own vẫn kiểm tra principal, flag không cấp quyền backend. Chứng nhận hiển thị project/session/completedAt từ snapshot; verify công khai không trả dữ liệu nội bộ, revoked ẩn thông tin người nhận.

Performance directory dùng `items,total,page,pageSize` (10 mặc định), xếp hạng/tìm kiếm ở server. Bộ chọn evaluation cũng phân trang. Student detail lấy `/performance/interns/:id/detail` với scope, task page và trend sáu tháng UTC từ history. Report schema2 đọc thêm task/sprint/review/timeline và cảnh báo có căn cứ; parser giữ tương thích snapshot cũ. Filter tạo report có sprintId/studentId, reset khi đổi project/session; file xuất phản ánh snapshot, không sửa số liệu hiện tại.

Admin có route questions/ai/templates/sessions/performance/reports, dùng cùng API đã kiểm tra quyền. Template editor giữ definition đầy đủ, gửi expectedVersion; archive/restore giữ snapshot. Link drill-down lấy basePath của workspace. ErrorState chỉ hiện details DTO đã giới hạn cho VALIDATION_ERROR400/422; không hiện chi tiết lỗi server.

API không trả đáp án mẫu/rubric tuyển dụng. Điểm AI code review là đề xuất, kèm evidence/limitations; task Done cần quyết định đã lưu từ BE. UI không gọi merge PR hoặc nhận trường passed từ model làm authority.

Evidence trustedTests mới có executionTimeMs, score và checks tên/kết quả/log do runner ký và BE kiểm tra. UI hiển thị thời gian, điểm test và từng tiêu chí đạt/chưa đạt cạnh kết luận AI. Bản ghi cũ không có nhóm chi tiết vẫn parse được, không tự điền số đo.

Conversation currentQuestion.kind là main hoặc follow_up. Câu phụ lưu qua PUT /recruitment/me/interviews/:id/follow-ups/:questionId; câu chính tiếp tục dùng /answers. Gửi xong tải lại conversation/next, không tự tăng chỉ số lượt. GET /recruitment/me/interviews phân trang lịch sử kết quả của principal. Điểm tiếng Anh riêng có thể null ở kết quả cũ.

Planning giữ key ổn định, dependsOn, parentKey, expectedOutput, estimatedHours, skillTags, complexity và milestones khi sửa/chuyển task. Khi publish, backend ánh xạ key sang UUID và xác nhận lại quan hệ/deadline. Task spec trả danh sách phụ thuộc đã được scope theo project, có code/title/status để trình bày. Không tự suy Done hoặc bỏ chặn khi chỉ thay đổi UI.
