# Kế hoạch mở rộng Agent và tuyển thực tập — FE/BE

> 23/10/2026 — G0/M00 đã đạt: FE `6b11d07`, quality và 14/14 bước SQL 2019 cùng xanh. Đang triển khai M01 theo các lát cắt dữ liệu → API → UI/consumer.

Kế hoạch liên repo được lưu tập trung ở BE để tránh hai checklist có trạng thái khác nhau:

- [Phạm vi, luồng nghiệp vụ, 16 hạng mục và tiêu chí hoàn thành](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feat/admin-repository-account/tasks/plan.md)
- [Checklist triển khai có phụ thuộc và cách kiểm thử](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feat/admin-repository-account/tasks/todo.md)

FE sẽ có các lát cắt: quản trị role/tri thức/dự án nhỏ; nộp CV và theo dõi hồ sơ; quản trị đợt/slot; phòng chờ/phỏng vấn được giao role; trạng thái invitation GitHub/mời lại; chính sách trễ/bằng chứng vi phạm và giảng viên duyệt thay người. Tái dùng design system, routing và cơ chế auth hiện hành; contract mới được định nghĩa theo từng capability trước khi nối UI.

M00 đã có [bằng chứng theo cặp SHA](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feat/admin-repository-account/docs/reports/ci-recovery-20261023.md). M01 có schema/API, consumer tuyển dụng và gợi ý nghề từ catalog ở BE, UI Admin/onboarding động ở FE; [hướng dẫn và giới hạn](../docs/CAREER-ROLES.md). R03 chưa hoàn tất consumer template/giảng viên; CI mới ghim BE `ecc1cb8` phải được kiểm riêng sau mỗi revision.

Các tài liệu `phase7-full-plan.md` và `phase7-full-todo.md` được giữ nguyên như lịch sử đợt trước. Bảng theo dõi mới nằm ở liên kết BE phía trên; không dùng task cũ để khẳng định nghiệm thu tính năng mới.
