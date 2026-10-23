# Kế hoạch mở rộng Agent và tuyển thực tập — FE/BE

> 23/10/2026 — người dùng đã duyệt kế hoạch; đang thực hiện G0/M00 để khôi phục đầy đủ CI trước các capability mới.

Kế hoạch liên repo được lưu tập trung ở BE để tránh hai checklist có trạng thái khác nhau:

- [Phạm vi, luồng nghiệp vụ, 16 hạng mục và tiêu chí hoàn thành](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feat/admin-repository-account/tasks/plan.md)
- [Checklist triển khai có phụ thuộc và cách kiểm thử](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feat/admin-repository-account/tasks/todo.md)

FE sẽ có các lát cắt: quản trị role/tri thức/dự án nhỏ; nộp CV và theo dõi hồ sơ; quản trị đợt/slot; phòng chờ/phỏng vấn được giao role; trạng thái invitation GitHub/mời lại; chính sách trễ/bằng chứng vi phạm và giảng viên duyệt thay người. Tái dùng design system, routing và cơ chế auth hiện hành; contract mới được định nghĩa theo từng capability trước khi nối UI.

Ưu tiên đầu tiên là sửa CI FE đủ 14 bước full-stack. Trạng thái baseline: commit `7c45109`, quality thành công, [full-stack thất bại ở bước 03](https://github.com/vanhoi04082006-pixel/V-Intern-FE/actions/runs/39901342649). Chưa đánh dấu phần mới đã được kiểm thử.

Các tài liệu `phase7-full-plan.md` và `phase7-full-todo.md` được giữ nguyên như lịch sử đợt trước. Bảng theo dõi mới nằm ở liên kết BE phía trên; không dùng task cũ để khẳng định nghiệm thu tính năng mới.
