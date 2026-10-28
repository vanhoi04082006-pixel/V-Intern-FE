# V-Intern — không gian học tập Blueberry

Ngày bắt đầu: 25/10/2026. Tích hợp nền chung ngày 26/10 tại `codex/notebook-workspace`, kế thừa G7. [Báo cáo hiện hành](../docs/design/NOTEBOOK-FOUNDATION-20261026.md).

## Hướng thiết kế đã tiếp nhận

Ảnh thời khóa biểu của người dùng là nguồn tham khảo chính: giấy trắng, ô ly nhẹ, xanh việt quất, điểm nhấn hoa và nét vẽ mềm. Tham khảo Duolingo ở cách dẫn dắt và phản hồi; không sao chép mascot, logo hay màn hình. Sinh viên thấy bước tiếp theo và tiến độ thật; giảng viên thấy việc cần xử lý và dữ liệu dễ quét. Không thêm điểm thưởng, streak hay thành tích giả.

Màu dự kiến: mực `#253858`, xanh `#426CC7`, giấy `#FAFBFE`, nền xanh `#EAF1FF`, tím `#8A70C9`, vàng `#E6B760`. Trạng thái dùng màu semantic, luôn có chữ. Font hiện có hỗ trợ tiếng Việt; nội dung nghiệp vụ không dùng chữ viết tay. Ô ly chỉ ở vùng minh họa; bảng và form dùng nền đọc rõ. Chuyển động phản hồi 150–220ms, tôn trọng reduced motion.

## Audit ban đầu

- Next.js 16 App Router, React 19, Tailwind 4; Lucide, Framer Motion đã có, không cần thêm dependency.
- Hai layout role import student/instructor CSS → workspace CSS → Aurora CSS. Phải xử lý cascade thay vì chồng thêm một theme không giới hạn.
- `InternShell` và `ProductShell` giữ navigation; `WorkspaceStage` giữ thanh chuyển nhóm trang. Giữ guard, routing, khóa tính năng.
- Aurora đang áp dụng nhiều nền thẻ, radius 16–24px và selector rộng cho table. Cần phân biệt object, section, form và collection.
- `product/primitives.tsx` và `shared/data-state.tsx` đã có button, field, modal, empty/error/loading; reuse hành vi focus/validation/retry.
- Chưa hoàn thành audit từng thao tác mutation; không được ghi nhận tất cả thông báo đã đủ.

## Theo dõi thực hiện

| Hạng mục | Hoàn thành khi | Trạng thái | Kiểm chứng / kết quả |
|---|---|---|---|
| UI-01 Inventory | Có route, layout, shared component và mutation map | Đang làm | Đã liệt kê route App Router; chưa kiểm đủ từng dialog |
| UI-02 Identity | Token, icon, minh họa có quy cách và dùng thực tế | Đã có nền tảng | 12 SVG nhóm, hai companion, token và tiêu đề dùng chung đã tích hợp; còn asset theo từng luồng |
| UI-03 Shell | Desktop/mobile, active/focus, navigation thống nhất | Đã có nền chung; đang phủ từng route | 15 lượt trên ba trang × năm độ rộng không tràn ngang; drawer sinh viên/Admin và trả focus đã thử |
| UI-04 Sinh viên | Tổng quan; công việc/detail; sprint; dự án; mentor; participation | Chưa làm | Loading/empty/error, nộp bài/DnD thật trên tài khoản QA |
| UI-05 Kết quả sinh viên | Evaluation/detail, KPI/detail, salary, performance, certificates/detail, recommendations | Chưa làm | Biểu đồ từ dữ liệu API, không suy diễn số liệu |
| UI-06 Cá nhân/onboarding | Profile, notifications, GitHub, role/interview/result | Đang làm | Thông báo đã kiểm ba vai; GitHub có trạng thái lịch sử; còn profile/onboarding và ngoại lệ theo luồng |
| UI-06.1 Thông báo ba vai | Danh sách gọn, mở nội dung, đọc/lọc/tùy chọn có phản hồi thật | Đạt lát triển khai | Code 603ee3f; 9 regression tests, click ba vai, 15 lượt responsive đúng kích thước, 0 tràn ngang. [Báo cáo](../docs/design/NOTIFICATIONS-20261026.md) |
| UI-07 Giảng viên | Overview, sessions/detail/setup, sprints/detail, task/detail, projects/detail | Chưa làm | Tạo/sửa/nộp/chấm và quyền truy cập |
| UI-08 Theo dõi giảng viên | Recruitment, participation, evaluation, performance, reports, sharing, GitHub, profile, notifications | Chưa làm | Mutation feedback và empty/error từng trang |
| UI-09 Admin/shared | Các trang quản trị và feedback dùng chung nhất quán | Tích hợp token/shell | Admin đã dùng chung theme; còn bố cục, nội dung và hành động từng trang |
| UI-10 Nghiệm thu | Quality gates, responsive, ba vai, ảnh/log, handover | Đang thực hiện | 109 file / 660 test, lint/typecheck/build đạt; nền chung và Thông báo có hai ma trận 15 lượt riêng, kèm click và bàn phím. Chưa đủ 78 route |

## Phạm vi và bảo vệ dữ liệu

Giữ trang chủ `/` theo yêu cầu cũ. Giữ nguyên API, auth, validation, nghiệp vụ. Không reset database, không dùng ba tài khoản trắng gốc để chạy luồng. QA dùng dữ liệu riêng và ghi lại thay đổi.

## Tiến độ tích hợp G7

Cặp FE 9ef1ff6 / BE 91a9175 đã xanh quality và full-stack, hành trình QA thật hoàn thành bốn task, đánh giá 96,1, KPI 98,8, chứng nhận và phục hồi lời mời. Xem [checkpoint có nguồn](../docs/ACCEPTANCE-CHECKPOINT-20261026.md). Bộ số liệu 660 thuộc source UI mới, không ghi đè receipt nghiệp vụ 649 của source trước. Chưa merge stack sản phẩm.
