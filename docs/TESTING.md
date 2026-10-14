# Kiểm thử frontend

npm test dùng Vitest/JSDOM; npm run typecheck/lint/build là gate riêng. Test hồi quy gồm passed-unassigned entry/navigation, chat recovery/pending, future prompt protection qua adapter, Kanban reload và rubric AI sau tải dữ liệu. Không skip hoặc xóa assertion để làm xanh.

Browser dùng Chrome/Playwright với Nest/SQL thật. Kiểm tra login, refresh qua reload, route đang xem, heading thật, request failures, mobile overflow, Escape và desktop resize. Ảnh chụp trang login không được tính là bằng chứng route private đã kiểm tra. Dùng client navigation cho nhiều route; hard reload quá nhiều có thể đạt auth rate limit.

Database nghiệm thu phải riêng; không thêm data fixture vào ba tài khoản trắng của runtime. Provider deterministic chỉ trong harness test và phải xử lý đúng feature/schema. Provider thật có thể503/invalid JSON; ghi lại trạng thái thất bại và retry thay vì bịa điểm.

Workflow full-stack cũ ghim BE_SHA để kiểm chứng baseline lịch sử. Khi cập nhật contract phải pin commit BE đã review tương thích và cập nhật fixture/assertions cho chat10câu. Không xem một run cũ dùng BEpin khác là bằng chứng cho feature mới.

Kết quả hiện tại và giới hạn ở tài liệu docs/VERIFICATION.md của workspace; báo cáo archive chỉ dùng truy vết.
