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
