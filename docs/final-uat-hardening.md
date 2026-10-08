# Final UAT hardening (in progress)

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
Backend 32226e70de2fe818d8b011d3ed0a0c5eaf4b9188 and includes the additional auth
browser regressions. Final product acceptance remains pending the complete UAT
matrix and exact final-SHA full-stack CI.
