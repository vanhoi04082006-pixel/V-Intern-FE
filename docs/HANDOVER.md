# Bàn giao Frontend

Tài liệu này là điểm bắt đầu cho người tiếp nhận. Nó không thay thế các chương kỹ thuật; nó cho biết **đọc gì, kiểm gì và phần nào chưa được chứng minh**.

> **Mốc bàn giao:** 02/11/2026 · nhánh `main` · commit `063c3d5`
> **Trạng thái:** 80 route source · 117 file test / 672 test đạt · lint, typecheck, build đạt.

## 1. Đọc theo nhu cầu

| Bạn cần | Đọc |
|---|---|
| Chạy sản phẩm | [GETTING-STARTED](GETTING-STARTED.md) → [TROUBLESHOOTING](TROUBLESHOOTING.md) |
| Hiểu hệ thống | [ARCHITECTURE](ARCHITECTURE.md) → [ROUTE-MAP](ROUTE-MAP.md) → [API-CONTRACTS](API-CONTRACTS.md) |
| Làm giao diện | [UI-SYSTEM](UI-SYSTEM.md) → [TESTING](TESTING.md) |
| Kiểm thử/nghiệm thu | [TESTING](TESTING.md) → [VERIFICATION](VERIFICATION.md) |
| Demo | [DEMO](DEMO.md) |
| Đóng góp | [CONTRIBUTING](CONTRIBUTING.md) → [SECURITY](SECURITY.md) |
| Nghiệp vụ | [CAREER-ROLES](CAREER-ROLES.md) · [CV-AND-INTERVIEW-SCHEDULING](CV-AND-INTERVIEW-SCHEDULING.md) · [MINI-PROJECTS](MINI-PROJECTS.md) · [KNOWLEDGE-LIBRARY](KNOWLEDGE-LIBRARY.md) · [PARTICIPATION](PARTICIPATION.md) · [REPLACEMENT](REPLACEMENT.md) |

## 2. Frontend chịu trách nhiệm gì?

**Có:**

- Route, layout, guard điều hướng và trải nghiệm theo vai trò.
- Gọi API, parse response, hiển thị loading/error/empty.
- Form, mutation, xác nhận, xử lý xung đột và lỗi.
- Design system, accessibility, responsive và motion.
- Hiển thị đúng dữ liệu/trạng thái do BE trả về.

**Không:**

- Không có database, không tự tính điểm/KPI/chứng nhận.
- Không quyết định quyền cuối cùng; BE kiểm tra permission + ownership.
- Không gọi provider AI/GitHub trực tiếp.
- Không thay đổi trạng thái nghiệp vụ bằng dữ liệu local.

## 3. Chạy nhanh

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm ci
Copy-Item .env.example .env   # chỉ khi chưa có
npm run dev
```

Kiểm tra:

1. `http://localhost:8080/api/v1/health` → `database: ok`.
2. `http://localhost:3001` → đăng nhập đúng vai trò.
3. Mở một phiên/task có thật; so sánh góc nhìn sinh viên và giảng viên.

Bản production:

```powershell
npm run build
& ..\manual-runtime\restart-owned-apps.ps1 -Frontend
```

## 4. Kiến trúc trong một trang

```text
Route (app/) → Guard/Entry → Shell → Component nghiệp vụ
             → lib/api adapter → api-client → NestJS /api/v1
```

- `WorkspaceGuard`: đăng nhập + vai trò.
- `InternEntry`: lifecycle sinh viên (onboarding/chờ/workspace/outcomes).
- `InternShell` / `ProductShell`: hai shell, một hệ token.
- `useResource`: abort/error/reload.
- Adapter: parse `unknown`, không cast.
- Auth: access token memory, refresh cookie HttpOnly, single-flight.

Chi tiết: [ARCHITECTURE](ARCHITECTURE.md).

## 5. Kiểm thử trước khi nhận bàn giao

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Kỳ vọng hiện tại: lint 0 lỗi, typecheck 0 lỗi, **672 test**, build thành công. CI `verify` và `sql2019` là gate merge; xem [TESTING](TESTING.md).

## 6. Việc cần kiểm lại khi tiếp nhận

- [ ] Đăng nhập/refresh/logout trên trình duyệt thật, cả reload.
- [ ] Ba vai trò vào đúng landing; route private chặn người sai vai.
- [ ] Sinh viên passed-unassigned, có assignment, đã kết thúc placement.
- [ ] Một luồng mutation: tạo/sửa, 409, 403, 429, lỗi mạng.
- [ ] GitHub connect/invitation và trạng thái repo.
- [ ] AI Mentor/gợi ý: loading, lỗi provider, không bịa kết quả.
- [ ] KPI/lương/chứng nhận/report: số 0 và “chưa đo được” khác nhau.
- [ ] Responsive 390/768/1440; dark mode; keyboard/modal.
- [ ] Không có secret/PII trong log/ảnh.

## 7. Giới hạn đã biết

| Giới hạn | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Full-stack gate ghim BE `a81de95` | Chưa tự động kiểm BE `main` mới nhất | Cập nhật `COMPATIBLE_BE_SHA` bằng PR compatibility khi contract đổi |
| Chưa audit WCAG/Core Web Vitals đầy đủ | Không chứng minh accessibility toàn hệ thống | Dùng checklist + browser/axe cho route thay đổi |
| Không phải mọi route có ảnh/browser evidence | Ảnh cũ có thể lệch UI hiện tại | Kiểm lại route trước khi dùng ảnh demo |
| Provider AI/GitHub thật có thể lỗi | Luồng phụ thuộc dịch vụ ngoài | Hiển thị lỗi/retry; không giả kết quả |
| Build dùng font Google cho Be Vietnam Pro/JetBrains Mono | Cần mạng ở bước build | Giữ cache/kiểm tra CI; không đổi sang tải runtime |
| Chưa có production deployment | Chỉ môi trường local/CI | Không tuyên bố sẵn sàng production |

## 8. Bàn giao kèm gì?

- Commit/branch và tình trạng working tree.
- Danh sách file/route đã đổi.
- Lệnh đã chạy + kết quả + số test.
- Ảnh browser thật (nếu UI) và viewport đã kiểm.
- Phần chưa kiểm/known issue.
- Liên kết PR BE, issue, tài liệu liên quan.

Thông tin đăng nhập, khóa, `.env` và `manual-runtime/private` bàn giao qua kênh riêng. Không đưa vào repo, README, ảnh hay chat công khai.
