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

---

## Phiên tích hợp v3 — Journey Notebook (2026-11-21)

**Phạm vi:** chuyển thể lớp thiết kế "Sổ tay hành trình v3" (từ sandbox demo
1-route) vào source thật nhánh `codex/product-acceptance-20261116` — additive,
giữ 100% logic API/permission/routing/multi-route.

### Đã làm

1. **Design system**: thêm `src/styles/journey.css` (v3 tokens, 17 keyframes
   mới, utilities paper-grain / card-tilt / sticker-pop / ants-border /
   shake-ink / spotlight-sweep…, kill-switch reduced-motion cục bộ) — import
   1 dòng vào `globals.css`; mọi keyframe/biến trùng tên repo đã có được bỏ
   qua, không ghi đè.
2. **176 custom SVG icons** (`src/components/icons/v-icons.tsx`, gồm
   VLogo/VLogoMark) + **notebook primitives** (`src/components/notebook/{ui,
   reveal,doodles}.tsx`: Tape, StampMoc, NoteCard, InkBadge, PolaroidFrame,
   Stagger…) — namespaced `nb-*` tại mọi điểm đụng style trùng tên của repo
   (tape, stamp-moc, sketch-card, sticky-note, squiggle…).
3. **Landing**: `v-intern/how-it-works.tsx` thay bằng bản **5 tấm vé 01–05**
   (sticker-pop + tape-gold + vé vẽ tay), giữ export, anchor
   `#how-it-works` và mọi liên kết landing nguyên vẹn.
4. **Auth**: `password-strength.tsx` (meter điểm mạnh), Caps Lock hint trong
   `password-field.tsx`, `animate-shake-ink` khi lỗi ở `login-form.tsx`,
   meter ở `register-form.tsx` + `change-password.tsx`; toàn bộ luồng
   `auth-service`/validation/redirect/cookie giữ nguyên từng dòng.
5. **Shell**: `shared/command-palette.tsx` — bảng lệnh ⌘K/Ctrl+K/`/` dựng trên
   pattern `<dialog>` của repo, điều hướng **55 route thật** theo role
   (intern/instructor/admin), "Đăng xuất" gọi đúng `auth-service.logout()`;
   gắn vào `intern/intern-topbar.tsx` và `product/shell.tsx` (bỏ `/` ở intern
   để không đụng phím tắt search sẵn có).
6. **Flagship accents**: mộc "KHO BẠC"/"KPI" (salary/kpi console), mộc "SỔ TAY"
   (`student-outcome-heading.tsx` — phủ các trang outcome của 3 role),
   sticker-pop thẻ số dư lương, card-tilt hàng session `/instructor/sessions`,
   paper-grain cho 4 trang auth, xoá emoji `👋`.
7. **Docs**: ma trận 9.9 trong `UI_COVERAGE_MATRIX.md`.

### Cổng kiểm soát (đều XANH)

- Quét marker mock sandbox (`an.pham`, `minh.nguyen`, `lan.pham`, `Sv@2026`,
  `Gv@2026`, demo-account-panel, `enterAuth(`, `ghp_`): **0 kết quả** trong
  tập file của phiên. Hệ preview `src/lib/preview/*` là commit có trước của
  repo, không đụng.
- `bun run lint` 0 lỗi · `bun run typecheck` 0 lỗi · `bunx vitest run`
  **135 file / 787 test pass** (đúng baseline) · `bun run build` **PASS**.

### Commits của phiên

1. `feat(design-system): integrate journey notebook tokens and 176 custom icons`
2. `feat(ui): upgrade landing, auth and global shell`
3. `feat(pages): upgrade student, instructor and admin workspaces with real api`
4. `docs: add UI coverage matrix and progress report`

### Còn lại (phiên sau)

- Áp sâu v3 (paper-grain/card-tilt/sticker-pop) cho từng trang workspace còn
  đang ở "lớp dùng chung" (ma trận 9.9.2 dòng PARTIAL).
- Audit browser cho lớp v3 trên từng route (hiện đã có build + 787 test xanh).
