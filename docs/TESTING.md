# Kiểm thử frontend

npm test dùng Vitest/JSDOM; npm run typecheck/lint/build là gate riêng. Test hồi quy gồm passed-unassigned entry/navigation, chat recovery/pending, future prompt protection qua adapter, Kanban reload và rubric AI sau tải dữ liệu. Không skip hoặc xóa assertion để làm xanh.

Browser dùng Chrome/Playwright với Nest/SQL thật. Kiểm tra login, refresh qua reload, route đang xem, heading thật, request failures, mobile overflow, Escape và desktop resize. Ảnh chụp trang login không được tính là bằng chứng route private đã kiểm tra. Dùng client navigation cho nhiều route; hard reload quá nhiều có thể đạt auth rate limit.

Database nghiệm thu phải riêng; không thêm data fixture vào ba tài khoản trắng của runtime. Provider deterministic chỉ trong harness test và phải xử lý đúng feature/schema. Provider thật có thể503/invalid JSON; ghi lại trạng thái thất bại và retry thay vì bịa điểm.

Workflow full-stack ghim COMPATIBLE_BE_SHA bằng commit BE hiện hành đã có trên remote. Harness test-only xử lý next/clarify/follow-up/evaluation theo đúng schema, evaluation có sáu chiều; fixture chỉ trả lời câu hiện tại qua API, không lấy trước danh sách câu hỏi. Node contract tests kiểm tra cả thiếu evidence và follow-up. Giữ toàn bộ gate role/ownership, publish/idempotency, outcomes và browser. Không xem run dùng pin khác là bằng chứng cho thay đổi mới.

Luồng nộp code dùng fixture ở ranh giới GitHub HTTP, chỉ GET repository/PR/diff/blob/checks đã đăng ký trong database VIntern_Phase715_ riêng. Khóa mã hóa tạm sinh trong từng job; transport từ chối credential thật, mutation và database ngoài test. Auth, scope, SHA, chấm AI và quyết định giảng viên vẫn đi qua domain service thật. Không giả lập execution pass: AI luôn inconclusive, duyệt cần lý do thủ công được audit. Fixture legacy chỉ kiểm tra hợp đồng nộp bài cũ, không được xem là nghiệm thu GitHub.

CI chạy thêm audit dependency production, chặn high/critical. Audit toàn cây dev vẫn được review riêng: [finding chưa có bản vá và reachability](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/DEPENDENCIES.md). Gate này không tuyên bố full audit sạch.

Geist/Geist Mono/Caveat được đóng gói trong source, dùng next/font/local để build không tải font từ Google. [Nguồn, checksum và giấy phép](../src/app/fonts/README.md) được giữ cùng assets; khi đổi font phải kiểm tra build và hiển thị tiếng Việt/mobile. Không retry build ngẫu nhiên để che lỗi xử lý URL font upstream.

Signup phải gọi API thật, gửi consent rõ ràng, không tự gán role hoặc đăng nhập khi chưa có session. Kiểm tra409/429/đăng ký bị đóng, mật khẩu theo giới hạn UTF8 của bcrypt. Form đăng nhập ghi Email theo hợp đồng API. Các case mới bao gồm lịch sử own outcomes sau placement, report filter/snapshot, blueprint/admin version conflict và chi tiết trusted runner có timing/score/checks.

Kết quả hiện tại: [kiểm chứng frontend](VERIFICATION.md) và [kiểm chứng toàn hệ thống](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/VERIFICATION.md); báo cáo archive chỉ dùng truy vết. Viewport đã kiểm tra gồm1440/820/390px, với backend/SQL thật và dữ liệu nghiệm thu riêng.
