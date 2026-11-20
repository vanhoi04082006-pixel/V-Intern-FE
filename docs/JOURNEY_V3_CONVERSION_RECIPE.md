# JOURNEY V3 — CONVERSION RECIPE (chuẩn cho mọi component)

> Tài liệu内 bộ cho đợt hoàn thiện 100%. Mọi thay đổi phải theo recipe này.
> Vi phạm bất kỳ ràng buộc nào ⇒ REJECT, phải hoàn tác.

## 0. Ràng buộc tuyệt đối (READ FIRST)

1. **KHÔNG đụng logic**: không đổi fetch/API calls, hooks, state, guards, permissions,
   validation, event handlers, conditional rendering nghiệp vụ. Chỉ đổi LỚP TRÌNH BÀY.
2. **KHÔNG đổi API props** của primitives: `btn()`, `buttonClass`, `inputClass`,
   `selectClass`, `textareaClass`, `Field`, `Panel`, `PageTitle`, `Empty`, `Badge`,
   `StatusDot`, `Modal`, `Pager`, `MetricCard`, `Card`, `InlineAlert`, `tableClass`…
   đã tự render v3 — component gọi chúng thì KHÔNG cần sửa chỗ gọi.
3. **KHÔNG thêm dependency mới**, không tạo thư viện UI thứ hai.
4. **GIỮ hooks `product-*`** trong DOM (test phụ thuộc `.product-badge`).
5. **KHÔNG phá tests**: sau khi sửa, `bun run typecheck` phải PASS. Nếu test liên quan
   fail, phải đọc test để hiểu giả định DOM rồi chỉnh trình bày cho khớp (không sửa test
   trừ khi test đó cản trở conversion hợp lệ và đã được điều phối viên duyệt).
6. **KHÔNG xóa A11Y**: giữ `aria-label`, `role`, `aria-pressed`, `scope`… có sẵn.

## 1. Bảng dữ liệu custom → ink table v3

Bảng viết tay (`<table className="w-full ...">` + `p-3` cells + `bg-muted` thead):

```tsx
// import thêm từ "./primitives" (hoặc "@/components/product/primitives"):
import { tableClass, thClass, tdClass } from "./primitives"; // đúng đường dẫn hiện có

<div className="notebook-scroll overflow-x-auto max-h-[...]"> {/* giữ nguyên vùng cuộn có sẵn */}
  <table className={`${tableClass} min-w-[52rem]`}>   // giữ min-w-*, bỏ text-left/text-body
    <thead>                                          // bỏ className bg-muted/50
      <th className={thClass}>…</th>                 // bỏ p-3; thêm " text-right" nếu cột phải
    <tbody>
      <tr key={…}>                                    // bỏ border-b border-border
        <td className={tdClass}>…</td>                // bỏ p-3 / border-b
```

- `tableClass` = `product-table nb3-table` (viền mực, header mono vàng giấy, zebra ấm,
  hover mực, th sticky).
- Ô chứa nhiều dòng con (name + email) giữ nguyên markup con.
- KHÔNG bọc thêm `nb3-table-wrap` khi bảng đã nằm trong vùng cuộn có sẵn
  (`notebook-scroll`/`overflow-x-auto`) — trùng lặp viền.

## 2. Nút custom → nb3

- Nút chính chưa dùng `buttonClass`/`btn()`: đổi `className={buttonClass}` (hoặc
  `btn("primary"|"secondary"|"ghost"|"danger", "sm"|"md"|"lg")` theo ngữ cảnh).
- Nút dòng chữ (link-button) giữ `linkButtonClass` như cũ (đã là mực v4).
- Nút icon ⋮ menu dòng: `RowMenuButton` từ `@/components/notebook/kit` (label + onClick
  giữ nguyên) — chỉ dùng khi trang có menu dòng phức tạp; nút đơn giản giữ nguyên.

## 3. PageTitle → eyebrow + stamp (mọi trang chính)

```tsx
<PageTitle
  eyebrow="NHÓM CHỨC NĂNG"          // mono nhỏ phía trên tiêu đề — VỪA ĐỦ, không lạm dụng
  stamp="TÊN MỤC"                    // mộc đỏ cạnh tiêu đề (stampTone="blue" cho nhóm phụ)
  title="…"
  subtitle="…"
  action={…}                          // giữ nguyên
  back={…}                            // giữ nguyên
/>
```

Nguyên tắc chọn stamp: mỗi trang chính một mộc ngắn (2–10 ký tự), phản ánh chức năng
(`SỔ NHÂN SỰ`, `THỦ QUỸ`, `KHO BẠC`, `KPI`…). Trang con/detail: chỉ eyebrow + back,
không stamp (tránh dồn dập).

## 4. Tabs custom → InkTabs

Tab bar viết tay (`role="tablist"` hoặc dải nút `aria-pressed`):
```tsx
import { InkTabs } from "@/components/notebook/kit";
<InkTabs
  tabs={[{ value: "all", label: "Tất cả", count: 12 }, …]}  // giữ nguyên giá trị + nhãn
  value={tab} onChange={setTab}                                // giữ state
  ariaLabel="…giữ nguyên aria-label cũ…"
/>
```
GIỮ content của từng tab như cũ (chỉ đổi dải nút). Đếm count chỉ thêm khi data có sẵn.

## 5. Bộ lọc chip → FilterChips

Dải lọc trạng thái dạng nút bấm:
```tsx
import { FilterChips } from "@/components/notebook/kit";
<FilterChips options={[{ value: "active", label: "Đang chạy" }, …]} value={f} onChange={setF} />
```

## 6. KPI / thống kê

- `MetricCard` (primitives) đã tự thành KPI tile v3 — giữ nguyên chỗ gọi.
- Dải số liệu custom (`dl`/`collection-stat-strip`) giữ nguyên — chỉ thêm stamp ở
  PageTitle; KHÔNG dựng lại bằng KpiTile nếu layout hiện tại ổn định.

## 7. Kanban → KanbanColumn/KanbanCard (chỉ khi trang có kanban)

```tsx
import { KanbanColumn, KanbanCard } from "@/components/notebook/kit";
<KanbanColumn title="Đang làm" count={n} tone="blue" tapeVariant="blue">
  <KanbanCard title={t.title} href={…}|onClick={…}>   // nội dung con giữ nguyên
    …meta, deadline, assignee…
  </KanbanCard>
</KanbanColumn>
```
GIỮ toàn bộ DnD handlers: nếu thẻ đang có drag handlers trên element khác, bọc
KanbanCard ở chế độ render-prop KHÔNG có (dùng `KanbanCard` như div chứa) —
ưu tiên giữ nguyên cấu trúc drag, chỉ đổi className cột/thẻ sang
`nb3-kanban-col`/`nb3-kanban-card` trực tiếp nếu dùng component gây vỡ DnD.

## 8. Charts → ChartFrame

```tsx
import { ChartFrame } from "@/components/notebook/kit";
<ChartFrame>{/* chart hiện tại NGUYÊN VẸN */}</ChartFrame>
```
Chỉ bọc khung, KHÔNG đụng dữ liệu/tooltip của chart.

## 9. Empty state đặc biệt → EmptyNotebook

Trang chưa có dữ liệu ở cấp trang (không phải trong bảng):
```tsx
import { EmptyNotebook } from "@/components/notebook/kit";
<EmptyNotebook title="…" description="…" action={…} />
```
Empty trong Panel/bảng: `Empty` của primitives đã v3 — giữ nguyên.

## 10. Quy ước chung

- Icon: giữ nguyên icon đang dùng (VIcons/lucide-compatible đã có màu mực v3).
- KHÔNG thêm tape/sticker/modal trang trí nếu trang đã có stamp/panel v3 đủ nhận diện.
  "Không lạm dụng texture" — mỗi trang tối đa 1 mộc + squiggle tự động.
- KHÔNG đổi font/size chữ nghiệp vụ (text-body/text-caption… giữ nguyên).
- Responsive: KHÔNG đổi grid responsive hiện có.
- Dark mode: nb3-* tự có `.dark` variants — không cần xử lý gì thêm.

## 11. Sau khi sửa mỗi file/component

1. `bun run typecheck` (bắt buộc PASS trước khi bàn giao).
2. Đọc lại diff từng hunk: nếu có dòng nào đổi logic → hoàn tác ngay.
3. Báo cáo: danh sách file + component + các cấu trúc đã chuyển (bảng/nút/tab/filter/
   kanban/chart/empty) + typecheck PASS.

## 12. Cấm mang theo từ sandbox

- KHÔNG import `@/lib/mock/*`, demo-account, `enterAuth`, tài khoản demo.
- KHÔNG tạo route.ts mock, KHÔNG đổi `lib/api/*`.
- Preview mode của repo (`src/lib/preview/*`) chỉ dùng để QA browser — không đụng.
