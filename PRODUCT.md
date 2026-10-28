# V-Intern

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sinh viên thực hành dự án phần mềm; giảng viên tổ chức phiên, phản hồi bài nộp và quyết định kết quả; Admin quản lý tài khoản, thư viện, tuyển dụng, Agent và tích hợp. Giao diện bằng tiếng Việt, dùng trên desktop và trình duyệt di động.

## Product Purpose

Đưa người học qua một quy trình thực tập có bằng chứng: tiếp nhận CV, hẹn và phỏng vấn, phân công dự án, Sprint, bài nộp GitHub, phản hồi, đánh giá, KPI và chứng nhận. Thành công là người dùng biết tình trạng hiện tại và thực hiện được bước tiếp theo, với kết quả lưu thật.

## Positioning

Agent dùng tri thức và dữ liệu trong phạm vi được phép để hỗ trợ tuyển dụng, lập kế hoạch và phản hồi mã nguồn. Quyết định chấm chính thức và thay sinh viên thuộc giảng viên; kết quả Agent không tự trở thành quyết định của con người.

## Operating Context

- Chạy local. Backend NestJS/SQL Server; frontend Next.js 16 App Router, React 19, Tailwind CSS 4. Framer Motion và Lucide đã có; không thêm thư viện tương đương.
- Ba khu vực `/intern`, `/instructor`, `/admin`; các trang xác thực, tiếp nhận CV và xác minh công khai có vai trò riêng.
- Bộ route, API và nghiệp vụ trong code hiện hành là nguồn chuẩn. [Bản đồ route](docs/ROUTE-MAP.md) và [bàn giao](docs/HANDOVER.md) là đường đọc bổ sung.

## Capabilities and Constraints

- Giữ API integration, auth, routing, phân quyền, form/validation, dữ liệu, chức năng và điều kiện vòng đời. Không dùng redesign để bỏ tính năng hoặc làm nhẹ kiểm thử.
- Không tạo metric, thành tích, streak, số người dùng, logo khách hàng hoặc nội dung giả. Biểu đồ chỉ dùng dữ liệu có nguồn; thiếu dữ liệu phải nói rõ.
- Giữ hai database chính và ba tài khoản trắng gốc. Nghiệm thu trên tài khoản/dữ liệu QA riêng.
- Source, dependency, công cụ, cache và bằng chứng đều ở trong folder dự án V-INTERN. Cấu hình nhạy cảm không được commit.
- **Trang chủ `/` giữ nguyên**: người dùng xác nhận lại ngày 26/10/2026. Các trang chức năng của cả ba vai và các trang hỗ trợ khác thuộc phạm vi redesign.

## Brand Commitments

Tên V-Intern, tiếng Việt rõ ràng và dễ hiểu. Brief hiện hành yêu cầu môi trường sáng/xanh nhạt, chữ navy, phân nhóm rõ, mật độ phù hợp công việc, không lạm dụng thẻ, gradient, kính mờ hoặc animation. Ảnh mẫu chỉ quyết định cách trình bày, không quyết định nghiệp vụ.

## Evidence on Hand

Ảnh tham khảo do người dùng cung cấp; ảnh và receipt kiểm thử local; dữ liệu QA của hành trình dịch vụ thật. [Checkpoint](docs/ACCEPTANCE-CHECKPOINT-20261026.md) phân biệt UI/API và giới hạn. Không suy từ một receipt thành nghiệm thu toàn bộ hệ thống.

## Product Principles

1. Nội dung và bước tiếp theo quan trọng hơn trang trí.
2. Luôn phân biệt đề xuất Agent, bằng chứng máy kiểm và quyết định giảng viên.
3. Phản hồi pending, thành công và thất bại phải khớp kết quả thật; lỗi không được làm mất nội dung người dùng đã nhập.
4. Thông tin chi tiết vẫn truy cập được qua disclosure, drill-down hoặc trang chi tiết.
5. Tái dùng một hệ thiết kế cho ba vai; mật độ và bố cục phục vụ công việc từng trang.

## Accessibility & Inclusion

Điều hướng bàn phím, focus nhìn rõ, label và lỗi form, tương phản đọc được, dialog quản lý focus, reduced motion. Nghiệm thu tối thiểu 375/480/768/1024/1280/1440px; bảng có vùng cuộn riêng khi cần, không che lỗi layout bằng cách cắt nội dung.
