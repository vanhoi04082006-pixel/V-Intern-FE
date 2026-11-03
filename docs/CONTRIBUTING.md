# Đóng góp

Quy trình này áp dụng cho mọi thay đổi trong `V-Intern FE`. Mục tiêu là giữ `main` luôn chạy được, contract FE ↔ BE không lệch và không mất việc đang làm.

## 1. Trước khi bắt đầu

```powershell
git status --short
git branch -vv
git log -1 --oneline
```

- Không reset/clean/checkout đè working tree đang có thay đổi chưa commit.
- Nếu working tree có việc của người khác, hỏi trước khi chạm.
- Đọc [ARCHITECTURE](ARCHITECTURE.md) và phần domain liên quan trước khi sửa.
- Với thay đổi API, đọc [API-CONTRACTS](API-CONTRACTS.md) và kiểm tra BE tương ứng.

## 2. Nhánh

```powershell
git switch -c feat/<mô-tả-ngắn>
```

| Tiền tố | Dùng cho |
|---|---|
| `feat/` | Tính năng mới |
| `fix/` | Sửa lỗi |
| `docs/` | Chỉ tài liệu |
| `refactor/` | Đổi cấu trúc, không đổi hành vi |
| `test/` | Bổ sung/sửa test |
| `chore/` | Dependency, cấu hình, vệ sinh |

Quy tắc:

- Nhánh `main` là bản chạy chính; không commit trực tiếp lên `main` nếu repo đang yêu cầu PR.
- Không force push lên nhánh dùng chung.
- Không xóa nhánh `archive/*` chỉ vì đã cũ.
- Tên nhánh không chứng minh đã merge; kiểm tra ancestry/PR thực tế.

## 3. Commit

Commit message bằng **tiếng Anh**, ngắn, mô tả hành vi:

```text
feat(workspace): add dependency status to task detail
fix(auth): prevent duplicate refresh on parallel 401
docs(readme): rewrite project documentation
test(api): cover legacy assessment response
```

Không dùng message chung chung như `update`, `fix bug`, `final`. Mỗi commit nên là một đơn vị logic; không trộn refactor lớn với thay đổi hành vi.

## 4. Thay đổi code

### Quy ước chung

- TypeScript strict; không `any` mới nếu có thể mô tả kiểu.
- Không `@ts-ignore`, `@ts-expect-error`, `eslint-disable` để né lỗi. Nếu buộc phải dùng, ghi lý do và phạm vi hẹp, có review.
- Adapter nhận `unknown` và parse; không cast response.
- Component nghiệp vụ đặt đúng thư mục domain; primitive dùng chung giữ trung tính.
- Không lặp `ProductShell`/`InternShell` trong route con.
- Giữ aria-label, test hook và hành vi keyboard khi refactor.
- Không thêm dependency nếu giải pháp hiện có đủ dùng.

### Giao diện

- Dùng token trong `src/styles/tokens.css`; không hard-code màu.
- Dùng component/utility hiện có trước khi tạo mới.
- Kiểm tra light/dark và 390/768/1440px.
- Không dùng dữ liệu mẫu để lấp empty state.
- Xem [UI-SYSTEM](UI-SYSTEM.md).

### API

- Khi BE đổi field/route, cập nhật adapter, parser, test và [API-CONTRACTS](API-CONTRACTS.md) trong cùng PR.
- Không tự thêm fallback gọi endpoint cũ nếu contract đã bỏ; ghi rõ compatibility nếu cần.
- Không gọi provider AI/GitHub trực tiếp từ browser.

## 5. Test

- Thêm test cho hành vi mới và trường hợp lỗi/biên.
- Bug fix phải có test tái hiện lỗi trước khi sửa (nếu khả thi).
- Không sửa test để khớp hành vi sai; sửa code hoặc cập nhật kỳ vọng có lý do.
- Không skip/xóa test hoặc hạ coverage để merge.
- Với thay đổi UI, chạy browser check; unit test không chứng minh layout.

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

## 6. Pull request

PR cần:

| Mục | Nội dung |
|---|---|
| Mục tiêu | Vấn đề gì, phạm vi nào |
| Thay đổi chính | File/route/component/API bị ảnh hưởng |
| Bằng chứng | Lệnh đã chạy, test count, ảnh browser nếu là UI |
| Rủi ro | Phần chưa kiểm, migration/contract, rollback |
| Liên kết | Issue/tài liệu/PR BE liên quan |

Điều kiện merge:

- `verify` xanh: lint, typecheck, test, audit production, build.
- `sql2019` xanh nếu chạm contract/route/luồng full-stack.
- Không còn conflict; không force push sau review mà không báo.
- Ít nhất một người review (hoặc quy trình review đã thống nhất).
- Không merge khi gate đỏ hoặc chỉ “retry cho xanh”.

## 7. Review checklist

- [ ] Hành vi đúng mô tả, không sửa ngoài phạm vi.
- [ ] Không phá route/API contract/quyền.
- [ ] Loading/error/empty/disabled đúng.
- [ ] Accessibility: label, focus, keyboard, contrast, reduced motion.
- [ ] Không secret/PII trong code/log/ảnh.
- [ ] Test đủ và có ý nghĩa; không skip.
- [ ] Tài liệu liên quan đã cập nhật.
- [ ] Không có thay đổi rác (log, file tạm, `.next`, `.runtime`).

## 8. Tài liệu

- Thay đổi kiến trúc → cập nhật [ARCHITECTURE](ARCHITECTURE.md) hoặc thêm ADR (nếu quyết định lớn).
- Thay đổi route → cập nhật [ROUTE-MAP](ROUTE-MAP.md).
- Thay đổi API → cập nhật [API-CONTRACTS](API-CONTRACTS.md).
- Thay đổi UI system → cập nhật [UI-SYSTEM](UI-SYSTEM.md).
- Thay đổi quy trình test/gate → cập nhật [TESTING](TESTING.md).
- Kết quả kiểm chứng mới → ghi vào [VERIFICATION](VERIFICATION.md), không sửa số liệu lịch sử.

## 9. An toàn Git

Được phép:

```powershell
git status
git diff
git add <file>
git commit
git switch -c <branch>
```

Không làm nếu chưa kiểm tra/được duyệt:

```powershell
git reset --hard
git clean -fd
git checkout -- <file>
git push --force
```

Không commit `.env`, `manual-runtime/private`, log runtime, `.next`, `node_modules` hoặc ảnh chứa secret. Nếu lỡ commit secret, coi như đã lộ: rotate và xử lý theo quy trình, không chỉ xóa file trong commit sau.
