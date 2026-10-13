# Instructor workflow — durable FE integration

Updated 2026-10-13 Asia/Bangkok. PR target approved by the owner: origin/main.

- Durable worktree: E:\Projects\V-INTERN\integration-worktrees\fe
- Branch: integration/instructor-project-first
- Source checkpoint: dcea1abfeccd40a5d5a0e17dc461d09cfb557a34
- Fresh main: 48617b032ac4c9a0b98d98fced56dd377ffbafbb
- Main is an ancestor; the new integration branch was created at main and fast-forwarded to the checkpoint. All 22 commits ahead of main, including six FE checkpoint commits and P0 permission fixes, are retained without duplication/rewrite.
- Common Git directory and installed node_modules are on E:, independent of Temp. No original dirty source/index or Temp source was changed.

## PR draft

Title: Instructor Project-first workflow with scoped delivery, performance and reports

Instructors start from the real Project Library, create independent versioned-template Sessions, select eligible role-matched interns, start asynchronous AI planning, edit/confirm a draft, and manage owned Sprint/Task delivery. Performance keeps the existing finalized-score ranking with Top10 and scoped search/detail. Reports use persisted project/session scope and real PDF/XLSX/CSV exports. Class/Attendance and Quick Setup entry points are removed from the active instructor workflow; historical modules remain.

The full main-to-integration diff also includes P0 permission/download fixes and earlier feature prerequisites. Review the full diff, not only the six final checkpoint commits. Backend integration and its pending schema migrations must be deployed before this FE.

## Verification

- Fresh installation from the committed lockfile: PASS.
- Production Next16 build: PASS.
- Standalone typecheck: PASS.
- Lint: PASS, zero warnings.
- Full Vitest: 53 suites / 409 tests PASS on sequential recheck, unchanged tests and timeout. First concurrent run had one 5s registration-test timeout (408/409); isolated registration suite passed 8/8, then full suite passed. Both logs retained. Existing jsdom navigation notices are non-failing.
- Product source tree is exactly the checkpoint tree. This integration changes documentation only.
- Class route redirects to /instructor/projects; active home uses InstructorHome; no active route imports mock instructor QA/PR cards or Quick Setup. Existing mock presentation modules/tests are retained outside the active workflow.

Evidence: E:\Projects\V-INTERN\integration-evidence\20261013\fe. Detailed cross-repository integration/34-path comparison/migration/rollback plan: paired BE docs/handoffs/instructor-workflow-safe-integration.md.

## Original workstreams and blockers

Thirty paths overlap the separate dirty original FE workstream, not main. Exact matches are already included. Different admin/reference-screen UI, compact pickers, optional metrics and manual recruitment-review work remain intact in the original checkout AND byte-verified backup; these separate behaviors are not claimed as merged. Do not import whole original files: several would restore Class navigation, weaken permission gates, remove scoped API contracts, or show hash-generated trend charts. The BE integration document records every path's disposition.

Snapshot E:\Projects\V-INTERN\handoff-snapshots\20261013-checkpoint-commits verified all469FE/357BE source files and bundles. Original dirty workstream backup is in integration-evidence/20261013/fe/original-source with SHA256 manifest. Future owners should separately review/checkpoint those workstreams, without overwriting this workflow.

Live Gemini remains BLOCKED — EXTERNAL PROVIDER: the previous controlled real-generation attempt on 2026-10-13 10:15 returned HTTP503 / AI_PROVIDER_UNAVAILABLE. No fresh Gemini retry during Git integration. SQL test-provider passes do not constitute Gemini acceptance.

Both main branches report protected:false; effective branch-rule inspection returned403 (GitHub feature/plan limitation). No settings changed. Enforce review/test gates before a future merge.

## Next action and staging order

After owner approval only: re-fetch main, recompute ancestry, push the new integration branch normally and open a PR to main. No push/PR/main merge/deployment has occurred.

Staging: verify DB backup/restore and pending migrations → deploy paired BE → deploy this FE → test real AI edit/Confirm/replay/persistence/isolation plus reports/security/navigation. Production acceptance remains blocked on live Gemini. Roll back to a recorded healthy paired artifact set, retaining additive schema/history; do not automatically revert migrations or erase Sessions.

For final documentation commit SHA, clean status and bundle checksum, see the external integration snapshot summary (avoids a self-referencing commit SHA in this file).
