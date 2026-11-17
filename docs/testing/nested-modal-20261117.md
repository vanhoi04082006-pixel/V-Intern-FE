# Escape trong hộp thoại lồng nhau

Tại Admin KPI, mở Kết quả rồi Chi tiết kết quả. Escape đã đóng cả hộp Nguồn tính lẫn danh sách kết quả. Sự kiện cancel do React truyền lên hộp cha, nên cả hai onClose cùng chạy.

Modal chung dừng propagation của cancel sau preventDefault, chỉ đóng lớp nhận sự kiện. Test tái hiện thất bại trước sửa vì hộp cha cũng biến mất; sau sửa hộp cha được giữ và focus về nút mở chi tiết. Nút Đóng của hộp cha vẫn hoạt động. Kiểm thử production và ảnh được ghi trong nhật ký nghiệm thu workspace.

CUA production xác minh Escape từ Truy xuất gốc kết quả chỉ đóng lớp trên, giữ danh sách kết quả 95,5 và focus về Chi tiết kết quả. Escape lần nữa đóng danh sách. Ảnh `.runtime/product-acceptance-20261116/kpi-nested-escape-retains-results-after.png`. Full FE 129 files/735 test, lint/typecheck/build đạt; review độc lập không có finding bắt buộc sửa.
