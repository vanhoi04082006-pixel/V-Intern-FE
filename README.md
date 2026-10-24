# V-Intern Frontend

**G4 — phòng chờ và hẹn lại:** [hướng dẫn sinh viên, giảng viên và người bảo trì](docs/SCHEDULED-INTERVIEWS.md) · [kiểm chứng và giới hạn](docs/reports/g4-completion-20261025.md).

**G3 — cổng CV và lịch hẹn:** [hướng dẫn ứng viên, giảng viên và người bảo trì](docs/CV-AND-INTERVIEW-SCHEDULING.md) · [nghiệm thu và giới hạn](docs/reports/g3-completion-20261024.md).

**G2 — thư viện bài nhỏ:** [hướng dẫn Admin, giảng viên và sinh viên](docs/MINI-PROJECTS.md) · [báo cáo nghiệm thu](docs/reports/g2-completion-20261024.md).

Giao diện thực tập theo dự án dành cho Sinh viên, Giảng viên và Quản trị viên. Sinh viên phỏng vấn, nhận nhiệm vụ, nộp bài và đọc phản hồi. Giảng viên chuẩn bị phiên, hướng dẫn, đánh giá và báo cáo. Dữ liệu nghiệp vụ đến từ NestJS API.

## Bắt đầu từ tài liệu bàn giao

**[Đọc bộ bàn giao FE](docs/HANDOVER.md)** — từ cách chạy local đến hành trình sử dụng, kiến trúc, thiết kế, lỗi thường gặp và bảo trì.

Chuẩn bị bảo vệ: **[kịch bản ngắn](docs/DEMO-CHECKLIST.md)** · [hướng dẫn demo từng bước](docs/DEMO-GUIDE.md) · [nghiệm thu hai vai trò](docs/ROLEPLAY-ACCEPTANCE.md). Thông tin đăng nhập được bàn giao riêng.

| Tài liệu | Trả lời câu hỏi |
|---|---|
| [Hướng dẫn bàn giao](docs/HANDOVER.md) | Người mới tiếp nhận nên làm gì, đọc gì và dùng hệ thống ra sao? |
| [Bản đồ route](docs/ROUTE-MAP.md) | URL này nằm ở file nào, dùng component nào? |
| [Kiến trúc](docs/ARCHITECTURE.md) | Guard, lifecycle, API client và component phối hợp thế nào? |
| [API contracts](docs/API-CONTRACTS.md) | Frontend trao đổi với Backend theo hợp đồng nào? |
| [Thiết kế UI](docs/UI-SYSTEM.md) | Dùng Aurora Glass và component chung như thế nào? |
| [Kiểm thử](docs/TESTING.md) | Gate và các luồng hồi quy phải giữ là gì? |
| [Kiểm chứng](docs/VERIFICATION.md) | Số liệu và ảnh được kiểm ở thời điểm nào? |
| [Nhánh Git](docs/GIT-WORKFLOW.md) | Nhánh nào đã tích hợp, nhánh nào là lưu trữ? |
| [Thư viện nghề nghiệp](docs/CAREER-ROLES.md) | Tạo nghề mới, cấu hình năng lực, mở tuyển và chuẩn bị câu hỏi ra sao? |
| [Kho tri thức Agent](docs/KNOWLEDGE-LIBRARY.md) | Soạn Q&A nhiều đáp án, giữ nguồn, duyệt xuất bản và khôi phục lịch sử thế nào? |
| [Bàn giao Backend](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feat/admin-repository-account/docs/HANDOVER.md) | Dữ liệu và quy tắc phía server hoạt động thế nào? |

## Công nghệ và phạm vi

Next.js 16.4.2, React 19, TypeScript, Tailwind CSS 4, Framer Motion và Lucide. Font đã đóng gói cục bộ. Aurora Glass áp dụng cho Sinh viên/Giảng viên và onboarding; trang chủ và Admin có phạm vi thiết kế riêng. Không thêm dữ liệu giả để làm đầy dashboard.

## Chạy trên workspace hiện tại

```powershell
& .\scripts\Use-ProjectStorage.ps1
# Chạy tại thư mục gốc repository Frontend
npm run dev
```

Lệnh dev mặc định dùng cổng 3001. Nếu bản local đang chạy tại đó, không mở thêm process đè cổng. Bản chính đang dùng `next start`; sau khi sửa source cần build thành công rồi restart đúng process:

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run build
& ..\manual-runtime\restart-owned-apps.ps1 -Frontend
```

Mở [ứng dụng local](http://localhost:3001). API chính là `http://localhost:8080/api/v1`; Swagger tại `http://localhost:8080/api/docs`. `NEXT_PUBLIC_API_BASE_URL` được lấy khi build. Không đặt token/secret vào biến public.

Máy mới: xem phần chạy local trong [HANDOVER](docs/HANDOVER.md), cài bằng `npm ci` theo lockfile và cấu hình môi trường riêng. Không ghi đè .env của máy đang chạy.

## Kiểm tra trước khi bàn giao

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Kiểm browser riêng cho desktop/mobile, drawer, tab, filter, form/modal, Kanban và trạng thái chưa có dữ liệu. Không coi unit test là bằng chứng đầy đủ cho layout. Số test mới nhất và giới hạn nằm trong [VERIFICATION](docs/VERIFICATION.md).

## Quy tắc tiếp nhận

- Source, công cụ, dependency, cache, log và bằng chứng của dự án lưu trong workspace.
- Giữ database và ba tài khoản gốc; không seed/reset để chụp UI.
- Backend là nơi quyết định quyền, điểm và điều kiện chuyển trạng thái.
- Giữ working tree có sẵn, review từng nhóm thay đổi trước commit/merge.
- Không đưa secret hoặc `manual-runtime/private` lên repository.
