# Bằng chứng browser audit — Preview Mode

> Sinh tự động bởi `npm run preview:audit` (scripts/preview-visual-audit.mjs),
> chạy trên `next dev` + `NEXT_PUBLIC_PREVIEW=1` (mock transport — không backend,
> không DB). Ngày chạy: xem `browser-audit.json` → `meta.startedAt`.

## Nội dung

- **`browser-audit.json`** — kết quả từng route × role: landing sau đăng nhập,
  lỗi console, đếm endpoint chưa mock (hiện qua ErrorState), đường dẫn ảnh.
- **`screens/*.jpg`** — ảnh desktop (1440×900) và mobile (390×844, JPEG q55).

## Cách đọc kết quả

| Trường | Ý nghĩa |
|---|---|
| `meta.*Landing` | URL thực tế sau khi đăng nhập bằng tài khoản demo — xác nhận luồng refresh + role-landing đúng role |
| `pages[].consoleErrors` | lỗi console/pageerror thực tế của trang (đã lọc tiếng ồn dev: Fast Refresh, font, WebGL driver) |
| `pages[].errorState` | trang hiển thị ErrorState (`.nb-error-card`) — với preview: endpoint chưa mock (501) hoặc lỗi kịch bản |
| `pages[].desktopOk/mobileOk` | `true` khi 0 lỗi console ở viewport đó |
| `scenarios[]` | 6 kịch bản sweep (empty/error/forbidden/network/loading-slow/unauthorized) trên `/intern` |

## Số liệu lần chạy cuối

- 77 route-passes (public 11 + role pages 66), **0 console error toàn bộ**.
- Đúng role-landing: admin → `/admin`, instructor → `/instructor`, intern → `/intern`,
  intern mới → `/intern/onboarding` (lifecycle resolver), admin mobile → `/admin`.
- Guest (chưa đăng nhập) vào `/admin`, `/instructor` → `/login` — đúng luồng guard.
- ~39/80 route render đầy dữ liệu mock; phần còn lại hiển thị ErrorState an toàn
  (endpoint chưa mock — xem UI_COVERAGE_MATRIX.md cột Preview/Final Status).
- Lưu ý ngữ nghĩa preview: guest chưa từng đăng nhập sẽ được `/auth/refresh`
  trả 401 như không có cookie — đúng hành vi production.

## Tái tạo

```bash
NEXT_PUBLIC_PREVIEW=1 npm run preview:audit      # script tự spawn dev server ở :3100
```

Kịch bản/tài khoản demo: xem [../PREVIEW.md](../PREVIEW.md).
