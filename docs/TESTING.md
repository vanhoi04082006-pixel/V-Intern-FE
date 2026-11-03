# Kiểm thử Frontend

Mỗi lớp test trả lời một câu hỏi khác nhau. Không cộng số test thành một “điểm tin cậy” duy nhất.

## 1. Bốn lớp kiểm chứng

| Lớp | Chứng minh được | Chưa chứng minh được |
|---|---|---|
| **Unit (Vitest + JSDOM)** | Logic adapter/parser, auth, permission, component state, lỗi biên | Layout thật, API/SQL thật, provider thật |
| **Browser (Playwright)** | Route, layout, responsive, focus, modal, navigation | Mọi nhánh backend nếu chưa kích hoạt |
| **Live harness** | FE + Nest + SQL thật, luồng nghiệp vụ có mutation | Toàn bộ mọi route/framework |
| **Full-stack gate** | Contract FE ↔ BE trên SQL Server 2019 | Production, mọi dữ liệu thật |

## 2. Lệnh cơ bản

```powershell
& .\scripts\Use-ProjectStorage.ps1
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

| Lệnh | Phạm vi |
|---|---|
| `npm test` | Vitest một lượt, toàn bộ `*.test.ts(x)` |
| `npm run test:watch` | Vitest watch mode khi đang sửa |
| `node --test scripts/__tests__/*.test.mjs` | Contract test cho harness Node (CI full-stack chạy) |
| `npm run build` | Next production build; bắt lỗi server/client boundary |

Chạy một file cụ thể:

```powershell
npx vitest run src/lib/api/__tests__/client.test.ts
npx vitest run src/components/intern/__tests__/student-performance-next-step.test.tsx
```

## 3. Unit test

- Framework: **Vitest**, môi trường JSDOM, Testing Library.
- Setup dùng chung nằm trong `src/test/`.
- Test đặt cạnh code (`__tests__`) theo domain.
- Trạng thái hiện tại (02/11/2026): **117 file / 672 test đạt**.

Nhóm hồi quy quan trọng:

| Nhóm | Phải giữ |
|---|---|
| Auth | Đăng nhập, refresh single-flight, logout, cookie coordination, redirect theo vai |
| Permission | `Can`, route guard, ẩn/hiện hành động, không nâng quyền ở client |
| Adapter | Parse đúng, response cũ, field thiếu/sai kiểu, nullable |
| Lifecycle | Passed-unassigned, chờ phân công, có lịch sử assignment, outcomes sau placement |
| Recruitment | Khôi phục hội thoại, câu hiện tại, follow-up, hết lượt, retry |
| Work | Kanban reload/revision, rubric AI sau khi tải, nộp/rút bài |
| Outcomes | KPI/lương/chứng nhận, report filter/snapshot, trusted runner có timing/score/checks |
| UI state | Loading/error/empty, form giữ draft, modal focus/Escape |

Không skip, xóa assertion hoặc hạ ngưỡng để làm xanh. Khi UI thêm nơi hiển thị cùng dữ liệu, scope selector vào đúng vùng thay vì giảm assertion nghiệp vụ.

## 4. Browser test

Browser test dùng Chrome/Playwright với **Nest + SQL thật**, không intercept API nghiệp vụ.

Checklist tối thiểu:

1. Đăng nhập đúng vai trò; refresh qua reload.
2. Mở route private bằng **client navigation**; hard reload quá nhiều có thể chạm rate limit auth.
3. Heading và dữ liệu thật, không chỉ ảnh trang login.
4. Request failures/console errors; phân biệt lỗi mạng với lỗi UI.
5. Responsive 1440/1280/1024/768/390px; kiểm tra tràn ngang.
6. Keyboard: tab, focus-visible, Escape, modal trả focus.
7. Loading/error/empty; filter không có kết quả; form đang gửi.
8. Kanban: kéo thả, phụ thuộc, revision, refresh.

> Ảnh chụp trang login **không** phải bằng chứng route private đã kiểm tra. Một suite xanh **không** chứng minh mobile đúng.

## 5. Live harness

Các script trong `scripts/` chạy trên môi trường local/QA riêng:

| Nhóm | Script tiêu biểu | Mục đích |
|---|---|---|
| Tuyển dụng | `g3-applications-live.mjs`, `g4-scheduled-interviews-live.mjs` | CV, lịch, phòng chờ, hẹn lại |
| Nghề nghiệp | `career-roles-live.mjs` | Catalog, phiên bản, câu hỏi |
| Dự án nhỏ | `mini-project-library-live.mjs` | Starter, revision, assessment |
| Kho tri thức | `knowledge-library-live.mjs` | Draft/publish/archive/import, 24 viewport |
| GitHub | `g5-invitations-live.mjs`, `code-review-settlement.mjs` | Lời mời, quyền, review/settlement |
| Nghiệp vụ đầy đủ | `project-first-*.mjs`, `phase7-*.mjs` | Luồng FE + Nest + SQL, UAT, audit runtime |
| Kiểm tra hợp đồng | `scripts/__tests__/*.test.mjs` | Schema/fixture của harness |

Nguyên tắc:

- Dùng database QA/E2E **riêng**, không thêm fixture vào ba tài khoản trắng hoặc DB chính.
- Provider deterministic chỉ trong harness; phải xử lý đúng feature/schema.
- Provider thật có thể 503/invalid JSON; ghi lại thất bại và retry, không bịa điểm.
- Không coi một lần chạy harness là nghiệm thu mọi route.

## 6. CI và quality gate

### `verify` — mọi PR vào `main`

```text
npm ci → lint → typecheck → test → npm audit --omit=dev --audit-level=high → build
```

### `sql2019` — full-stack gate

- Chạy trên `ubuntu-24.04` (pin vì Playwright chưa có build cho 26.04).
- Checkout FE hiện tại + BE đúng `COMPATIBLE_BE_SHA` (xem `phase7-fullstack.yml`).
- Dựng SQL Server 2019, chạy migration/schema audit, seed idempotent, boot API thật.
- Chạy unit + contract harness + browser/live flow + audit runtime.
- Artifact chỉ chứa bằng chứng của đúng run; xóa `phase7-evidence` trước khi chạy.

**Quy tắc merge:** cả `verify` và `sql2019` phải xanh. Không merge khi một gate đỏ, không “retry cho xanh” khi chưa hiểu nguyên nhân.

Khi BE đổi contract, cập nhật `COMPATIBLE_BE_SHA` bằng một PR compatibility riêng, có review; không sửa pin tùy tiện trong PR feature.

## 7. Dữ liệu và môi trường test

| Môi trường | FE | API | Database | Dùng cho |
|---|---|---|---|---|
| Chính | 3001 | 8080 | `VIntern_M2_BROWSER` | Demo/QA chính |
| QA | 3004 | 8081 | `VIntern_Test_Learning_20261014` | Luồng có mutation |
| E2E | CI | CI | `VIntern_Phase715_*` | Full-stack gate |

- Không reset/seed DB chính để chụp giao diện.
- Không dùng mật khẩu thật trong script/ảnh/log.
- Không sửa trạng thái DB thủ công để ép một test đi qua.
- Giữ nguyên ba tài khoản trắng gốc.

## 8. Ghi bằng chứng

Mỗi lần kiểm chứng ghi:

- Ngày/giờ và múi giờ.
- Branch, commit, dirty state.
- Lệnh đã chạy, exit code, số test.
- Môi trường (FE/API/DB), viewport, tài khoản vai trò (không ghi mật khẩu).
- Phần đã kiểm và **phần chưa kiểm**.

Lưu log/ảnh dưới workspace (`.runtime/...` hoặc `docs/reports/` nếu là bằng chứng được commit). Không sửa log cũ để trông như mới.

## 9. Giới hạn đã biết

- Ma trận responsive không thay audit WCAG đầy đủ.
- Chưa có production deployment trong phạm vi hiện tại.
- Một số luồng phụ thuộc GitHub/AI/provider thật; harness deterministic không chứng minh provider thật.
- Ảnh demo có thể lệch UI hiện tại sau các đợt redesign; luôn kiểm lại route trước khi dùng ảnh cũ.

Xem [VERIFICATION](VERIFICATION.md) để biết mốc mới nhất và nguồn bằng chứng.
