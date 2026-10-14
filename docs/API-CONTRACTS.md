# API và lifecycle frontend

Base lấy NEXT_PUBLIC_API_BASE_URL gồm /api/v1. Mọi request dùng credentials:include và Bearer access token khi cần. Refresh cookie HttpOnly; access token ở memory. Adapter kiểm tra field/type/nullable; response sai không render như dữ liệu hợp lệ.

| Nhóm adapter | Hành vi |
|---|---|
| workspace/recruitment | Lifecycle, profile, own session, conversation next/clarify, answer, submit/retry |
| templates/sessions | Library/detail/create run, eligible members, Start, plan history/publish |
| work/submissions | Own tasks/specs/comments/history, nộp/rút bài, AI review và rubric cuối |
| github | Trạng thái kết nối, authorize redirect, repo/provision/invitation |
| sharing | Xin xem, approve/deny/revoke, snapshot chỉ đọc |
| mentor | Own conversation/history, selected own taskId |
| reports/performance | Scope quản lý, phân trang, PDF/XLSX |

Lỗi 401 xóa phiên và yêu cầu đăng nhập;403 từ chối quyền;409 reload dữ liệu và cho xử lý xung đột;429/5xx hiển thị retry. Refresh bị throttled/transport error không giả thành logout; cookie invalid/revoked vẫn fail closed.

Sinh viên đã passed nhưng chưa assignment chỉ dùng route chờ, notifications, profile và github. requireAssignment là gate trước mount, không phải bảo mật duy nhất: API BE vẫn xác thực sở hữu. Sau assignment phải lấy workspace mới; không tự đặt active trong local state.

API không trả đáp án mẫu/rubric tuyển dụng. Điểm AI code review là đề xuất, kèm evidence/limitations; task Done cần quyết định đã lưu từ BE. UI không gọi merge PR hoặc nhận trường passed từ model làm authority.
