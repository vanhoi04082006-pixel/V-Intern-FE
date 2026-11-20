# Chế độ Preview (mock) — V-Intern FE

> Ngày: 2026-11-20 · nhánh `codex/product-acceptance-20261116` · Section 10 của master brief.

Preview cho phép chạy giao diện V-Intern **không cần backend/SQL** để kiểm thử UI,
trạng thái dữ liệu và luồng nghiệp vụ với bộ dữ liệu mô phỏng có quan hệ nhất quán.

## 1. Bật preview (chỉ dev / preview deployment)

```bash
# Dev thông thường — tắt preview (mặc định):
npm run dev            # port 3001, gọi API thật theo NEXT_PUBLIC_API_BASE_URL

# Dev với preview bật:
NEXT_PUBLIC_PREVIEW=1 npm run dev
```

Điều kiện bật (xem `src/lib/preview/enabled.ts`):

1. `NEXT_PUBLIC_PREVIEW=1` — **biến build-time**, đặt trước khi chạy/build.
2. `NODE_ENV !== "production"` — mọi `next build` luôn là production.

Hệ quả:

- Không URL parameter, `localStorage` hay client-side flag nào bật được preview
  ở production (test tự động: `src/lib/preview/__tests__/preview-isolation.test.ts`).
- Trong production build, nhánh import mock bị dead-code elimination; kiểm chứng:
  `node scripts/verify-preview-isolation.mjs` (dò marker trong `.next` sau build — phải 0 hit).

## 2. Tài khoản demo (Section 10.1)

Bảng chọn tài khoản nằm ở góc dưới-trái màn hình (chỉ hiện khi preview bật).
Mật khẩu chung: `Preview@12345`.

| Email | Vai trò | Trạng thái đại diện |
|---|---|---|
| `admin@vintern.preview` | admin | extensive: toàn quyền, dữ liệu vận hành đầy |
| `giangvien1@vintern.preview` | instructor | normal: chủ sở hữu phiên Thu 2026 |
| `giangvien2@vintern.preview` | instructor | incomplete: chưa có phiên active (dashboard rỗng) |
| `sinhvien1@vintern.preview` | intern | extensive: sprint chạy, KPI, sổ lương, chứng nhận |
| `sinhvien_minh@vintern.preview` | intern | normal: ít dữ liệu |
| `sinhvien_tan@vintern.preview` | intern | new: chưa onboarding → luồng recruitment_required |
| `sinhvien_nanghe@vintern.preview` | intern | restricted: thiếu quyền nộp bài (permission denied) |

Tài khoản demo **không tồn tại trong DB thật** — chỉ sống trong router mock,
đã loại khỏi production bundle.

## 3. Kịch bản (scenario switching)

| Kịch bản | Ý nghĩa | Kiểm tra gì |
|---|---|---|
| `populated` | Dữ liệu đầy đủ (mặc định) | Layout, bảng, chart, tương tác |
| `empty` | Danh sách rỗng, số liệu 0 | Empty state |
| `loading-slow` | Mọi request chậm 2.4s | Skeleton/loading state |
| `error` | 500 mọi request dữ liệu (auth giữ nguyên) | ErrorState + retry |
| `unauthorized` | 401 cả refresh | clearSession → về /login đúng luồng |
| `forbidden` | 403 mọi request dữ liệu | Permission denied state |
| `validation` | GET giữ dữ liệu; mutation → 422 kèm details | Form validation error |
| `network` | Mất kết nối (ApiError 0) | Offline messaging |
| `large` | 120 dòng dữ liệu | Phân trang, cuộn, overflow |
| `long-text` | Chuỗi dài tiếng Việt | Tràn dòng, ellipsis, wrap |

Đổi kịch bản/tài khoản → app **reload và bootstrap lại đúng luồng refresh thật**
(không hack state React).

## 4. Endpoint đã mock (nguồn: `src/lib/preview/router.ts`)

- **Auth**: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`,
  `POST /auth/logout`, `GET /auth/me`.
- **Dashboard/quản trị**: `GET /dashboard/admin`, `GET /dashboard/instructor`,
  `GET /sessions/overview`, `GET /users`, `GET /users/:id`, `GET /roles`,
  `GET /groups`, `GET /audit-logs`, `GET /activity-events`, `GET /settings`,
  `GET /health`.
- **Intern**: `GET /intern/me/workspace`, `/evaluations(+/​:id)`, `/performance`,
  `/kpi(+/​:id)`, `/virtual-salary(+/​ledger)`, `/certificates(+/​:id)`,
  `/ai-recommendations(+/​refresh)`, `/sprint/board`, `/sprints`, `/project`,
  `/ai-mentor/conversations(+/​:id+/​archive+/​messages)`.
- **Công việc**: `GET /tasks`, `GET /tasks/:id`, `/spec`, `/spec/source`,
  `/comments`, `/history`, `/submissions`, `GET /submissions/:id/code-reviews`.
- **Tham gia & GitHub**: `GET /participation/me`, `/participation/me/replacements`,
  `GET /github/me/repository-access`,
  `GET /sessions/:id/participation` (+policy).
- **Thông báo**: `GET /notifications` (+unread-count, preferences),
  `POST .../read`, `/read-all`, `PUT /preferences`.
- **Công khai**: `GET /certificates/verify/:code`.

Endpoint **chưa mock** trả `501 PREVIEW_ENDPOINT_NOT_MOCKED` và hiển thị
ErrorState — coverage matrix ghi rõ "endpoint chưa mock" thay vì giả dữ liệu.
Muốn thêm: bổ sung handler trong `router.ts` theo đúng parser fail-closed của
`src/lib/api/*` (test `preview-router.test.ts` chạy qua parser thật).

## 5. Kiểm thử đi kèm

- `src/lib/preview/__tests__/preview-isolation.test.ts` — gate, sessionStorage,
  chống kích hoạt qua client-side flag.
- `src/lib/preview/__tests__/preview-router.test.ts` — shape mock qua parser
  thật của FE (fail-closed), scenario, hành vi stateful (đánh dấu đã đọc).
- `scripts/preview-visual-audit.mjs` — audit browser toàn route × role,
  desktop + mobile, ảnh + JSON bằng chứng vào `docs/preview-evidence/`.
- `scripts/verify-preview-isolation.mjs` — bằng chứng bundle production sạch mock.

## 6. Vì sao dữ liệu tách tuyệt đối với production

- Mock chạy **trong transport client** (`previewFetch` thay `fetch`), không đụng
  network, không đụng DB, không có "fallback sang mock" khi API thật lỗi.
- `NEXT_PUBLIC_API_BASE_URL` không đặt + preview tắt → mọi trang vẫn báo
  `API_CONFIG_MISSING` trung thực như trước.
- Production build không chứa module mock (mục 1) — không demo account, không
  response giả, không thông báo thành công giả.
