# Một ngôn ngữ thiết kế cho toàn bộ V-Intern

Trạng thái ngày 29/10/2026: **đã triển khai nền chung cho ba vai; chưa redesign xong từng trang**. [Báo cáo lát nền tảng](../docs/design/NOTEBOOK-FOUNDATION-20261026.md): 12 icon SVG, hai minh họa sổ tay, token/sidebar/tab/section dùng chung, nhận xét thu gọn; 651 test và build local đạt, 15 lượt responsive trên ba trang mẫu. Số route khi lập báo cáo ngày 26/10 là 78; source hiện tại có 82 page source. Các kiểm tra nền chung không được tính là nghiệm thu đủ từng route.

Riêng [tab Thông báo ba vai](../docs/design/NOTIFICATIONS-20261026.md) đã trau chuốt tiếp ở 603ee3f: 660 test, build đạt, thêm ma trận 15 lượt đúng kích thước và thao tác đọc/lọc/lưu tùy chọn có phản hồi API.

## Hướng thiết kế

V-Intern là không gian thực hành của sinh viên đại học và giảng viên. Hình ảnh gợi sổ tay, thời khóa biểu và giấy kẻ ô: xanh việt quất, nền giấy sáng, xanh nhạt hỗ trợ, điểm nhấn vàng nhạt dùng ít. Tham khảo nhịp tiến bộ và phản hồi rõ ràng của ứng dụng học tập; nhân vật, icon và bố cục là của V-Intern. Không đưa XP, streak, thành tích hoặc số liệu không có nguồn vào giao diện.

Các trang cần trả lời ngay: đang ở đâu, việc gì cần xử lý, bằng chứng nào đã có, thao tác tiếp theo là gì. Cụm nộp bài/chấm bài là nội dung chính, không bị ép vào cột hẹp cạnh một cột lịch sử quá dài. Chỉ dùng card cho đối tượng độc lập; mô tả, tiêu chí, biểu mẫu và lịch sử dùng section, khoảng trắng, divider và timeline.

## Những gì audit đã thấy

- Có hai shell chính: `intern/intern-shell.tsx` và `product/shell.tsx`; onboarding có shell riêng. Cần thống nhất active nav, mật độ, menu mobile, focus và vị trí phản hồi giữa cả ba vai.
- Framework hiện tại: Next.js App Router, React, Tailwind CSS 4; Lucide cho icon chức năng và Framer Motion đã có. Không cần thêm một UI framework khác.
- `globals.css` có token gốc và nhiều lớp nâng cấp cũ; một số vùng thiên tím, Admin thiên xanh, nhiều container bo lớn. Không sửa bằng cách chồng thêm một lớp CSS ghi đè không có phạm vi.
- Có primitives, data-state, workspace-stage, artwork và charts dùng lại được. Cần sửa composition/layout tại nơi dùng, không chỉ đổi màu primitives.
- Khi test click đã phát hiện lỗi thông báo duyệt AI quá chung và parser bản nháp Admin sai shape. Hai lỗi đã có kiểm thử hồi quy; tiếp tục áp dụng cách kiểm chứng này cho các hành động còn lại.
- Inventory hiện tại ngày 29/10: **80 page source = 23 intern + 18 instructor + 31 admin + 8 public**. Bản đồ URL/source: [ROUTE-MAP](../docs/ROUTE-MAP.md). Không có màn quản lý lớp hoặc chia sẻ dữ liệu; `/instructor/classes` chỉ chuyển hướng về `/instructor/projects`. Các route bổ sung gồm career roles, communications và knowledge library. Trang chủ `/` giữ nguyên.

## Bộ asset dự kiến

| Asset | Dùng ở đâu, để làm gì | Trạng thái |
|---|---|---|
| Notebook companion: học / hướng dẫn | Điểm bắt đầu của sinh viên và giảng viên; tối đa một nhân vật trong vùng chính | Đã tích hợp vào nhánh `codex/notebook-workspace`, dùng ở tiêu đề chung |
| Icon nhóm học tập / đội nhóm / vận hành | Giúp nhận diện nhóm điều hướng, không thay icon thao tác có nghĩa quen thuộc | Đã có 12 SVG; nhóm sidebar và khu vực đã dùng một phần, cần phủ tiếp các luồng |
| Tờ lịch hẹn | CV, phòng chờ, đổi lịch; nhấn ngày/giờ thật | Chưa tạo |
| Bìa hồ sơ CV | Trạng thái đang phân tích/đã lên lịch; không mô phỏng tài liệu thật của người dùng | Chưa tạo |
| Nhánh code và tờ review | Nộp bài, đang chạy, cần sửa, chờ giảng viên; trạng thái lấy từ API | Chưa tạo |
| Dấu mốc Sprint | Kế hoạch, công việc đang chạy và bước tiếp theo; không tự tính XP | Chưa tạo |
| Thư mời cộng tác | Đã mời, hết hạn, mời lại, đã có quyền GitHub | Chưa tạo |
| Hộp thư | Empty notification, gửi thành công, gửi chưa rõ; phân biệt queued/SMTP accepted/inbox | Chưa tạo |
| Cặp hồ sơ dự án | Thư viện và empty state có CTA; mô tả mẫu thật | Chưa tạo |
| La bàn phát triển | Gợi ý, Mentor và kết quả; không dùng làm dữ liệu biểu đồ | Chưa tạo |
| Chứng nhận và dây đánh dấu | Certificate, xác minh, thu hồi; trạng thái đúng API | Chưa tạo |
| Trang giấy biểu đồ | Báo cáo và empty state phân tích; số/đường biểu đồ chỉ từ dữ liệu thật | Chưa tạo |

Asset ưu tiên SVG gốc trong source: nhẹ, sắc nét, có `viewBox`, màu lấy từ token, `aria-hidden` nếu chỉ trang trí. Hình mang thông tin cần nhãn thay thế. Nếu cần ảnh raster, phải có mục đích, kích thước và ngân sách dung lượng cụ thể trước khi tạo. Mọi file/công cụ/cache nằm trong folder dự án.

## Token và tương tác

Ba lớp token: màu/kích thước gốc → ý nghĩa (surface, text, primary, success, warning, danger) → component. Nút/input 6–8px; card 8–12px; dialog 12px; pill chỉ dành cho tag/status. Khoảng cách 4/8/12/16/24/32/40/48. H1 28–32px desktop; body 14–16px; metadata nhỏ nhưng vẫn đủ tương phản.

Nút có hover/focus/pressed/disabled/pending. Mutation chỉ báo thành công sau response thật; lỗi giữ nội dung form. Notification dùng nhãn trạng thái dễ hiểu, có hành động phục hồi. Chuyển động 150–220ms, chủ yếu để giải thích thay đổi do người dùng tạo; `prefers-reduced-motion` bỏ chuyển động không cần thiết. Tránh animation lặp lại trên mọi card.

## Checklist triển khai

| Nhóm | Phạm vi | Hoàn thành khi | Trạng thái |
|---|---|---|---|
| Shell + feedback | 2 shell workspace, onboarding, nav, dialog, các trạng thái | Nhất quán desktop/mobile, bàn phím, thông báo theo kết quả thật | Chưa trau chuốt riêng |
| Sinh viên làm việc | Tổng quan, work/list/detail, Sprint, project, Mentor, GitHub, participation | Có trọng tâm công việc, DnD và nộp bài giữ logic; ưu tiên/tiến độ scan nhanh | Chưa trau chuốt riêng |
| Sinh viên kết quả | Evaluation/detail, KPI/detail, salary, performance, recommendation, certificate/detail | Biểu đồ có nguồn và empty state trung thực; drill-down rõ | Chưa trau chuốt riêng |
| Sinh viên tài khoản/tuyển | Profile, notification, onboarding/role/interview/result | Lịch và giới hạn 3 lượt giữ nguyên; validation, no-show, success/error đủ | Đang làm: Thông báo/GitHub đã kiểm; còn các luồng khác |
| Giảng viên tổ chức | Home, sessions/detail/setup, Sprint/detail, task/detail, library/detail, alias redirect `/instructor/classes` | Hàng đợi cần xử lý rõ; review là vùng chính; form không bị card lồng card | Chưa trau chuốt riêng |
| Giảng viên theo dõi | Recruitment, participation, evaluations, performance, reports, GitHub, profile, notification | Tạo/sửa/duyệt/xuất/mời lại có pending và kết quả đúng | Đang làm: Thông báo đã kiểm; còn từng tab theo dõi |
| Admin | 31 route trong route map | Cùng ngôn ngữ thiết kế, mật độ phù hợp vận hành; giữ phân quyền | Đã có nền chung và Thông báo; còn từng tab quản trị |
| Public ngoài trang chủ | 7 route public còn lại | Auth, CV, verify, lỗi và các trạng thái thống nhất; `/` không đổi | Chưa trau chuốt riêng |
| Nghiệm thu | Toàn bộ route và hành động trên dữ liệu QA riêng | 390/768/1024/1280/1440px, keyboard, reduced motion, loading/empty/error/success, regression và ảnh có nguồn | Chưa làm cho UI mới |

Mỗi dòng được đánh dấu hoàn tất phải kèm route cụ thể, thao tác đã thử, kết quả quan sát và ảnh/log. Alias, trang empty và trang có dữ liệu đều được kiểm riêng. Không thu gọn phạm vi còn một dashboard đẹp.
