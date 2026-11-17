# Chọn giao dịch hoàn đảo và thử lại điều chỉnh

Trong UI Admin, form Hoàn đảo yêu cầu UUID dòng gốc nhưng bảng không có cách chọn dòng đó. Bổ sung nút Hoàn đảo ngay trên các dòng gốc: mở xác nhận với đúng người, giao dịch và số tiền đã chọn, chỉ cần nhập lý do. Dòng bù trừ vẫn do BE tính và BE chặn hoàn đảo trùng; không sửa/xóa dòng gốc. Dòng reversal không có nút hoàn đảo tiếp.

Test còn tái hiện thử lại cùng điều chỉnh sau mất phản hồi tạo requestId mới. Form nay giữ requestId theo payload đã chuẩn hóa: retry nguyên nội dung dùng lại ID; thay payload tạo ID mới; mở form mới sau thành công là thao tác mới. Thêm thông báo khi lý do chỉ có khoảng trắng thay vì bỏ qua im lặng.

RED2 cho row action/idempotency và RED1 cho whitespace reason trước sửa; sau sửa toàn FE130files/741test,lint/typecheck đạt. Build, review và kiểm lại production được ghi tiếp trong nhật ký nghiệm thu. Ảnh trước sửa: `.runtime/product-acceptance-20261116/salary-reversal-needs-hidden-id-before.png`.

Review phát hiện đóng modal khi đang ghi có thể hủy định danh request và callback cũ đóng nhầm form mới. Ca deferred-promise thất bại trước sửa. Form nay khóa trường nhập và khóa đóng bằng nút/Escape/backdrop trong lúc ghi; Modal có prop closeDisabled mặc định false nên các dialog khác giữ hành vi cũ. Hook xử lý lỗi và finally mở lại điều khiển sau khi yêu cầu kết thúc. Toàn bộ regression và production retest chạy lại sau thay đổi này.

Kết quả cuối: 130 files/742 test, lint/typecheck/build đạt; review độc lập chấp thuận. CUA mở đúng dòng Thưởng10000 bằng nút mới; whitespace reason bị chặn. Hoàn đảo hợp lệ tạo reversal−10000, giữ bonus+10000 và KPI+955000, tổng3dòng, balance965000→955000. Hoàn đảo lần2 bị chặn với guidance. Ảnh `salary-reversal-ledger-production.png` và `salary-reversal-duplicate-blocked-production.png` trong workspace evidence. Kiểm retry/pending sử dụng deferred unit tests, không giả nhận đã mô phỏng mất mạng qua trình duyệt.
