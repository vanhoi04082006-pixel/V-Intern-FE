# Journey v3 — Design Parity (Sandbox → Repo thật)

Ngày: 2026-11-21 · nhánh `codex/product-acceptance-20261116` · commit nền tảng: `cfcf9e2`.

Mục đích: đối chiếu **nguồn thiết kế gốc** (Sandbox `/home/z/my-project` — Journey Notebook v3)
với tài sản đã port vào FE thật, chỉ rõ phần đã có / còn thiếu / phương án chuyển thể.
Đây là căn cứ để mọi route dùng cùng một ngôn ngữ thị giác khi chuyển thể sâu.

## 1. Nguồn đối chiếu

| Nguồn | Vị trí | Trạng thái truy cập |
|---|---|---|
| Sandbox gốc v3 (globals.css đầy đủ) | `/home/z/my-project/src/app/globals.css` | Truy cập được — tham chiếu trực tiếp |
| 176 Custom SVG Icons + VLogoMark | `/home/z/my-project/src/components/icons/v-icons.tsx` | Đã port sang `src/components/icons/v-icons.tsx` |
| Notebook primitives (Tape, StampMoc, InkBadge, MarginNote, NoteCard, SketchCard, PolaroidFrame, Eyebrow, FadeIn/Stagger/Parallax, 18 doodles) | sandbox `src/components/notebook/*` | Đã port sang `src/components/notebook/{ui,reveal,doodles}.tsx` |
| Keyframes + textures (paper-grain, card-tilt, sticker-pop, marching-ants, shake-ink, pop-in, confetti-burst, spotlight-sweep, chart-grow, tape-peel, marker-sweep, ink-draw…) | sandbox `globals.css` | Đã port vào `src/styles/journey.css` (namespaced `nb3-*`, bỏ qua keyframe trùng tên đã có của repo) |
| PAGE KIT v3 (PageHeading, KpiTile, SectionPanel, inkTable, RowMenuButton, StatusChip, FilterChips, MiniBar, SparkTrend, ChartFrame, EmptyNotebook, KanbanColumn/Card, InkTabs, InkDivider) | sandbox các màn hình (không tách file) | **Đã物 hoá thành thư viện riêng** `src/components/notebook/kit.tsx` + CSS block 1–19 trong `journey.css` (commit `cfcf9e2`) |
| Layout Dashboard Student/Instructor/Admin của sandbox | `/home/z/my-project/src/components/{student,staff}/*` | **Không port theo nguyên bản** — repo thật có shell riêng (sidebar + topbar + Command Palette đã tích hợp). Chỉ lấy *ngôn ngữ thị giác* (tokens, texture, primitive), không mang cấu trúc SPA mock của sandbox |
| Charts (Radar/Area/Burndown/Donut/Line) | sandbox `src/components/{student,staff}/*` | Repo thật đã có `workspace-charts.tsx` riêng vẽ theo dữ liệu thật — chuyển thể bằng `ChartFrame` (khung sketch) bọc quanh chart thật, giữ dữ liệu & tooltip thật |
| Kanban | sandbox `own-kanban`/`kanban-dnd` | Repo thật có `product/own-kanban.tsx` + `kanban-dnd.tsx` + `use-own-task-drop.ts` (drag-drop thật) — chuyển thể bằng `KanbanColumn/KanbanCard` giữ nguyên DnD logic |
| Toast/Notification, Empty/Skeleton/Error (401/403/404/500), Confirm dialog | sandbox | Repo thật đã có hệ thống riêng (toast chuẩn hoá commit `0dc9e0d`, `shared/data-state`, `shared/error-*`) — chỉ chuyển thể thị giác, không thay flow |

## 2. Tài sản v3 hiện có trong FE thật (đủ điều kiện chuyển thể sâu)

| Tài sản | File | Ghi chú |
|---|---|---|
| Tokens màu giấy kem / nét mực / royal / gold / chalk-dust | `src/styles/journey.css` §1–2 | dùng `var(--ink)`, `var(--paper-*)`, `var(--royal)`… của repo thật |
| `--nb3-*` private vars (ink-line, radius 12px 15px 13px 14px, offset) | `journey.css` | shell `.aurora-workspace` không thể đè (mục đích thiết kế) |
| nb3 BUTTON (primary/ghost/danger/icon + sm/md/lg) | `journey.css` §5 | |
| nb3 FORM (input/select/textarea + label + focus nét mực + shake khi invalid) | `journey.css` §6 | |
| nb3 PAGE HEADING (eyebrow mono + tiêu đề mực + squiggle draw) | `journey.css` §7 | dùng với `kit.tsx PageHeading` |
| nb3 KPI (thẻ giấy + hạt giấy + sticker icon) | `journey.css` §8 | `kit.tsx KpiTile` |
| nb3 PANEL (sketch + tape + squiggle tiêu đề) | `journey.css` §9 | `kit.tsx SectionPanel` |
| nb3 TABLE (header mono, zebra giấy ấm, hover mực, scrollbar mảnh) | `journey.css` §10 | `inkTableWrapClass`… |
| nb3 CHIP/BADGE + TOOLBAR (filter chips vẽ tay) + TABS (gạch mực trượt) | `journey.css` §11–13 | `StatusChip`, `FilterChips`, `InkTabs` |
| nb3 KANBAN (cột sketch + tape đầu cột) | `journey.css` §14 | `KanbanColumn/KanbanCard` |
| nb3 CHART FRAME + MODAL (sketch-card pop-in) + EMPTY/ERROR doodle + MINI BAR + CRUMB | `journey.css` §15–19 | `ChartFrame`, `Modal`(bridge), `EmptyNotebook`, `MiniBar` |
| 176 VIcons + VLogoMark | `src/components/icons/v-icons.tsx` | props tương thích lucide |
| Bridge v3-primitives (cho `product/primitives.tsx` render v3 mà vẫn giữ hook `product-*`) | `journey.css` §20 (thêm ở Phase B) | dùng特异性 `.aurora-workspace .product-*.nb3-*` để thắng rule v2 cùng tên |

## 3. Phần còn thiếu so với thiết kế gốc & phương án

| Thành phần gốc | Phương án chuyển thể |
|---|---|
| Mỗi page header sandbox có eyebrow + stamp + tape + back-link tay | Áp `PageHeading` (kit) cho từng component chính; `PageTitle` (primitives) cũng được nâng v3 làm nền |
| KPI tiles có tape + trend ▲▼ | Áp `KpiTile` thay `MetricCard` ở các dashboard/overview |
| Bảng dữ liệu viền mực + header mono | `tableClass/thClass/tdClass` (primitives) bridge sang `nb3-table` — mọi bảng của ~40 component hưởng |
| Kanban cột tape + thẻ sketch | `KanbanColumn/KanbanCard` trong `own-kanban`/`kanban-dnd`/`intern-work` |
| Biểu đồ khung sketch | `ChartFrame` bọc `workspace-charts` thật |
| Empty state doodle | `EmptyNotebook` / `Empty` (bridge) |
| Row-menu ⋯ viền mực | `RowMenuButton` cho row action |
| Responsive mobile 390px | giữ nguyên grid responsive của repo; kiểm tra overflow ngang khi audit browser |
| prefers-reduced-motion | đã có kill-switch toàn cục trong `journey.css` + globals.css |

## 4. Ràng buộc không đánh đổi

- Không mang mock/demo sandbox (`lib/mock`, `demo-account-panel`, tài khoản `Sv@2026`…) vào repo thật.
- Không thay `lib/api/*`, guard, middleware, token/permission, validation.
- Preview mode (`src/lib/preview/*`) là commit có trước của repo — chỉ dùng cho QA browser, không đụng contract.
- Mọi chuyển thể là additive + namespaced (`nb3-*`), tách bạch với logic.
