# FINAL PRODUCTION READINESS AUDIT — Journey Notebook v3

Ngày: 2026-11-21 (session Master Prompt V5)
Phạm vi: sửa lỗi GitHub Actions full-stack gate (3 test fail tại run 44822285512), tái kiểm chứng
toàn bộ quality gates ở cả hai cấu hình môi trường, xác minh Backend thật ở pinned SHA, đánh giá
khả năng Real Backend E2E tại môi trường hiện hành — không thay đổi gì khác.

---

## 1. HEAD & REPOSITORIES

| Repo | Nhánh / SHA | Trạng thái |
| --- | --- | --- |
| V-Intern-FE | `codex/product-acceptance-20261116` @ `9e83345e20a299acb92dca4ac0420e4575d0eb01` | Đã đồng bộ, working tree sạch trước khi sửa |
| V-Intern-BE | detached @ `cb2cf860cf083cc38e3b4f7a235769f4e119e4e0` (pinned SHA trong `phase7-fullstack.yml`) | Đã clone và xác minh tồn tại, build/test tại local |

- Không force push, không merge `main`, không PAT/token nào được dùng trong session này.
- Diff sau session: đúng 1 file `src/lib/preview/__tests__/preview-isolation.test.ts` (+36/−1) —
  **0 dòng production code thay đổi** → không có rủi ro regression UI Journey v3 từ commit này.

---

## 2. ROOT CAUSE 3 TEST FAIL TRONG FULL-STACK CI (run 44822285512)

### Bằng chứng tái hiện (trước khi sửa)

Lệnh tái hiện đúng điều kiện bước `FE quality gates` (job env có `NEXT_PUBLIC_API_BASE_URL`,
Nest CHƯA boot):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 npx vitest run src/lib/preview/__tests__/preview-isolation.test.ts
# → Tests 3 failed | 8 passed (11)
```

Ba test fail (khớp 100% log CI do user cung cấp):

1. `không flag → apiFetch không đi vào transport preview (giữ lỗi cấu hình thật)`
   — `Expected: API_CONFIG_MISSING / Received: NETWORK_ERROR`
2. `URL parameter/localStorage không thể bật preview khi flag đóng`
   — `Expected: API_CONFIG_MISSING / Received: NETWORK_ERROR`
3. `isApiConfigured() coi preview như đã cấu hình khi gate mở`
   — `Expected: false / Received: true`

### Chuỗi nguyên nhân (đọc code, không suy đoán)

1. `phase7-fullstack.yml` đặt **job-level env** `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`
   phục vụ Real-Backend E2E ở các bước sau (boot Nest ở port 8080).
2. Bước `FE quality gates` chạy `npm test` **trước khi** Nest được boot — biến đã có trong
   `process.env` của vitest worker.
3. `src/lib/preview/__tests__/preview-isolation.test.ts` mô tả hành vi "chưa cấu hình API"
   nhưng **không hề pin** `NEXT_PUBLIC_API_BASE_URL`; nó mặc định ambient env trống
   (đúng ở CI thường `ci.yml`, sai ở full-stack CI).
4. Hệ quả theo từng test:
   - `apiFetch` đọc `getApiBaseUrl()` → base không rỗng → gọi fetch thật tới `localhost:8080`
     (chưa có process nào lắng nghe) → `NETWORK_ERROR` thay vì `API_CONFIG_MISSING`.
   - `isApiConfigured()`: đoạn cuối test dùng `vi.unstubAllEnvs()` (trả về biến ambient của runner)
     rồi assert `false` — nhưng ambient có base URL → nhận `true`.

Kết luận: **logic production `api-client.ts` / `enabled.ts` HOÀN TOÀN ĐÚNG** — khi có base URL
thì coi như configured; khi base không reachable thì lỗi là `NETWORK_ERROR`. Lỗi nằm ở
**test phụ thuộc biến môi trường ambient của runner** thay vì tự kiểm soát đầu vào.

### Sửa (chỉ test, không weaken, không skip, không xóa assertion)

`src/lib/preview/__tests__/preview-isolation.test.ts`:

- `beforeEach` của khối "Preview isolation": sau `vi.unstubAllEnvs()` thêm
  `vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "")` — pin đầu vào "chưa cấu hình API" cho mọi test
  trong khối, bất kể runner có biến ambient hay không.
- Test `isApiConfigured()`: bỏ phụ thuộc `vi.unstubAllEnvs()` cho nhánh "gate đóng"; chủ động
  stub `NEXT_PUBLIC_PREVIEW="0"` (giữ base URL rỗng đã pin) và **bổ sung assertion ngược**:
  gate đóng + base URL có sẵn (đúng thực tế full-stack CI) → `isApiConfigured() === true`.
- **Bổ sung 1 regression test mới** (đây là nguồn tăng 804 → 805):
  `base URL đã cấu hình nhưng không thể kết nối → NETWORK_ERROR, không nhầm với
  API_CONFIG_MISSING` — pin `http://127.0.0.1:1/api/v1` (connection refused tức thì, an toàn
  và deterministic ở mọi runner). Test này chốt ranh giới ngữ nghĩa giữa "chưa cấu hình" và
  "cấu hình rồi nhưng không reachable" — chính sự nhầm lẫn đã gây incident CI này.

Không dùng `it.skip` / `test.todo`; không xóa assertion nào; không đổi implementation.

---

## 3. CÁCH CÔ LẬP MÔI TRƯỜNG TEST

- Mọi test isolation giờ **tự pin** trạng thái cấu hình API nó muốn kiểm chứng qua `vi.stubEnv`
  (vitest quản lý + restore qua `vi.unstubAllEnvs()` trong `beforeEach`).
- Bộ test không còn phụ thuộc việc runner có/không có `NEXT_PUBLIC_API_BASE_URL`.
- Audit toàn `src/**`: các test file khác đã dùng `vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", …)`
  từ trước (contracts-card, workspace-guard, onboarding-flow, intern-page, client.test …) —
  chỉ preview-isolation.test.ts là relied ambient; đã sửa.
- `scripts/__tests__/*.test.mjs` (contract tests) chỉ mutate `NODE_ENV` có save/restore — không vướng.

---

## 4. KẾT QUẢ QUALITY GATES (chạy local trên HEAD 9e83345 + fix)

| Gate | Cấu hình A: full-stack CI env (`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`) | Cấu hình B: CI thường (không biến) |
| --- | --- | --- |
| `vitest run` (full suite) | **805/805 PASS, 136 files** (3 lần chạy liên tiếp đều xanh) | **805/805 PASS, 136 files** |
| Lint | 0 errors, 1 warning (`no-img-element` có sẵn từ trước, không đổi) | như nhau |
| Typecheck (`tsc --noEmit`) | PASS | PASS |
| `node --test scripts/__tests__/*.test.mjs` | 25 pass / 0 fail | 25 pass / 0 fail |
| `npm run build` (production) | PASS (80 routes) | PASS |
| `npm run verify:preview-isolation` | PASS — 0 marker preview trong `.next` | PASS |
| `npm run verify:journey` | PASS — gate v2: 80/80 route, 79 DONE + 1 redirect verified, 237 evidence files, 22 interactions (0 fail) | PASS |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities | 0 vulnerabilities |
| `git diff --check` | sạch | sạch |

Ghi chú trung thực: ở lần chạy full-suite **đầu tiên** của cấu hình A có 1 test fail tạm thời
(flake, không tái hiện ở 3 lần chạy ngay sau đó với cùng mã nguồn và cùng cấu hình; không nằm
trong file vừa sửa). Kết quả ghi nhận là 3 lần xanh liên tiếp. Nếu flake tái xuất hiện trên
GitHub Actions, cần bắt tên test từ log để xử lý riêng — không ghi nhận là blocker hôm nay.

### Baseline test mới

- Trước: 804/804. Sau session này: **805/805** — 804 cũ giữ nguyên + 1 regression test hợp lệ
  cho hợp đồng lỗi `NETWORK_ERROR` ≠ `API_CONFIG_MISSING` (giải trình tại mục 2). Đáp ứng
  điều kiện "baseline mới hợp lệ, có giải trình".

### 4bis. LIVE PRODUCTION-MODE BROWSER CHECK (real behavior, không mock)

Boot `next start -p 3001` trên production build KHÔNG preview flag, KHÔNG
`NEXT_PUBLIC_API_BASE_URL` — đúng điều kiện "chưa cấu hình API thật" (agent-browser, headless):

| Kiểm tra | Kết quả |
| --- | --- |
| `/` (landing Journey v3) render production bundle | PASS — hero/nav/features đầy đủ, 0 page error |
| Route bảo vệ `/intern` khi API chưa cấu hình | PASS — alert "Không thể hoàn tất yêu cầu — Chưa cấu hình NEXT_PUBLIC_API_BASE_URL." + nút Thử lại (không crash, không fallback mock) |
| `/login` render + submit form | PASS — thông báo "Chưa cấu hình NEXT_PUBLIC_API_BASE_URL để kết nối hệ thống." (hợp đồng API_CONFIG_MISSING hiển thị đúng qua UI) |
| Nhét `NEXT_PUBLIC_PREVIEW=1` vào localStorage rồi mở `/intern` | PASS — preview KHÔNG bật (vẫn lỗi cấu hình thật) |
| `?NEXT_PUBLIC_PREVIEW=1` qua URL parameter | PASS — preview KHÔNG bật |
| Page errors console | 0 |

→ Bằng chứng sống cho Section 10.2 / mục 3 master prompt: production không thể bật preview
bằng URL/localStorage; lỗi cấu hình được xử lý chính xác; demo/mock không xuất hiện.

---

## 5. BACKEND THẬT — XÁC MINH TẠI PINNED SHA (local, không cần DB)

Trên V-Intern-BE @ `cb2cf860cf083cc38e3b4f7a235769f4e119e4e0` (đúng SHA khai báo trong
`phase7-fullstack.yml`):

- `npm ci`: PASS.
- `npm run lint`: 0 errors (15 warnings `no-console` có sẵn — exit 0, không đổi gì).
- `npm run build` (nest build): PASS.
- `npm test`: **876/876 PASS, 113 suites** (jest --runInBand; các spec dùng mock, không cần SQL).

→ BE artifact tại pinned SHA **xây dựng và test xanh tại local**. KHÔNG sửa gì ở BE.

---

## 6. REAL BACKEND E2E — TRẠNG THÁI & DANH SÁCH NGHIỆM THU

Môi trường bắt buộc của repo cho Real-Backend E2E: SQL Server 2019 (docker) + Nest thật +
Next production server + Playwright + fixtures — đúng như job `sql2019` của workflow
`phase7-fullstack.yml`.

### Tình trạng hạ tầng sandbox hiện tại (bằng chứng)

- `which docker` → không có; `docker ps` fail → **không thể boot `mcr.microsoft.com/mssql/server:2019`**.
- RAM tổng 3.9Gi (≈2.0Gi đang dùng) — dưới ngưỡng cần để chạy đồng thời SQL Server 2019 +
  Nest + Next prod + Playwright Chrome.
- Không có credential push (không SSH key, không `.netrc`, không credential helper; token bị
  cấm dùng từ remote cũ) → không thể tự trigger workflow trên GitHub từ sandbox này.

### Kết luận danh mục nghiệp vụ (mục 4.3 master prompt)

| Nhóm nghiệp vụ | Trạng thái | Ghi chú |
| --- | --- | --- |
| BE artifact @ pinned SHA (lint/build/876 unit+contract tests) | **VERIFIED (local)** | Mục 5 |
| FE quality gates trong môi trường env của full-stack job | **VERIFIED (local, tái lập chính xác env fail)** | Mục 4 |
| Live E2E: Auth, Intern, Instructor, Admin (13 phase7 live scripts + SQL2019 thật) | **BLOCKED (sandbox)** | Yêu cầu docker + SQL Server 2019; chỉ chạy được trong GitHub Actions `Project-first full-stack gate` |
| Preview không lọt production | **VERIFIED** | `verify:preview-isolation` PASS: 0 marker trong `.next` |
| Preview không thể bật qua URL/localStorage khi flag đóng | **VERIFIED** | Test isolation PASS ở cả 2 cấu hình môi trường |

**Không** dùng Preview API làm bằng chứng backend thật. **Không** fake response. Không tuyên bố
E2E PASS cho phần nào chưa chạy.

---

## 7. KẾT QUẢ WORKFLOW GITHUB ACTIONS

- CI thường + full-stack gate **chưa có run mới sau session này**: cần push commit lên
  `origin/codex/product-acceptance-20261116` rồi trigger (workflow chỉ tự chạy trên
  `pull_request` tới `codex/**` / push `main` / `feat/full-product-fe-nest-integration`;
  ngoài ra dùng `workflow_dispatch`). Sandbox hiện không có credential để push/trigger
  (xem mục 6). **Không tự khai SUCCESS.**
- Những gì step `FE quality gates` chạy đã được tái lập 1:1 tại local (kể cả biến môi trường
  gây fail): lint → typecheck → `npm test` → contract tests → audit → build → isolation scan;
  tất cả PASS (mục 4). Phần còn lại của full-stack job (SQL2019 + live scripts) là đúng phần
  BLOCKED nêu trên.

---

## 8. PHÂN BIỆT TRẠNG THÁI NGHIỆM THU (không suy xuyên)

| Trạng thái | Kết luận | Bằng chứng |
| --- | --- | --- |
| CODE VERIFIED | **PASS** | lint 0 err / typecheck / 805 tests × 2 env configs / build / contract 25 — tại HEAD sau fix; kèm live production-mode browser check (mục 4bis): lỗi cấu hình API xử lý đúng, preview không bật được qua URL/localStorage |
| PREVIEW VERIFIED | **PASS** | `verify:preview-isolation` (0 marker) + `verify:journey` gate v2 PASS 80/80 (tái chạy trên HEAD sau fix); auditor trước đó đã thu evidence 3 viewport × đúng role (docs/journey-v3-evidence/) |
| REAL BACKEND VERIFIED | **PARTIAL — BE artifact verified; LIVE E2E BLOCKED** | BE @ pinned SHA: build + 876 tests xanh; live E2E cần hạ tầng GitHub Actions (mục 6) |
| FULL-STACK CI VERIFIED | **BLOCKED — chưa có run mới** | Yêu cầu push + trigger; sandbox không credential (mục 7) |
| PRODUCTION READY | **NO — INCOMPLETE** | Còn 2 điều kiện bắt buộc: full-stack gate xanh trên GitHub + Real Backend E2E live |

---

## 9. REGRESSION RISKS & VIỆC CẦN LÀM TRƯỚC KHI TUYÊN BỐ PRODUCTION-READY

1. (Bắt buộc) Push commit này lên `origin/codex/product-acceptance-20261116` từ môi trường có
   quyền ghi; sau đó trigger `Project-first full-stack gate` (workflow_dispatch hoặc PR tới
   nhánh codex/** theo trigger hiện có) và require trạng thái SUCCESS — đặc biệt bước
   `FE quality gates` giờ phải xanh nhờ fix này.
2. (Bắt buộc) Live Real-Backend E2E của 13 nhóm nghiệp vụ chạy trong job `sql2019` (auth,
   recruitment, submissions, outcomes, projects, instructor, admin, navigation, UAT UI/
   keyboard/responsive, negative authorization, KPI/salary UTC boundary…). Nếu bất kỳ script
   live fail → đọc log, xử lý như lỗi thật, không bỏ bước.
3. (Theo dõi) Flake 1 test quan sát được 1 lần ở local (mục 4) — nếu tái xuất hiện trên
   Actions, lấy tên test từ log và khắc phục nguyên nhân.
4. (Rủi ro thấp) Diff chỉ 1 test file; UI Journey v3 không đổi. `verify:journey` và
   `verify:preview-isolation` tái chạy xanh trên HEAD sau fix.
5. `no-img-element` warning (1) và 15 `no-console` warnings ở BE: không đổi (có từ trước,
   không thuộc phạm vi lỗi CI).

---

## 10. GIT DELIVERY

- Commit FE tại local (ngay trên đỉnh `9e83345e…`, xác minh bằng `git log -1`):
  `fix(test): pin env inputs in preview-isolation tests for full-stack CI`
  (2 files: 1 test + 1 doc; production code bất biến).
- Push từ sandbox đã thử và **BLOCKED** với bằng chứng:
  `fatal: could not read Username for 'https://github.com': No such device or address`
  (không SSH key, không .netrc, không credential helper; không dùng token từ
  remote cũ theo ràng buộc). Không force push, không ghi đè gì lên remote —
  remote HEAD giữ nguyên `9e83345e…`.
- Bước tiếp theo cho người có quyền ghi:
  `git push origin codex/product-acceptance-20261116` (KHÔNG force push) rồi
  verify `git ls-remote` cho HEAD mới; sau đó trigger 2 workflow và yêu cầu SUCCESS.

---

## 11. KẾT LUẬN

Fix lỗi full-stack CI đã hoàn tất và được chứng minh bằng tái lập điều kiện fail → xanh ở
805/805 × 2 cấu hình môi trường; toàn bộ quality gates local PASS; BE pinned SHA verified.
**Production readiness CHƯA tuyên bố** — chờ full-stack gate xanh trên GitHub và
Real-Backend E2E live (BLOCKED hạ tầng sandbox, hướng dẫn tại mục 9).
