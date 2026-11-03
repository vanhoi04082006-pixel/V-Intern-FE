# Kiểm chứng Frontend

Trang này là **chỉ mục bằng chứng hiện hành**. Số liệu lịch sử nằm trong [`reports/`](reports/) và [`archive/`](archive/); không sửa chúng để khớp hiện tại.

## 1. Mốc hiện hành — 02/11/2026

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Branch / commit | `main` / `063c3d5` | Working tree sạch tại thời điểm ghi |
| ESLint | Đạt, 0 lỗi | `npm run lint` |
| TypeScript | Đạt, 0 lỗi | `npm run typecheck` |
| Vitest | **117 file / 672 test đạt** | `npm test` |
| Next production build | Đạt | `npm run build` |
| API contract | FE gọi Nest `/api/v1`; classes/sharing đã bị gỡ ở BE | `/api/v1/classes`, `/api/v1/session-sharing` trả 404 |
| Runtime probe | Admin 27/27 · Giảng viên 13/13 · Sinh viên 15 route | 0 API lỗi, 0 page error; sinh viên vào được `/intern/onboarding/interview` |

Lệnh tái lập:

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

## 2. Phạm vi runtime probe

Probe dùng API/SQL thật trên môi trường local, đăng nhập từng vai trò và đi qua các route chính:

- **Admin:** dashboard, người dùng, nghề nghiệp, câu hỏi, mẫu dự án, phiên, Sprint/task, đánh giá, KPI/lương/chứng nhận, báo cáo, cài đặt.
- **Giảng viên:** dashboard, dự án, phiên, Sprint/task, đánh giá, hiệu suất, báo cáo, GitHub.
- **Sinh viên:** onboarding, workspace, task, Sprint, dự án, Mentor, đánh giá, KPI/lương/chứng nhận, GitHub, thông báo.

Đây là **smoke theo route**, không phải nghiệm thu từng nhánh nghiệp vụ hoặc mọi trạng thái dữ liệu. Các luồng mutation sâu cần dùng DB QA riêng và harness tương ứng.

## 3. CI

| Workflow | Nội dung | Điều kiện |
|---|---|---|
| `ci.yml` — `verify` | lint → typecheck → test → audit production → build | Mọi PR vào `main` |
| `phase7-fullstack.yml` — `sql2019` | SQL Server 2019 + BE contract SHA + harness full-stack | PR chạm contract/luồng tích hợp |

Gate full-stack đang ghim `COMPATIBLE_BE_SHA` trong workflow. Pin này **cố ý** không tự chạy theo BE `main`; khi contract đổi, cập nhật bằng PR compatibility có review.

## 4. Bằng chứng lịch sử

| Nguồn | Nội dung | Cảnh báo |
|---|---|---|
| [`reports/`](reports/) | Báo cáo G2–G7, JSON, ảnh browser | Số liệu theo ngày và commit riêng |
| [`design/`](design/) | Audit thiết kế, notebook foundation, notifications | Có thể lệch UI sau redesign |
| [`ACCEPTANCE-CHECKPOINT-20261026.md`](ACCEPTANCE-CHECKPOINT-20261026.md) | Checkpoint 26/10 | Lịch sử |
| [`BUSINESS-ACCEPTANCE-20261027.md`](BUSINESS-ACCEPTANCE-20261027.md) | Nghiệp vụ 27/10 | Lịch sử |
| [`BUSINESS-ACCEPTANCE-20261028.md`](BUSINESS-ACCEPTANCE-20261028.md) | Nghiệp vụ 28/10 | Lịch sử |
| [`ROLEPLAY-ACCEPTANCE.md`](ROLEPLAY-ACCEPTANCE.md) | Nhập vai sinh viên/giảng viên | Lịch sử |
| [`archive/`](archive/) | Trước Aurora/notebook | Chính sách cũ |

Quy tắc đọc: **không cộng test của nhiều mốc**, không coi ảnh cũ là bằng chứng UI hiện tại, không coi harness deterministic là provider thật.

## 5. Phần chưa được chứng minh

- Chưa audit WCAG/Core Web Vitals đầy đủ cho toàn bộ 80 route.
- Chưa có production deployment; không tuyên bố sẵn sàng production.
- Không phải mọi route có ảnh browser mới sau redesign.
- Provider AI/GitHub thật có thể lỗi/timeout; harness deterministic không thay thế kiểm tra live.
- Một số luồng phụ thuộc dữ liệu/role cụ thể; smoke không kích hoạt mọi nhánh 403/409.

## 6. Cách ghi một mốc mới

1. Tạo mục “Mốc … — ngày”.
2. Ghi branch, commit, dirty state.
3. Ghi lệnh + exit code + số test.
4. Ghi môi trường: FE/API/DB, viewport, tài khoản vai trò (không mật khẩu).
5. Ghi rõ đã kiểm gì và **chưa** kiểm gì.
6. Lưu log/ảnh dưới workspace; chỉ commit bằng chứng đã lọc PII.

Xem [TESTING](TESTING.md) để biết chọn lớp kiểm chứng phù hợp.
