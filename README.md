# V-INTERN Frontend

Next.js 16.3.8 App Router, React 19, TypeScript và Tailwind CSS 4. Giao diện tiếng Việt cho tuyển dụng bằng chat, không gian sinh viên, quản lý phiên giảng viên và quản trị. Browser gọi Nest API thật; frontend không quyết định điểm, quyền hay kết quả task.

## Chạy local

Yêu cầu Node.js 22+ và BE đã chạy/migrate.

~~~powershell
npm ci
Copy-Item .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
npm run dev
~~~

Mở http://localhost:3001. Đăng nhập bằng email được admin tạo. Không có password/token trong repository. Access token chỉ ở memory; browser gửi refresh cookie HttpOnly khi cần. Khi đổi API base, khởi động lại Next.

## Lệnh

| Lệnh | Mục đích |
|---|---|
| npm run dev | Next dev, cổng 3001 |
| npm run typecheck | TypeScript |
| npm run lint | ESLint / React hooks |
| npm test | Vitest + Testing Library |
| npm run build / npm start | Build / chạy production, cổng 3001 |

Không chạy hai Next dev trong cùng checkout vì dùng chung .next. Đọc AGENTS.md và tài liệu Next bundled trước khi sửa API framework.

## Luồng và route

| Khu vực | Route chính | Nguồn dữ liệu |
|---|---|---|
| Tuyển dụng | /intern/onboarding/* | Recruitment/workspace API |
| Sinh viên chờ phân công | /intern, notifications, profile, github | Lifecycle BE; shell chung |
| Công việc | /intern/work, sprint, project | Own tasks/specs/history/submissions |
| Hỗ trợ học tập | /intern/mentor, recommendations | Hội thoại và khuyến nghị AI có ngữ cảnh |
| Kết quả | /intern/performance, kpi, virtual-salary, certificates | Số liệu đã lưu/finalize |
| Giảng viên | /instructor/projects, sessions, sprints | Thư viện → phiên → đội hình → Start → draft → publish |
| Review/báo cáo | /instructor/performance, evaluations, reports | Quyền và số liệu thuộc phạm vi quản lý |
| Chia sẻ/GitHub | /instructor/sharing, github | Consent / OAuth theo tài khoản |
| Admin | /admin/* | Users, RBAC, groups, catalogs, settings, services, audit |

BE trả lifecycle; route cần assignment không mount nội dung hoặc gọi API học tập khi chưa được giao dự án. Sinh viên đã đạt nhấn thông báo vẫn dùng InternShell chờ phân công. Kanban có bốn cột, ưu tiên, phân trang; thay đổi task làm mới cả cột và số lượng.

Phỏng vấn mới là hội thoại từng câu, có thời gian server, retry, giải thích lại, bỏ qua có xác nhận và trạng thái AI đang chấm. Không hiển thị câu hỏi tương lai hoặc đáp án mẫu. Khi AI lỗi, bài làm được giữ để thử lại. AI code review hiện bằng chứng/SHA/giới hạn và điểm đề xuất; giảng viên mới xác nhận task.

## Cấu trúc

~~~text
src/app                           Route/layout App Router
src/components/auth              Form, session/role guard
src/components/intern            Shell, lifecycle và tuyển dụng
src/components/sessions          Project-first workflow, đội hình/draft/publish
src/components/product           Task, mentor, report, admin; primitives dùng chung
src/components/shared            Loading/error/empty state
src/lib/api                      Adapter + parse/validate dữ liệu unknown từ BE
src/lib/auth                     Transport, session memory, cookie coordination
src/lib/ui                       Focus/accessibility helpers
~~~

Components mock/reference chỉ phục vụ fixture/presentation test; route thật phải lấy dữ liệu qua lib/api. Không nhập mock dataset vào route production hoặc thay error/empty bằng số liệu giả. Các khối Thiết lập nhanh đã được gỡ; thao tác nghiệp vụ vẫn ở trang tương ứng.

Luồng tuyển dụng hiện có 10 câu chính và tối đa 2 câu phụ thích ứng, phục hồi theo backend. Sinh viên đã đậu nhưng chưa được phân công thấy điểm, kỹ năng, lịch sử và thông báo trong cùng workspace. Fullstack là vai trò tuyển dụng riêng. Giảng viên xem chi tiết phỏng vấn và sửa kế hoạch có milestone, phụ thuộc, task con, đầu ra và ước lượng trước publish.

## Giao diện và kiểm thử

Panel, nút, input và navigation dùng cùng primitive để giữ độ tương phản, khoảng cách, focus và responsive. Drawer hỗ trợ Escape/Tab và đóng khi chuyển sang desktop. Tìm kiếm topbar tìm trang được phép; tìm task nằm trong trang công việc. Hiệu ứng tuân thủ prefers-reduced-motion.

[Kiến trúc](docs/ARCHITECTURE.md) · [API/lifecycle](docs/API-CONTRACTS.md) · [UI](docs/UI-SYSTEM.md) · [Kiểm thử](docs/TESTING.md). Hướng dẫn toàn hệ thống ở README của workspace bên ngoài.

GitHub cần BE cấu hình OAuth; Gmail không cấp quyền tạo repository. Đăng ký công khai, Google login và quên mật khẩu chưa có API thật; giao diện phải thông báo chưa hỗ trợ, không giả thành công.
