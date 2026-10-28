# G3 — Giao diện CV, lịch phỏng vấn và email local

Đã bổ sung `/apply`, tuyển dụng/hồ sơ cho Admin/Giảng viên, Admin communications và đổi mật khẩu tạm. [Hướng dẫn sử dụng và bảo trì](../CV-AND-INTERVIEW-SCHEDULING.md) giải thích từng màn hình và các tình huống cần xử lý.

## Nghiệm thu local ngày 24–25/10/2026

| Nhóm kiểm | Kết quả | Nguồn local dưới workspace |
|---|---|---|
| Unit toàn FE | 96 file / 599 test qua | `.runtime/g3-fe-unit-final.log` |
| Typecheck/lint | Qua | `.runtime/g3-fe-typecheck-final.log`, `g3-fe-lint-final.log` |
| Build production local | Qua | `.runtime/g3-fe-build-verified.log` |
| Browser | 7 luồng qua; 0 page error | `manual-runtime/g3-20261024/browser-result.json` |
| Responsive | 390/768/1440; không tràn ngang | `manual-runtime/g3-20261024/shots/` |

Browser đi từ giảng viên tạo lịch → ứng viên nộp PDF/consent → mail xác minh → ba Agent đặt lịch → mail lịch/credential riêng → đăng nhập/đổi mật khẩu → giảng viên tải CV, xem bằng chứng và modal gửi lại → Admin preview mail đã che bí mật. Đóng modal bằng Escape trả focus đúng nút. Timestamp browser: `2026-10-24T16:52:02.160Z` UTC.

Hai lỗi UI được kiểm riêng: link xác minh mở trong tab đã mount vẫn được xử lý một lần, kể cả StrictMode; nhãn mật khẩu mới truy cập được bằng accessible name đúng. Nhóm nút gửi lại được bọc flex-wrap sau khi xem ảnh mobile để tránh chen chữ. Unit staff kiểm xem câu trích, xác nhận gửi lại, chống bấm đôi và thông báo không thay mật khẩu.

## Đọc đúng bằng chứng

Model là transport deterministic được khai báo, còn Agent graphs, SQL và giao thức SMTP chạy thật. SMTP chỉ tới inbox local, không tới hộp thư ngoài. GET hồ sơ trước xác minh trả 401 là ca có chủ đích. Không dùng dữ liệu giả để trình bày như kết quả provider thật và không dùng tài khoản trắng để test.

Nguồn BE độc lập: unit **100 suite/768 test**, SQL hồi quy chung **34 suite/318 test**, SQL G3 **19 test**, migration **2 test**, business Agent/quyền **10 test**. Không cộng các nhóm này thành một lần chạy duy nhất. [Báo cáo BE](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/codex/g3-cv-scheduling/docs/reports/g3-completion-20261024.md) ghi giới hạn và dữ liệu được giữ.

Mốc 15 phút/cổng bắt đầu thuộc G4; GitHub thuộc G5; nộp trễ/thay người thuộc G6; bàn giao tổng hợp và CI đúng cặp SHA thuộc G7. Kết quả CI remote phải đọc từ check của commit, không suy ra từ kiểm thử local.

CI lần đầu qua kiểm chất lượng FE nhưng full-stack gặp assertion inventory cũ `7` ở `mini-project-library-live.mjs` (API thực trả `10`). Đã cập nhật thành `10` và bổ sung đối chiếu chính xác cả bảy Agent cũ lẫn ba Agent G3; giữ nguyên các kiểm tra run metadata và chống rò dữ liệu. Gate được chạy lại trên commit sửa này; chỉ kết quả remote mới xác nhận trạng thái cuối.
