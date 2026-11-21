/**
 * CỔNG CHẾ ĐỘ PREVIEW — nguồn sự thật duy nhất cho việc bật/tắt Preview.
 *
 * Preview (mock API, tài khoản demo, chuyển kịch bản) CHỈ bật khi CẢ HAI:
 * 1. Build-time flag `NEXT_PUBLIC_PREVIEW=1` được đặt lúc build/dev.
 * 2. `NODE_ENV !== "production"` — mọi `next build` luôn đặt NODE_ENV=production.
 *
 * Nhờ đó:
 * - Không URL parameter, localStorage hay client-side flag nào bật được Preview
 *   ở production (yêu cầu Section 10.2 master brief).
 * - Trong production build, biểu thức này gập thành `false` ngay lúc compile →
 *   các nhánh import động mock bị dead-code elimination, module mock KHÔNG
 *   lọt vào bundle. Bằng chứng: `scripts/verify-preview-isolation.mjs` dò
 *   chuỗi marker `"VINTERN-PREVIEW-MARKER"` trong `.next` sau `next build`.
 *
 * Preview deployment có kiểm soát = chạy `next dev` (hoặc build dev-server)
 * với `.env.preview`; xem docs/PREVIEW.md.
 */
export const PREVIEW_ENABLED =
  process.env.NEXT_PUBLIC_PREVIEW === "1" &&
  process.env.NODE_ENV !== "production";
