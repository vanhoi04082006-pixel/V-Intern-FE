# Gate full-stack theo phiên bản hợp đồng

Gate local của thay đổi hiện tại phải dùng FE và BE từ cùng bộ thay đổi: library → tuyển dụng chat10lượt → eligible assignment → Start → AI draft → publish → own tasks/submissions → teacher approval. Xem docs/TESTING.md và README hiện hành.

Workflow project-first-fullstack.yml hiện ghim COMPATIBLE_BE_SHA cho baseline đã review trước đây. Pin này là quyết định reproducibility, không chứng minh feature GitHub/chat mới đã được kiểm tra. Khi phát hành hai repo, commit/push BE đã review trước, cập nhật pin FE bằng đúng SHA tương thích và chạy lại toàn gate; không dùng main/latest thay commit cố định.

Test chỉ override AI trong môi trường test và database dùng một lần. Phải dùng đúng feature/schema, không trả scoring cho mọi lời gọi. Không giảm migration count hoặc giữ assertion8câu khi start hiện dùng10câu tuần tự. Migrate registry hiện hành và kiểm tra pending=false, sanitized prompt policy, ownership, version/conflict và trạng thái backend.

Unit tests, SQL E2E, browser thật và provider/OAuth/runner thật là bốn mức bằng chứng khác nhau. Ghi riêng từng mức và limitation; các báo cáo phase cũ ở docs/archive chỉ dùng truy vết.
