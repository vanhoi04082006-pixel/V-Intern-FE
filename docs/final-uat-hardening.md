# Final UAT hardening

## UAT-AUTH-002 — HIGH, fixed

Real Chrome with two tabs restoring one shared cookie caused REFRESH_REUSE and
returned a tab to login. Cookie-mutating requests now use the same Web Locks
resource across tabs; refresh remains single-flight within each tab. Refresh
queued before logout checks its session generation before performing the request.
This introduces no localStorage token or principal persistence.

## UAT-AUTH-003 — MEDIUM, fixed

Logout previously left the other tab's private UI visible. BroadcastChannel now
invalidates memory on logout or account change. It carries only an event string;
incoming objects cannot install a principal. Workspace guards hide private UI
and return to login. Real browser regression includes Back and protected deep links.

## UAT-CONCURRENCY-001 — MEDIUM, fixed

`useAction` allowed two mutations before React committed its busy state. A synchronous
ref now guards pending mutations. Regression proves only one mutation occurs and
that failures release the guard for retry.

## UAT-DEPENDENCY-001 — HIGH advisory, patched

## UAT-ACCESSIBILITY-001 — MEDIUM, fixed

Real Chrome Tab traversal moved focus to BODY at the last modal/drawer control.
Both product dialogs now wrap Tab and Shift+Tab among visible enabled controls.
Native Escape and focus restoration remain intact. Real browser tests cover the
user form and mobile drawers for all three roles, plus 18 tablet routes.

## UAT-AI-001 — MEDIUM, fixed

Two rapid clicks before React committed busy state sent two real Mentor message
requests. Synchronous guards now protect send/archive and conversation creation.
The real browser regression requires exactly one message request.

## Dependency validation

Next.js and matching eslint config are pinned to 16.3.8; source-map-js resolves to
the patched compatible version. The production FE dependency audit reports zero
advisories. All-dependency audits still flag `braces` in ESLint/Jest tooling.
Upstream has no patched release as of 2026-10-08. Its inputs here are repository
glob patterns; neither app exposes a user-provided brace pattern to this tool.
The package is absent from production dependency trees. This is a documented
development-tool residual, not a clean all-dependency audit claim.

Sources: [Next advisory](https://github.com/vercel/next.js/security/advisories/GHSA-3w37-wq28-93x7),
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Live UAT uses real Next/Nest/SQL, with no request interception. The workflow pins
Backend 8c38651bbf18213dee8aff6aab1950616a0be213 and includes the additional auth
browser regressions. Final product acceptance remains pending the complete UAT
matrix and exact final-SHA full-stack CI.

## UAT-AUTH-004 / 005 — MEDIUM, fixed

Real browser rapid login issued two credential requests before busy state committed. A synchronous ref now guards login and releases after errors. Locked accounts now receive a Vietnamese ACCOUNT_LOCKED message rather than generic permission denial. Real browser regressions require one request and verify lock denial/no cookie, API unlock and lifecycle landing; a unit regression covers the locked response.

## Real UAT additions

The clean-checkout SQL2019 workflow runs tablet/dialog/double-submit/XSS browser checks, 29 real API privacy/validation checks, and a separate API-created financial fixture. Its KPI is 83.8 (delivery80, quality90, absent timeliness); browser/API/SQL agree at 8,380,000, 8,680,000 and 8,180,000. The suite checks concurrent earning generation and UTC [from,to) boundaries using newly created task history. It never alters historical business timestamps.

## Visual acceptance

R02, R07 and R10 remain PARTIAL with documented contract limitations. Reports show real metrics before filters; Groups use a real-data table; Roles use a primary table with a separate permission list and five explicitly scoped metrics. Existing browser CRUD/RBAC and tablet regressions remain mandatory. Persisted report libraries, arbitrary role-policy editing, group aggregate membership statistics and fabricated historical charts are not added. R01 and remaining references retain ACCEPTABLE subject to final-run visual recheck.

## Acceptance provenance

Final report and exact-SHA CI evidence are recorded outside the checkout in phase7-audit. Credentials remain ignored local/session environment only. The final FE workflow must pin the final Backend SHA and pass after the last commit; older successful runs do not certify newer changes.
