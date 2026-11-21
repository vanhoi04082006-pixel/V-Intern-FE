# BE CAPABILITY INVENTORY — NestJS real backend

> Nguồn: quét source BE thật \`vanhoi04082006-pixel/V-Intern-BE\` @ \`cb2cf860cf083cc38e3b4f7a235769f4e119e4e0\` (nhánh \`codex/product-acceptance-20261116\`).
> Trích xuất bằng \`scripts/extract-endpoints.cjs\` (BE repo) — đọc từng \`@Controller\`, \`@RequirePermissions\`, \`@Public\`, DTO của \`@Body\`/\`@Query\`, swagger summary. Không dùng tài liệu làm nguồn sự thật.

## Tổng quan

- **Tổng số endpoint (controller routes)**: 302 từ 46 file controller.
- **Public (không xác thực)**: 6 — auth login/refresh/me/register/logout, chứng nhận công khai, webhook GitHub, health.
- **Có `@RequirePermissions` (RBAC tường minh)**: 198.
- **Chỉ(Authenticated + ownership scope, không permission code tường minh)**: 96 — đa số là endpoint scope "của chính tôi" (intern/me, recruitment/me, applications/…) hoặc controller nội bộ.
- **Permission code phân biệt**: 52 (liệt kê cuối file).

## Phân loại capability

| Nhóm | Số lượng | Ghi chú |
|---|---|---|
| USER-FACING (read) | 155 | Cần hiển thị dữ liệu (bảng/chi tiết/dashboard) |
| USER-FACING (mutation) | 136 | Cần thao tác (form/nút/xác nhận) |
| USER-FACING (public) | 6 | Luồng đăng nhập/đăng ký/xác minh công khai |
| READ-ONLY (batch support) | 5 | Batch summary — tối ưu N+1, không cần trang riêng |
| INTERNAL (design fixtures) | 2 | reference-screens — fixture ảnh đã duyệt |
| INTEGRATION (webhook/callback/health) | 3 | GitHub OAuth callback + webhook receiver + health |

## Chi tiết theo module


### admin (4 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/admin/system/contracts\` | settings.read | USER-FACING (read) | \`contracts\` | — | — |
| \`POST\` | \`/admin/system/contracts/validate\` | settings.read | USER-FACING (mutation) | \`validate\` | — | — |
| \`GET\` | \`/admin/system/repositories\` | settings.read | USER-FACING (read) | \`repositories\` | — | — |
| \`GET\` | \`/admin/system/status\` | settings.read | USER-FACING (read) | \`status\` | — | — |

### agents (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/admin/agents/business-runs\` | settings.read | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/admin/agents/knowledge-runs\` | knowledge.read | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/admin/agents/knowledge-runs/:id\` | (auth-scope) | USER-FACING (read) | \`cancel\` | — | — |
| \`POST\` | \`/admin/agents/knowledge-runs/:id/cancel\` | (auth-scope) | USER-FACING (mutation) | \`cancel\` | — | — |
| \`POST\` | \`/admin/agents/knowledge-runs/:id/resume\` | (auth-scope) | USER-FACING (mutation) | \`resume\` | — | — |

### ai (13 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/intern/me/ai-recommendations\` | (auth-scope) | USER-FACING (read) | \`latestOwn\` | — | — |
| \`POST\` | \`/intern/me/ai-recommendations/refresh\` | ai.recommendations.view.own | USER-FACING (mutation) | \`refreshOwn\` | — | My latest AI development recommendations (ai.recommendations.view.own; AI-generated, advisory, non-authoritative; 404 until first refresh) |
| \`GET\` | \`/performance/interns/:userId/ai-recommendations\` | ai.recommendations.view.own | USER-FACING (read) | \`latestForIntern\` | — | Refresh my recommendations — deterministic source facts are hashed; unchanged facts reuse the existing snapshot WITHOUT a provider call; changed facts generate  |
| \`GET\` | \`/admin/ai-configuration\` | (auth-scope) | USER-FACING (read) | \`(unknown)\` | — | — |
| \`PUT\` | \`/admin/ai-configuration\` | settings.read | USER-FACING (mutation) | \`(unknown)\` | — | — |
| \`POST\` | \`/evaluations/:id/ai-suggestions\` | (auth-scope) | USER-FACING (mutation) | \`generate\` | — | — |
| \`GET\` | \`/evaluations/:id/ai-suggestions\` | (auth-scope) | USER-FACING (read) | \`list\` | — | Generate an AI draft suggestion for an evaluation (ai.evaluation.assist; evaluator-of-record or admin; DRAFT ONLY — advisory, non-authoritative, never applied a |
| \`GET\` | \`/evaluations/:id/ai-suggestions/:suggestionId\` | ai.evaluation.assist | USER-FACING (read) | \`getOne\` | — | List AI suggestion history for an evaluation (ai.evaluation.assist; ownership enforced) |
| \`GET\` | \`/intern/me/ai-mentor/conversations\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/intern/me/ai-mentor/conversations\` | ai.mentor.use | USER-FACING (mutation) | \`create\` | — | My AI mentor conversations (ai.mentor.use; identity = principal; AI-generated advisory content — non-authoritative) |
| \`GET\` | \`/intern/me/ai-mentor/conversations/:id\` | ai.mentor.use | USER-FACING (read) | \`getOne\` | — | Create an AI mentor conversation owned by the authenticated intern |
| \`POST\` | \`/intern/me/ai-mentor/conversations/:id/archive\` | (auth-scope) | USER-FACING (mutation) | \`archive\` | — | Send a message to MY conversation — persists the user message, builds authorized workspace facts, generates the AI answer (AI-generated, advisory, non-authorita |
| \`POST\` | \`/intern/me/ai-mentor/conversations/:id/messages\` | ai.mentor.use | USER-FACING (mutation) | \`sendMessage\` | — | One of my AI mentor conversations with ordered messages (404-safe for foreign conversations) |

### ai-generation (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/ai-generations/plans\` | sprints.manage | USER-FACING (read) | \`plans\` | — | Generate and persist an AI plan draft (sprints.manage; idempotent per session+version; review before confirm) |
| \`GET\` | \`/ai-generations/plans/:id\` | sprints.manage | USER-FACING (read) | \`plan\` | — | Generate and persist an AI plan draft (sprints.manage; idempotent per session+version; review before confirm) |
| \`POST\` | \`/ai-generations/plans/generate\` | sprints.manage | USER-FACING (mutation) | \`generate\` | — | Confirm an instructor-reviewed draft (sprints.manage; re-validated server-side; idempotent per requestId) |
| \`POST\` | \`/ai-generations/sprint-plan/confirm\` | sprints.manage | USER-FACING (mutation) | \`confirm\` | — | Generate a sprint/task draft with AI (sprints.manage; managed project+session only; persists nothing) |
| \`POST\` | \`/ai-generations/sprint-plan/draft\` | (auth-scope) | USER-FACING (mutation) | \`draft\` | — | — |

### applications (24 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`POST\` | \`/applications\` | (auth-scope) | USER-FACING (mutation) | \`apply\` | — | — |
| \`POST\` | \`/applications/leave\` | (auth-scope) | USER-FACING (mutation) | \`verify\` | — | — |
| \`GET\` | \`/applications/me\` | (auth-scope) | USER-FACING (read) | \`supplement\` | — | — |
| \`POST\` | \`/applications/me/cv\` | (auth-scope) | USER-FACING (mutation) | \`supplement\` | — | — |
| \`GET\` | \`/applications/me/cv\` | (auth-scope) | USER-FACING (read) | \`cv\` | — | — |
| \`POST\` | \`/applications/request-access\` | (auth-scope) | USER-FACING (mutation) | \`access\` | — | — |
| \`GET\` | \`/applications/rounds\` | (auth-scope) | USER-FACING (read) | \`apply\` | — | — |
| \`POST\` | \`/applications/verify\` | (auth-scope) | USER-FACING (mutation) | \`verify\` | — | — |
| \`GET\` | \`/recruitment-rounds\` | applications.manage | USER-FACING (read) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds\` | applications.manage | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`GET\` | \`/recruitment-rounds/:id\` | applications.manage | USER-FACING (read) | \`recoverCredentials\` | — | — |
| \`GET\` | \`/recruitment-rounds/:id/applications\` | (auth-scope) | USER-FACING (read) | \`recoverCredentials\` | — | — |
| \`GET\` | \`/recruitment-rounds/:id/applications/:applicationId\` | (auth-scope) | USER-FACING (read) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/applications/:applicationId/cancel\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`GET\` | \`/recruitment-rounds/:id/applications/:applicationId/credential-recovery\` | (auth-scope) | USER-FACING (read) | \`recoverCredentials\` | — | — |
| \`GET\` | \`/recruitment-rounds/:id/applications/:applicationId/cv\` | (auth-scope) | USER-FACING (read) | \`cv\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/applications/:applicationId/recover-credentials\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/applications/:applicationId/reschedule\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/applications/:applicationId/resend-credentials\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/applications/:applicationId/retake\` | (auth-scope) | USER-FACING (mutation) | \`retake\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/applications/:applicationId/retry\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/slots\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/slots/:slotId/close\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |
| \`POST\` | \`/recruitment-rounds/:id/status\` | (auth-scope) | USER-FACING (mutation) | \`recoverCredentials\` | — | — |

### assignments (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/assignments\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/assignments\` | assignments.view | USER-FACING (mutation) | \`create\` | — | Paginated assignments (assignments.view; filters: internId, sessionId, projectId, status; own or managed-session scope) |
| \`GET\` | \`/assignments/:id\` | assignments.manage | USER-FACING (read) | \`getOne\` | — | Create assignment — ONE transaction: intern lock, session/project validation, capacity, conflict check, membership ensure, notification+audit+activity (409 ASSI |
| \`POST\` | \`/assignments/:id/cancel\` | assignments.manage | USER-FACING (mutation) | \`cancel\` | — | Complete an active assignment (assignments.manage; audited; intern notified; history preserved) |
| \`POST\` | \`/assignments/:id/complete\` | assignments.view | USER-FACING (mutation) | \`complete\` | — | Assignment detail (assignments.view; includes project/session/intern summaries; own or managed-session scope) |

### audit (2 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/activity-events\` | audit.read | USER-FACING (read) | \`activityEvents\` | — | Paginated audit trail (audit.read) |
| \`GET\` | \`/audit-logs\` | (auth-scope) | USER-FACING (read) | \`auditLogs\` | — | — |

### auth (6 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`POST\` | \`/auth/change-password\` | (auth-scope) | USER-FACING (mutation) | \`changePassword\` | — | Revoke refresh token + clear cookie (204) |
| \`POST\` | \`/auth/login\` | PUBLIC | USER-FACING (public) | \`login\` | — | Create an intern-only account; login separately to start recruitment |
| \`POST\` | \`/auth/logout\` | PUBLIC | USER-FACING (public) | \`logout\` | — | Rotate refresh token (family reuse detection) |
| \`GET\` | \`/auth/me\` | PUBLIC | USER-FACING (public) | \`me\` | — | Revoke refresh token + clear cookie (204) |
| \`POST\` | \`/auth/refresh\` | PUBLIC | USER-FACING (public) | \`refresh\` | — | Login → access token + HttpOnly refresh cookie |
| \`POST\` | \`/auth/register\` | PUBLIC | USER-FACING (public) | \`register\` | — | — |

### career-roles (8 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/admin/career-roles\` | recruitment.manage | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/admin/career-roles\` | recruitment.manage | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/admin/career-roles/:code\` | recruitment.manage | USER-FACING (read) | \`get\` | — | — |
| \`PUT\` | \`/admin/career-roles/:code\` | (auth-scope) | USER-FACING (mutation) | \`update\` | — | — |
| \`POST\` | \`/admin/career-roles/:code/archive\` | (auth-scope) | USER-FACING (mutation) | \`archive\` | — | — |
| \`GET\` | \`/admin/career-roles/:code/revisions\` | recruitment.manage | USER-FACING (read) | \`revisions\` | — | — |
| \`GET\` | \`/career-roles\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`GET\` | \`/career-roles/reference\` | (auth-scope) | USER-FACING (read) | \`(unknown)\` | — | — |

### catalogs (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/catalogs/items\` | catalogs.read | USER-FACING (read) | \`items\` | — | Paginated catalog types (catalogs.read) |
| \`POST\` | \`/catalogs/items\` | catalogs.manage | USER-FACING (mutation) | \`createItem\` | — | Create catalog type (catalogs.manage; audited) |
| \`PATCH\` | \`/catalogs/items/:id\` | catalogs.manage | USER-FACING (mutation) | \`updateItem\` | — | Create catalog type (catalogs.manage; audited) |
| \`GET\` | \`/catalogs/types\` | (auth-scope) | USER-FACING (read) | \`types\` | — | — |
| \`POST\` | \`/catalogs/types\` | catalogs.read | USER-FACING (mutation) | \`createType\` | — | Paginated items of a type (?typeCode=…) |

### certificates (9 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/certificates\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`GET\` | \`/certificates/:id\` | PUBLIC | USER-FACING (public) | \`getOne\` | — | PUBLIC verification (no auth, spec 47/48): issued → { valid: true, certificateNumber, holderName, role, projectName, issuedAt }; revoked → { valid: false, statu |
| \`GET\` | \`/certificates/:id/pdf\` | certificates.manage | USER-FACING (read) | \`pdfAdmin\` | — | REVOKE (admin, spec 50): requires a reason, preserves the record with revoke metadata, notifies the intern, writes audit + activity; second revoke → 409 CERTIFI |
| \`POST\` | \`/certificates/:id/revoke\` | certificates.view | USER-FACING (mutation) | \`revoke\` | — | One certificate (certificates.view) |
| \`POST\` | \`/certificates/issue\` | certificates.view | USER-FACING (mutation) | \`issue\` | — | Certificate list (certificates.view; filters userId/status + pagination) |
| \`GET\` | \`/certificates/verify/:code\` | certificates.manage | USER-FACING (read) | \`verify\` | — | Issue a certificate (admin): deterministic V-INTERN-COMPLETE v1 eligibility (recruitment passed + completed assignment + finalized evaluation >= 70 + finalized  |
| \`GET\` | \`/intern/me/certificates\` | (auth-scope) | USER-FACING (read) | \`myCertificates\` | — | — |
| \`GET\` | \`/intern/me/certificates/:id\` | certificates.view.own | USER-FACING (read) | \`myCertificate\` | — | My certificates (identity = principal) |
| \`GET\` | \`/intern/me/certificates/:id/pdf\` | certificates.view.own | USER-FACING (read) | \`myCertificatePdf\` | — | My certificates (identity = principal) |

### code-review (2 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/submissions/:id/code-reviews\` | (auth-scope) | USER-FACING (read) | \`run\` | — | — |
| \`POST\` | \`/submissions/:id/code-reviews\` | (auth-scope) | USER-FACING (mutation) | \`run\` | — | — |

### communications (3 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/admin/communications\` | communications.manage | USER-FACING (read) | \`list\` | — | — |
| \`GET\` | \`/admin/communications/:id/preview\` | communications.manage | USER-FACING (read) | \`preview\` | — | — |
| \`POST\` | \`/admin/communications/:id/resend\` | communications.manage | USER-FACING (mutation) | \`resend\` | — | — |

### dashboard (12 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/dashboard/academic\` | catalogs.read, roles.read, permissions.read, groups.read, users.read | READ-ONLY (batch support) | \`academic\` | — | — |
| \`GET\` | \`/dashboard/academic-overview\` | catalogs.read, roles.read, permissions.read, groups.read, users.read, sessions.view, projects.view | READ-ONLY (batch support) | \`academicOverview\` | — | — |
| \`GET\` | \`/dashboard/access\` | catalogs.read | READ-ONLY (batch support) | \`access\` | — | — |
| \`GET\` | \`/dashboard/admin\` | users.read, roles.read, sessions.view, projects.view, tasks.view, sprints.view | USER-FACING (read) | \`admin\` | — | — |
| \`GET\` | \`/dashboard/catalogs\` | (auth-scope) | READ-ONLY (batch support) | \`catalogs\` | — | — |
| \`GET\` | \`/dashboard/instructor\` | sessions.view, projects.view, tasks.view, sprints.view, users.read, roles.read, audit.read | USER-FACING (read) | \`instructor\` | — | — |
| \`GET\` | \`/dashboard/sprints/:id/burndown\` | roles.read, permissions.read, groups.read, users.read, sessions.view, projects.view | USER-FACING (read) | \`burndown\` | — | — |
| \`GET\` | \`/dashboard/user-roles\` | catalogs.read, roles.read, permissions.read, groups.read | READ-ONLY (batch support) | \`userRoles\` | — | — |
| \`GET\` | \`/imported-reviews\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`PATCH\` | \`/imported-reviews/:id\` | evaluations.view | USER-FACING (mutation) | \`update\` | — | — |
| \`GET\` | \`/reference-screens\` | (auth-scope) | INTERNAL (design fixtures) | \`list\` | — | — |
| \`GET\` | \`/reference-screens/:key\` | (auth-scope) | INTERNAL (design fixtures) | \`get\` | — | List explicitly labelled image-reference sample screens |

### evaluation (18 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/evaluation-cycles\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/evaluation-cycles\` | evaluations.view | USER-FACING (mutation) | \`create\` | — | List evaluation cycles (evaluations.view; filters: status/sessionId/projectId) |
| \`GET\` | \`/evaluation-cycles/:id\` | evaluations.manage | USER-FACING (read) | \`getOne\` | — | Create a draft cycle; seeds the documented evaluation-v1 template (35/30/20/15) by default — criteria editable only while draft |
| \`PATCH\` | \`/evaluation-cycles/:id\` | evaluations.view | USER-FACING (mutation) | \`update\` | — | One evaluation cycle (evaluations.view) |
| \`GET\` | \`/evaluation-cycles/:id/criteria\` | evaluations.manage | USER-FACING (read) | \`criteria\` | — | Explicit cycle state transition (draft→open\|archived, open→closed, closed→archived); opening requires active criteria weights to total exactly 100% |
| \`POST\` | \`/evaluation-cycles/:id/criteria\` | evaluations.view | USER-FACING (mutation) | \`addCriterion\` | — | Cycle criteria with weights (evaluations.view) |
| \`PATCH\` | \`/evaluation-cycles/:id/criteria/:criterionId\` | evaluations.manage | USER-FACING (mutation) | \`updateCriterion\` | — | Add a criterion (draft cycles only; weight 0<w<=100) |
| \`DELETE\` | \`/evaluation-cycles/:id/criteria/:criterionId\` | evaluations.manage | USER-FACING (mutation) | \`deleteCriterion\` | — | Update a criterion (draft cycles only) |
| \`POST\` | \`/evaluation-cycles/:id/status\` | evaluations.manage | USER-FACING (mutation) | \`changeStatus\` | — | Update a DRAFT cycle (name/dates) — open/closed/archived cycles are immutable |
| \`GET\` | \`/evaluations\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/evaluations\` | evaluations.view | USER-FACING (mutation) | \`create\` | — | List evaluations (evaluations.view; filters cycleId/internId/evaluatorId/status) |
| \`GET\` | \`/evaluations/:id\` | evaluations.manage | USER-FACING (read) | \`getOne\` | — | Create a draft evaluation in an OPEN cycle; evaluator defaults to principal; intern must belong to the cycle scope; ownership enforced (spec 61) |
| \`PATCH\` | \`/evaluations/:id\` | evaluations.view | USER-FACING (mutation) | \`update\` | — | One evaluation with criterion scores (evaluations.view) |
| \`POST\` | \`/evaluations/:id/finalize\` | evaluations.manage | USER-FACING (mutation) | \`finalize\` | — | draft → submitted: validates required criteria + weights == 100 (evaluator-owned) |
| \`POST\` | \`/evaluations/:id/revisions\` | evaluations.manage | USER-FACING (mutation) | \`revise\` | — | submitted → finalized: backend recomputes the weighted overall, locks the evaluation, writes audit + activity and notifies the intern (one transaction) |
| \`POST\` | \`/evaluations/:id/submit\` | evaluations.manage | USER-FACING (mutation) | \`submit\` | — | Upsert criterion scores (0..criterion.maxScore) + summary on a draft/submitted evaluation; overallScore is ALWAYS recomputed server-side (spec 12) |
| \`GET\` | \`/intern/me/evaluations\` | (auth-scope) | USER-FACING (read) | \`myEvaluations\` | — | — |
| \`GET\` | \`/intern/me/evaluations/:id\` | evaluations.view.own | USER-FACING (read) | \`myEvaluation\` | — | My FINALIZED evaluations with scores (identity = principal; drafts/submitted are internal) |

### github (17 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/github/callback\` | settings.update | INTEGRATION | \`callback\` | — | — |
| \`POST\` | \`/github/connect\` | settings.read, settings.update | USER-FACING (mutation) | \`connect\` | — | — |
| \`GET\` | \`/github/me\` | (auth-scope) | USER-FACING (read) | \`repositoryAccountStatus\` | — | — |
| \`DELETE\` | \`/github/me\` | (auth-scope) | USER-FACING (mutation) | \`provision\` | — | — |
| \`GET\` | \`/github/me/repository-access\` | sessions.manage, recruitment.view, assignments.manage | USER-FACING (read) | \`own\` | — | — |
| \`GET\` | \`/github/repository-account\` | (auth-scope) | USER-FACING (read) | \`repositoryAccountStatus\` | — | — |
| \`POST\` | \`/github/repository-account\` | settings.read | USER-FACING (mutation) | \`selectRepositoryAccount\` | — | — |
| \`GET\` | \`/sessions/:id/github\` | (auth-scope) | USER-FACING (read) | \`provision\` | — | — |
| \`GET\` | \`/sessions/:id/github/activity\` | sessions.manage | USER-FACING (read) | \`githubActivity\` | — | — |
| \`POST\` | \`/sessions/:id/github/invite\` | sessions.manage | USER-FACING (mutation) | \`invite\` | — | — |
| \`POST\` | \`/sessions/:id/github/members/:userId/invite\` | sessions.manage | USER-FACING (mutation) | \`inviteMember\` | — | — |
| \`POST\` | \`/sessions/:id/github/provision\` | (auth-scope) | USER-FACING (mutation) | \`provision\` | — | — |
| \`POST\` | \`/sessions/:id/github/reconcile\` | sessions.manage | USER-FACING (mutation) | \`reconcile\` | — | — |
| \`POST\` | \`/sessions/:id/github/webhook\` | sessions.manage | USER-FACING (mutation) | \`configureWebhook\` | — | — |
| \`GET\` | \`/sessions/:id/participation/repository-access-jobs\` | (auth-scope) | USER-FACING (read) | \`report\` | — | — |
| \`POST\` | \`/sessions/:id/participation/repository-access-jobs/:jobId/retry\` | sessions.manage, recruitment.view, assignments.manage | USER-FACING (mutation) | \`retry\` | — | — |
| \`POST\` | \`/github/webhook\` | PUBLIC | INTEGRATION | \`receive\` | — | — |

### groups (8 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/groups\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/groups\` | groups.read | USER-FACING (mutation) | \`create\` | — | Paginated groups (groups.read) |
| \`PATCH\` | \`/groups/:id\` | groups.read, groups.manage | USER-FACING (mutation) | \`update\` | — | Paginated groups (groups.read) |
| \`GET\` | \`/groups/:id/members\` | groups.manage | USER-FACING (read) | \`members\` | — | Create group (groups.manage; audited) |
| \`POST\` | \`/groups/:id/members\` | groups.manage, groups.read | USER-FACING (mutation) | \`addMembers\` | — | Update group (groups.manage; audited) |
| \`DELETE\` | \`/groups/:id/members/:userId\` | groups.read, groups.manage | USER-FACING (mutation) | \`removeMember\` | — | List group members (groups.read) |
| \`PUT\` | \`/groups/:id/roles\` | groups.manage | USER-FACING (mutation) | \`setRoles\` | — | Remove member (audited) |
| \`GET\` | \`/groups/:id/roles\` | groups.manage | USER-FACING (read) | \`roles\` | — | Replace group role set (groups.manage; audited) |

### health (1 endpoint)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/health\` | PUBLIC | INTEGRATION | \`check\` | — | — |

### intern (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/intern/me/project\` | (auth-scope) | USER-FACING (read) | \`project\` | — | — |
| \`GET\` | \`/intern/me/sprint/board\` | intern.workspace.view | USER-FACING (read) | \`sprintBoard\` | — | My active assignment project details and technologies; principal identity only; recruitment gate; 404 when unassigned. No broad projects.view permission require |
| \`GET\` | \`/intern/me/sprints\` | intern.workspace.view | USER-FACING (read) | \`sprints\` | — | My current sprint board with ONLY my tasks and true per-column counts; principal/assignment scoped, paginated per column; 404 when no active assignment/sprint. |
| \`GET\` | \`/intern/me/sprints/:id/board\` | intern.workspace.view | USER-FACING (read) | \`selectedSprintBoard\` | — | Planned, active and historical sprints in my active assignment; authenticated principal only. |
| \`GET\` | \`/intern/me/workspace\` | intern.workspace.view | USER-FACING (read) | \`workspace\` | — | Selected assignment sprint board with only my tasks, including planned sprints; never activates a sprint. |

### knowledge (10 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/admin/knowledge\` | knowledge.read | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/admin/knowledge\` | (auth-scope) | USER-FACING (mutation) | \`(unknown)\` | — | — |
| \`GET\` | \`/admin/knowledge/:code\` | knowledge.read | USER-FACING (read) | \`get\` | — | — |
| \`PUT\` | \`/admin/knowledge/:code\` | knowledge.read, knowledge.manage | USER-FACING (mutation) | \`(unknown)\` | — | — |
| \`POST\` | \`/admin/knowledge/:code/archive\` | knowledge.read, knowledge.manage, knowledge.publish | USER-FACING (mutation) | \`(unknown)\` | — | — |
| \`GET\` | \`/admin/knowledge/:code/publication-check\` | knowledge.read | USER-FACING (read) | \`check\` | — | — |
| \`POST\` | \`/admin/knowledge/:code/publish\` | knowledge.read, knowledge.manage | USER-FACING (mutation) | \`(unknown)\` | — | — |
| \`POST\` | \`/admin/knowledge/:code/restore\` | knowledge.read, knowledge.publish, knowledge.manage | USER-FACING (mutation) | \`(unknown)\` | — | — |
| \`GET\` | \`/admin/knowledge/:code/revisions\` | knowledge.read | USER-FACING (read) | \`history\` | — | — |
| \`POST\` | \`/admin/knowledge/import/dry-run\` | knowledge.read, knowledge.manage | USER-FACING (mutation) | \`(unknown)\` | — | — |

### kpi (11 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/intern/me/kpi\` | (auth-scope) | USER-FACING (read) | \`myResults\` | — | — |
| \`GET\` | \`/intern/me/kpi/:id\` | kpi.view.own | USER-FACING (read) | \`myResult\` | — | My KPI results with their periods (identity = principal) |
| \`GET\` | \`/kpi-periods\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/kpi-periods\` | kpi.view | USER-FACING (mutation) | \`create\` | — | List KPI periods (kpi.view; filter: status) |
| \`GET\` | \`/kpi-periods/:id\` | kpi.view, kpi.manage | USER-FACING (read) | \`getOne\` | — | List KPI periods (kpi.view; filter: status) |
| \`PATCH\` | \`/kpi-periods/:id\` | kpi.manage, kpi.view | USER-FACING (mutation) | \`update\` | — | Create a KPI period (kpi.manage = admin policy): ruleVersion is pinned to kpi-v1 |
| \`POST\` | \`/kpi-periods/:id/calculate\` | kpi.manage | USER-FACING (mutation) | \`calculate\` | — | Explicit KPI period transition; finalized uses canonical readiness/audit/notification checks; calculating is engine-managed (spec 23) |
| \`POST\` | \`/kpi-periods/:id/finalize\` | kpi.manage | USER-FACING (mutation) | \`finalize\` | — | Run the deterministic kpi-v1 batch (open→calculating→open): per-user results + full component provenance; concurrent request → 409 KPI_CALCULATION_IN_PROGRESS;  |
| \`GET\` | \`/kpi-periods/:id/results\` | kpi.manage | USER-FACING (read) | \`results\` | — | open → finalized after a successful current calculation; stale/failed/missing calculation → 409 KPI_CALCULATION_REQUIRED; locks the period and notifies calculat |
| \`POST\` | \`/kpi-periods/:id/status\` | kpi.view, kpi.manage | USER-FACING (mutation) | \`changeStatus\` | — | One KPI period (kpi.view) |
| \`GET\` | \`/kpi-results/:id\` | (auth-scope) | USER-FACING (read) | \`getOne\` | — | — |

### notifications (6 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/notifications\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/notifications/:id/read\` | (auth-scope) | USER-FACING (mutation) | \`markRead\` | — | Effective preferences (missing row = enabled) |
| \`GET\` | \`/notifications/preferences\` | (auth-scope) | USER-FACING (read) | \`preferences\` | — | Own notifications (paginated, optional unread filter) |
| \`PUT\` | \`/notifications/preferences\` | (auth-scope) | USER-FACING (mutation) | \`setPreference\` | — | Unread badge count |
| \`POST\` | \`/notifications/read-all\` | (auth-scope) | USER-FACING (mutation) | \`markAllRead\` | — | Upsert one preference |
| \`GET\` | \`/notifications/unread-count\` | (auth-scope) | USER-FACING (read) | \`unreadCount\` | — | Own notifications (paginated, optional unread filter) |

### participation (11 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/participation/me\` | (auth-scope) | USER-FACING (read) | \`own\` | — | — |
| \`GET\` | \`/participation/me/replacements\` | sessions.manage, recruitment.view, assignments.manage | USER-FACING (read) | \`own\` | — | — |
| \`GET\` | \`/sessions/:id/participation\` | (auth-scope) | USER-FACING (read) | \`report\` | — | — |
| \`POST\` | \`/sessions/:id/participation/incidents/:incidentId/replacement-advice\` | sessions.manage | USER-FACING (mutation) | \`adviseReplacement\` | — | — |
| \`POST\` | \`/sessions/:id/participation/incidents/:incidentId/replacement-preview\` | (auth-scope) | USER-FACING (mutation) | \`prepare\` | — | — |
| \`POST\` | \`/sessions/:id/participation/incidents/:incidentId/resolve\` | sessions.manage | USER-FACING (mutation) | \`resolve\` | — | — |
| \`POST\` | \`/sessions/:id/participation/policy\` | sessions.manage | USER-FACING (mutation) | \`savePolicy\` | — | — |
| \`POST\` | \`/sessions/:id/participation/refresh\` | sessions.manage | USER-FACING (mutation) | \`refresh\` | — | — |
| \`GET\` | \`/sessions/:id/participation/replacements/:commandId\` | sessions.manage, recruitment.view, assignments.manage | USER-FACING (read) | \`get\` | — | — |
| \`POST\` | \`/sessions/:id/participation/replacements/:commandId/approve\` | sessions.manage, recruitment.view, assignments.manage | USER-FACING (mutation) | \`approve\` | — | — |
| \`POST\` | \`/sessions/:id/participation/tasks/:taskId/extend\` | sessions.manage | USER-FACING (mutation) | \`extend\` | — | — |

### performance (4 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/intern/me/performance\` | (auth-scope) | USER-FACING (read) | \`me\` | — | — |
| \`GET\` | \`/performance/interns\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`GET\` | \`/performance/interns/:userId\` | performance.view | USER-FACING (read) | \`getOne\` | — | Deterministic intern performance list (performance.view): real task/story-point/evaluation metrics; instructors see only interns they own (session instructor /  |
| \`GET\` | \`/performance/interns/:userId/detail\` | performance.view | USER-FACING (read) | \`studentDetail\` | — | Full deterministic metrics for ONE intern (performance.view): taskCompletionRate, storyPointCompletionRate, onTimeCompletionRate (null when no due-dated complet |

### projects (10 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/projects\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/projects\` | projects.view | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/projects/:id\` | projects.view, projects.manage | USER-FACING (read) | \`getOne\` | — | Create project (projects.manage; audited; technologies relational) |
| \`PATCH\` | \`/projects/:id\` | projects.manage, projects.view | USER-FACING (mutation) | \`update\` | — | Create project (projects.manage; audited; technologies relational) |
| \`POST\` | \`/projects/:id/claim\` | projects.view | USER-FACING (mutation) | \`claim\` | — | Sessions running on this project, scoped to managed ones (project history across cohorts) |
| \`GET\` | \`/projects/:id/members\` | projects.manage | USER-FACING (read) | \`members\` | — | Update project (projects.manage; archived is terminal → 409 PROJECT_ARCHIVED; technologies REPLACE strategy) |
| \`GET\` | \`/projects/:id/sessions\` | projects.view | USER-FACING (read) | \`sessions\` | — | Project members (projects.view; membership is assignment-driven; managed scope) |
| \`GET\` | \`/projects/:id/slots\` | projects.manage | USER-FACING (read) | \`slots\` | — | Claim an unmentored library project (projects.manage; 409 when already claimed) |
| \`PUT\` | \`/projects/:id/slots\` | projects.view | USER-FACING (mutation) | \`setSlots\` | — | Claim an unmentored library project (projects.manage; 409 when already claimed) |
| \`GET\` | \`/projects/filter-options\` | (auth-scope) | USER-FACING (read) | \`filterOptions\` | — | — |

### rbac (3 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/permissions\` | roles.read | USER-FACING (read) | \`permissions\` | — | Paginated roles (roles.read) |
| \`GET\` | \`/roles\` | (auth-scope) | USER-FACING (read) | \`roles\` | — | — |
| \`GET\` | \`/roles/:id/permissions\` | permissions.read | USER-FACING (read) | \`rolePermissions\` | — | Paginated permissions (permissions.read) |

### recruitment (21 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/admin/question-bank\` | recruitment.manage | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/admin/question-bank\` | recruitment.manage | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/admin/question-bank/:id\` | recruitment.manage | USER-FACING (read) | \`get\` | — | — |
| \`PUT\` | \`/admin/question-bank/:id\` | recruitment.manage | USER-FACING (mutation) | \`update\` | — | — |
| \`DELETE\` | \`/admin/question-bank/:id\` | (auth-scope) | USER-FACING (mutation) | \`retire\` | — | — |
| \`GET\` | \`/recruitment/candidates\` | recruitment.view.own | USER-FACING (read) | \`candidates\` | — | My authoritative recruitment result (backend-computed scores + decision) |
| \`GET\` | \`/recruitment/candidates/:userId\` | recruitment.view | USER-FACING (read) | \`candidate\` | — | Candidate recruitment status list (instructor/admin read-only) |
| \`GET\` | \`/recruitment/me\` | (auth-scope) | USER-FACING (read) | \`me\` | — | — |
| \`GET\` | \`/recruitment/me/interviews\` | recruitment.view.own | USER-FACING (read) | \`history\` | — | My recruitment profile: status, attempts, cooldown, latest result (spec 41) |
| \`POST\` | \`/recruitment/me/interviews\` | recruitment.view.own, recruitment.start.own | USER-FACING (mutation) | \`startInterview\` | — | My interview attempts and persisted results, newest attempt first |
| \`GET\` | \`/recruitment/me/interviews/:id\` | recruitment.start.own | USER-FACING (read) | \`getSession\` | — | Start an interview session: 10 sequential questions (2 introduction + 6 technical + 2 English), backend timer, attempt+cooldown enforced |
| \`PUT\` | \`/recruitment/me/interviews/:id/answers/:questionId\` | recruitment.answer.own | USER-FACING (mutation) | \`saveAnswer\` | — | — |
| \`GET\` | \`/recruitment/me/interviews/:id/conversation\` | recruitment.answer.own | USER-FACING (read) | \`conversationView\` | — | My interview session status (own sessions only; 404-safe) |
| \`POST\` | \`/recruitment/me/interviews/:id/conversation/clarify\` | recruitment.answer.own, recruitment.view.own | USER-FACING (mutation) | \`clarifyConversation\` | — | Sanitized questions of MY session: id/position/category/prompt/answered — NEVER rubric or expected answers (spec 42) |
| \`POST\` | \`/recruitment/me/interviews/:id/conversation/next\` | recruitment.view.own, recruitment.answer.own | USER-FACING (mutation) | \`nextConversation\` | — | — |
| \`PUT\` | \`/recruitment/me/interviews/:id/follow-ups/:questionId\` | recruitment.answer.own | USER-FACING (mutation) | \`answerFollowUp\` | — | Save/update MY answer for a session question (only while in_progress and before backend expiry — spec 16/17) |
| \`GET\` | \`/recruitment/me/interviews/:id/questions\` | recruitment.view.own | USER-FACING (read) | \`getQuestions\` | — | Start an interview session: 10 sequential questions (2 introduction + 6 technical + 2 English), backend timer, attempt+cooldown enforced |
| \`POST\` | \`/recruitment/me/interviews/:id/retry-evaluation\` | recruitment.submit.own | USER-FACING (mutation) | \`retryEvaluation\` | — | Submit the interview (idempotent): validates completeness + backend timer, then runs the AI evaluation; Backend computes overall = 0.7*technical + 0.3*soft and  |
| \`POST\` | \`/recruitment/me/interviews/:id/submit\` | recruitment.answer.own | USER-FACING (mutation) | \`submit\` | — | — |
| \`GET\` | \`/recruitment/me/result\` | recruitment.submit.own | USER-FACING (read) | \`myResult\` | — | Retry a failed evaluation (evaluation_failed only): same snapshots, same answers, no duplicate result (spec 39/40) |
| \`PATCH\` | \`/recruitment/me/role\` | recruitment.view.own | USER-FACING (mutation) | \`selectRole\` | — | My recruitment profile: status, attempts, cooldown, latest result (spec 41) |

### reports (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/reports\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/reports\` | performance.view | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/reports/:id\` | performance.view | USER-FACING (read) | \`get\` | — | — |
| \`GET\` | \`/reports/:id/pdf\` | performance.view | USER-FACING (read) | \`download\` | — | — |
| \`GET\` | \`/reports/:id/xlsx\` | performance.view | USER-FACING (read) | \`downloadExcel\` | — | — |

### salary (6 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/intern/me/virtual-salary\` | (auth-scope) | USER-FACING (read) | \`myBalance\` | — | — |
| \`GET\` | \`/intern/me/virtual-salary/ledger\` | virtual_salary.view.own | USER-FACING (read) | \`myLedger\` | — | My global VIRTUAL ledger balance (identity = principal); optional kpiPeriodId scopes earnedThisPeriod only; this is a virtual unit and NEVER real payroll (spec  |
| \`GET\` | \`/virtual-salary\` | virtual_salary.manage | USER-FACING (read) | \`list\` | — | Ledger adjustment (admin): bonus (+), penalty (−), signed adjustment, or reversal of an existing row — always reason + audit + notification; no hidden balance e |
| \`POST\` | \`/virtual-salary/adjustments\` | virtual_salary.manage | USER-FACING (mutation) | \`adjust\` | — | Generate virtual salary from a FINALIZED KPI period (admin): base from the virtual_salary.base_amount setting (missing → 409 VIRTUAL_SALARY_CONFIG_MISSING); UNI |
| \`POST\` | \`/virtual-salary/generate/:kpiPeriodId\` | (auth-scope) | USER-FACING (mutation) | \`generate\` | — | — |
| \`GET\` | \`/virtual-salary/users/:userId/balance\` | virtual_salary.view | USER-FACING (read) | \`balance\` | — | Ledger list (admin; filters userId/type/kpiPeriodId + pagination) |

### sessions (19 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/sessions\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/sessions\` | (auth-scope) | USER-FACING (mutation) | \`create\` | — | Session management overview (sessions.view; bounded aggregate queries; scoped; no N+1) |
| \`GET\` | \`/sessions/:id\` | sessions.view | USER-FACING (read) | \`getOne\` | — | — |
| \`PATCH\` | \`/sessions/:id\` | sessions.view, tasks.view | USER-FACING (mutation) | \`update\` | — | — |
| \`GET\` | \`/sessions/:id/instructors\` | sessions.manage | USER-FACING (read) | \`instructors\` | — | Remove member (audited) |
| \`POST\` | \`/sessions/:id/instructors\` | sessions.view | USER-FACING (mutation) | \`addInstructors\` | — | Session instructors (sessions.view; managed scope only) |
| \`DELETE\` | \`/sessions/:id/instructors/:userId\` | sessions.manage | USER-FACING (mutation) | \`removeInstructor\` | — | Add instructors (sessions.manage; DB-resolved permission check on each target — 403 INSTRUCTOR_PERMISSION_MISSING) |
| \`GET\` | \`/sessions/:id/members\` | (auth-scope) | USER-FACING (read) | \`members\` | — | — |
| \`POST\` | \`/sessions/:id/members\` | sessions.view | USER-FACING (mutation) | \`addMembers\` | — | Session members (sessions.view; managed scope only) |
| \`DELETE\` | \`/sessions/:id/members/:userId\` | sessions.manage | USER-FACING (mutation) | \`removeMember\` | — | Session members (sessions.view; managed scope only) |
| \`GET\` | \`/sessions/:id/milestones\` | sessions.manage | USER-FACING (read) | \`milestones\` | — | Remove instructor (audited) |
| \`POST\` | \`/sessions/:id/milestones\` | sessions.view | USER-FACING (mutation) | \`createMilestone\` | — | Session milestones (sessions.view; ordered by sortOrder; managed scope only) |
| \`PATCH\` | \`/sessions/:id/milestones/:milestoneId\` | sessions.manage | USER-FACING (mutation) | \`updateMilestone\` | — | Create milestone (sessions.manage; audited) |
| \`DELETE\` | \`/sessions/:id/milestones/:milestoneId\` | sessions.manage | USER-FACING (mutation) | \`deleteMilestone\` | — | Update milestone (sessions.manage; audited) |
| \`GET\` | \`/sessions/:id/timeline\` | sessions.view, tasks.view | USER-FACING (read) | \`timeline\` | — | Session work page with dependency, latest submission and AI/human review facts; managed task scope |
| \`GET\` | \`/sessions/:id/work\` | sessions.view | USER-FACING (read) | \`delivery\` | — | Session detail (sessions.view; managed scope only) |
| \`GET\` | \`/sessions/instructor-options\` | sessions.manage | USER-FACING (read) | \`instructorOptions\` | — | Create session (sessions.manage; audited) |
| \`GET\` | \`/sessions/member-options\` | sessions.manage | USER-FACING (read) | \`memberOptions\` | — | Search/paginate qualified active instructors; public identity fields only, effective sessions.manage grants including groups |
| \`GET\` | \`/sessions/overview\` | sessions.view | USER-FACING (read) | \`overview\` | — | Paginated sessions (sessions.view; filters: q, status; scoped to managed sessions) |

### settings (2 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/settings\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`PATCH\` | \`/settings\` | settings.read | USER-FACING (mutation) | \`update\` | — | All system settings (settings.read) |

### sprints (7 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/sprints\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/sprints\` | sprints.view | USER-FACING (mutation) | \`create\` | — | Paginated sprints (sprints.view; filters: projectId, sessionId, status; managed scope only) |
| \`GET\` | \`/sprints/:id\` | sprints.manage | USER-FACING (read) | \`getOne\` | — | Create sprint (sprints.manage; planned status; ONE tx with audit; 409 PROJECT_NOT_ASSIGNABLE / SPRINT_CODE_TAKEN / 404 PROJECT_NOT_FOUND / SESSION_NOT_FOUND) |
| \`PATCH\` | \`/sprints/:id\` | sprints.view | USER-FACING (mutation) | \`update\` | — | Sprint detail (sprints.view; includes project/session summaries; managed scope only) |
| \`GET\` | \`/sprints/:id/board\` | sprints.manage | USER-FACING (read) | \`board\` | — | Sprint status transition (sprints.manage; legal: planned→active\|cancelled, active→completed\|cancelled; 409 INVALID_SPRINT_TRANSITION / SPRINT_ACTIVE_EXISTS /  |
| \`GET\` | \`/sprints/:id/completion\` | (auth-scope) | USER-FACING (read) | \`completion\` | — | — |
| \`POST\` | \`/sprints/:id/status\` | sprints.manage | USER-FACING (mutation) | \`transition\` | — | Update sprint metadata (sprints.manage; name/description/goal/dates; terminal sprints frozen → 409 INVALID_SPRINT_TRANSITION; 400 INVALID_SPRINT_DATES) |

### submissions (4 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`POST\` | \`/submissions/:id/review\` | tasks.update.own | USER-FACING (mutation) | \`review\` | — | — |
| \`POST\` | \`/submissions/:id/withdraw\` | tasks.update.own | USER-FACING (mutation) | \`withdraw\` | — | — |
| \`GET\` | \`/tasks/:id/submissions\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/tasks/:id/submissions\` | (auth-scope) | USER-FACING (mutation) | \`submit\` | — | — |

### tasks (9 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/tasks\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/tasks\` | (auth-scope) | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/tasks/:id\` | tasks.manage | USER-FACING (read) | \`getOne\` | — | Create task (tasks.manage; ONE tx: project lock+active check, sprint/project match, assignee active-assignment check, SEQUENCE code, history seed, notification+ |
| \`PATCH\` | \`/tasks/:id\` | (auth-scope) | USER-FACING (mutation) | \`update\` | — | Task detail (assignee OR tasks.view/tasks.manage; 403 TASK_ACCESS_DENIED otherwise) |
| \`DELETE\` | \`/tasks/:id\` | tasks.update.own | USER-FACING (mutation) | \`remove\` | — | Intern updates OWN task (tasks.update.own; identity = authenticated principal; ONLY status todo→doing / doing→review + progress; 403 TASK_NOT_OWNED / ASSIGNMENT |
| \`GET\` | \`/tasks/:id/comments\` | tasks.manage | USER-FACING (read) | \`listComments\` | — | Soft-delete task (tasks.manage; deletedAt set, history preserved, audited) |
| \`POST\` | \`/tasks/:id/comments\` | (auth-scope) | USER-FACING (mutation) | \`addComment\` | — | Task comments (paginated, oldest first; assignee OR tasks.view/tasks.manage) |
| \`GET\` | \`/tasks/:id/history\` | (auth-scope) | USER-FACING (read) | \`listHistory\` | — | Add task comment (assignee OR tasks.manage holders; content 1..2000; comments on inaccessible tasks rejected 403 TASK_ACCESS_DENIED) |
| \`PATCH\` | \`/tasks/:id/my\` | tasks.manage | USER-FACING (mutation) | \`updateOwn\` | — | Update task (tasks.manage; metadata + sprint move + assignee change + optional status transition incl. rework review→doing; history + notifications + audit in O |

### templates (17 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/intern/me/projects/:id/learning-package\` | (auth-scope) | USER-FACING (read) | \`ownPackage\` | — | — |
| \`POST\` | \`/project-changes/:id/apply\` | projects.manage | USER-FACING (mutation) | \`apply\` | — | — |
| \`GET\` | \`/project-templates\` | projects.manage, templates.assessment.read | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/project-templates\` | projects.manage, templates.assessment.read | USER-FACING (mutation) | \`create\` | — | — |
| \`GET\` | \`/project-templates/:id\` | projects.manage, templates.assessment.read | USER-FACING (read) | \`get\` | — | — |
| \`PATCH\` | \`/project-templates/:id\` | projects.manage | USER-FACING (mutation) | \`update\` | — | — |
| \`GET\` | \`/project-templates/:id/assessment\` | projects.manage, templates.assessment.read | USER-FACING (read) | \`assessment\` | — | — |
| \`GET\` | \`/project-templates/:id/revisions\` | intern.workspace.view | USER-FACING (read) | \`history\` | — | — |
| \`GET\` | \`/project-templates/:id/revisions/:version\` | intern.workspace.view, projects.manage | USER-FACING (read) | \`revision\` | — | — |
| \`GET\` | \`/project-templates/:id/revisions/:version/assessment\` | intern.workspace.view, projects.manage | USER-FACING (read) | \`revisionAssessment\` | — | — |
| \`POST\` | \`/project-templates/:id/start\` | projects.manage | USER-FACING (mutation) | \`start\` | — | — |
| \`GET\` | \`/projects/:id/changes\` | projects.manage | USER-FACING (read) | \`changes\` | — | — |
| \`POST\` | \`/projects/:id/changes\` | projects.manage | USER-FACING (mutation) | \`propose\` | — | — |
| \`GET\` | \`/projects/:id/template-assessment\` | projects.manage, templates.assessment.read | USER-FACING (read) | \`projectAssessment\` | — | — |
| \`GET\` | \`/projects/:id/template-context\` | projects.manage, sessions.manage, tasks.manage | USER-FACING (read) | \`context\` | — | — |
| \`GET\` | \`/tasks/:id/spec\` | projects.manage, sessions.manage, tasks.manage | USER-FACING (read) | \`spec\` | — | — |
| \`GET\` | \`/tasks/:id/spec/source\` | projects.manage, sessions.manage, tasks.manage | USER-FACING (read) | \`sourceSpec\` | — | — |

### users (5 endpoints)

| Method | Route | Permission | Phân loại | Handler | DTO (Body/Query) | Mô tả (swagger) |
|---|---|---|---|---|---|---|
| \`GET\` | \`/users\` | (auth-scope) | USER-FACING (read) | \`list\` | — | — |
| \`POST\` | \`/users\` | users.read | USER-FACING (mutation) | \`create\` | — | Paginated user list (users.read) |
| \`GET\` | \`/users/:id\` | users.create | USER-FACING (read) | \`getOne\` | — | Paginated user list (users.read) |
| \`PATCH\` | \`/users/:id\` | users.create, users.read | USER-FACING (mutation) | \`update\` | — | Create user (users.create; audited) |
| \`PATCH\` | \`/users/:id/status\` | users.read, users.update | USER-FACING (mutation) | \`setStatus\` | — | Get one user (users.read) |

## Danh sách permission code (52)

- `ai.evaluation.assist`
- `ai.mentor.use`
- `ai.recommendations.view.own`
- `applications.manage`
- `assignments.manage`
- `assignments.view`
- `audit.read`
- `catalogs.manage`
- `catalogs.read`
- `certificates.manage`
- `certificates.view`
- `certificates.view.own`
- `communications.manage`
- `evaluations.manage`
- `evaluations.view`
- `evaluations.view.own`
- `groups.manage`
- `groups.read`
- `intern.workspace.view`
- `knowledge.manage`
- `knowledge.publish`
- `knowledge.read`
- `kpi.manage`
- `kpi.view`
- `kpi.view.own`
- `performance.view`
- `permissions.read`
- `projects.manage`
- `projects.view`
- `recruitment.answer.own`
- `recruitment.manage`
- `recruitment.start.own`
- `recruitment.submit.own`
- `recruitment.view`
- `recruitment.view.own`
- `roles.read`
- `sessions.manage`
- `sessions.view`
- `settings.read`
- `settings.update`
- `sprints.manage`
- `sprints.view`
- `tasks.manage`
- `tasks.update.own`
- `tasks.view`
- `templates.assessment.read`
- `users.create`
- `users.read`
- `users.update`
- `virtual_salary.manage`
- `virtual_salary.view`
- `virtual_salary.view.own`

## Ghi chú ownership / scope (endpoint không có permission code)

- Các route `/intern/me/*`, `/recruitment/me/*`, `/applications/me`, `/github/me`… scope theo người gọi (JWT) — service kiểm ownership.
- `POST /evaluations/:id/revisions` có guard bổ sung: admin-role freshly resolved từ DB (spec 14 — sửa điểm đã chốt).
- `GET /sessions/:id` và một số route session được scope qua `resolveOwnership(permissionsService, userId)` (instructor quản lý hoặc member).
- Webhook/ callback: `POST /github/webhook` (public, xác thực chữ ký), `GET /github/callback` (OAuth redirect, settings.update).
