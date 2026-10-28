# V-Intern Design System — "Emerald Noir"

> Chuẩn thiết kế BẮT BUỘC cho mọi view. Dark-only, cao cấp, đậm chất AI product.
> KHÔNG dùng màu indigo/blue. Không dùng theme sáng.

## 1. Palette (đã khai báo trong globals.css — dùng token, không hardcode hex)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `bg-canvas` | #090C0B | nền trang |
| `bg-deep` | #0D1211 | sidebar, hero alt |
| `bg-panel` | #111615 | card/panel mặc định |
| `bg-panel-2` | #171D1B | card nâng cao, hover |
| `border-line` | rgba(255,255,255,.07) | viền card/input |
| `border-line-strong` | rgba(255,255,255,.14) | viền focus/đậm |
| `text-ink` | #EDF2EF | text chính |
| `text-dim` | #9AA5A0 | text phụ |
| `text-faint` | #6B7671 | text mờ |
| `bg-brand` / `text-brand` | #10B981 | brand chính (emerald) |
| `bg-brand-bright` | #34D399 | gradient end, glow |
| `text-on-brand` | #04241A | text trên nền brand |
| amber | #FBBF24 | chờ duyệt / cảnh báo |
| teal | #2DD4BF | đang làm / info |
| rose | #FB7185 | lỗi / nghiêm trọng |
| orange | #FB923C | ưu tiên cao |
| violet | #A78BFA | chỉ dùng cho role QA |

Các token shadcn (`bg-background`, `bg-card`, `text-muted-foreground`, `bg-primary`...) đã được map sang cùng bảng màu này — component shadcn dùng được ngay.

## 2. Status semantics (dùng qua component có sẵn, KHÔNG tự map màu)

- Task: `todo`=zinc, `doing`=teal, `review`=amber, `done`=emerald
- Priority: `low`=zinc, `medium`=teal, `high`=orange, `critical`=rose
- Session: `active`=emerald, `planning`=teal, `completed`=zinc, `cancelled`=rose
- Submission: `submitted`=teal, `approved`=emerald, `rework`=amber, `withdrawn`=zinc
- AI review: `running`=teal (pulse), `awaiting_instructor`=amber, `needs_changes`=rose, `passed`=emerald

## 3. Typography

- Font chính: **Be Vietnam Pro** (var `--font-sans`). Mono: **JetBrains Mono** (`font-mono`, dùng cho mã: `TSK-01`, `SPR-01`, SHA, số liệu bảng).
- Heading: `font-bold tracking-tight`; H1 page `text-2xl md:text-3xl`, section `text-lg`.
- Body `text-sm`, phụ trợ `text-xs text-dim`. Số liệu lớn `text-3xl font-bold font-mono`.

## 4. Shape & depth

- Input/Button: `rounded-lg`; Card/Panel: `rounded-2xl`; Hero card: `rounded-3xl`.
- Card chuẩn: `rounded-2xl border border-line bg-panel shadow-card` (đã có class `.card-surface`).
- Glass (navbar/topbar/dropdown): class `.glass`.
- Glow brand: `.glow-brand` (box-shadow emerald). Dùng tiết chế cho CTA chính / thẻ nổi bật.
- Hover card: `transition-colors hover:border-line-strong hover:bg-panel-2`.

## 5. Hiệu ứng & motion (framer-motion đã cài)

- Vào view: bọc `<ViewFrame>` (fade + slide 8px, 0.25s) — CÓ SẴN trong `@/components/shared/view`.
- Stagger list: `<Stagger>` + `<StaggerItem>` (có sẵn).
- Số đếm: `<AnimatedNumber>` (có sẵn). Progress: `<AnimatedProgressBar>`.
- Kanban drag: dùng `<KanbanBoard>` chung (dnd-kit) — có sẵn, nhận `renderCard`.
- Skeleton khi loading (`LoadingBlock`), lỗi có retry (`ErrorBlock`), rỗng có CTA (`Empty`) — LUÔN render đủ 3 trạng thái.
- `prefers-reduced-motion` đã được tôn trọng toàn cục.
- Hover micro: button `active:scale-[0.98]`, icon transform, arrow translate-x.

## 6. Layout chung

- **Sticky footer bắt buộc** ở landing: `min-h-screen flex flex-col`, footer `mt-auto`.
- Workspace: sidebar 264px (desktop) + topbar cao 60px + content `max-w-[1400px] mx-auto p-4 md:p-6`.
- Mobile (<lg): sidebar thu thành drawer (Sheet), topbar có nút menu; touch target ≥ 40px.
- Danh sách dài: `max-h-96 overflow-y-auto` + scrollbar custom (đã style global).
- Card cùng hàng: `gap-4`/`gap-6`, padding `p-4`/`p-6` nhất quán.

## 7. Icon & hình

- Icon: `lucide-react` (size 16/18/20, `strokeWidth={1.75}` mặc định trong class `.icon`).
- Avatar: `<UserAvatar>` (initials, màu quyết định bởi tên) — KHÔNG tải ảnh ngoài.
- Ảnh landing có sẵn trong `public/images/`: `hero-orb.png`, `feature-showcase.png`, `ai-interview.png`.

## 8. Quy tắc văn bản UI (tiếng Việt)

- Địa danh giao diện: "Tổng quan", "Công việc", "Đánh giá", "Hiệu suất", "Chứng chỉ"...
- Thời gian: `formatDate` (dd/MM/yyyy), tiền: `formatVnd` (V-Intern "đồng ảo" — hiển thị `2.400.000 ₫ (ảo)`).
- Số liệu AI luôn nhãn "đề xuất" khi là gợi ý chấm điểm.
- Empty state phải có câu hành động + nút (VD: "Chưa có cuộc trò chuyện — Bắt đầu hỏi Mentor AI").

## 9. Cấm / tránh

- KHÔNG indigo/blue, KHÔNG gradient tím-xanh sáo rỗng, KHÔNG emoji trong UI.
- KHÔNG tạo component trùng functionality với shared primitives — check `@/components/shared/*` trước khi viết.
- KHÔNG dùng chart library khác recharts. KHÔNG thêm package mới nếu chưa có trong package.json.
- KHÔNG hardcode hex khi đã có token; KHÔNG viết route Next.js mới ngoài `/` và `src/app/api/**`.

## 10. Component shared có sẵn (xem `src/components/shared/`)

`ViewFrame, Stagger, StaggerItem, FadeIn` (view.tsx) · `Panel, PanelHeader, PageHeader, MetricCard, ToneBadge, Empty, Pager, StatusDot, UserAvatar, AvatarStack, AnimatedProgressBar, KeyValue, SectionHeading` (primitives.tsx) · `TaskStatusBadge, PriorityBadge, RoleBadge, SessionStatusBadge, SubmissionStatusBadge, ReviewStatusBadge, GithubStatusBadge` (badges.tsx) · `LoadingBlock, ErrorBlock, InlineSpinner` (states.tsx) · `KanbanBoard` (kanban.tsx) · `ChatBubble, ChatComposer, TypingDots` (chat.tsx) · `ConfirmDialog` (confirm.tsx) · `FilterBar, SearchInput` (toolbar.tsx) · `AnimatedNumber, CountdownTimer` (counters.tsx) · `Logo` (logo.tsx) · helpers `@/lib/client/labels` (labels, formatters).

## 11. Router & guard

- `navigate("/intern/work")`, `<Link to="...">`, `useRoute()` trả về `{ path, params }` — pattern `/intern/work/:id`.
- Route registry: mỗi agent chỉ sửa file routes của mình (`routes.intern.ts`, `routes.instructor.ts`, `routes.admin.ts`) — KHÔNG đụng file của role khác.
- Guard đã xử lý ở `RootApp`: đúng role mới vào được workspace; sai role tự chuyển về home role đó.
