# Hệ thống giao diện — Journey Notebook

Toàn bộ sản phẩm dùng concept **“Sổ tay hành trình”**: nền giấy kem, nét mực đen, mực xanh làm điểm nhấn, đường cắt giấy, băng dính washi, doodle vẽ tay, highlight marker, con dấu mộc và typography viết tay có kiểm soát.

Mục tiêu không phải “trang trí cho giống sổ”, mà là **làm trạng thái công việc dễ đọc**: việc gì đang chờ, đã duyệt, bị chặn hay cần người học xử lý.

## 1. Ba mật độ theo vai

| Vai | Mật độ | Được dùng | Hạn chế |
|---|---|---|---|
| Sinh viên | Đậm | Sticky note cho gợi ý AI, doodle empty state, tape ở panel chính, stamp kết quả | Không dùng hiệu ứng che dữ liệu hoặc làm chậm thao tác |
| Giảng viên | Vừa | Lề kẻ, dashed-cut cho thẻ chờ hành động, stamp trạng thái duyệt | Bảng dày không thêm doodle/tape |
| Admin | Nhẹ | Token giấy/mực, typography đậm, stamp cho badge quan trọng | Không tape/doodle trong bảng và form dày |

Nguyên tắc: **trang trí tăng dần từ Admin → Giảng viên → Sinh viên**, nhưng thông tin và accessibility không đổi.

## 2. Token

Nguồn sự thật: [`src/styles/tokens.css`](../src/styles/tokens.css).

| Nhóm | Token tiêu biểu | Ý nghĩa |
|---|---|---|
| Giấy | `--paper`, `--paper-2`, `--paper-3` | Nền giấy kem và lớp giấy |
| Mực | `--ink`, `--ink-2`, `--ink-3` | Chữ chính, phụ, mờ |
| Nhấn | `--blue`, `--blue-soft` | Link, hành động, focus |
| Note | `--note-yellow`, `--note-rotate` | Sticky note |
| Stamp | `--stamp-red`, `--stamp-green` | Kết quả/trạng thái quan trọng |
| Bóng | `--shadow-paper`, `--shadow-lift` | Độ nổi của thẻ giấy |
| Font | `--font-body`, `--font-heading`, `--font-hand`, `--font-geist-mono` | Đọc, tiêu đề, ghi chú, nhãn |

**Dark mode = “chalkboard night”**: nền bảng đen, chữ phấn, mỗi utility có bản dark riêng. Không đảo màu bằng filter toàn trang.

Không hard-code màu ngoài token trừ khi là màu semantic đã có trong component. Không đổi token toàn cục để sửa một trang.

## 3. Utility notebook

Nguồn: [`notebook.css`](../src/components/workspace/notebook.css) và `globals.css`.

| Utility | Dùng cho | Ghi chú |
|---|---|---|
| `.bg-grid-paper` / `.bg-dots-paper` / `.bg-dots-chalk` | Nền giấy ô ly/chấm bi/phấn | Landing, hero |
| `.tape` (+ `.tape-peel`) | Băng dính washi | Xoay qua `--tape-rotate`; hover cong nhẹ |
| `.marker` | Highlight sau chữ | Có thể thêm `.animate-marker-sweep` |
| `.sketch-card` / `.sketch-card-sm` | Thẻ giấy viền mực + bóng in | Panel chính, landing |
| `.dashed-cut` / `.dashed-cut-chalk` | Viền đứt đường cắt giấy | Thẻ chờ hành động, dropzone |
| `.sticky-note` | Giấy note vàng dán lệch | Dark: vàng đậm; xoay qua `--note-rotate` |
| `.stamp-moc` / `.stamp-moc-sm` | Con dấu mộc tròn | ĐÃ DUYỆT/PASS; màu qua `color` |
| `.divider-torn` | Đường xé giấy giữa section | Thay `<hr>` liền |
| `.skeleton-pencil` | Skeleton nét chì | Thay khối xám pulse |
| `.spinner-hand` | Vòng tròn vẽ tay | Thay ring quay |
| `.underline-squiggle` | Gạch chân lượn sóng | Link/tab đang mở |
| `.notebook-scroll` | Scrollbar bút chì | Vùng cuộn trong; bảng có `thead` sticky |
| `.font-hand` | Patrick Hand | **Chỉ** ghi chú ngắn/label/empty state |

Motion: `.animate-stamp-thump`, `.animate-marker-sweep`, `.animate-paper-settle`, `.animate-page-curl`, `.squiggle-draw` — 120–240ms, tôn trọng `prefers-reduced-motion`.

Micro-details toàn cục: `::selection` marker xanh, `::placeholder` chữ chì nghiêng, `::marker` bullet mực xanh, `focus-visible` nét mực 2px offset 2px, scrollbar kiểu bút chì.

## 4. Typography

| Vai trò | Font | Dùng cho |
|---|---|---|
| Đọc | **Be Vietnam Pro** (Vietnamese subset) | Nội dung, form, bảng |
| Tiêu đề | Be Vietnam Pro, weight đậm | H1–H3; `text-wrap: balance` |
| Nhãn/mono | **JetBrains Mono** | Mã, số liệu nhỏ, nhãn kỹ thuật |
| Ghi chú | **Patrick Hand** (local) | Sticky note, caption ngắn, empty state |
| Dự phòng mono | Geist Mono (local) | Asset đóng gói, dùng khi cấu hình đổi |

Quy tắc:

- Không dùng `font-hand` cho đoạn dài, bảng hoặc nội dung cần độ chính xác.
- Không giảm cỡ chữ dưới 12px cho nội dung; ưu tiên 14–16px cho body.
- Tiêu đề một trang chỉ có **một H1**; heading theo thứ bậc, không nhảy cấp.
- Số liệu và đơn vị phải đọc được bằng chữ, không chỉ bằng màu.

> Font được khai báo trong [`src/app/layout.tsx`](../src/app/layout.tsx). Khi đổi font, kiểm tra tiếng Việt, mobile và build; không thêm phụ thuộc mạng lúc runtime.

## 5. Bộ icon notebook

Nguồn: [`src/components/v-intern/icons`](../src/components/v-intern/icons/index.tsx) — khoảng 103 icon SVG vẽ tay.

- Một bộ nét: stroke 2px, bo tròn, đường cong lệch nhẹ, vòng tròn khép hở.
- Màu `currentColor`; prop `size`, `className`, `strokeWidth` tương thích cách gọi Lucide.
- Icon hiển thị chính của shell/nav/primitives dùng bộ notebook.
- Lucide chỉ còn trong `src/components/ui` (thư viện shadcn nền) và icon phụ chưa migrate.
- Icon trang trí đặt `aria-hidden`; nút chỉ có icon phải có `aria-label`.

| Nhóm | Ví dụ |
|---|---|
| Điều hướng | Home, ListTodo, Layers, FolderKanban, SquareKanban, ChartColumn, FileText |
| Học tập | Github, CodeXml, Bot, Lightbulb, Award, BookOpen, GraduationCap |
| Tài khoản | UserRound, Users, Shield, Settings, Bell |
| Trạng thái | Info, AlertTriangle, CircleCheck, CircleX, CircleDashed, Lock |
| Hành động | RefreshCw, Eye, PenLine, Trash, Download, Upload, ExternalLink, Filter, Send |

## 6. Component theo nhu cầu

| Nhu cầu | Component | Quy tắc |
|---|---|---|
| Tiêu đề trang | `WorkspacePageHeader`, `StudentHeading`, `InstructorHeading` | Một H1, lời dẫn ngắn, hành động theo ngữ cảnh |
| Điều hướng nhóm | `WorkspaceStage` | Tab mục lục squiggle; không mở route bị khóa lifecycle |
| Nhóm nội dung | `Panel`, `StudentPanel` | Không bọc một Panel quanh từng field |
| Nút/trường nhập | `product/primitives`, `student-ui` | Giữ loading, disabled, label, lỗi |
| Ghi chú/gợi ý | `NoteCard`, `MarginNote` | Sticky note cho ghi chú ngắn; không dùng cho dữ liệu |
| Trạng thái quan trọng | `StampMoc`, badge stamp | Đỏ = thất bại/kết thúc; xanh = đạt/pass; luôn kèm chữ |
| Loading/error/empty | `shared/data-state`, `Empty` | Ba trạng thái phải khác nhau |
| Modal/drawer | `Modal`, shell hiện có | Focus trap, Escape, trả focus; admin không dùng tape |

## 7. Một trang nên được tổ chức thế nào?

1. **Hành động chính gần tiêu đề**, lời dẫn đủ để biết bước tiếp theo.
2. **Metric ghi rõ phạm vi đo** và dùng semantic color đúng trạng thái.
3. **Filter đặt gần collection** mà nó tác động; hiện nút đặt lại khi đang lọc.
4. **List/table cho nhiều bản ghi**, card cho object cần xem độc lập.
5. **Giải thích dài đưa xuống vùng trợ giúp/chi tiết**, không lặp ở mọi section.
6. **Hành động thay đổi dữ liệu** phải rõ đang gửi, thành công hay lỗi.
7. **Empty state nói bước tiếp theo**, không chỉ “Không có dữ liệu”.

## 8. Accessibility

- Mọi thao tác dùng được bằng bàn phím; thứ tự focus theo luồng đọc.
- `focus-visible` rõ ràng, không xóa outline toàn cục.
- Modal: trap focus, Escape đóng, focus trả về phần tử mở.
- Ảnh trang trí `alt=""`; ảnh mang thông tin có mô tả thật.
- Không truyền tải trạng thái chỉ bằng màu; thêm chữ/icon.
- Chart có bảng hoặc chú giải đọc được; donut hỗ trợ bàn phím.
- Form: label thật, lỗi gắn với field, không chỉ placeholder.
- Tôn trọng `prefers-reduced-motion`; không animation chặn thao tác.

## 9. Responsive

Kiểm tra tối thiểu:

| Viewport | Trọng tâm |
|---|---|
| 1440px | Bố cục đầy đủ, bảng rộng |
| 1280px | Sidebar + nội dung không chồng |
| 1024px | Tablet ngang, bảng bắt đầu cuộn |
| 768px | Tablet dọc, drawer/tab |
| 390px | Mobile, form một cột, CTA dễ bấm |
| 320px | Component dễ tràn (date, mã dài, badge) |

Quy tắc: tab cuộn ngang trong vùng của nó; bảng cuộn trong container; trang **không** tràn ngang. Không dùng `overflow: hidden` toàn trang để che lỗi layout.

## 10. Nội dung và giọng điệu

- Tiếng Việt tự nhiên, xưng “bạn” với người dùng; tránh thuật ngữ nội bộ khi có thể.
- Nói rõ **điều kiện** và **bước tiếp theo**, không đổ lỗi cho người dùng.
- Không hứa “AI chấm đúng”; nói AI đề xuất, giảng viên quyết định.
- Số 0 và “chưa đo được” phải diễn đạt khác nhau.
- Không dùng dữ liệu mẫu trong câu ví dụ như thể là dữ liệu thật của tài khoản đang đăng nhập.

## 11. Checklist sau khi sửa giao diện

- [ ] Desktop 1440/1280/1024, tablet 768, mobile 390 (và 320 nếu dễ tràn).
- [ ] Light/dark, loading/error/empty, nội dung dài.
- [ ] Keyboard, focus, Escape, modal, reduced motion.
- [ ] Không hard-code màu ngoài token; không lặp shell.
- [ ] Icon chính đúng bộ notebook; icon-only có accessible name.
- [ ] `npm run lint`, `typecheck`, `test`, `build` đạt.
- [ ] Kiểm tra browser thật, không chỉ Vitest/JSDOM.

Đọc thêm [ARCHITECTURE](ARCHITECTURE.md#7-thiết-kế-và-component) và [TESTING](TESTING.md).
