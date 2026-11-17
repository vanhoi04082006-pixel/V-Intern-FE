# Chốt KPI sau lượt tính hợp lệ

Lỗi thấy qua UI Admin: tạo/mở kỳ rồi bấm Chốt kỳ khi chưa tính vẫn thành công, khóa kỳ với 0 kết quả. BE b4921b47567c2a7721479c2b984e2d9b9e431632 bổ sung readiness dưới write lock của kỳ. Không chốt trước tính, sau đổi khoảng ngày hoặc sau batch lỗi; đường status finalized dùng cùng finalize; calculating chỉ do engine quản lý. Một batch thành công có 0 người đủ điều kiện vẫn được chốt. Kết quả nháp ngoài phạm vi mới được đối soát trong transaction hoàn tất để không phát hành dữ liệu cũ. Không đổi schema hoặc sửa kỳ đã chốt.

FE giải thích KPI_CALCULATION_REQUIRED và KPI_PERIOD_INVALID_DATES, hướng dẫn tính lại và nói rõ khoảng ngày UTC không bao gồm ngày kết thúc. Workflow full-stack ghim đúng BE trên, giữ mọi regression và runtime/workflow contract tests.

RED: 6/7 ca SQL readiness thất bại trước sửa; review độc lập phát hiện thêm snapshot cũ và ca RED còn 2 kết quả sau lượt tính 0 eligible. Sau sửa: SQL KPI/salary/certificates + readiness 23/23 đạt, BE 113 suites/876 unit test, lint và build đạt; FE 128 files/734 test, lint/typecheck đạt. Production browser retest và build được tiếp tục ghi trong nhật ký nghiệm thu workspace.

Dữ liệu hoàn toàn QA. Kỳ QA-KPI-20261117 đã khóa từ bước tái hiện được giữ nguyên làm bằng chứng, không mở khóa hoặc xóa lịch sử. Ảnh trước sửa: `.runtime/product-acceptance-20261116/kpi-finalized-without-calculation-before.png`.

CUA production sau sửa: tạo QA-KPI-FIX-20261117, mở rồi chốt trước tính bị chặn với hướng dẫn đúng và kỳ vẫn mở. Tính được 1 kết quả, 0 thiếu dữ liệu. Đối chiếu 100×50% + 85×30% + 100×20% = 95,5, sau đó chốt thành công và không còn sửa/tính lại. Ảnh `kpi-finalization-blocked-production.png`, `kpi-components-95-5-production.png`, `kpi-finalized-95-5-production.png`. Sau sửa Modal liên quan: toàn FE 129 files/735 test, lint/typecheck/build đều đạt.
