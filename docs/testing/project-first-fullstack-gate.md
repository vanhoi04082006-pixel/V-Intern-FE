# Project-first full-stack gate: contract migration

Audit baseline FE e0e5a89fbb219c025ec080803415268517e473cf / BE33940ac626bd1d788ebc69033ec868fc7731e5e6. Historical failure: FE run38407321355; merged FE#11/BE#1. This audit precedes test/workflow edits.

| Old assumption/assertion | Current expected behavior / retained semantic coverage |
|---|---|
| Full-stack runs only after push/main | Run on PRs to main as well; exact FE checkout + reviewed BE SHA |
| BE pin6b61b82… | Pin reviewed compatible BE33940ac…; record both HEADs in evidence |
| migration history length6 / label migrations1–6 | Product TypeORM configuration runs all pending migrations; applied names match configured migrations; zero pending, no hard-coded count |
| Instructor Workspace heading | Real Workspace giảng viên with Project Library entry, no mock/reference-screen route imports |
| Instructor Session/Project/Class CRUD modals | Versioned DB template detail -> Create Session -> owned setup; native date validation, snapshot/version pin and request replay |
| Class creation/member management as primary Instructor workflow | /instructor/classes redirects to Project Library; active navigation excludes Class/Attendance. Historical tables/API remain verified, not dropped |
| Dashboard inline assignment of arbitrary graduate | PASS frontend/backend recruited through real API, matching role slots, availability conflict and invalid candidate rejection |
| Instructor manually creates Sprint/Task in list modals | Start reserves deterministic AI generation -> stored ready draft -> editor -> atomic Confirm -> persisted delivery -> replay/isolation |
| Test provider falls through sprint-plan into recruitment scores | Extend existing test-only AI_PROVIDER_TOKEN override with explicit validated sprint-plan output from actual session/member context; no live provider |
| academic.json is old manually-created session/project/class | New Project-first journey exports real owned Session/Project context; admin/navigation consumers retain their relevant coverage |
| Reports is Báo cáo tổng hợp / CSV-only metrics | Persisted scoped Session report, PDF/XLSX/CSV MIME+content checks, owner/foreign boundaries |
| Old instructor evaluation-assistance95/official80 and delivery transitions | Preserve advisory-vs-finalized authority and owned task review transitions using the new published Session; Performance finalized ranking |
| Instructor classes route in desktop/mobile/tablet navigation | Redirect assertion plus current Session/Library/Sprint/Performance/Reports routes and responsive/no-console checks |
| Admin Task has inline edit/delete and combined code/title button | Open the exact task row's actions menu; retain create/edit/soft-delete assertions and SQL title/deletedAt verification |
| fixed DB name and implicit script order/state | Per-run+attempt disposable DB; sequential declared dependencies; newly unique Project-first actors/templates; no published delivery seeding |
| Evidence only after late browser stages | Always capture migration/readiness/startup logs, bounded browser failure screenshots, SQL/API summaries; explicit process/container cleanup |

Unchanged coverage: auth cookie/refresh/logout, recruitment timing/PASS/cooldown, intern Waiting->Active and optimistic concurrency, admin CRUD/RBAC/audit, outcome/certificate privacy, KPI/salary arithmetic, mobile/keyboard/XSS/negative UAT. Existing scripts are retained and adapted only where their Instructor contracts or shared context changed. No assertion is skipped to get green.

## Compatible backend update procedure
The workflow's COMPATIBLE_BE_SHA is an immutable reviewed commit. Updating it requires an explicit compatibility PR: review FE/BE contracts and migration delta, update the SHA, run this gate against a fresh disposable SQL2019 database, verify zero pending migrations and all journeys, then review CI evidence. Never replace it with a moving main/latest ref.

## Scope and safety
No staging/production deployment, no applied migration changes, synchronize:false. All test AI is injected only by the existing guarded development Nest harness, never by product fallback. GitHub creates a unique disposable DB/container and destroys the container after evidence collection. Local native SQL2019 runner is NOT RUN unless an approved disposable environment is available; local lint/typecheck/tests/build are separate evidence.

## Verification and evidence
Local verification before first push: FE lint PASS, typecheck PASS,53 suites409 tests PASS, production build PASS; deterministic provider and workflow safety4 node:test cases PASS; all edited scripts node --check PASS. Native SQL2019/browser runner NOT RUN LOCALLY (Docker/SQL2019 disposable runtime unavailable; manual services/DBs not used). Required PR gates: FE CI and Project-first full-stack gate. GitHub's full-stack job must record zero pending migrations and actual configured/applied history.

The existing broad release job retains auth/recruitment/intern/admin/outcomes/finance/negative/mobile gates. scripts/phase7-academic-live.mjs is archived audit context; the executable replacement is scripts/project-first-live.mjs. scripts/phase7-instructor-live.mjs retains advisory95 vs official80, owned task review and now validates scoped finalized Top10 plus persisted report/export ownership. Existing direct classes navigation checks now explicitly assert redirection rather than Class CRUD.
