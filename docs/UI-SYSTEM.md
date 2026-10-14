# Giao diện và tương tác

Nền sáng slate, navy cho nội dung, blue cho hành động/chọn, amber cho chờ/giới hạn và emerald cho hoàn thành. Dùng components/product/primitives cho Panel, MetricCard, PageTitle, inputs, buttons, badges, modal và phân trang. Không tạo mỗi trang một bộ spacing/shadow riêng.

Panel border nhẹ, góc bo và heading rõ; card metric có icon, số và nguồn/ngữ cảnh. Nội dung có loading, empty, error/retry riêng. Không dùng0 thay cho số chưa có; không hiển thị số ngẫu nhiên. Dữ liệu table cần overflow container trên mobile, không làm body tràn ngang.

Sidebar hiện active route kể cả chi tiết. Drawer dùng keyboard, Escape, focus và đóng khi viewport chuyển desktop; không giữ inert trên nội dung khi menu đã ẩn. Có skip link và tên accessible cho button/link/input. Biểu mẫu có label, validation, trạng thái bận và lỗi gần thao tác.

Topbar sinh viên tìm trang được phép truy cập, có kết quả và trạng thái không tìm thấy; không còn phím tắt giả. Tìm kiếm/lọc task thực ở Công việc của tôi và có ở cả list/board. Thao tác nộp code, Start, publish, chia sẻ, revoke và rubric cần phản hồi trạng thái thật.

Motion ngắn, phục vụ chuyển trạng thái; không che pending/result. Tuân thủ prefers-reduced-motion. Tất cả Thiết lập nhanh đã gỡ; thao tác thật nằm ở trang nghiệp vụ tương ứng.

Kiểm tra390px/1440px, bàn phím, reload/session, error và dữ liệu rỗng bằng browser thật. Unit test DOM không thay thế kiểm tra CSS/layout.
