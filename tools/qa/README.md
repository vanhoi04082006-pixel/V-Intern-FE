# Local visual QA harness

Bộ công cụ kiểm tra giao diện cục bộ cho toàn bộ lộ trình redesign "Sổ tay
hành trình". Công cụ **không thay đổi hành vi ứng dụng**: mọi request
`/api/v1/**` được Playwright đánh chặn và trả fixture theo đúng contract mà
các parser trong `src/lib/api/*` đã kiểm chứng — gate `sql2019` trên CI vẫn
là thẩm quyền cho hành vi thật với backend.

## Thành phần

| File | Chức năng |
|---|---|
| `fixtures.mjs` | Fixture theo contract cho các surface intern (workspace, work, sprint, mentor, github, participation, outcomes). `resolveApi(method, path, search)` trả payload hoặc `null` khi chưa có. |
| `visual-check.mjs` | Boot `next dev`, chặn API, duyệt từng route ở 390/768/1024/1280/1440 (light/dark), chụp ảnh, đo tràn ngang, bắt lỗi console/network và fixture thiếu. |
| `a11y-check.mjs` | Chạy axe-core (đã có trong node_modules) trên từng route ở 390px + 1440px, light + dark; chỉ báo vi phạm serious/critical (kể cả color-contrast). |
| `keyboard-check.mjs` | Khói thử bàn phím: tab stop đầu là skip-link, mọi tab stop có focus-visible, Escape đóng drawer mobile. |
| `inspect-page.mjs` | Debug nhanh một route: liệt kê `[role=alert]` và heading để tìm error state ẩn. |

## Chạy

```bash
# Dev server warm (tách riêng, giữ chạy xuyên suát)
NEXT_PUBLIC_API_BASE_URL=http://qa-be.internal/api/v1 npm run dev -- -p 3016

node tools/qa/visual-check.mjs --pack intern-work --base-url http://localhost:3016
node tools/qa/a11y-check.mjs     --pack intern-work --base-url http://localhost:3016
node tools/qa/keyboard-check.mjs http://localhost:3016 /intern/work
```

Pack khả dụng: `intern-work`, `intern-results`. Ảnh và report ghi vào `.qa/`
(đã gitignore).

`visual-check` tự khởi động Next nếu không truyền `--base-url`. Trên Windows,
harness gọi thẳng binary `next` bằng node (không spawn `npm.cmd`), và dọn cả
process tree khi kết thúc — không để dev server giữ cổng.

Trước khi đo/chụp, mỗi trang được cuộn hết một lượt (cuộn tức thời, vì
`globals.css` đặt `scroll-behavior: smooth`) để ảnh lazy tải và các khối
`FadeIn`/`whileInView` hiện ra; sau đó mới đo tràn ngang và chụp full-page.
Report tách riêng `brokenImages` (lỗi thật) và `abortedRequests` (request bị
trang tự hủy, ví dụ prefetch RSC khi redirect).

## Quy ước

- Fixture mới phải kèm assertion trong
  `src/lib/api/__tests__/qa-fixtures-shape.test.ts` để lock contract với
  parser thật — fixture sai shape sẽ render error state im lặng và làm lãng
  nguyên chu kỳ QA nếu không có test chặn sớm.
- Ảnh chụp là bằng chứng review, không commit raw QA data lên repository.
