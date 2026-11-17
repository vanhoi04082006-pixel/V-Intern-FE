# Sinh lương ảo: lỗi, chờ xử lý và số dư

CUA production phát hiện nút Sinh lương cho kỳ không phản hồi khi BE trả VIRTUAL_SALARY_CONFIG_MISSING; console có unhandled ApiError. Callback gọi API ngoài useAction dù truyền busy/error từ hook này cho giao diện.

Callback nay dùng action.run để hiện lỗi, khóa nút và chặn gửi trùng khi đang chờ. Thử lại giữ kỳ đã chọn và xóa thông báo cũ. Thành công làm mới cả sổ giao dịch lẫn số dư đang xem; ghi điều chỉnh cũng làm mới số dư. Thiếu mức cơ sở ảo có hướng dẫn tới Cài đặt hệ thống.

Ba test UI RED trước sửa kiểm lỗi/thử lại, pending/duplicate, và số dư sau thành công. Toàn FE sau sửa: 130 files/738 test, lint/typecheck/build đạt; review độc lập không có finding bắt buộc sửa.

CUA sau sửa hiển thị rõ lỗi cấu hình, giữ lựa chọn kỳ. Tạo cấu hình chỉ trong DB QA: virtual_salary.base_amount=1000000. Sinh từ KPI QA-KPI-FIX-20261117 được 1 dòng 955000 VND_VIRTUAL, số dư cập nhật ngay. Sinh lại: generated0/skipped1, sổ vẫn1dòng. Không phải tiền lương hoặc giao dịch tài chính thật. Ảnh `salary-config-error-visible-after.png` trong workspace evidence; log thao tác ghi tại ui-events.jsonl.
