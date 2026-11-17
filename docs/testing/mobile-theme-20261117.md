# Chủ đề giao diện trên di động và bàn phím

CUA trên production local: ở 390 px, thanh trên ẩn ThemeToggle và drawer không có bộ chọn thay thế. Ở 768 px, nhấn ArrowLeft tại Theo máy không đổi lựa chọn hoặc focus. Hai ca regression thất bại trước sửa.

Drawer Intern dùng ThemeToggle chung trong footer để vẫn có thể thay chủ đề ở màn hình nhỏ. Bộ chọn chung hỗ trợ các phím mũi tên có vòng lặp, Home và End; focus đi cùng lựa chọn. Store chủ đề hiện hữu đồng bộ các bộ chọn đang gắn và giữ thiết lập qua reload. Không thêm dependency.

Test kiểm drawer có bộ chọn, Escape và focus return, Arrow/Home/End cùng class chủ đề, đồng bộ hai bộ chọn. Toàn FE sau sửa: 127 files / 732 test, lint và typecheck đạt. Build và kiểm lại trình duyệt production được ghi trong nhật ký nghiệm thu workspace.

Bằng chứng trước sửa: `.runtime/product-acceptance-20261116/intern-mobile-theme-missing-before.png`. CUA production sau sửa: ArrowLeft ở 768 px chuyển Theo máy → Tối và focus đúng; Home về Sáng. Ở 390 px, menu hiện bộ chọn, ArrowRight chuyển sang Tối, Escape đóng menu; sau reload menu vẫn chọn Tối. End khôi phục Theo máy. Ảnh `intern-mobile-theme-dark-after.png` giữ cùng thư mục. Production build đạt; review độc lập không có finding bắt buộc sửa. Đây là một phần nghiệm thu, không phải xác nhận đã kiểm toàn sản phẩm.
