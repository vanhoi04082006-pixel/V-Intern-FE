# Hệ thống giao diện: từ component tới trang hoàn chỉnh

## Hướng thiết kế hiện tại

Sinh viên và Giảng viên dùng **Aurora Glass**: nền lavender/mint nhẹ, sidebar nổi, surface trắng mờ và primary violet. Trang chủ và Admin giữ phạm vi riêng. Đây là lựa chọn mới ngày 22/10/2026, thay thế hướng navy/white phẳng ở bản trước.

Đọc [chương thiết kế trong bàn giao](HANDOVER.md#5-thiết-kế-aurora-glass) để hiểu token, cách dùng surface, chart, motion và responsive. [Token và phạm vi CSS](workspace-design-system.md) dành cho người triển khai.

## Component theo vai trò

| Nhu cầu | Component hiện có | Cách dùng |
|---|---|---|
| Tiêu đề trang | WorkspacePageHeader / StudentHeading / InstructorHeading | Một H1, lời dẫn ngắn, hành động theo ngữ cảnh |
| Điều hướng nhóm | WorkspaceStage | Tab của khu vực, không tự mở route bị khóa lifecycle |
| Nhóm nội dung độc lập | Panel / StudentPanel | Không bọc một Panel quanh từng field |
| Nút và trường nhập | product/primitives, student-ui | Giữ loading, disabled, label và lỗi |
| Phân bố trạng thái | TaskDistribution | Số liệu thật, legend bằng bàn phím, chỉ là snapshot |
| So sánh tỷ lệ/điểm | RateComparison | Khai báo đúng unit; null không đổi thành 0 |
| Deadline | TaskDeadline | Ngày gốc + hôm nay/ngày mai/quá hạn, task done không cảnh báo quá hạn |
| Loading/error/empty | shared/data-state và Empty | Trạng thái khác nhau phải có nội dung khác nhau |
| Modal/drawer | Modal, shell hiện có | Focus trap, Escape và trả focus |

## Một trang nên được tổ chức thế nào?

1. Đặt hành động chính gần tiêu đề, dùng lời dẫn đủ để biết bước tiếp theo.
2. Nếu có metric, ghi phạm vi đo và dùng semantic color đúng trạng thái.
3. Đặt filter gần collection mà nó tác động; hiển thị đặt lại khi đang lọc.
4. Dùng list/table cho nhiều bản ghi, card cho object cần xem độc lập.
5. Đưa giải thích dài sang vùng trợ giúp hoặc chi tiết; không lặp ở mọi section.
6. Giữ hành động thay đổi dữ liệu rõ trạng thái đang gửi và kết quả.

## Ảnh và icon

Robot V-Intern có sẵn được dùng ở header dẫn dắt. Artwork SVG hiện có diễn tả dự án, kết nối và thành tựu. Lucide giữ vai trò nhận diện thao tác, không thay icon nhỏ bằng ảnh nặng. Ảnh trang trí phải có alt rỗng; ảnh mang thông tin phải có mô tả. Không sao chép ảnh của website tham khảo vào repo.

## Cần kiểm tra sau khi sửa

Desktop 1440/1280/1024, tablet 768 và mobile 390px; thêm 320px cho component dễ tràn. Nội dung dài, empty state, error/retry, filter, keyboard, modal và reduced motion. Bảng cuộn trong container; không giấu overflow toàn trang để che lỗi. Chỉ số và hình không được thay đổi kết quả nghiệp vụ.
