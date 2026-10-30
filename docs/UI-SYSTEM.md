# Hệ thống giao diện: từ component tới trang hoàn chỉnh

## Hướng thiết kế hiện tại

Toàn hệ thống dùng **Sổ tay hành trình (Journey Notebook)**: nền giấy ô ly/kem
`--paper`, mực đen `--ink`, mực xanh notebook `--blue`; ngôn ngữ thị giác gồm
nét đứt đường cắt giấy, băng dính washi, doodle vẽ tay, highlight marker, thẻ
giấy dán lệch, con dấu mộc tròn, chữ viết tay Patrick Hand (chỉ cho ghi chú
ngắn/label/empty-state). Font đọc chính: Be Vietnam Pro.

Mật độ trang trí theo vai (concept phục vụ dữ liệu, không giết density):

- **Sinh viên + auth/public — đậm**: sticky note cho ghi chú/gợi ý AI, doodle
  empty-state, tape trên panel chính, marker tiêu đề, Patrick Hand cho ghi chú ngắn.
- **Giảng viên — vừa**: panel giữ density, lề kẻ, dashed-cut cho thẻ chờ hành
  động, mộc cho trạng thái duyệt.
- **Quản trị — nhẹ**: token màu giấy/mực + typography đậm, mộc cho badge quan
  trọng, tab kiểu mục lục; tuyệt đối không tape/doodle trong bảng dữ liệu dày.

Dark mode = **Chalkboard night** (bảng đen phấn xanh). In/chứng chỉ = giấy
trắng, mực đen, mộc đỏ.

### Bộ utility sổ tay (tokens.css + globals.css)

| Utility | Dùng cho |
|---|---|
| `.bg-grid-paper` / `.bg-dots-paper` / `.bg-dots-chalk` | nền giấy ô ly / chấm bi / phấn |
| `.sketch-card` / `.sketch-card-sm` | thẻ giấy viền mực + bóng đổ in |
| `.dashed-cut` | viền đứt đường cắt giấy — thẻ chờ hành động, dropzone, empty-state |
| `.tape` (+ `.tape-peel` trong `.group`) | băng dính washi; hover cong nhẹ |
| `.marker` / `.marker-sweep` | tô bút dạ quang / quét qua chữ khi vào viewport (`data-inview`) |
| `.sticky-note` / `.sticky-note-alt` | giấy note vàng dán lệch, hover thẳng lại |
| `.stamp-moc` (+ `-red`/`-green`, `.stamp-thump`) | con dấu mộc tròn; thump = đóng dấu |
| `.divider-torn` | đường xé giấy giữa các section |
| `.notebook-table` | zebra giấy ấm + đầu bảng dính đổ bóng mép giấy |
| `.notebook-control` / `.notebook-lines` | ô nhập viền mực / textarea kẻ dòng vở |
| `.notebook-btn-ink` | nút mực: đổ mực lệch + nhấn xuống giấy |
| `.notebook-badge` | badge mộc nhỏ pill viền mực màu |
| `.skeleton-pencil` / `.spinner-hand` | skeleton nét chì gạch chéo / spinner vòng vẽ tay |
| `.paper-settle` / `.page-curl` | card giấy đậu xuống / drawer mở như lật góc trang |
| `.squiggle-tab` / `.underline-squiggle` | gạch chân lượn vẽ tay cho tab/link |
| `.font-hand` | Patrick Hand (ghi chú ngắn, empty-state, label tay) |

Vi mô toàn app (globals.css `@layer base`): `::selection` marker xanh,
`::placeholder` chì nghiêng, `::marker` mực mềm, `:focus-visible` nét mực 2px
offset 2px, scrollbar bút chì mảnh (webkit + firefox). Mọi hiệu ứng 120–240ms
và tôn trọng `prefers-reduced-motion`.

### Bộ icon notebook

Icon hiển thị chính dùng bộ vẽ tay `src/components/v-intern/icons/` (42 icon,
xem dossier `notebook-icons.md` trong thư mục đó). Icon hành động nhỏ chưa
thay sẽ chuyển dần theo pack. Khi thay icon: giữ nguyên aria-label/aria-hidden
và test hook cũ.

Đọc [chương thiết kế trong bàn giao](HANDOVER.md#5-thiết-kế-aurora-glass) để
hiểu token, cách dùng surface, chart, motion và responsive. [Token và phạm vi
CSS](workspace-design-system.md) dành cho người triển khai.

## Component theo vai trò

| Nhu cầu | Component hiện có | Cách dùng |
|---|---|---|
| Tiêu đề trang | WorkspacePageHeader / StudentHeading / InstructorHeading | Một H1, lời dẫn ngắn, hành động theo ngữ cảnh |
| Điều hướng nhóm | WorkspaceStage | Tab của khu vực, không tự mở route bị khóa lifecycle |
| Nhóm nội dung độc lập | Panel / StudentPanel | Không bọc một Panel quanh từng field |
| Nút và trường nhập | product/primitives, student-ui | Giữ loading, disabled, label và lỗi |
| Phân bố trạng thái | TaskDistribution | Số liệu thật, legend bằng bàn phím, chỉ là snapshot |
| So sánh tỷ lệ/điểm | RateComparison | Khai báo đúng unit; null không đổi thành 0 |
| Deadline | TaskDeadline | Ngày gốc + hôm nay/ngày mai/quá hạn, task done không cảnh báo quá hạn |
| Loading/error/empty | shared/data-state và Empty | Trạng thái khác nhau phải có nội dung khác nhau |
| Modal/drawer | Modal, shell hiện có | Focus trap, Escape và trả focus |

## Một trang nên được tổ chức thế nào?

1. Đặt hành động chính gần tiêu đề, dùng lời dẫn đủ để biết bước tiếp theo.
2. Nếu có metric, ghi phạm vi đo và dùng semantic color đúng trạng thái.
3. Đặt filter gần collection mà nó tác động; hiển thị đặt lại khi đang lọc.
4. Dùng list/table cho nhiều bản ghi, card cho object cần xem độc lập.
5. Đưa giải thích dài sang vùng trợ giúp hoặc chi tiết; không lặp ở mọi section.
6. Giữ hành động thay đổi dữ liệu rõ trạng thái đang gửi và kết quả.

## Ảnh và icon

Robot V-Intern có sẵn được dùng ở header dẫn dắt. Artwork SVG hiện có diễn tả dự án, kết nối và thành tựu. Lucide giữ vai trò nhận diện thao tác, không thay icon nhỏ bằng ảnh nặng. Ảnh trang trí phải có alt rỗng; ảnh mang thông tin phải có mô tả. Không sao chép ảnh của website tham khảo vào repo.

## Cần kiểm tra sau khi sửa

Desktop 1440/1280/1024, tablet 768 và mobile 390px; thêm 320px cho component dễ tràn. Nội dung dài, empty state, error/retry, filter, keyboard, modal và reduced motion. Bảng cuộn trong container; không giấu overflow toàn trang để che lỗi. Chỉ số và hình không được thay đổi kết quả nghiệp vụ.
