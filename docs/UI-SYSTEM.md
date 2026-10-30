# Hệ thống giao diện: từ component tới trang hoàn chỉnh

## Hướng thiết kế hiện tại

Toàn hệ thống dùng concept **"Sổ tay hành trình" (Journey Notebook)**: nền giấy
kem, nét mực đen, mực xanh dương làm điểm nhấn; nét đứt đường cắt giấy, băng dính
washi, doodle vẽ tay, highlight marker, card giấy dán lệch, con dấu mộc tròn và
chữ viết tay Patrick Hand cho ghi chú ngắn. Mật độ trang trí theo vai:
**intern đậm** (sticky note cho gợi ý AI, doodle empty state, tape panel chính),
**instructor vừa** (lề kẻ, dashed-cut thẻ chờ hành động, mộc trạng thái duyệt),
**admin nhẹ** (token màu giấy/mực, typography đậm, mộc badge quan trọng — không
tape/doodle trong bảng dày).

Token nguồn sự thật nằm ở `src/styles/tokens.css` (`--paper`, `--ink`, `--blue`,
`--note-yellow`, `--stamp-red`…). Dark mode = "chalkboard night" (bảng đen phấn),
mỗi utility có bản dark riêng.

## Utility notebook (một nguồn sự thật)

| Utility | Dùng cho | Ghi chú |
|---|---|---|
| `.bg-grid-paper` / `.bg-dots-paper` / `.bg-dots-chalk` | nền giấy ô ly / chấm bi / phấn trên nền đen | landing + hero |
| `.tape` (+ `.tape-peel`) | mẩu băng dính washi | hover cong nhẹ; xoay qua `--tape-rotate` |
| `.marker` | highlight bút dạ quang sau chữ | quét qua viewport khi thêm `.animate-marker-sweep` |
| `.sketch-card` / `.sketch-card-sm` | thẻ giấy viền mực + bóng in | landing, panel chính |
| `.dashed-cut` / `.dashed-cut-chalk` | viền đứt đường cắt giấy (ink / chalk) | thẻ chờ hành động, dropzone, đường phân mục |
| `.sticky-note` | giấy note vàng dán lệch (dark: vàng đậm) | xoay qua `--note-rotate` |
| `.stamp-moc` / `.stamp-moc-sm` | con dấu mộc tròn nét không đều, chữ nghiêng | ĐÃ DUYỆT / PASS; màu mực qua `color` |
| `.divider-torn` | đường xé giấy giữa các section | thay `<hr>` liền |
| `.skeleton-pencil` | skeleton nét chì gạch chéo | thay khối xám pulse |
| `.spinner-hand` | vòng tròn vẽ tay quay | thay ring quay |
| `.underline-squiggle` | gạch chân lượn sóng | link, tab đang mở |
| `.notebook-scroll` | scrollbar bút chì mảnh cho vùng cuộn trong (sidebar, drawer, bảng áp qua selector `:is(...)` trong notebook.css) | vùng cuộn |
| `.font-hand` | Patrick Hand — CHỈ ghi chú ngắn/label/empty-state | không dùng nội dung dài/bảng |
| Motion: `.animate-stamp-thump` `.animate-marker-sweep` `.animate-paper-settle` `.animate-page-curl` `.squiggle-draw` | hiệu ứng 120–240ms | đều tôn trọng `prefers-reduced-motion` |

Micro-details áp toàn hệ thống (globals.css): `::selection` marker xanh,
`::placeholder` chữ chì nghiêng, `::marker` bullet mực xanh, focus-visible nét
mực 2px offset 2px, scrollbar webkit+firefox kiểu bút chì trên rãnh giấy.

Component notebook dùng chung: `src/components/workspace/notebook.tsx` —
`NoteCard` (sticky note + tape), `MarginNote`, `StampMoc`, `PaperDivider`.
Shell/primitives workspace được notebook hoá qua `src/components/workspace/notebook.css`
(import cuối trong 3 layout), mật độ theo `[data-workspace-role]`.

## Bộ icon notebook

`src/components/v-intern/icons/index.tsx` — 68 icon SVG vẽ tay thay thế lucide
cho icon hiển thị chính. Một bộ nét: stroke 2px, bo tròn, đường cong lệch nhẹ,
vòng tròn khép hở; màu `currentColor`; prop `size`/`className`/`strokeWidth`
tương thích cách gọi lucide. Type dùng chung: `IconComponent`.

Dossier (tên · nơi dùng chính · aria):

| Icon | Nơi dùng | Aria |
|---|---|---|
| IconHome | nav "Tổng quan" (3 shell), breadcrumb intern | aria-hidden (decorative) |
| IconListTodo | nav Công việc/Nhiệm vụ | aria-hidden |
| IconLayers | nav Phiên thực tập | aria-hidden |
| IconFolderKanban | nav Dự án, viewbar nhóm dự án | aria-hidden |
| IconSquareKanban | nav Sprint Board | aria-hidden |
| IconClipboardCheck | nav Thời hạn/Đánh giá | aria-hidden |
| IconChartColumn | nav Hiệu suất/KPI | aria-hidden |
| IconFileText | nav Báo cáo/Audit | aria-hidden |
| IconGithub / IconCodeXml | nav GitHub | aria-hidden |
| IconBot | nav AI Mentor/Gợi ý | aria-hidden |
| IconWallet / IconCoins | nav KPI/Lương ảo | aria-hidden |
| IconAward | nav Chứng nhận | aria-hidden |
| IconLightbulb | nav Khuyến nghị | aria-hidden |
| IconBell | nav + chuông thông báo | aria-hidden; label nằm trên nút cha |
| IconUserRound / IconUsers | nav Hồ sơ/Nhóm | aria-hidden |
| IconShield | nav Vai trò & quyền, footer admin | aria-hidden |
| IconBookOpen | nav Kho tri thức/Danh mục | aria-hidden |
| IconCircleHelp | nav Ngân hàng câu hỏi | aria-hidden |
| IconGraduationCap | nav Nghề nghiệp, footer instructor/intern | aria-hidden |
| IconLayoutTemplate | nav Project template | aria-hidden |
| IconSparkles | nav Cấu hình AI | aria-hidden |
| IconSettings | nav Cài đặt | aria-hidden |
| IconActivity | nav Trạng thái dịch vụ/Hoạt động | aria-hidden |
| IconLock | mục nav chưa mở khóa | aria-hidden |
| IconCalendarDays / IconClock | meta rows intern (phiên, hạn) | aria-hidden |
| IconMenu / IconX | mở/đóng drawer mobile | aria-hidden; aria-label trên nút cha |
| IconChevronRight/Left/Down | breadcrumb, user menu | aria-hidden |
| IconArrowLeft / IconArrowRight | quay lại, StudentLink, CTA | aria-hidden |
| IconSearch | ô tìm kiếm topbar | aria-hidden |
| IconSun / IconMoon / IconMonitor | theme toggle | aria-hidden |
| IconLogout | nút đăng xuất (pack sau) | aria-hidden |
| IconInbox | Empty mặc định | aria-hidden |
| IconInfo / IconAlertTriangle / IconCircleCheck / IconCircleX | InlineAlert, ErrorState | aria-hidden |
| IconCircleDashed | trạng thái pending (pack sau) | aria-hidden |
| IconCompass / IconListChecks / IconGitBranch | màn chờ gate intern | aria-hidden |
| IconStar / IconSparkles doodle | trang trí landing | aria-hidden |
| IconRefreshCw, IconEye, IconPenLine, IconTrash, IconDownload, IconUpload, IconExternalLink, IconFilter, IconSend, IconPaperclip, IconMessageSquare, IconMoreHorizontal, IconTrendingUp, IconPlus, IconCheck | hành động bảng/form (tiêu thụ dần theo pack) | aria-hidden |

Lucide vẫn được phép dùng ở icon phụ chưa migrates (diễn ra theo pack), nhưng
icon hiển thị chính của shell/nav/primitives phải là bộ notebook.

## Component theo vai trò

| Nhu cầu | Component hiện có | Cách dùng |
|---|---|---|
| Tiêu đề trang | WorkspacePageHeader / StudentHeading / InstructorHeading | Một H1, lời dẫn ngắn, hành động theo ngữ cảnh |
| Điều hướng nhóm | WorkspaceStage | Tab mục lục squiggle, không tự mở route bị khóa lifecycle |
| Nhóm nội dung độc lập | Panel / StudentPanel | Không bọc một Panel quanh từng field |
| Nút và trường nhập | product/primitives, student-ui | Giữ loading, disabled, label và lỗi |
| Ghi chú/gợi ý | NoteCard / MarginNote (workspace/notebook) | Sticky note cho ghi chú ngắn; không dùng cho dữ liệu |
| Trạng thái quan trọng | StampMoc / Badge stamp | Mộc đỏ = thất bại/kết thúc, mực xanh = đạt/pass |
| Loading/error/empty | shared/data-state và Empty | Trạng thái khác nhau phải có nội dung khác nhau |
| Modal/drawer | Modal, shell hiện có | Focus trap, Escape và trả focus; modal có tape (trừ admin) |

## Một trang nên được tổ chức thế nào?

1. Đặt hành động chính gần tiêu đề, dùng lời dẫn đủ để biết bước tiếp theo.
2. Nếu có metric, ghi phạm vi đo và dùng semantic color đúng trạng thái.
3. Đặt filter gần collection mà nó tác động; hiển thị đặt lại khi đang lọc.
4. Dùng list/table cho nhiều bản ghi, card cho object cần xem độc lập.
5. Đưa giải thích dài sang vùng trợ giúp hoặc chi tiết; không lặp ở mọi section.
6. Giữ hành động thay đổi dữ liệu rõ trạng thái đang gửi và kết quả.

## Ảnh và icon

Robot V-Intern có sẵn được dùng ở header dẫn dắt. Artwork SVG hiện có diễn tả
dự án, kết nối và thành tựu. Icon hiển thị chính dùng bộ notebook vẽ tay
(`v-intern/icons`); lucide chỉ còn ở icon phụ chưa migrate. Ảnh trang trí phải
có alt rỗng; ảnh mang thông tin phải có mô tả. Không sao chép ảnh của website
tham khảo vào repo.

## Cần kiểm tra sau khi sửa

Desktop 1440/1280/1024, tablet 768 và mobile 390px; thêm 320px cho component dễ
tràn. Nội dung dài, empty state, error/retry, filter, keyboard, modal và reduced
motion. Bảng cuộn trong container; không giấu overflow toàn trang để che lỗi.
Chỉ số và hình không được thay đổi kết quả nghiệp vụ.
