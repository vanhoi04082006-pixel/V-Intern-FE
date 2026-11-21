# JOURNEY V3 VISUAL PARITY AUDIT — Master prompt V6, Phase C

> Đối chiếu **FE thật** (`vanhoi04082006-pixel/V-Intern-FE` @ nhánh `codex/product-acceptance-20261116`, sau Phase E) với **Sandbox Journey Notebook v3 gốc** (nguồn thiết kế tham chiếu đã duyệt).
> Phương pháp: (1) đối chiếu token/CSS (`--ink`, giấy kem/bảng đen, Patrick-Hand, shake-ink, tape, stamp, paper-grain); (2) đối chiếu từng screen-group qua import notebook-kit + class usage (code-level); (3) bằng chứng browser Journey coverage gate (`docs/journey-v3-evidence/coverage-manifest.json` — 81 route × 3 viewport đúng role, ảnh thuộc đúng route, state loading/empty/error có bằng chứng riêng — PASS).
> Ghi trung thực: đây là bằng chứng **Preview QA** cho khía cạnh thị giác (mock data chỉ để dựng hình); runtime thật được xác minh riêng ở Phase D (Real Backend E2E trong full-stack CI).

## 1. Landing page — ĐỦ, không thiếu mục nào

FE `/` dựng đúng stack section như sandbox `landing.tsx`: Navbar → Hero (+feature-strip) → HowItWorks → AiInterviewShowcase → ProductHeart → AudienceCards → Workflow → FinalCta (+newsletter trong Footer) → Footer — bao đầy đủ doodles (Tape, Polaroid, hand arrows), reveal/motion, hover/tilt.

| Section | Sandbox | FE | Kết luận |
|---|---|---|---|
| Navbar/Hero/Feature-strip/Workflow/Footer/Newsletter | `v-intern/*.tsx` | cùng file (port 1:1) | IDENTICAL — khác duy nhất mock-enterAuth → `<Link href="/login">` |
| HowItWorks | `landing/how-it-works.tsx` | `v-intern/how-it-works.tsx` | PORTED — namespacing `hw-marker`, `nb-sketch-card` (journey.css tái tạo đúng look) |
| AiInterviewShowcase / ProductHeart / Audience / FinalCta / Doodles | `v-intern/*` | port 1:1 | IDENTICAL |

## 2. Token & kit — đối chiếu chi tiết

- **Đủ cả hai phía:** `--ink/-soft/-faint`, `--paper`, `--royal(-deep)`, `--blue-mist`, `--hard-shadow(-warm)`, `--stamp-red/blue`, `--pencil`, `--note-*`, `--success/warning/danger/gold`, dark "blackboard" #131318, Patrick-Hand (`--font-hand`), `animate-shake-ink` + thump stamp, `.tape-*` (+ `.nb-tape-*` namespaced), `paper-grain`, `.nb-stamp-moc` (turbulence-mask 420ms).
- **Kit 1:1:** FE `notebook/ui.tsx`, `doodles.tsx`, `reveal.tsx` là port nguyên bản sandbox; FE thêm `notebook/kit.tsx` (16 component nb3: PageHeading, KpiTile, SectionPanel, FilterChips, ChartFrame, EmptyNotebook, KanbanColumn, InkTabs…).
- **Đã sửa trong Phase E:** `.confetti-pop` (trước đây là CSS chết ở `question-bank.tsx` — keyframe chưa port) → đã port 1:1 class+keyframes vào `journey.css`.
- **Micro-gaps còn lại (không chặn, đúng như sandbox chỉ có 1):** `.sketch-border(-thin)` (biến thể border-only) chưa có ở FE; `--shadow-ink-*` FE dùng `var(--ink)` thay `var(--hard-shadow)` (khác sắc ấm nhẹ); FE `.marker` là biến thể riêng (sandbox-look lưu ở `.hw-marker` — dùng đúng chỗ landing).
- **Shell 3 role (admin/instructor/intern):** dùng aurora-workspace chrome + notebook.css Patrick-Hand nav — chủ đích hybrid (layout shell phẳng, nội dung màn notebook) — palette giấy/mực vẫn khớp toàn cục.

## 3. Phán quyết theo screen-group (code-level)

**VERIFIED (notebook/tape/stamp/font-hand/shake-ink hiện diện):**
- Auth 4 màn (login/register/forgot/change-password) — auth-card Tape/Paperclip, shake-ink lỗi.
- Public: `/apply` (EmptyNotebook + dashed-cut), `/verify` (sketch-card + Tape + stamp HỢP LỆ/THU HỒI), `/github/invitation`.
- Intern: onboarding (+interview conversational), work (+[id] hero nb-sketch-card + StampMoc), sprint (kanban tape từng cột), evaluations/kpi/virtual-salary/certificates/notifications/profile/recommendations (outcomes.tsx — stamp/chart/sketch đầy đủ), participation, performance, github. **Trước audit: mentor = PARTIAL (thân generic `student-*`) — ghi nhận, hạng P2 tích lũy, chưa chuyển đổi trong đợt này (nguy cơ thị giác thấp, không chặn thao tác).**
- Instructor: sessions list (MarginNote + stamp LỚP), sprints (+detail delivery FilterChips/sprint-workspace ChartFrame), projects list (EmptyNotebook), evaluations/grading (FilterChips + confetti + shake-ink — **cộng thêm sau Phase E: route `/admin/evaluations` + RevisionModal theo đúng ngữ pháp modal/stamp notebook**), recruitment-rounds, participation, performance, reports, notifications, profile, github.
- Admin: users/groups/roles/catalogs/services/settings/audit/activity (admin-management ChartFrame/FilterChips/RowMenu + 15 class notebook + bảng nb3), questions (FilterChips + InkBadge), templates (+editor/materials), kpi/salary/certificates consoles (StampMoc), career-roles/communications/ai (PageHeading stamp + thân nb3), knowledge library, sprints/tasks/reports (dùng chung delivery/sprint-workspace/TaskDetail), notifications/profile (outcomes).

**ĐÃ SỬA trong Phase E (từ OLD-UI):**
1. **Session detail** (`/instructor/sessions/[id]`, `/admin/sessions/[id]` → `session-overview.tsx`): dải `ins-session-stat-strip` generic → **KPI notebook** (`KpiTile` paper-grain + Tape + `InkCountUp` mực); heading admin thêm stamp "LỚP". Màn này vốn là OLD-UI lớn nhất (0 tham chiếu notebook).
2. **Admin overview** (`/admin`): chuyển nguồn dữ liệu sang `/dashboard/admin` đồng thời đúng bộ hiển thị notebook (CollectionMetrics + donut ChartFrame chính xác toàn hệ thống + bảng nb3 users/roles + sticky-note mint + ants-border CTA).
3. **Session setup** (`/instructor/sessions/[id]/setup`): thêm **SlotEditor** (notebook Panel + InstructorNotice) cho `PUT /projects/:id/slots`.

**Còn leaning-old/PARTIAL (không chặn, đã xếp hạng P2/P3 cho đợt sau):**
- Session setup wizard tổng thể (setup-wizard thân aurora form, nb3 atoms).
- Admin knowledge editor (`/admin/knowledge/[code]`, `/new` — nb3 atoms, thiếu flourish).
- Instructor project detail (`/instructor/projects/[id]` → template-detail — primitives-only).
- Intern mentor (`/intern/mentor` — thân generic `student-*`).
- Admin career-roles/communications/ai — thân nb3-atoms, PageTitle stamp chỉ ở heading.

## 4. Kết luận thị giác

- **81/81 route** có bằng chứng browser Journey v3 (đúng role × 3 viewport, ảnh đúng route, state riêng) — gate `verify:journey` **PASS** (`docs/journey-v3-evidence/coverage-manifest.json`).
- Landing (khoảng trống lớn nhất của các đợt trước) **đã port đầy đủ — không thiếu mục nào**.
- Kit + token: 1:1 với sandbox trừ micro-gaps liệt kê trên (không có màn nào lệch hệ thiết kế).
- Sau Phase E: các màn "old-UI-leaning" còn lại đều là **thân nb3-atoms có chức năng đầy đủ + API thật** (không phải màn hỏng); không còn màn nào 0% notebook như session-overview trước đây.
- **DESIGN REFERENCE UNAVAILABLE:** không phát sinh — nguồn sandbox còn truy cập được trong suốt đợt audit; mọi phán quyết trên đều đối chiếu trực tiếp file sandbox tương ứng.
