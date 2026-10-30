# Dossier bộ icon notebook "Sổ tay hành trình"

Quy ước nét: `viewBox 0 0 24 24` · `stroke=currentColor` · `strokeWidth=2` ·
`strokeLinecap/linejoin=round` · fill none · sai lệch tay 0.3–0.6px có chủ đích.
Vòng tròn lớn (r ≥ 3.5) vẽ bằng path cong lệch; chấm/nút nhỏ dùng `<circle>`
hoặc cap tròn. Mọi icon là function component có tên (displayName) và nhận
`size` (mặc định 24) + toàn bộ props SVG (`className`, `aria-hidden`…).

Đối chiếu nhanh lucide gốc khi thay: giữ nguyên `aria-label`/`aria-hidden`
và `data-testid` của call site — test không được đỏ vì đổi icon.

| Icon | Thay cho (lucide) | Nơi dùng chính | Aria |
|---|---|---|---|
| IconHome | Home | Nav "Tổng quan" 3 vai, intern nav | aria-hidden tại call site |
| IconChecklist | ListTodo | Nav "Công việc/Nhiệm vụ/Tasks" | aria-hidden |
| IconLayers | Layers | Nav "Phiên thực tập" | aria-hidden |
| IconFolder | FolderKanban | Nav "Dự án" | aria-hidden |
| IconKanban | KanbanSquare/SquareKanban | Nav "Sprint Board/Sprints" | aria-hidden |
| IconClipboardCheck | ClipboardCheck | Nav "Thời hạn/Đánh giá" | aria-hidden |
| IconChart | ChartNoAxesCombined/ChartColumn | Nav "Hiệu suất" | aria-hidden |
| IconFile | FileText | Nav "Báo cáo/Audit log" | aria-hidden |
| IconGitBranch | Github | Nav "Kết nối GitHub" (instructor/admin) | aria-hidden |
| IconCode | CodeXml | Nav "GitHub" (intern), nhãn kỹ thuật | aria-hidden |
| IconRobot | Bot | Nav "AI Mentor", "Cấu hình AI" | aria-hidden |
| IconWallet | Wallet | Nav "KPI & Lương ảo" | aria-hidden |
| IconCoins | Coins | Nav "Lương ảo" (admin) | aria-hidden |
| IconAward | Award | Nav "Chứng nhận" | aria-hidden |
| IconBulb | Lightbulb | Nav "Khuyến nghị/Gợi ý" | aria-hidden |
| IconBell | Bell | Nav "Thông báo", NotificationBell | aria-label="Thông báo chưa đọc" giữ nguyên |
| IconUser | UserRound | Nav "Hồ sơ" | aria-hidden |
| IconUsers | Users | Nav "Người dùng/Nhóm" | aria-hidden |
| IconShield | Shield | Nav "Vai trò & quyền", footer admin | aria-hidden |
| IconBook | BookOpen | Nav "Danh mục/Kho tri thức" | aria-hidden |
| IconHelp | CircleHelp | Nav "Ngân hàng câu hỏi" | aria-hidden |
| IconCap | GraduationCap | Nav "Thư viện nghề nghiệp", footer vai | aria-hidden |
| IconTemplate | LayoutTemplate | Nav "Project template" | aria-hidden |
| IconSparkles | Sparkles | Nav "Cấu hình AI", điểm nhấn AI | aria-hidden |
| IconSliders | Settings (móc trượt) | Nav "Cài đặt hệ thống" (admin) | aria-hidden |
| IconGear | Settings (bánh răng) | Nav "Cài đặt" cá nhân (intern) | aria-hidden |
| IconPulse | Activity | Nav "Hoạt động/Trạng thái dịch vụ" | aria-hidden |
| IconLock | Lock | Mục nav chưa khả dụng | aria-hidden + title giải thích |
| IconChevronRight | ChevronRight | Breadcrumb mọi shell | aria-hidden |
| IconMenu | Menu | Nút "Mở menu" mobile | aria-label="Mở menu" giữ nguyên |
| IconClose | X | Nút "Đóng" modal/drawer/tìm kiếm | aria-label="Đóng…" giữ nguyên |
| IconSearch | Search | Ô tìm kiếm topbar | aria-hidden/aria-label của input giữ nguyên |
| IconInbox | Inbox | Empty-state mặc định | aria-hidden |
| IconInfo | Info | InlineAlert info | aria-hidden |
| IconAlert | TriangleAlert | InlineAlert warning | aria-hidden |
| IconCheck | Check | Trạng thái hoàn thành | aria-hidden |
| IconCircleCheck | CircleCheck | InlineAlert success, huy hiệu đạt | aria-hidden |
| IconCircleX | CircleX | InlineAlert danger | aria-hidden |
| IconArrowLeft | ArrowLeft | Nút quay lại PageTitle | aria-hidden |
| IconCalendar | CalendarDays/Calendar | Deadline, lịch | aria-hidden |
| IconClock | Clock | Deadline, thời hạn | aria-hidden |

Icon đặc thù nghiệp vụ (điểm số, phỏng vấn, duyệt…) sẽ bổ sung theo pack
khi có route tiêu thụ — cập nhật bảng này mỗi lần thêm icon.
