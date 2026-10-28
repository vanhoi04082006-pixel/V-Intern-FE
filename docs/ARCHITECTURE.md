# Kiến trúc frontend

> Bộ bàn giao theo lộ trình đọc: [HANDOVER](HANDOVER.md). Trang này là chương tra cứu chuyên sâu; kết quả chạy thực tế xem [VERIFICATION](VERIFICATION.md).


Routes App Router nhận params và chọn component; WorkspaceGuard xác thực/role; InternEntry lấy lifecycle để quyết định chờ phân công hay mount học tập. Giao diện không có backend nghiệp vụ trong Next. Dữ liệu qua lib/api → transport xác thực → Nest.

InternShell dùng cho tổng quan/thông báo/hồ sơ/GitHub và các trang học tập. Task/sprint/Mentor chỉ mount khi có active assignment. Sinh viên đã kết thúc placement nhưng có `hasAssignmentHistory` vẫn xem kết quả/chứng nhận của chính mình; người chưa từng được phân công giữ dashboard chờ. ProductShell dùng giảng viên/admin, có navigation và drawer chung. Một route không tự bọc thêm ProductShell khi layout đã có shell.

RecruitmentProvider giữ profile/session, tách busy và evaluating. ConversationInterview phục hồi transcript từ server, hiển thị đúng một câu hiện tại, dùng server remainingSeconds và interval local để trình bày. Backend kiểm tra thời gian và thứ tự lần nữa. Phiên lịch sử tám câu có UI tương thích; phiên mới mười câu dùng chat.

useResource quản lý abort/error/reload. Adapter parse unknown trước khi component dùng dữ liệu. Mutation có version/conflict và tải lại thông tin cần thiết; Kanban truyền revision để các cột cập nhật, không chỉ bảng danh sách. Form giảng viên chỉ khởi tạo sau khi AI review đã tải, keyed theo review để điểm đề xuất không bị giữ ở0.

Component mới thuộc nghiệp vụ cụ thể. Primitives dùng chung chỉ chứa hành vi/appearance trung tính. Reference mock components không được trở thành route production. Không ghi token vào localStorage, URL hay BroadcastChannel; cookie coordination serialize refresh giữa tabs.
