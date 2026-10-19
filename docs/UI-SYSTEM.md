# Giao diện và tương tác

Nền canvas `#f4f6fb`, panel trắng; navy `#16243e` cho nội dung, brand `#0c67ed` (đậm `#0a57cb`) và blue-600 cho hành động/chọn, sky cho thông tin, amber cho chờ/giới hạn, emerald cho hoàn thành, rose cho lỗi/nguy hiểm. Toàn bộ primitive nằm ở `src/components/product/primitives.tsx`; không tạo mỗi trang một bộ spacing/shadow riêng, không tạo bộ `components/ui` song song.

## Primitives v2 (product/primitives.tsx)

- `btn(variant, size)` / `buttonClass` / `iconButtonClass` — primary, secondary, ghost, danger; không tự chế nút.
- `Field` — label + `htmlFor` + hint/error, dùng cho mọi ô nhập mới.
- `inputClass`, `selectClass`, `textareaClass` — kèm focus ring và trạng thái hover.
- `Spinner`, `Skeleton`, `TableSkeleton` — trạng thái đang tải theo ngữ cảnh.
- `InlineAlert` (tone: info/success/warning/danger) — phản hồi gần thao tác; `role=alert` cho warning/danger.
- `MetricCard` — icon + nhãn viết hoa nhỏ + số liệu; số chưa có hiển thị “Chưa đo được”, không bịa số.
- `Panel` (title/description/action) và `Card` — khối nội dung chuẩn, bo `rounded-2xl`, border `slate-200/70`.
- `PageTitle` (title/subtitle/action/back) — một `h1` mỗi trang, kèm hành động chính và đường quay lại.
- `Empty`, `Badge` (tone: blue/gray/amber/green/red/sky), `StatusDot`, `ProgressBar`.
- `Pager` — nút “Trước”/“Sau” giữ nguyên accessible name; không đặt aria-label đè lên tên nút.
- `Modal` — quản lý focus, Escape, backdrop; dùng cho mọi hộp thoại.
- `tableWrapClass`, `tableClass`, `thClass`, `tdClass` — bảng cuộn ngang trên mobile, không làm body tràn.

## Trạng thái dữ liệu

`src/components/shared/data-state.tsx` cung cấp `LoadingState` (spinner) và `ErrorState` (thẻ rose + thông điệp + nút thử lại) dùng chung. Cấp ứng dụng có `src/app/error.tsx` (dùng prop `retry`) và `src/app/not-found.tsx` (server component, class tĩnh). Mọi trang dữ liệu phải trả lời: đang ở đâu, dữ liệu/trạng thái gì, hành động quan trọng tiếp theo, điều gì đang chặn.

## Shell

- `ProductShell` cho admin/giảng viên: menu nhóm có tiêu đề, breadcrumb V-Intern > khu vực > Chi tiết, drawer đóng khi bấm nền, footer card theo vai trò, nhãn vai trò tiếng Việt.
- Shell sinh viên giữ cấu trúc riêng với nhóm Workspace / Hiệu suất & Phát triển; không trộn điều hướng giữa các vai trò.
- Trang chủ public `/` (`src/components/v-intern/*`) là bề mặt thiết kế độc lập — không sửa khi nâng cấp workspace; mọi thay đổi token phải additive và được kiểm tra lại bằng ảnh trước/sau.

## Quy ước nội dung

- Nhãn trạng thái hiển thị tiếng Việt (Sắp diễn ra / Đang chạy / Đã hoàn thành…), giá trị gốc của backend vẫn là nguồn dữ liệu và được giữ trong bộ lọc/URL.
- Không nút chết, không dữ liệu giả, không báo thành công khi API chưa xác nhận. Thao tác quan trọng có xác nhận và trạng thái bận.
- Trạng thái AI/GitHub/chấm bài hiển thị đúng điều hệ thống biết: configured chỉ nghĩa là có cấu hình, không phải đã kiểm tra truy vấn.

## Biên tập & kiểm chứng

Motion ngắn, phục vụ chuyển trạng thái, tôn trọng `prefers-reduced-motion`. Hướng WCAG 2.2 AA: focus thấy rõ, thứ tự bàn phím hợp lý, label/accessible name đầy đủ, không dùng màu làm tín hiệu duy nhất.

Kiểm tra tối thiểu 390px / 820px / 1440px bằng trình duyệt thật (Chrome), gồm bàn phím, reload/session, error, rỗng và quyền. Script chụp/so sánh: `manual-runtime/ui-ux-capture.cjs` (baseline|survey|after) và `manual-runtime/ui-ux-peek.cjs`; ảnh lưu tại `manual-runtime/ui-ux-evidence-20261019/`. Unit test DOM không thay thế kiểm tra CSS/layout.
