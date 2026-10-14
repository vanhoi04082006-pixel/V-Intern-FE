# Kiểm chứng frontend ngày14/10/2026

- Vitest:57files/430tests đạt; typecheck, lint và production build đạt.
- Regressions: passed-unassigned route gate, pending AI, chat recovery, delayed AI rubric initialization, Kanban refresh và không gửi empty search400.
- Chrome thật ở1440px/390px: ba roles trên runtime sạch, refresh cookie qua reload; không page errors/API5xx. Passed-unassigned notifications giữ shell chờ, direct mentor không mount chat. Assigned own tasks/board/detail/spec/submission area, tìm trang, drawer Escape/focus/desktop resize đạt.
- Browser learning fixture dùng SQL/backend thật8081 qua URL forwarding; không mock response. Dữ liệu nghiệm thu không nằm trong ba tài khoản trắng.

Backend cùng bộ thay đổi:460unit và174SQL integration tests đạt. Live OAuth repo/invitation/PR và isolated runner chưa được nghiệm thu do thiếu cấu hình ngoài. UI báo tình trạng thiếu cấu hình; không thay bằng điểm hoặc repo giả.

Workflow full-stack đang pin BE baseline cũ; khi phát hành cần commit BE mới tương thích và chạy gate lại. Xem TESTING.md và tài liệu VERIFICATION ở workspace cha để biết phạm vi/môi trường và fixture provider thật.
