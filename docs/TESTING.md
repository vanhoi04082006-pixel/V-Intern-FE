# Kiểm thử frontend

npm test dùng Vitest/JSDOM; npm run typecheck/lint/build là gate riêng. Test hồi quy gồm passed-unassigned entry/navigation, chat recovery/pending, future prompt protection qua adapter, Kanban reload và rubric AI sau tải dữ liệu. Không skip hoặc xóa assertion để làm xanh.

Browser dùng Chrome/Playwright với Nest/SQL thật. Kiểm tra login, refresh qua reload, route đang xem, heading thật, request failures, mobile overflow, Escape và desktop resize. Ảnh chụp trang login không được tính là bằng chứng route private đã kiểm tra. Dùng client navigation cho nhiều route; hard reload quá nhiều có thể đạt auth rate limit.

Database nghiệm thu phải riêng; không thêm data fixture vào ba tài khoản trắng của runtime. Provider deterministic chỉ trong harness test và phải xử lý đúng feature/schema. Provider thật có thể503/invalid JSON; ghi lại trạng thái thất bại và retry thay vì bịa điểm.

Workflow full-stack cũ ghim BE_SHA để kiểm chứng baseline lịch sử. Khi cập nhật contract phải pin commit BE đã review tương thích và cập nhật fixture/assertions cho chat10câu. Không xem một run cũ dùng BEpin khác là bằng chứng cho feature mới.

Signup phải gọi API thật, gửi consent rõ ràng, không tự gán role hoặc đăng nhập khi chưa có session. Kiểm tra409/429/đăng ký bị đóng, mật khẩu theo giới hạn UTF8 của bcrypt. Form đăng nhập ghi Email theo hợp đồng API. Các case mới bao gồm lịch sử own outcomes sau placement, report filter/snapshot, blueprint/admin version conflict và chi tiết trusted runner có timing/score/checks.

Kết quả hiện tại: [kiểm chứng frontend](VERIFICATION.md) và [kiểm chứng toàn hệ thống](../../docs/VERIFICATION.md); báo cáo archive chỉ dùng truy vết. Viewport đã kiểm tra gồm1440/820/390px, với backend/SQL thật và dữ liệu nghiệm thu riêng.
