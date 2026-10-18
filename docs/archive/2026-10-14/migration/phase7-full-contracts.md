> Tài liệu lịch sử, lưu để truy vết. Không dùng làm hướng dẫn hoặc bằng chứng cho bản hiện hành. Xem README của repository và docs hiện tại.

# Phase 7 full product contracts

Backend SHA baseline: `102b9afa0998bcb0237a8fed25c5908f4436c6f2`. FE imports no legacy runtime API or authentication implementation from archive.

## Intern work / sprint / project

- `/tasks?mine=true`: Nest `{data,meta}` pagination, search/status/priority, server-enforced own scope.
- `/tasks/:id/my`: status `todo→doing`, `doing→review`, progress and optional reason only. Instructor approves/reworks. A 409 refetches authoritative task and history.
- `/tasks/:id/comments`: paginated; POST `{content}` (1–2000).
- `/tasks/:id/history`: paginated append-only transitions.
- Workspace currentSprint and assignment derive from DB and recruitment lifecycle.
- Intern has no broad `sprints.view` / `projects.view`. Live 403 exposed a product contract gap. Minimal backend read endpoints `/intern/me/project` and `/intern/me/sprint/board` resolve current assignment from authenticated principal, require `intern.workspace.view`, preserve recruitment gate, never accept another project/sprint/user ID. Board contains only the caller's tasks with real per-column counts. No permission catalog or migration changes.
- Direct Work/Sprint/Project navigation remains gated until active assignment. Waiting R01 presentation retained.

Development verification: real browser on :3001 → Nest :8080 → disposable local SQL Server 2025; task status/comment SQL equals rendered state; mobile 390×844 navigation/Escape/no overflow PASS. This is not SQL Server 2019 final evidence.
