# Phase 7.1 QA inventory

Production Next.js at localhost:3001. Browser API interception exists only in the test runner, not runtime source.

- Waiting 1440×900 and 390×844: six rows, no fake business records, gated Work/Sprint/Project, reload.
- Mobile drawer: visible menu, focus trap, Escape/focus restoration; no horizontal document overflow.
- Active 1440×900: assignment/session/sprint, seven API fixture tasks, focused task; no demo metrics.
- All five lifecycle states, role landing, unauthenticated route, logout.
- Recruitment selection, questions, answers, submit, backend decision; 503 errors/no fallback.
- R01 visual comparison: preserve approved composition; list mascot/illustration/chrome differences, no MATCH claim.
- Screenshots marked TEST CONTRACT, not live Nest/SQL Server evidence. Live QA is blocked by missing backend .env.

## Kết quả cuối

- Lint: PASS, 0 error / 0 warning.
- Typecheck: PASS.
- Tests: 23 suites / 213 tests PASS, 0 FAIL. Baseline 20 suites / 185 tests.
- Production build: PASS.
- Browser: 11 PASS / 0 FAIL, không pageerror; bản production mới nhất.
- Import graph: 73 module runtime từ app page/layout, 0 import mock/test/preview business.
- Git diff --check: PASS.
- Live Nest/SQL: CHƯA KIỂM CHỨNG. Backend startup thiếu JWT_SECRET/DB_PASSWORD.
- R01: PARTIAL. Mascot, illustration, sidebar/topbar khác reference; visual gate chưa chốt.
- Release gate / bắt đầu Phase 7.2: NO.

## Phase 7.1.5 — live

- Live suite: 10 PASS / 0 FAIL, real Next → real Nest → real SQL Server, không interception.
- SQL engine: 17.0.1000.7 (2025), compatibility level 150; không phải SQL Server 2019.
- Sáu migrations thật; synchronize=false.
- Full FE regression: 23 suites / 214 tests PASS; 213 tests được giữ và thêm logout race regression.
- Logout cookie clear/revoke, refresh 401 → một refresh → một retry 200, principal giữ nguyên.
- SQL/API/FE trace: một task trong project, doing=1, progress=37, project/session/task names khớp.
- Waiting R01: ACCEPTABLE, không pixel MATCH. Desktop 1440x900, mobile 390x844, không overflow; menu focus/Escape PASS.
- Chỉ có AUTH/FE_MAPPING logout race và VISUAL fix; không sửa BE source.
- Release gate vẫn NO vì chưa chạy SQL Server 2019.
- Evidence live ở phase7.1-live-\*.png, phase715-live-results.json và phase715-live-network.json.
