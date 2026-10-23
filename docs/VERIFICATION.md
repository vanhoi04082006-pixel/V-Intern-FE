# Kiểm chứng Frontend — 23/10/2026

Bản này là mốc hiện hành cho giao diện Aurora Glass của **Sinh viên và Giảng viên**. Trang chủ và Admin giữ phạm vi thiết kế trước đó. Không dùng tổng số test ở checkpoint cũ để mô tả bản hiện tại.

| Hạng mục | Kết quả | Log hoặc dữ liệu |
|---|---|---|
| Vitest | **82 file / 541 test đạt** | fe-unit-final-v2.log |
| ESLint | Đạt, không lỗi/cảnh báo lint | fe-lint-final-v2.log |
| TypeScript | Đạt | fe-typecheck-final-v2.log |
| Next build | Đạt | fe-build-final-v2.log |
| Responsive | 1440, 1280, 1024, 768, 390px | browser-final.json, screens/ |
| Các tương tác shell/modal | Kết quả từng thao tác được ghi riêng | browser.json, browser-final.json |
| Luồng có dữ liệu thật | Đánh giá, nguồn KPI, ledger, chứng nhận, hiệu suất, AI và thông báo sau kết thúc | outcomes-live.json, browser-final.json |

Kiểm thử mới giữ quyền đọc khuyến nghị sau assignment hoàn thành, chặn người chưa từng được phân công, giữ khóa công việc/Mentor và thay CTA sau kết thúc bằng liên kết đánh giá. Test tái hiện lỗi trước khi sửa nằm ở historical-recommendations-red.log và performance-next-step-red.log; kết quả sau sửa ở historical-outcomes-green.log.

Vitest có thông báo jsdom không triển khai điều hướng trang trong một số test bấm liên kết; toàn bộ assertion vẫn đạt. Không đồng nhất thông báo môi trường test này với lỗi console của browser thật. Browser được kiểm riêng bằng dữ liệu runtime.

## Hiểu đúng phạm vi nghiệm thu

Luồng thực hành dùng tài khoản QA riêng trên API 8081, database VIntern_Test_Learning_20261014 và FE 3004. FE chính 3001/API 8080 dùng VIntern_M2_BROWSER. Không reset/seed dữ liệu chính hoặc ba tài khoản gốc. Bài nộp là sản phẩm tổng hợp phục vụ kiểm thử, không phải bài đánh giá của một sinh viên thật.

Đã thực hiện GitHub OAuth, tạo repository dưới tài khoản chung của Admin, sinh viên khác danh tính commit/PR, Docker chạy test có chữ ký, Gemini phân tích, giảng viên trả sửa/duyệt. Kết quả cuối: 4/4 nhiệm vụ, đánh giá **85,5**, KPI **95,7**, số dư **9.570.000 đồng ảo**, chứng nhận xác minh hợp lệ, PDF/Excel tải và đọc được. Sau kết thúc phiên, sinh viên vẫn xem kết quả và khuyến nghị AI.

Xem [báo cáo nhập vai](ROLEPLAY-ACCEPTANCE.md) để đọc từng bước, lỗi tìm được, cách sửa và giới hạn. [Bàn giao](HANDOVER.md) hướng dẫn sử dụng và đọc code. [Git workflow](GIT-WORKFLOW.md) ghi các nhánh đã đối chiếu và SHA phục hồi.

## Nguồn và mốc thời gian

Tất cả tên tệp bằng chứng trong trang này tính từ **workspace/manual-runtime/aurora-handoff-20261022/**. Thư mục giữ ngày bắt đầu 22/10; kiểm tra cuối thực hiện ngày **23/10/2026, UTC+7**. Trường checkedAt trong JSON dùng UTC. final-manifest.json ghi thời điểm, source hash cả tệp chưa commit, branch/HEAD và trạng thái runtime; log ngày trước không được diễn giải thành lần chạy mới.

Tại mốc chạy các kiểm tra bên trên, thay đổi còn nằm trong working tree. Source và tài liệu được commit/công bố trên nhánh feature ngày 23/10; xem GIT-WORKFLOW. Chưa merge vào main. Đã dọn 5 tên nhánh local có commit nằm trong HEAD bằng branch -d; giữ nhánh đang làm, main, archive và nhánh có patch tương đương để bảo toàn lịch sử. Bốn PR đã merge là trong repository bài thực hành QA.

## Giới hạn còn được ghi nhận

- Webhook repository QA chưa có endpoint public được cấu hình: chưa kiểm delivery live. Live PR/SHA dùng GitHub API; E2E kiểm hợp đồng webhook riêng.
- Bộ test xuất JSON kiểm preview và version, chưa đối chiếu byte của file tải xuống từ browser.
- Ma trận responsive không thay audit WCAG hoặc Core Web Vitals đầy đủ; kết quả AI của một bài không chứng minh độ chính xác chấm mọi bài.
- Production không nằm trong yêu cầu hiện tại.

[Bằng chứng trước đợt này, giữ nguyên mốc lịch sử](archive/verification-before-aurora-20261023.md).


## Bản vá bảo mật khi công bố GitHub — 23/10/2026

CI ban đầu chặn Next.js 16.3.8 bởi advisory critical. Đã nâng riêng Next và eslint-config-next lên **16.4.2**, giữ React và các ngưỡng CI hiện hữu. Local sau nâng cấp: lint, 82 file/541 test, typecheck và build đạt; audit production không còn finding. Log mới nằm trong workspace/manual-runtime/publish-20261023. Các số liệu browser/nhập vai ở trên là mốc trước nâng dependency, không được gọi là đã chạy lại toàn bộ với Next mới.

Full-stack CI ghim Backend tại commit `3989138d2e8b479b00b4a39f275ad8ee858b7911`, chính là source đã đạt 625 unit/237 SQL E2E trên [CI Backend](https://github.com/vanhoi04082006-pixel/V-Intern-BE/actions/runs/39879926943). Giữ đủ các bước nghiệp vụ và test hợp đồng; không chạy theo một nhánh BE thay đổi liên tục. Kết quả CI của bản vá xem [PR Frontend](https://github.com/vanhoi04082006-pixel/V-Intern-FE/pull/15).
