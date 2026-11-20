# IMPLEMENTATION PROGRESS — V-Intern UI/UX Transformation

> Checkpoint theo Section 19.7. Cập nhật: 2026-11-20.
> Nhánh: `codex/product-acceptance-20261116` · điểm bắt đầu: `a9b7273`.

## Trạng thái tổng (bản cập nhật cuối phiên)

| Phase | Phạm vi | Trạng thái |
|---|---|---|
| 1 — Repository audit | Clone FE/BE, routes/roles/API map | DONE |
| 2 — UI Coverage Matrix | `docs/UI_COVERAGE_MATRIX.md` (7 bảng, 80 routes thật) | DONE — đã điền bằng chứng browser |
| 3 — Design system | Kế thừa Notebook DS + toast/confirm mới theo tokens | DONE |
| 4 — Global layout | ToastProvider root + PreviewGate root | DONE |
| 5 — Preview environment | Gate + mock + demo accounts + scenarios + switcher | DONE |
| 6 — Browser audit | 77 route-passes, 0 console error, 83 ảnh | DONE |
| 7 — QA & optimization | tsc sạch · eslint sạch · 787/787 test · build prod · isolation PASS | DONE |
| 8 — Git delivery | commits nhóm + push nhánh | DONE (xem Commits) |

## Đã hoàn thành trong phiên này

1. **Audit nguồn** — 84 `page.tsx` routes; 3 roles từ `ROLE_CATALOG` BE
   (admin/instructor/intern); baseline `tsc` sạch, 742 test pass (130 file).
2. **`docs/UI_COVERAGE_MATRIX.md`** — sinh từ route scan thật; cột bằng chứng
   chỉ điền khi có JSON audit; không tự nâng trạng thái.
3. **Toast system** (`src/components/shared/toast.tsx` + motion.css keyframes
   `nb-toast-in/out` + tests 10 case):
   - 5 tone (success/info/warning/error/progress) + progress handle done/fail.
   - a11y: `role=status` (polite) / `role=alert` (assertive), nút đóng,
     Escape, pause khi hover/focus; `prefers-reduced-motion` tắt animation.
   - preset nghiệp vụ: permissionDenied/sessionExpired/networkFailure.
   - Stack trần 4; auto-dismiss theo tone; API trả id để dismiss thao tác trước.
   - Wired: Notifications (outcomes.tsx) thay notice inline; test cập nhật.
4. **ConfirmDialog** (`src/components/shared/confirm-dialog.tsx` + 5 test):
   danger/normal, busy khoá cả hai nút, focus restore. Thay `window.confirm`
   ở `sprint-management.tsx` (xoá task) và `setup-wizard.tsx` (bỏ dở).
5. **Preview Mode** (`src/lib/preview/`):
   - `enabled.ts` gate build-time (flag + non-production); `isApiConfigured()`
     coi preview như đã cấu hình khi gate mở.
   - `store.ts` scenario/account in-session (sessionStorage, chỉ khi gate mở).
   - `accounts.ts` 7 demo accounts theo Section 10.1 (new/normal/extensive/
     incomplete/restricted).
   - `data.ts` bộ dữ liệu "Phiên Thu 2026" quan hệ nhất quán; marker
     `VINTERN-PREVIEW-MARKER` cho script dò bundle.
   - `router.ts` ~40 endpoint mock (auth, dashboard admin/instructor, admin
     lists, intern workspace/outcomes/mentor, tasks/board, notifications,
     verify); endpoint chưa mock → 501 trung thực.
   - `transport.ts` áp scenario: loading-slow/error/unauthorized/forbidden/
     validation/network/large/long-text/empty.
   - `apiFetch` tiêm transport qua dynamic import trong nhánh gate (DCE được).
   - `preview-gate.tsx` + `preview-switcher.tsx` UI bảng điều khiển.
   - Tests 26 case: isolation + shape qua parser fail-closed của repo.
6. **Công cụ**: `scripts/preview-visual-audit.mjs` (Playwright + dev server),
   `scripts/verify-preview-isolation.mjs` (build + grep marker),
   `docs/PREVIEW.md`, `.env.preview.example`, npm scripts
   `preview:audit` / `verify:preview-isolation`.

## Test đã chạy (pass)

- `vitest run` full: **135 file / 787 test** (baseline 130/742; thêm toast 10,
  confirm 5, preview isolation 14 + router 16 + contract-bridge 4; sửa
  notifications-feedback/setup-wizard giữ hành vi).
- `tsc --noEmit` sạch · `eslint .` sạch (0 error, 0 warning).
- `next build` production OK · `npm run verify:preview-isolation` **PASS
  (0 marker preview trong .next)**.
- Browser audit: 77 route-passes / 0 console error / landing đúng role /
  guest → /login đúng luồng / 6 kịch bản sweep OK.

## Lỗi đã sửa trong phiên (đáng chú ý)

1. Preview refresh sau reload mất identity → login/logout persist account
   vào preview store; audit dùng MỘT tab mỗi role (sessionStorage theo tab).
2. Shape mock sai contract (parser fail-closed từ chối): kpi/evaluations/
   certificates phải `{items:[...]}`; notifications phải Nest `{data,meta}` —
   đã đối chiếu qua `preview-contract-bridge.test.ts`.
3. `Date` hai tham số gây RangeError trong mock sprints/comments/history.
4. Thiếu endpoint: `/sessions/overview`, `/sprints/:id/completion`,
   `/participation/me` (+replacements, github repository-access),
   `/tasks/:id/spec` (+source), `/submissions`, `/submissions/:id/code-reviews`.
5. Login form playwright: fill trước hydration bị wipe → stableFill;
   DCE gate phải inline literal (import const chặn fold của Turbopack) —
   sau đó isolation build PASS thật sự.

## Còn lại (phiên sau có thể tiếp tục)

- ~29 route admin/instructor/onboarding chưa mock endpoint dữ liệu (trang
  hiển thị ErrorState an toàn, 0 console error) — mở rộng handler trong
  `src/lib/preview/router.ts` theo pattern các module `management.ts`,
  `planning.ts`, `system-admin.ts`, `finance.ts`, `recruitment.ts`.
- 13 route [id]/công khai chưa audit browser (chi tiết động chưa có id mock).
- Toast mới wired ở Notifications; các trang còn dùng InlineAlert theo
  design cũ — hợp lệ, chỉ cân nhắc toast cho thao tác dài ngày.

## Commits

- Xem `git log codex/product-acceptance-20261116` sau khi push (nhóm: docs
  coverage, toast+confirm, preview mode, evidence+QA).
