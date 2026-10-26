# Gate full-stack theo phiên bản hợp đồng

Cặp hiện hành ghim BE **`254cabd8e5097d86bc6971f03419944b40b2f592`**, đã push trên PR BE #12. Product source không đổi so với `91a9175`; thay đổi mới nằm trong fixture `business-agent.e2e-spec.ts`: provider giả lập vẫn ghi event vào SQL, nhưng không xuất trace sang tài khoản LangSmith thật được nạp từ `.env` của người chạy. Không đổi runtime tracing, assertion hoặc timeout 5 giây.

| Phần kiểm | Source và kết quả |
|---|---|
| BE product | Code `91a9175`, 114 suites / 859 unit tests; schema CV, mentor authority, module collector và tool budget đã kiểm |
| BE SQL contract | Fixture `254cabd`, 3 suites / **31 tests đạt local**, 78 event SQL và 0 lượt xuất trace fixture. Dùng DB mới, file nằm trong dự án; giữ các lần timeout trước làm lịch sử |
| FE UI | Code `603ee3f`, 109 file / **660 tests**, lint/typecheck/build local đạt; Thông báo ba vai và nền chung có bằng chứng riêng |
| CI của nền UI trước | FE `8932bef` / BE `91a9175`: [quality](https://github.com/vanhoi04082006-pixel/V-Intern-FE/actions/runs/40262952070) và [full-stack](https://github.com/vanhoi04082006-pixel/V-Intern-FE/actions/runs/40262952079) đã xanh |
| CI sau pin mới | Chạy lại toàn bộ gate cho commit mang pin `254cabd`; xem checks của PR FE #23. Không gán receipt cũ cho source mới |

FE giữ kiểm thử gửi lại mail uncertain và kiểm tra hết hạn tương đối. Bước 07 đọc/chờ lượt chấm tự động kết thúc, vẫn khẳng định `inconclusive` và đúng SHA trước khi thử duyệt thông thường/thủ công; không POST chấm trùng khi lease đang chạy. Ngân sách và giới hạn source, credential filtering, ownership, RBAC, Docker runner và audit quyết định giảng viên được giữ nguyên.

Nghiệm thu Gemini/LangSmith/Gmail/GitHub/Docker thật đọc ở [checkpoint dịch vụ](../ACCEPTANCE-CHECKPOINT-20261026.md). Provider giả lập trong gate SQL hoặc full-stack không được ghi thành provider ngoài thật. [Report UI](../design/NOTIFICATIONS-20261026.md) ghi đúng phạm vi click và responsive, không thay thế toàn bộ 78 route.

Cặp K03: BE `bf3118693c782c145a87d4348212344396ce3526`, UI `17f4370` và bài `scripts/knowledge-library-live.mjs`. Bài knowledge chạy riêng sau career catalog và trước bước 09; không thay thế 14 bước đã có. Kiểm DB thật và zero-mutation import; [nguồn nghiệm thu](../reports/knowledge-library-20261024.md).

Gate local của thay đổi hiện tại phải dùng FE và BE từ cùng bộ thay đổi: library → tuyển dụng chat10lượt → eligible assignment → Start → AI draft → publish → own tasks/submissions → teacher approval. Xem docs/TESTING.md và README hiện hành.

Workflow `.github/workflows/phase7-fullstack.yml` ghim COMPATIBLE_BE_SHA bằng đúng SHA của BE đã review/push (SHA hiện hành được ghi trong root manual-runtime/ci-verification.json; khi thay hợp đồng BE, cập nhật pin và chạy lại toàn gate). Khi thay hợp đồng: commit/push BE trước, cập nhật pin bằng đúng SHA tương thích rồi chạy lại toàn gate; không dùng main/latest thay commit cố định. CI hiện giữ cả kiểm tra SQL2019 native, browser, ownership, publish/idempotency và các luồng kết quả cũ.

14 kịch bản nghiệp vụ hiện là 14 bước riêng, đánh số 01–14 và giữ nguyên thứ tự phụ thuộc. Bước 06 kiểm tra thư viện/đội hình/AI draft/publish; bước 07 kiểm tra đánh giá/chấm bài/báo cáo của giảng viên. Khi lỗi, mở đúng bước đỏ để đọc assertion và artifact tương ứng; không suy ra mọi lần đỏ cùng nhóm đều cùng một nguyên nhân. Không dùng continue-on-error để bỏ qua lỗi; thu thập log và cleanup vẫn chạy khi thất bại.

Harness không trả evaluation làm fallback cho feature khác. Next/clarify/follow-up có schema riêng, evaluator đủ sáu chiều; fixture gửi đáp án theo câu hiện tại và chặn trạng thái chưa ready. Node contract tests kiểm tra follow-up và missing evidence. Browser dùng nhãn Email hiện hành, chờ câu hỏi tự xuất hiện rồi hoàn thành10câu. Deadline/countdown dùng thời gian server; refresh giữ transcript và quyền truy cập.

Workflow chỉ dùng contents:read và persist-credentials:false theo [checkout](https://github.com/actions/checkout) và [permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions). Deploy key đọc BE đã có phục vụ hai repo private; credential AI/GitHub ứng dụng không nạp vào job. Audit production chặn high/critical; [finding dev/upstream chưa vá](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/DEPENDENCIES.md) được review riêng.

Test chỉ override AI và ranh giới HTTP GitHub trong môi trường test/database dùng một lần. GitHub fixture chỉ đọc, từ chối credential thật và mutation; không truy cập GitHub thật hoặc giả lập execution pass. AI review phải inconclusive, sinh viên không chuyển thẳng review/done, duyệt thông thường bị chặn và giảng viên chấm thủ công phải có lý do được audit. Auth, snapshot SHA, scope và quyết định qua service thật. Phải dùng đúng feature/schema, không trả scoring cho mọi lời gọi. Không giảm migration count hoặc giữ assertion8câu khi start hiện dùng10câu tuần tự. Migrate registry hiện hành và kiểm tra pending=false, sanitized prompt policy, ownership, version/conflict và trạng thái backend.

Unit tests, SQL E2E, browser thật và provider/OAuth/runner thật là bốn mức bằng chứng khác nhau. Ghi riêng từng mức và limitation; các báo cáo phase cũ ở docs/archive chỉ dùng truy vết.
