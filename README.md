**Nghiệp vụ 28/10/2026:** [sáu kịch bản UI ba vai, lỗi tuyển dụng và gate local](docs/BUSINESS-ACCEPTANCE-20261028.md) · [skill audit Cloudflare](docs/SECURITY-AUDIT-WORKFLOW.md). BE 860 test; FE worktree local 676 test, gồm redesign đang giữ riêng. Có timeout audit đã hồi phục và hai lỗi build trước khi cache mới đạt. G7 chưa đóng mọi nhánh UI; chưa merge.

**Nghiệp vụ 27/10/2026:** [kết quả ba vai, nhánh ngoại lệ và dịch vụ thật](docs/BUSINESS-ACCEPTANCE-20261027.md). 117 ca SQL/HTTP duy nhất đạt theo ma trận mới nhất; có một timeout ở lượt nhóm đầu, advisor chạy riêng 3/3 đạt, giữ nguyên 5 giây. Mentor Gemini thật và trace LangSmith mới đã kiểm. Redesign tạm dừng; không coi lượt này là nghiệm thu mọi trang hoặc merge PR.

**Checkpoint 26/10/2026:** [nguồn kiểm chứng và việc còn mở](docs/ACCEPTANCE-CHECKPOINT-20261026.md). BE 859 / FE 660 unit tests; source và CI ghi riêng trong checkpoint. Hành trình QA thật đã hoàn thành 4/4 task, đánh giá 96,1, KPI 98,8, chứng nhận và vòng mời lại GitHub. Có cả bước UI/API; chưa nghiệm thu mọi nhánh hoặc redesign toàn bộ.

**G6/T03 — quyền repository sau thay người:** [hướng dẫn trạng thái, đối chiếu và phục hồi](docs/REPOSITORY-ACCESS-RECOVERY.md). Đã kiểm QA, GitHub pending thật và đã kích hoạt cả hai DB native.

# V-Intern Frontend

**UI sổ tay — 26/10:** [nền dùng chung và asset](docs/design/NOTEBOOK-FOUNDATION-20261026.md) · [tab Thông báo ba vai](docs/design/NOTIFICATIONS-20261026.md) · [inventory toàn hệ thống](tasks/ui-route-asset-manifest.md). Source UI mới có **677 test** và build local đạt; nền chung và tab Thông báo đều có ma trận 15 lượt responsive riêng. Chưa nghiệm thu toàn bộ 78 route. Checkpoint nghiệp vụ bên dưới giữ số liệu theo source riêng của nó.

**G6 — thời hạn và thay thành viên:** [quy tắc và điểm phạt](docs/PARTICIPATION.md) · [hướng dẫn tư vấn, xem trước và phê duyệt](docs/REPLACEMENT.md) · [bằng chứng QA và phần còn lại](docs/reports/g6-replacement-evidence-20261025.json). Đã kích hoạt G6 trên cả hai DB native, giữ nguyên dữ liệu cũ.

**G5 — GitHub:** [lời mời, quyền cộng tác và cách mời lại](docs/GITHUB-INVITATIONS.md) · [kết quả local và phụ thuộc live](docs/reports/g5-completion-20261025.md).

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
