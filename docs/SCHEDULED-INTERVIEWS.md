# Dùng phòng chờ và lịch phỏng vấn lại

Sinh viên đi từ cổng CV không cần tự chọn nghề. Backend cung cấp nghề và lịch; giao diện bước vị trí chuyển thành phòng chờ. Tài khoản lịch sử chưa liên kết CV giữ giao diện trước đây để các luồng/tài khoản được bảo vệ vẫn dùng được.

## Sinh viên

| Trạng thái | Bạn làm gì? |
|---|---|
| Chưa đến giờ | Đọc nghề, múi giờ và hạn bắt đầu; chờ hoặc Cập nhật lịch |
| Đã đến giờ, chưa quá 15 phút | Bắt đầu phỏng vấn; một lần bắt đầu tiêu thụ một lượt |
| Đã có phiên đang làm | Tiếp tục cùng phiên, kể cả sau mốc vào phòng 15 phút |
| Phiên hết hạn | Xem lịch tiếp theo và liên hệ giảng viên; không tạo lượt mới bằng lịch cũ |
| Chưa bắt đầu tại T+15:00 | Hồ sơ chờ đợt sau; số lượt không bị reset hoặc trừ thêm |

Ví dụ lịch 09:00: 09:14:59 còn được bắt đầu; 09:15:00 chưa vào thì no-show. Một phiên đã bắt đầu được tiếp tục theo hạn bài làm riêng. Đồng hồ đếm trên UI giúp theo dõi; máy chủ mới xác nhận quyền start.

Nếu cần đợt khác, vào `/apply` và chọn **Nộp hồ sơ đợt khác**. Hệ thống thu hồi phiên theo dõi cũ, mở form nộp mới, giữ CV/tài khoản/lượt và lịch sử. Chọn đợt mới đang nhận hồ sơ. Việc này không tạo tài khoản trắng hoặc đặt lại mật khẩu.

## Giảng viên

Trong chi tiết hồ sơ, xem số lượt đã dùng/còn lại rồi chọn **Hẹn phỏng vấn lại**. Chọn khung giờ đang mở và nhập lý do. UI chỉ đề nghị nghề hiện tại hoặc nghề được đề xuất từ kết quả; Backend kiểm lại quyền, slot, sức chứa, cooldown và trạng thái phiên.

No-show cần xác nhận ngoại lệ có lý do; hồ sơ đã hủy riêng không được khôi phục bằng hẹn lại. Một phiên/đánh giá còn chạy không được chen ngang bằng lịch mới. Sau xác nhận, màn hình làm mới, thông báo rõ không đặt lại mật khẩu/số lượt và đưa focus tới phản hồi. Lịch cũ vẫn có trong timeline/ledger.

Điểm dưới 50 chưa đạt; 50–70 gồm hai đầu là định hướng nghề khác; trên 70 đạt theo cơ chế chấm hiện hành. Đề xuất nghề có bằng chứng từ câu trả lời được giữ ở kết quả, không phải một lựa chọn tự do để né giới hạn ba lượt.

## Bản đồ code FE

| File | Trách nhiệm |
|---|---|
| `lib/api/recruitment.ts` | Parse phần lịch thêm vào profile; response cũ vẫn đọc được |
| `onboarding/scheduled-interview.tsx` | Phòng chờ, clock dựa serverNow, deadline và CTA có trạng thái |
| `role-selection-step.tsx`, `interview-step.tsx` | Chọn trải nghiệm CV hoặc đường lịch sử theo dữ liệu API |
| `recruitment-provider.tsx` | Cho xem lịch riêng cả sau kết quả, giữ guard và phiên hiện tại |
| `conversation-interview.tsx` | Phiên đã hết hạn chuyển tới lịch mới; CV không tự tạo lượt khác |
| `applications/interview-rebooking.tsx` | Modal riêng cho giảng viên, lọc slot, lý do, chống gửi đôi và phản hồi |
| `applications/public-application.tsx` | Chuyển khỏi capability cũ khi nộp đợt khác |

Không lấy giờ máy client để trao quyền hoặc gọi PATCH role cho sinh viên có lịch. Bộ lọc lịch của giảng viên cũng dùng `interviewPolicy.serverNow`, nên lệch giờ máy không làm mất các khung giờ hợp lệ. API vẫn kiểm chứng lần cuối khi gửi.

Thời gian chờ không phát aria-live mỗi giây; thông báo trạng thái tách khỏi số đếm. Nút disabled có lý do, modal hỗ trợ Escape/focus, thông tin quan trọng hiển thị bằng heading/divider thay vì lồng card.

Đọc domain, transaction và phục hồi tại [hướng dẫn BE](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/codex/g4-scheduled-interviews/docs/SCHEDULED-INTERVIEWS.md). Các bằng chứng G4 dùng model deterministic và clock QA có khai báo, không phải giờ thực của một buổi phỏng vấn ngoài hệ thống.
