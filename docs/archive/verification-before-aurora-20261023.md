# Kiểm chứng giao diện sinh viên — 22/10/2026

Lượt trau chuốt riêng sinh viên mới nhất đạt **81 file / 539 test**, lint/typecheck/build đạt. Browser: **15 route / 17 trạng thái / 85 lượt kiểm tra** ở 1440/1280/1024/768/390px. Nguồn: `manual-runtime/tab-polish-20261022/` tại workspace; [báo cáo, ảnh và giới hạn nghiệm thu](../../tasks/tab-polish-20261022.md). Tài khoản/dữ liệu chính được giữ nguyên. Một đợt timeout SQL runtime trong kiểm tra sơ bộ được ghi riêng, không gộp thành kiểm tra browser đạt; ma trận cuối chạy sau khi dịch vụ khôi phục. Phần giảng viên vừa bắt đầu được để riêng cho lượt sau theo yêu cầu người dùng.

## Kiểm chứng workspace — 21–22/10/2026

FE **80 file / 534 test đạt**, lint/typecheck/build đạt. Sau sửa cuối empty state báo cáo, 2 test liên quan và toàn bộ gate lint/typecheck/build tiếp tục đạt. Nguồn tại workspace `manual-runtime/workspace-visual-polish-20261021/`: `fe-polish-tests.log`, `reports-final.log`, `fe-final-gates.log`.

Kiểm tra browser cuối có **31 route × 5 viewport = 155 lượt kiểm tra**, thêm các trạng thái list/Kanban/dialog; 5 tương tác validation, chọn biểu đồ, drawer/modal Escape và CTA báo cáo đạt. Không có document tràn ngang, alert lỗi hoặc loading còn sót trong ma trận cuối. Viewport: 1440/1280/1024/768/390px. Không tạo evaluation/KPI/certificate/sharing mới trên DB chính chỉ để chụp ảnh; các trạng thái chi tiết chưa có record local chưa được coi là browser acceptance.

Xem [báo cáo và danh sách file](../../tasks/workspace-visual-polish-20261021.md), [design system](workspace-design-system.md), [kiểm chứng BE và phỏng vấn](../../V-INTERN-BE/docs/VERIFICATION.md). Chưa push/merge; remote CI và production ngoài phạm vi. Các mục bên dưới giữ nguyên như **lịch sử**, không dùng số test cũ thay cho lần hiện tại.

## Tài khoản repository chung của Admin — local 19/10/2026

Frontend 71 file/504 test đạt, 0 lỗi/0 bỏ qua; typecheck, lint và build đạt tại `b7a7266`. Nguồn: `manual-runtime/private/central-repo-fe-unit-20261019.json` cùng các log `central-repo-fe-*` trong workspace gốc. Hai regression mới kiểm tra chọn tài khoản chung, tải lại trạng thái và lỗi API; giữ nguyên kiểm thử Kanban/Sprint.

Người dùng đã thay tài khoản và tự hoàn tất OAuth cho `hbuivanhoi6-stack`; trang Admin xác nhận tài khoản chung sẵn sàng. Repo public ID `1425170948` đã được tạo thật cho phiên hiện tại, trang GitHub hiển thị đúng owner/README/marker; sinh viên thấy cùng URL. Lời mời sinh viên đã được GitHub nhận, chưa xác nhận chấp nhận; giảng viên chưa liên kết danh tính nên `not_connected`. Nguồn: `manual-runtime/central-repository-live-20261019.json` lúc 05:53:53 UTC. Ảnh: `central-repository-admin-ready-20261019.png`, `central-repository-github-ready-20261019.png`. Ảnh chưa kết nối/consent trước đó là lịch sử. Webhook repo mới chưa cấu hình vì public tunnel đang tắt; không tuyên bố đã nghiệm thu PR webhook/chấm bài trên repo mới.

Gate SQL độc lập đạt 25 suite/237 test, 0 lỗi/0 bỏ qua, tại source BE `824be89`, kết thúc 05:30:34 UTC ngày 19/10. Readiness 05:31:10 UTC xác nhận FE3001/API8080/API8081 trả 200 và ba tài khoản gốc đăng nhập đúng identity/vai trò. Báo cáo tổng hợp: `manual-runtime/central-repository-verification-20261019.json`. Các số 502/497/495 bên dưới là checkpoint lịch sử trước bản này; production và remote CI ngoài phạm vi local hiện tại.

# Kiểm chứng frontend — local 19/10/2026

Đợt bổ sung kéo thả Kanban: **71 file/502 test đạt, 0 thất bại, 0 bỏ qua**; 9 test tập trung Kanban đạt. Nguồn `manual-runtime/private/kanban-dnd-unit-20261019.json` và log `kanban-dnd-green-20261019.log`. Build, typecheck, lint và diff check đạt; local FE3001 và API8080/8081 trả200. Bằng chứng tổng hợp: `manual-runtime/kanban-dnd-verification-20261019.json`.

Cả Công việc của tôi và Sprint Board nối kéo thả vào API sinh viên, tải lại trạng thái/version trước khi lưu và chỉ chuyển thẻ khi lưu thành công. Chặn gửi lặp trong lúc lưu; lỗi giữ nguyên thẻ và thông báo. Thả Doing sang Review mở chi tiết nộp bài, không vượt kiểm tra code submission; sinh viên không tự Done hoặc đi ngược. Nút/liên kết chi tiết giữ đường thao tác bàn phím/điện thoại. Bộ kéo thả dùng chung giữ metadata từ dragstart vì trình duyệt không cho đọc payload trong dragover, nhưng kiểm tra lại payload và transition tại drop.

Lần full đầu501/502 có một lookup trạng thái Waiting hết thời gian trong khi chạy đồng thời các gate; giữ nguyên source/assertion/timeout, chạy lại full riêng đạt502/502. JSON/log lần đầu được giữ với hậu tố `unit-first-20261019`. Trình duyệt tích hợp không gắn được webview nên chưa nghiệm thu kéo chuột trực tiếp; không reset hoặc đổi trạng thái task người dùng để kiểm thử. Backend không đổi. Số497 bên dưới là mốc kích hoạt Sprint trước khi thêm5regression kéo thả.

Vitest 71 file/497 test đạt, không có test thất bại hoặc bỏ qua. Nguồn: `manual-runtime/private/sprint-activation-unit-20261019.json` trong workspace; log cùng tên `.log`. Thêm hai regression cho kích hoạt Sprint từ route chi tiết và giữ trạng thái planned/retry khi API từ chối; kiểm tra người thiếu quyền không thấy nút. Typecheck/build và lint local đạt trong cùng đợt. Bằng chứng API thực tế: `manual-runtime/sprint-activation-verification-20261019.json`.

Sprint do AI publish vẫn là planned cho tới khi giảng viên bắt đầu. Trang chi tiết nay hiển thị trạng thái tiếng Việt, giải thích vì sao sinh viên chưa có Sprint Board và nút Kích hoạt khóa bằng sprints.manage. Dùng API chuyển trạng thái hiện hữu, không tự coi planned là active; giữ ownership, ràng buộc một Sprint active, audit và thông báo. Sau thành công reload metadata/board; lỗi giữ nguyên planned. Phía sinh viên có hướng dẫn và liên kết Công việc của tôi trong thời gian chờ. Sprint được người dùng báo lỗi đã kích hoạt qua tài khoản giảng viên chuẩn; API sinh viên xác nhận đúng Sprint và4task được giao. Không reset dữ liệu.

Đợt kiểm chứng rộng18/10 vẫn giữ nguồn/ngày gốc ở `manual-runtime/local-completion-verification.json`; SQL/backend không thay đổi trong bản sửa giao diện19/10. Mốc frontend18/10 là71file/495test, trước hai regression mới.

Trước khi dọn, chạy lại đúng source đã merge `b80385482f2e15e3ca52495c2c631742cf68b1ad` cho kết quả 70 file/504 test. Xóa 25 file chỉ phục vụ hai workspace Admin/Giảng viên mẫu sau khi phân tích toàn bộ import; route chính vẫn là `AdminOverview`/`InstructorHome` và `ProductShell`. Hai bộ test có 25 ca kiểm tra prototype được thay bằng ba bộ có 16 ca kiểm tra dữ liệu API/zero/loading/error/retry, route theo vai trò, danh tính đăng nhập và bàn phím menu thực tế. Vì vậy tổng mới là 504 − 25 + 16 = 495; không bỏ qua hoặc giảm assertion của các bộ test nghiệp vụ được giữ lại. SQL gate và 20 script-contract tests giữ nguyên yêu cầu.

Đăng nhập ghi Email đúng API; signup gửi request thật/consent, chỉ mở login sau khi backend xác nhận tạo intern. Regression kiểm tra đồng hồ chat lấy thời gian server, giảm đúng từng giây, tự mở câu đầu và không tự lặp khi provider thất bại.

Sprint workspace: route Sprint trực tiếp đọc context board do backend trả (goal, deep-link phiên, tổng overdue toàn sprint gồm item ngoài trang100, loại Done), danh sách nhiệm vụ phân trang kèm phụ thuộc/bài nộp, khu quản lý khóa theo quyền, modal chi tiết nhiệm vụ. Bộ test sprint workspace 3file/24tests đạt; Chrome thật trên FE3004+API8081 chạy9checks, không tràn ngang1440/820/390, console0 — bằng chứng manual-runtime/master-sprint-browser-verification.json và ảnh master-sprint-workspace-*.

Hồi quy gồm PASS chưa assignment, khóa task/Mentor, own outcomes sau placement, chat/follow-up/reload/pending, Kanban refresh, rubric AI sau tải dữ liệu, eligibility/roster removal, blueprint/planner metadata, report filters/snapshot, admin bank/template/policy và signed runner details.

Bổ sung MASTER: Kanban hiển thị Sprint/progress/repository state; danh sách phiên sort ở server và có current Sprint/alerts. Chi tiết phiên gồm role, mục tiêu/đầu ra object, thẻ task/phụ thuộc/bài nộp/SHA/PR/AI/human score, timeline phân trang, hiệu suất và báo cáo nhúng khóa đúng phiên. Parser chặn trạng thái giả và link ngoài HTTPS GitHub. Các kiểm thử mới kiểm tra paging/filter/locked scope và không biến đề xuất AI thành quyết định giảng viên.

Chrome với HTTP/Nest/SQL thật ở1440/820/390px: student waiting/notifications; instructor blueprint/performance/detail/report; admin bank/policy/template/session/report; thêm/gỡ thành viên và lifecycle; worker status; certificate/PDF/public verify; signup→login→onboarding. Không sửa API response. Fixtures tách khỏi tài khoản trắng; chỉ tính pass sau nội dung thật đã render, không tính loading/login như private page.

Artifacts browser lịch sử ở workspace manual-runtime/*-master-browser.json và ảnh cùng prefix; các mốc 15–17/10 giữ nguyên ngày nghiệm thu, không gọi là vừa chạy lại. Các luồng/viewport đã chạy không có page errors/body overflow. Runtime import audit chạy lại 18/10 đo 71 route entries/221 modules, không có mock-data/test/server-business imports hoặc Next business route handlers; bản cũ thiếu `contracts-card` trong danh sách module. [Artifact import hiện hành](../phase7-evidence/final/runtime-import-audit.json). UI kết quả AI không auto Done/merge. Report/certificate hiển thị snapshot thật, không bịa số đo/điểm cho dữ liệu cũ.

Nghiệm thu GitHub thật dùng hai danh tính: sinh viên tạo/sửa PR, runner và Gemini chấm; giảng viên nhập rubric riêng, duyệt90.5 và task Done. Student thấy AI98/runner2/2 cùng quyết định giảng viên, không có form duyệt. Đã sửa TaskSpec bị lặp, tên sprint/ưu tiên, deep-link task chứa SQL GUID viết hoa, mark-read và nhãn AI còn chờ sau human approval; có regression. [Bằng chứng](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/LIVE-GITHUB.md).

BE chạy lại 18/10 đạt 73 suite/574 unit test, schema31. [PR backend2](https://github.com/vanhoi04082006-pixel/V-Intern-BE/pull/2) và [PR frontend14](https://github.com/vanhoi04082006-pixel/V-Intern-FE/pull/14) đã merge ngày18/10. CI sau merge trên FE `b803854` đạt; đây là baseline trước đợt dọn local, không phải remote CI cho commit dọn mới. Full-stack vẫn ghim BE `0469793` có source tree trùng BE main `dfefc6c`, giữ đủ 14 bước nghiệp vụ và provider test riêng. Kết quả local, SQL và readiness mới có thời điểm/nguồn riêng trong báo cáo tổng hợp; production chưa nằm trong phạm vi người dùng yêu cầu hiện tại.

CI task giữ luồng nộp bài thật qua API/UI và SQL: chặn chuyển thẳng review/done, đóng băng SHA, AI fixture thiếu execution phải inconclusive, duyệt thủ công phải có lý do lưu audit. GitHub HTTP được thay bằng transport chỉ đọc trong database test riêng, từ chối credential thật; không có browser interception. Đây là kiểm thử hợp đồng hệ thống, không thay bằng chứng GitHub/Docker/Gemini thực tế ở trên.

[Cách chạy test](TESTING.md) · [Bằng chứng hệ thống](https://github.com/vanhoi04082006-pixel/V-Intern-BE/blob/feature/unified-learning-experience/docs/VERIFICATION.md) · [API](API-CONTRACTS.md).
