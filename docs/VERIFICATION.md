# Kiểm chứng frontend — 16/10/2026

Vitest66files/479tests đạt. Đăng nhập ghi Email đúng API; signup gửi request thật/consent, chỉ mở login sau khi backend xác nhận tạo intern. Regression kiểm tra đồng hồ chat lấy thời gian server, giảm đúng từng giây, tự mở câu đầu và không tự lặp khi provider thất bại.

Hồi quy gồm PASS chưa assignment, khóa task/Mentor, own outcomes sau placement, chat/follow-up/reload/pending, Kanban refresh, rubric AI sau tải dữ liệu, eligibility/roster removal, blueprint/planner metadata, report filters/snapshot, admin bank/template/policy và signed runner details.

Chrome với HTTP/Nest/SQL thật ở1440/820/390px: student waiting/notifications; instructor blueprint/performance/detail/report; admin bank/policy/template/session/report; thêm/gỡ thành viên và lifecycle; worker status; certificate/PDF/public verify; signup→login→onboarding. Không sửa API response. Fixtures tách khỏi tài khoản trắng; chỉ tính pass sau nội dung thật đã render, không tính loading/login như private page.

Artifacts ở workspace manual-runtime/*-master-browser.json và ảnh cùng prefix. Các luồng/viewport đã chạy không có page errors/body overflow. Runtime import audit hiện71route entries/216modules, không có mock-data/test/server-business imports hoặc Next business route handlers. UI kết quả AI không auto Done/merge. Report/certificate hiển thị snapshot thật, không bịa số đo/điểm cho dữ liệu cũ.

Nghiệm thu GitHub thật dùng hai danh tính: sinh viên tạo/sửa PR, runner và Gemini chấm; giảng viên nhập rubric riêng, duyệt90.5 và task Done. Student thấy AI98/runner2/2 cùng quyết định giảng viên, không có form duyệt. Đã sửa TaskSpec bị lặp, tên sprint/ưu tiên, deep-link task chứa SQL GUID viết hoa, mark-read và nhãn AI còn chờ sau human approval; có regression. [Bằng chứng](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/LIVE-GITHUB.md).

BE hiện71suites/555unit tests và schema31. Kết quả SQL225tests/native SQL2019 theo từng commit tại [PR backend2](https://github.com/vanhoi04082006-pixel/V-Intern-BE/pull/2). Full-stack workflow ghim BEcf5890c đã có trên remote, thêm cấu hình vị trí file database và dựng fixture KPI song song; test provider đúng feature/schema và10câu hội thoại. 14 kịch bản được tách thành 14 bước CI riêng để xác định đúng luồng thất bại. Kết quả remote gắn với từng commit tại [PR nháp14](https://github.com/vanhoi04082006-pixel/V-Intern-FE/pull/14); không dùng run của pin cũ để chứng minh phiên bản khác.

CI task giữ luồng nộp bài thật qua API/UI và SQL: chặn chuyển thẳng review/done, đóng băng SHA, AI fixture thiếu execution phải inconclusive, duyệt thủ công phải có lý do lưu audit. GitHub HTTP được thay bằng transport chỉ đọc trong database test riêng, từ chối credential thật; không có browser interception. Đây là kiểm thử hợp đồng hệ thống, không thay bằng chứng GitHub/Docker/Gemini thực tế ở trên.

[Cách chạy test](TESTING.md) · [Bằng chứng hệ thống](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/VERIFICATION.md) · [API](API-CONTRACTS.md).
