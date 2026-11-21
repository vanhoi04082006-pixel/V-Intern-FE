# Bản vá dependency khi nghiệm thu production — 17/11/2026

`next build` với Next.js 16.4.2 bị chặn bởi kiểm tra bảo mật. Audit npm xác nhận [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h): rò rỉ thông tin giữa root params khi gọi một hàm `use cache` qua `unstable_cache()`. Không tìm thấy hai cách gọi này trong `src` hoặc `next.config.ts`; đây là bằng chứng phiên bản bị ảnh hưởng, không phải bằng chứng dữ liệu ứng dụng đã bị lộ.

Nâng Next.js và `eslint-config-next` từ 16.4.2 lên bản vá 16.4.6. Cập nhật dependency `typescript-eslint` trong dải semver hiện hữu lên 8.73.0 và các dependency đi kèm để loại bỏ bảy cảnh báo moderate của chuỗi công cụ lint. Không đổi ngưỡng audit hoặc bỏ qua kiểm tra bảo mật.

Đã xác minh tại workspace: production build thành công, 126 tệp/719 kiểm thử frontend, lint, typecheck và 25 kiểm thử hợp đồng đều đạt; audit npm cho cả production và toàn bộ dependency đều có 0 cảnh báo. Runtime QA dùng `next start` trên loopback cổng 3001, API/SQL riêng và provider AI/GitHub tổng hợp. Nghiệm thu ba vai trò vẫn tiếp tục; các kết quả giả lập không thay thế bằng chứng provider hoặc trusted runner thật.
