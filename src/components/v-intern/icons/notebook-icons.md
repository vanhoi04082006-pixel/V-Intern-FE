# Dossier bộ icon notebook "Sổ tay hành trình"

Bộ icon vẽ tay thay lucide cho **icon hiển thị chính** của hệ thống
(`src/components/v-intern/icons/index.tsx`). Quy ước nét: `viewBox 0 0 24 24` ·
`stroke=currentColor` · `strokeWidth=2` (đổi được qua prop) · bo tròn đầu nét ·
đường "thẳng" cong rất nhẹ, điểm cuối lệch 0.3–1.2px; vòng tròn là chuỗi cung C
bán kính lệch nhau, khép hở nhẹ — sai lệch tinh tế, không nguệch ngoạc.
Mọi icon nhận `size`, `className`, `strokeWidth` và toàn bộ props SVG; icon tự
đặt `aria-hidden="true"` mặc định (call site đè được khi cần mô tả).

**Quy tắc thay icon:** giữ nguyên `aria-label`/`aria-hidden`/`data-testid` cũ
của call site — test không được đỏ vì đổi icon. Icon lucide chỉ còn cho icon
hành động phụ chưa thay; thay dần theo pack.

Bảng dưới liệt kê icon · thay cho (lucide) · nơi dùng chính · ghi chú aria.
Cột "nơi dùng" cập nhật mỗi pack bổ sung consumer mới.

## Điều hướng & shell

| Icon | Thay lucide | Nơi dùng | Ghi chú |
|---|---|---|---|
| IconHome | Home | Nav "Tổng quan" 3 vai; breadcrumb topbar intern | ẩn mặc định |
| IconListTodo | ListTodo | Nav "Công việc/Nhiệm vụ", info-card task | ẩn |
| IconLayers | Layers | Nav "Phiên thực tập" | ẩn |
| IconFolderKanban | FolderKanban | Nav "Dự án", workspace-stage | ẩn |
| IconSquareKanban | SquareKanban | Nav "Sprint Board", work-list | ẩn |
| IconClipboardCheck | ClipboardCheck | Nav "Thời hạn/Đánh giá" | ẩn |
| IconChartColumn | ChartColumn | Nav "Hiệu suất/KPI" | ẩn |
| IconChartTrend | ChartNoAxesCombined | Tiêu đề khối xu hướng | ẩn |
| IconFileText | FileText | Nav "Báo cáo/Audit log" | ẩn |
| IconGithub | Github | Nav "Kết nối GitHub" (instructor/admin) | ẩn |
| IconCodeXml | CodeXml | Nav "GitHub" intern, nhãn kỹ thuật | ẩn |
| IconBot | Bot | Nav "AI Mentor", mentor chat | ẩn |
| IconWallet | Wallet | Nav "KPI & Lương ảo" | ẩn |
| IconCoins | Coins | Nav "Lương ảo" | ẩn |
| IconAward | Award | Nav "Chứng nhận" | ẩn |
| IconLightbulb | Lightbulb | Nav "Khuyến nghị" | ẩn |
| IconBell | Bell | NotificationBell (aria-label "Thông báo…chưa đọc" giữ nguyên), nav | ẩn |
| IconUserRound | UserRound | Nav "Hồ sơ", stage | ẩn |
| IconUsers | Users | Nav "Người dùng/Nhóm" | ẩn |
| IconShield | Shield | Nav "Vai trò & quyền", footer admin | ẩn |
| IconBookOpen | BookOpen | Nav "Danh mục/Kho tri thức" | ẩn |
| IconCircleHelp | CircleHelp | Nav "Ngân hàng câu hỏi" | ẩn |
| IconGraduationCap | GraduationCap | Nav "Thư viện nghề nghiệp", footer vai | ẩn |
| IconLayoutTemplate | LayoutTemplate | Nav "Project template" | ẩn |
| IconSparkles | Sparkles | Nav "Cấu hình AI" | ẩn |
| IconSettings | Settings | Nav "Cài đặt" mọi vai | ẩn |
| IconActivity | Activity | Nav "Hoạt động/Trạng thái dịch vụ" | ẩn |
| IconLock | Lock | Mục nav chưa khả dụng (kèm title) | ẩn |
| IconCalendarDays | CalendarDays | Deadline, info "Phiên thực tập" | ẩn |
| IconClock | Clock | Deadline, "Đang chờ phân công" | ẩn |
| IconMenu | Menu | Nút "Mở menu" mobile 2 shell | aria-label giữ nguyên |
| IconX | X | Nút "Đóng" modal/drawer/ tìm kiếm | aria-label giữ nguyên |
| IconChevronRight | ChevronRight | Breadcrumb, next | ẩn |
| IconChevronLeft | ChevronLeft | Trang trước kanban | ẩn |
| IconChevronDown | ChevronDown | Menu user, select | ẩn |
| IconArrowLeft | ArrowLeft | Nút quay lại PageTitle | ẩn |
| IconArrowRight | ArrowRight | CTA tiếp tục | ẩn |
| IconArrowUpRight | ArrowUpRight | Liên kết ngoài | ẩn |
| IconSearch | Search | Ô tìm kiếm topbar intern | input giữ aria-label riêng |
| IconSun/IconMoon/IconMonitor | Sun/Moon/Monitor | ThemeToggle radio "Chủ đề …" | aria-label radio giữ nguyên |
| IconLogout | LogOut | (dự bị — tiêu thụ ở pack auth/admin) | ẩn |
| IconCompass | Compass | Onboarding hướng hành trình | ẩn |

## Trạng thái & phản hồi

| Icon | Thay lucide | Nơi dùng | Ghi chú |
|---|---|---|---|
| IconInbox | Inbox | Empty-state mặc định (primitives) | ẩn |
| IconInfo | Info | InlineAlert info | ẩn |
| IconAlertTriangle | TriangleAlert | InlineAlert warning, ErrorState | ẩn |
| IconCircleCheck | CircleCheck | InlineAlert success, badge đạt | ẩn |
| IconCircleX | CircleX | InlineAlert danger | ẩn |
| IconCircleDashed | CircleDashed | (dự bị — trạng thái pending/chờ) | ẩn |
| IconHourglass | Hourglass | Chờ phân công (active-entry) | ẩn |
| IconTarget | Target | Mục tiêu task/KPI | ẩn |
| IconFlag | Flag | Cột kanban "Hoàn thành" | ẩn |
| IconCircleDot | CircleDot | Điểm trạng thái dòng việc | ẩn |
| IconTrendingUp | TrendingUp | Xu hướng hiệu suất | ẩn |
| IconGitBranch | GitBranch | Chi tiết commit/nhánh | ẩn |
| IconMessageSquare | MessageSquare | Bình luận/review | ẩn |
| IconSend | Send | Gửi chat mentor | ẩn |
| IconStar | Star | (dự bị — đánh giá) | ẩn |

## Hành động (dự bị cho PACK 4–6)

IconCheck, IconPlus, IconRefreshCw, IconEye, IconPenLine, IconTrash,
IconDownload, IconUpload, IconExternalLink (đã dùng code-submissions),
IconFilter, IconPaperclip, IconMoreHorizontal, IconShieldCheck — bộ hành động
vẽ sẵn đúng bộ nét, tiêu thụ khi các pack instructor/admin chạm tới trang có
nút tương ứng; mỗi lần tiêu thụ cập nhật bảng này. Không xóa trước thời hạn
(tránh tái tạo cùng nét sau này), nhưng KHÔNG thêm icon dự bị mới ngoài nhu cầu.

## Duy trì

- Thêm icon mới: copy quy ước nét (stroke 2, cap/join round, wobble ≤1.2px),
  đặt tên trùng lucide tương ứng để tra cứu nhanh, cập nhật bảng dossier.
- Đổi icon tại call site: giữ aria/test-hook; chạy `vitest run` (672 floor)
  và keyboard-check trước khi mở PR.
