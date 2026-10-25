# V-Intern — không gian học tập Blueberry

Ngày bắt đầu: 25/10/2026. Nhánh: `codex/learning-identity`, kế thừa G7.

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
| UI-02 Identity | Token, icon, minh họa có quy cách và dùng thực tế | Đang làm | 3 icon nhóm trang + companion sổ tay học/hướng dẫn; typecheck, lint file đổi, 4 test stage qua. Chưa QA hình ảnh/browser; token chưa áp dụng |
| UI-03 Shell | Desktop/mobile, active/focus, navigation thống nhất | Chưa làm | 390/768/1024/1280/1440px, keyboard |
| UI-04 Sinh viên | Tổng quan; công việc/detail; sprint; dự án; mentor; participation | Chưa làm | Loading/empty/error, nộp bài/DnD thật trên tài khoản QA |
| UI-05 Kết quả sinh viên | Evaluation/detail, KPI/detail, salary, performance, certificates/detail, recommendations | Chưa làm | Biểu đồ từ dữ liệu API, không suy diễn số liệu |
| UI-06 Cá nhân/onboarding | Profile, notifications, GitHub, role/interview/result | Chưa làm | Success/failure/pending, bảo toàn giới hạn phỏng vấn |
| UI-07 Giảng viên | Overview, sessions/detail/setup, sprints/detail, task/detail, projects/detail | Chưa làm | Tạo/sửa/nộp/chấm và quyền truy cập |
| UI-08 Theo dõi giảng viên | Recruitment, participation, evaluation, performance, reports, sharing, GitHub, profile, notifications | Chưa làm | Mutation feedback và empty/error từng trang |
| UI-09 Admin/shared | Các trang quản trị và feedback dùng chung nhất quán | Chưa làm | Không thay contract hay backend để trang trí UI |
| UI-10 Nghiệm thu | Quality gates, responsive, hai vai trò, ảnh/log, cập nhật handover | Chưa làm | Chưa có kết quả mới; không dùng số liệu G7 làm bằng chứng UI mới |

## Phạm vi và bảo vệ dữ liệu

Giữ trang chủ `/` theo yêu cầu cũ. Giữ nguyên API, auth, validation, nghiệp vụ. Không reset database, không dùng ba tài khoản trắng gốc để chạy luồng. QA dùng dữ liệu riêng và ghi lại thay đổi.

## Tiến độ tích hợp G7

- Người dùng đã xác nhận nhận được email: bằng chứng xác nhận của người dùng, không phải tự mở hộp thư kiểm tra.
- GitHub username được người dùng xác nhận lại: `vanhoi04082006-pixel`.
- CI BE 40189080999 và FE 40189217398 chạy lại vẫn failure; job FE `verify` có 0 step. Chưa đạt cloud CI. Chưa có bằng chứng mới cho hành trình toàn bộ dùng external service thật.
