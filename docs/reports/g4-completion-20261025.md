# G4 — Phòng chờ và lịch phỏng vấn lại

Ngày kiểm **25/10/2026 (UTC+7)**. Đã thêm phòng chờ cho hồ sơ CV, clock dựa serverNow, trạng thái quá 15 phút, đường tiếp tục phiên, hướng dẫn hẹn lại và modal giảng viên chọn lịch/lý do. [Hướng dẫn sử dụng và bản đồ code](../SCHEDULED-INTERVIEWS.md).

| Kiểm | Kết quả | Nguồn dưới workspace |
|---|---|---|
| FE unit | 98 file / 605 test qua | `.runtime/g4-fe-unit-final.log` |
| Typecheck/lint/build | Qua | `.runtime/g4-fe-typecheck-final.log`, `g4-fe-lint-final.log`, `g4-fe-build-final.log` |
| Browser G3/G4 | 11 luồng qua, 0 page error | `.runtime/g4-browser-verified.log`, `manual-runtime/g4-20261025/browser-result.json` |
| Responsive | 390/768/1440; không tràn ngang | `manual-runtime/g4-20261025/shots/` |

Browser đi hết CV/mail/đổi mật khẩu G3, sau đó vào phòng chờ → bắt đầu T+14:59 → tiếp tục sau T+15 → hết hạn phiên → giảng viên hẹn lại có lý do → no-show lịch mới → chuyển khỏi capability cũ. Clock fixture có khai báo; SQL và graph thật, model deterministic, SMTP local.

Các kiểm âm gồm: không tự chọn nghề cho hồ sơ CV, không dùng lịch cũ để tạo lượt sau khi phiên hết hạn, không gửi đôi lệnh hẹn lại, giới hạn nghề trong dropdown và dùng giờ server thay vì Date.now của máy khách để lọc lịch. Modal trả phản hồi và đưa focus tới thông báo sau thành công.

BE đối chiếu độc lập: 101 suite/775 unit, SQL cũ 34 suite/318 test, SQL G3/G4 33 test, migration G4 2 test. Không cộng chúng thành một bộ chạy duy nhất. Native hai DB giữ identity/lịch sử; API 8080/8081 và FE 3001 hoạt động sau migration.

Khôi phục credential tạm hết hạn cho đợt mới là Q05/G7; thao tác hẹn lại không reset mật khẩu. G5–G7 và CI remote phải có kết quả riêng. Manifest đi kèm ghi commit code và hash log để tra nguồn.
