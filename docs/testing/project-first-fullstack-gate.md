# Gate full-stack theo phiên bản hợp đồng

Gate local của thay đổi hiện tại phải dùng FE và BE từ cùng bộ thay đổi: library → tuyển dụng chat10lượt → eligible assignment → Start → AI draft → publish → own tasks/submissions → teacher approval. Xem docs/TESTING.md và README hiện hành.

Workflow `.github/workflows/phase7-fullstack.yml` ghim COMPATIBLE_BE_SHA=cf5890cfd885c9ea5b2c9dc3585c0231c20dd538 của BE đã review/push. Khi thay hợp đồng, commit/push BE trước, cập nhật pin bằng đúng SHA tương thích rồi chạy lại toàn gate; không dùng main/latest thay commit cố định. CI hiện giữ cả kiểm tra SQL2019 native, browser, ownership, publish/idempotency và các luồng kết quả cũ.

14 kịch bản nghiệp vụ hiện là 14 bước riêng, đánh số 01–14 và giữ nguyên thứ tự phụ thuộc. Bước 06 kiểm tra thư viện/đội hình/AI draft/publish; bước 07 kiểm tra đánh giá/chấm bài/báo cáo của giảng viên. Khi lỗi, mở đúng bước đỏ để đọc assertion và artifact tương ứng; không suy ra mọi lần đỏ cùng nhóm đều cùng một nguyên nhân. Không dùng continue-on-error để bỏ qua lỗi; thu thập log và cleanup vẫn chạy khi thất bại.

Harness không trả evaluation làm fallback cho feature khác. Next/clarify/follow-up có schema riêng, evaluator đủ sáu chiều; fixture gửi đáp án theo câu hiện tại và chặn trạng thái chưa ready. Node contract tests kiểm tra follow-up và missing evidence. Browser dùng nhãn Email hiện hành, chờ câu hỏi tự xuất hiện rồi hoàn thành10câu. Deadline/countdown dùng thời gian server; refresh giữ transcript và quyền truy cập.

Workflow chỉ dùng contents:read và persist-credentials:false theo [checkout](https://github.com/actions/checkout) và [permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions). Deploy key đọc BE đã có phục vụ hai repo private; credential AI/GitHub ứng dụng không nạp vào job. Audit production chặn high/critical; [finding dev/upstream chưa vá](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/DEPENDENCIES.md) được review riêng.

Test chỉ override AI và ranh giới HTTP GitHub trong môi trường test/database dùng một lần. GitHub fixture chỉ đọc, từ chối credential thật và mutation; không truy cập GitHub thật hoặc giả lập execution pass. AI review phải inconclusive, sinh viên không chuyển thẳng review/done, duyệt thông thường bị chặn và giảng viên chấm thủ công phải có lý do được audit. Auth, snapshot SHA, scope và quyết định qua service thật. Phải dùng đúng feature/schema, không trả scoring cho mọi lời gọi. Không giảm migration count hoặc giữ assertion8câu khi start hiện dùng10câu tuần tự. Migrate registry hiện hành và kiểm tra pending=false, sanitized prompt policy, ownership, version/conflict và trạng thái backend.

Unit tests, SQL E2E, browser thật và provider/OAuth/runner thật là bốn mức bằng chứng khác nhau. Ghi riêng từng mức và limitation; các báo cáo phase cũ ở docs/archive chỉ dùng truy vết.
