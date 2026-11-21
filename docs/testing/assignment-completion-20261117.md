# Hoàn thành phân công sau khi phiên bắt đầu

Lỗi phát hiện khi bấm nghiệm thu Instructor trên production local: `MemberSelector` chỉ gắn vào phiên upcoming. Nút hoàn thành nằm trong kết quả tìm ứng viên, trong khi truy vấn chỉ lấy ứng viên còn trống. Khi phiên active/ending/completed, đội hình không còn đường hoàn thành phân công; sinh viên tiếp tục có assignment active dù phiên đã hoàn tất.

Đặt thao tác tại hàng thành viên hiện tại, chỉ cho assignment active trong phiên active/ending/completed và khi có cả assignments.view + assignments.manage. Giữ hộp xác nhận, lỗi/retry và kiểm lại assignment theo session + intern trước khi POST complete. Dùng assignmentStatus từ BE; refresh roster sau lưu và giữ lịch sử cùng thành viên. Không cần endpoint mới hoặc đổi dữ liệu cũ.

Regression RED: 5 ca thất bại trên UI/parser trước sửa. Review độc lập phát hiện quyền manage thiếu view; ca tái hiện đó thất bại trước khi gate đủ hai quyền. Sau sửa: 126 files / 729 test, lint/typecheck đạt. Kiểm trực tiếp: nút xuất hiện trong phiên completed, Giữ phân công không đổi dữ liệu, xác nhận lưu thành công và trạng thái Phân công đã hoàn thành xuất hiện trong roster. Bằng chứng ở workspace `.runtime/product-acceptance-20261116/assignment-completed-production.png`.

Dữ liệu kiểm thử hoàn toàn tổng hợp trong DB QA riêng. Việc này không chứng minh đã nghiệm thu mọi chức năng của ba vai; ma trận chung vẫn đang mở.
