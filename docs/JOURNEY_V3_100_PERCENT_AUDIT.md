# JOURNEY V3 — 100% ROUTE AUDIT (FINAL ACCEPTANCE RE-AUDIT)

Ngày: 2026-11-20 · nhánh `codex/product-acceptance-20261116` · HEAD cuối phiên (xem git log).
Đợt này là **tái nghiệm thu độc lập** sau khi phát hiện các lỗ hổng nghiệm thu của phiên
`519b130` (manifest khai DONE khi bằng chứng chưa đủ nghiêm ngặt).

## 0. LỖ HỔNG ĐÃ XÁC MINH VÀ CÁCH KHẮC PHỤC

| # | Lỗ hổng phát hiện độc lập (đầu vào của đợt này) | Khắc phục thật |
|---|---|---|
| 1 | 31–32 route chỉ có 1 screenshot, không có bằng chứng 768px | Audit lại **toàn bộ 79 route UI × 3 viewport (390/768/1440)** = 237 ảnh route + 26 ảnh trạng thái/tương tác |
| 2 | `/change-password` dùng screenshot của `/login` | Chụp riêng bằng phiên đăng nhập intern (`evidence/intern/change-password-{vw}.jpg`, finalUrl `/change-password`) |
| 3 | `/admin/sessions/[id]`, `/admin/sprints/[id]` dùng ảnh Instructor | Audit lại bằng **tài khoản admin** (`admin@vintern.preview`) — resolvedRoute `/admin/sessions/ss-f26`, `/admin/sprints/sp-03` |
| 4 | `/instructor/tasks/[id]` dùng ảnh Intern | Audit lại bằng **tài khoản giảng viên** (`giangvien1@vintern.preview`) — resolvedRoute `/instructor/tasks/ts-20` |
| 5 | `/admin/knowledge/[code]` dùng ảnh trang tạo mới | Audit với **code hợp lệ** `KL-QA-01` từ dữ liệu preview — resolvedRoute `/admin/knowledge/KL-QA-01` |
| 6 | Ảnh evidence cũ thực chất là **trạng thái LỖI** (knowledge: "Chưa có quyền đọc"; salary: "Không thể hoàn tất yêu cầu") | Mở rộng mock preview API (GAP-2, mục 2) để mọi endpoint trang dùng đều trả dữ liệu parse-đúng → trang render **loaded** mới chụp; 0 response 501 |
| 7 | Global states thiếu bằng chứng độc lập | Chụp riêng not-found (404 thật × 3 viewport), loading-skeleton (scenario loading-slow), error (scenario error), empty (scenario empty admin + instructor) — mỗi trạng thái một ảnh, không mượn ảnh loaded |
| 8 | `coverage-manifest.json` thiếu trường Role và API rõ ràng | Manifest mới: mỗi route có `role {access, auditedAs, account}`, `api [endpoint…]`, `perms`, `browser {finalUrl, state, consoleErrors, 501, overflowX}`, `evidence [{viewport, file, role, resolvedRoute}]` |
| 9 | Script coverage cũ không bắt buộc 3 viewport, không kiểm ảnh đúng route, không xác nhận functional QA | Gate v2 (`scripts/verify-journey-v3-coverage.mjs`) thực thi đủ 10 yêu cầu nghiệm thu — exit ≠ 0 khi thiếu bất kỳ mục nào |
| 10 | Số liệu tổng route không nhất quán giữa các tài liệu | Thống nhất: **80 route = 79 route UI + 1 redirect server-side** (`/instructor/classes`); 5 global states tách bảng riêng |
| 11 | (tự phát hiện trong đợt này) Phase xoay tab làm mất phiên → các route sau đó chụp nhầm trang `/login` | Sửa script: tab mới phải **đăng nhập lại**; auditRoute chặn "unexpected-redirect" (không bao giờ dùng ảnh route khác thay thế) — sau khi sửa, 0 route bị redirect ngoài ý muốn |

## 1. MÔI TRƯỜNG NGHIỆM THU (PHÂN BIỆT RÕ CÁC PHẠM VI)

```
CODE COMPLETE        ✅  lint 0 lỗi · tsc 0 lỗi · 136 file/804 test pass · next build PASS
VISUAL VERIFIED     ✅  Preview QA — 79/79 route UI render loaded, đúng role, ảnh thuộc đúng route
                       (Visual review bổ sung bằng VLM — xem mục 6)
RESPONSIVE VERIFIED ✅  3 viewport (390×844 / 768×1024 / 1440×900) cho mọi route UI;
                       overflow ngang = 0 ở cả 3 viewport (metadata trong browser-audit.json)
FUNCTIONAL VERIFIED ✅  Preview QA — 22/22 tương tác nghiệp vụ chính pass (mục 5)
REAL BACKEND        ❌  KHÔNG kiểm thử. Toàn bộ bằng chứng trên mock API preview
                       (NEXT_PUBLIC_PREVIEW=1, src/lib/preview/*). KHÔNG tuyên bố
                       Real Backend E2E PASS. Preview isolation PASS (0 marker trong
                       production build — mock bị dead-code loại khỏi bundle).
```

Dữ liệu production KHÔNG bị đụng: mọi thao tác nghiệp vụ chạy trên mock preview
(tài khoản `*.preview`, entity `ss-f26 / sp-03 / ts-20 / KL-QA-01 / tpl-lib …`).

## 2. MỞ RỘNG PREVIEW MOCK API (điều kiện để "loaded" là thật)

Bằng chứng cũ của nhiều route admin thực chất là ErrorState vì endpoint chưa mock.
Đợt này mở rộng `src/lib/preview/` để mọi endpoint các trang gọi đều có dữ liệu:

- `router.ts` — 59 → **279 route handler** (mock mọi endpoint GAP-1 truy vết được:
  knowledge, kpi-periods, salary admin, sessions CRUD + detail + milestones + timeline,
  sprints, projects, templates, evaluations + cycles + ai-suggestions, imported-reviews,
  recruitment-rounds + applications, reports, catalogs, communications, ai-configuration,
  agents, github identity, participation ops, recruitment/me…).
- `admin-data.ts` (mới) — dữ liệu mock admin/instructor bám **parser fail-closed**
  `src/lib/api/parse.ts`, ID nhất quán với data.ts gốc.
- `accounts.ts` — thêm quyền `knowledge.read/manage/publish` cho tài khoản admin demo
  (trang knowledge bị chặn quyền là một nguyên nhân bằng chứng cũ sai).
- `onboarding-flow.ts` (mới) — luồng onboarding **có trạng thái theo phiên**
  (sessionStorage): chọn nghề → phỏng vấn → trả lời 6 câu → nộp → kết quả;
  workspace mock phản ánh đúng `lifecyclePath` của FE.
- `data.ts` — mentor conversations **có trạng thái**: POST messages append vào phiên,
  GET phản ánh (tin nhắn gửi hiển thị thật sau reload — đúng hành vi FE).

Kiểm chứng: `src/lib/preview/__tests__/preview-gap2-endpoints.test.ts` (17 test mới
qua request() + parser thật); **0 endpoint 501** trong toàn bộ 80-route audit.

## 3. KẾT QUẢ AUDIT 80 ROUTE

| Nhóm | Số route | Bằng chứng |
|---|---|---|
| Public & Auth | 8 UI (`/`, `/login`, `/register`, `/forgot-password`, `/verify`, `/apply`, `/change-password`*, `/github/invitation`*) | 3 viewport/route; `/change-password` + `/github/invitation` chụp bằng phiên đăng nhập đúng quyền truy cập |
| Intern | 20 UI | 3 viewport/route; ID động hợp lệ: `ts-20`, `kpi-2026-10`, `ev-2026-mid`, `cert-01` |
| Intern Onboarding (tài khoản `sinhvien_tan`) | 4 UI | Luồng THẬT được đi qua: welcome → chọn nghề (radio card + "Bắt đầu phỏng vấn") → phỏng vấn 6 câu + nộp → result |
| Instructor | 16 UI + 1 redirect | 3 viewport/route; `ss-f26`, `ss-f26/setup?project=prj-lib`, `sp-03`, `tpl-lib`, `ts-20`; `/instructor/classes` redirect kiểm chứng bằng **URL cuối** (`/instructor/projects`) — không dùng ảnh |
| Admin | 31 UI | 3 viewport/route; `ss-f26`, `sp-03`, `ts-20`, `KL-QA-01` |

Tổng: **80/80 route** — 79 route UI có đầy đủ 3 viewport × đúng role × dữ liệu loaded
(0 console error, 0 page error, 0 response 501, 0 HTTP 5xx, 0 tràn ngang > 2px) +
1 redirect verified. Chi tiết từng route (URL cuối, trạng thái dữ liệu, lỗi, ảnh):
`docs/journey-v3-evidence/coverage-manifest.json` (sinh bởi
`scripts/gen-journey-v3-manifest.mjs` từ `browser-audit.json`).

Công cụ tái chạy: `node scripts/journey-v3-browser-audit.mjs --phase=<public|intern|
onboarding|instructor|admin|admin2|states|interactions|merge>` rồi
`node scripts/gen-journey-v3-manifest.mjs` rồi `node scripts/verify-journey-v3-coverage.mjs`.

## 4. TRẠNG THÁI LOADING / EMPTY / ERROR / NOT-FOUND — BẰNG CHỨNG RIÊNG

| Trạng thái | Bằng chứng | Cách kích hoạt |
|---|---|---|
| Loading (skeleton "Đang tải dữ liệu…") | `global/intern-work-loading-skeleton-1440.jpg` | scenario `loading-slow` (mọi request +2400ms), chụp giữa lúc tải |
| Error (ErrorState) | `global/intern-work-error-state-{1440,768,390}.jpg` | scenario `error` (500 mọi request ngoài auth) |
| Empty | `global/admin-users-empty-state-{1440,768,390}.jpg`, `global/instructor-empty-users-{…}.jpg` | scenario `empty` (danh sách rỗng — Empty primitive render) |
| 404 not-found | `global/not-found-{1440,768,390}.jpg` | truy cập route không tồn tại (404 thật, VLM xác nhận sketch-card + doodles) |

Không dùng ảnh loaded thay cho các trạng thái trên.

## 5. TƯƠNG TÁC NGHIỆM VỤ CHÍNH — 22/22 PASS (Preview QA)

Đăng nhập từng role (admin/instructor/intern/intern-mới) · ⌘K command palette ·
drawer mobile 390 · tìm kiếm users · mở phiên SS-F26 từ console · chọn đợt tuyển
dụng (admin + instructor) · chọn kỳ lương · mở tài liệu KL-QA-01 · mở trang Thiết lập
phiên · gửi tin nhắn AI Mentor (tin hiển thị thật) · đánh dấu mọi thông báo đã đọc ·
render form đổi mật khẩu (đã đăng nhập) · submit forgot-password (FE trung thực
"chưa kết nối") · submit register ("Đăng ký thành công") · xác minh chứng nhận
VC-2026-000123-XK4T · onboarding chọn nghề · logout → /login.

## 6. REVIEW ĐỘ SÂU CHUYỂN THỂ (yêu cầu §4 của đợt này)

- **Kiểm kê 15 component chỉ đổi 1–3 dòng ở 3 commit trước**: toàn bộ là
  `eyebrow`/`showThemeToggle` thêm vào component **đã dùng v3 primitives**
  (`product/primitives` nb3-bridge, `student-ui`, `notebook/*`) — kế thừa là thật
  (bằng chứng: các trang cha render notebook style trong audit + VLM).
- **Phát hiện 1 trang còn UI cũ thật sự**: `/intern/work/[id]` (cùng TaskContent
  dùng cho `/instructor/tasks/[id]`, `/admin/tasks/[id]`) — hero detail dạng SaaS phẳng.
  **Đã sửa thật** (`src/components/product/intern-work.tsx`): hero chuyển sang
  `nb-sketch-card` (viền mực + bóng mực + giấy) + `Tape` + eyebrow "NHIỆM VỤ";
  biến thể managed thêm eyebrow. VLM xác nhận sau sửa: "cream paper card, hand-drawn
  ink border, tape strip behind NHIỆM VỤ eyebrow" (tái chụp 3 route × 3 viewport —
  phase `patch`).
- **VLM sweep 79 ảnh** (visual review độc lập, ghi trung thực): ~29/79 verdict
  "notebook đầy đủ" (cream + ink border + stamp/doodle); ~46/79 "notebook một phần"
  (giấy kem/doodle/grid-paper có, mật độ stamp/viền mực khác nhau theo khu);
  1 trang từng "SaaS" đã được sửa như trên. Sweep là đánh giá thị giác của model —
  bảng verdict đính kèm `browser-audit` để tái kiểm tra; chuẩn "đạt" của cổng
  nghiệm thu là bằng chứng browser (role/route/viewport/dữ liệu) — không lấy
  verdict VLM làm điều kiện PASS/FAIL đơn độc.

## 7. GLOBAL STATES + NGOẠI LỆ (trạng thái riêng, không tính PASS tự động)

| File | Trạng thái | Ghi chú |
|---|---|---|
| `src/app/not-found.tsx` | DONE | 404 thật × 3 viewport |
| `src/app/loading.tsx` | DONE | skeleton dữ liệu (scenario loading-slow) + code-audit route-level |
| `src/app/error.tsx` | **EXEMPT-REASONED** | chỉ render khi exception render chưa xử lý — mọi lỗi API đã được ErrorState bắt (có bằng chứng); không route nào ném exception render trong luồng thật; mô phỏng buộc inject lỗi nhân tạo → không tái kiểm tra được |
| `src/app/global-error.tsx` | **EXEMPT-REASONED** | chỉ render khi root layout throw — không thể tái hiện bằng thao tác người dùng; bằng chứng = code-audit inline-style |
| `src/app/template.tsx` | **EXEMPT-NO-UI** | không render UI riêng |

Gate v2 **ép** mỗi ngoại lệ phải có `justification` (≥40 ký tự) + `technicalEvidence`,
và cấm khai DONE — thiếu bất kỳ mục nào thì exit ≠ 0.

## 8. CỔNG KIỂM SOÁT CHẤT LƯỢNG (chạy lại toàn bộ đợt này)

| Cổng | Kết quả |
|---|---|
| `npx eslint .` | 0 lỗi · 1 warning có chủ đích (`no-img-element` ở PolaroidFrame) |
| `npx tsc --noEmit` | 0 lỗi |
| `npx vitest run` | 136 file / **804 test pass** (baseline 787 + 17 test preview-gap2) |
| `npx next build` | PASS |
| `node scripts/verify-preview-isolation.mjs` | PASS — 0 marker preview trong `.next` |
| `node scripts/verify-journey-v3-coverage.mjs` (gate v2, 10 yêu cầu) | **PASS** — exit 0 |

## 9. KẾT LUẬN

**80/80 route có bằng chứng browser đúng role × 3 viewport, ảnh thuộc đúng route,
dữ liệu loaded, 0 lỗi console/runtime, 0 endpoint chưa mock, trạng thái
loading/empty/error/404 có bằng chứng riêng, 22/22 tương tác nghiệp vụ pass,
redirect kiểm chứng bằng URL cuối, ngoại lệ có giải thích kỹ thuật và trạng thái riêng.**

Phạm vi tuyên bố: **Preview QA (CODE COMPLETE + VISUAL + RESPONSIVE + FUNCTIONAL)**.
**Real Backend E2E: chưa kiểm thử — không tuyên bố.**
