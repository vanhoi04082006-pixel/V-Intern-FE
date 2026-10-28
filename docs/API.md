# V-Intern Mock API — Hợp đồng backend (base: `/api/v1`)

- Backend: catch-all route `src/app/api/v1/[...path]/route.ts` → dispatch tới handlers trong `src/lib/server/handlers/*`, store in-memory trên `globalThis` (sống qua HMR).
- Auth: header `Authorization: Bearer <token>`. Login trả `{ accessToken, user }`. Sai token → 401 `{ statusCode:401, message, code:"UNAUTHORIZED" }`.
- List response chuẩn: `{ data: T[], meta: { total, page, pageSize, totalPages } }`. Query phân trang: `page` (default 1), `pageSize` (default 10).
- Lỗi chuẩn: `{ statusCode, message, code? }`. Codes hay dùng: `VALIDATION_ERROR` (400, kèm `details: string[]`), `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND` (404), `CONFLICT` (409), `INVALID_RESPONSE`.
- Toàn bộ text tiếng Việt. Thời gian ISO string. Tiền tệ: số nguyên (VND ảo).
- **Typed client cho FE** đặt chung một file `src/lib/client/api.ts` (agent backend viết + export đầy đủ types & hàm gọi từng nhóm). FE agents CHỈ import từ đây, không tự gọi fetch.

## Demo users (password chung `demo1234`)

| Email | Role | Tình trạng |
|---|---|---|
| an.nguyen@student.edu.vn | intern | ĐANG active — assignment vào session `SES-2025-01`, project "Sàn TMĐT EduMart", đủ data (task mọi trạng thái, submission + AI review, evaluations, KPI, lương, chứng chỉ, mentor chat, thông báo) |
| binh.tran@student.edu.vn | intern | `not_started` — demo onboarding + phỏng vấn AI |
| chi.pham@student.edu.vn | intern | `passed`, chưa có assignment (ứng viên cho instructor chọn) |
| dung.vo@student.edu.vn | intern | `failed` (thi lại được), có history |
| minh.ha@student.edu.vn | intern | active, assignment cùng session SES-2025-01 |
| hong.le@gv.edu.vn | instructor | phụ trách SES-2025-01 + SES-2025-02, có cycles/evaluations/reports |
| admin@vintern.edu.vn | admin | quản trị toàn bộ |

## 0. Auth

- `POST /auth/login` `{email,password}` → `{accessToken, user:{id,email,displayName,role,permissions[],avatarColor}}`. Sai → 401 `INVALID_CREDENTIALS`.
- `POST /auth/register` `{fullName,email,password,acceptedTerms}` → `{registered:true}`. Trùng email → 409 `EMAIL_EXISTS`. Role mặc định `intern`, user mới có recruitment profile `not_started`.
- `GET /auth/me` → user (401 nếu token sai).
- `POST /auth/logout` → 204.

## 1. Intern workspace

- `GET /intern/me/workspace` →
```json
{ "status": "active|unassigned|recruitment_required|recruitment_in_progress|recruitment_failed",
  "hasAssignmentHistory": true,
  "assignment": { "id","assignedAt","role":"frontend",
    "project": {"id","code":"PRJ-EDU","name":"Sàn TMĐT EduMart","status","description","techStack":["Next.js","PostgreSQL"]},
    "session": {"id","code":"SES-2025-01","name":"Thực tập Xuân 2025","status":"active","startDate","endDate"} },
  "recruitment": {"status","selectedRole","attemptCount","recruitedAt"},
  "currentSprint": {"id","code":"SPR-02","name":"Sprint 2 — Checkout & Thanh toán","status":"active","startDate","endDate","progress":62},
  "taskSummary": {"todo":3,"doing":2,"review":1,"done":8,"total":14},
  "focusedTask": {"id","code":"TSK-12","title":"Xây dựng trang giỏ hàng","status":"doing","priority":"high","dueDate","progress":45},
  "notificationsUnread": 3 }
```
  - Rule: user có assignment active → `active`; đã pass + chưa có assignment → `unassigned` (FE render màn chờ); recruitment chưa xong → `recruitment_required|in_progress|failed`.

## 2. Recruitment / Onboarding (intern)

- `GET /recruitment/me` → `{status:"not_started|role_selected|interview_in_progress|evaluation_pending|passed|failed", selectedRole, selectedRoleLabel, attemptNumber, attemptsRemaining, nextEligibleAt, currentInterviewSessionId, result}` (result = object mục Result bên dưới khi đã có).
- `GET /recruitment/me/interviews?page=&pageSize=5` → list `{id,roleCode,status:"completed|evaluation_failed",startedAt,submittedAt,attemptNumber,decision:"passed|failed|null,overallScore}`.
- `PATCH /recruitment/me/role` `{role:"frontend|backend|fullstack|qa|business_analyst"}` → recruitment profile sau cập nhật.
- `POST /recruitment/me/interviews` → bắt đầu (status `in_progress`, `expiresAt` = now+45 phút, attempt+1) → trả `{session, firstQuestion}`; nếu role chưa chọn → 400 `ROLE_REQUIRED`.
- `GET /recruitment/me/interviews/:id/conversation` → `{session:{id,status,secondsRemaining,...}, answeredCount, totalQuestions, messages:[{id,role:"ai|user",content,at}], currentQuestion:{id,position,phase:"introduction|technical|english|communication",kind:"main|follow_up",prompt,answer,status:"ready"} | null}`
  - Nếu session `evaluating` → trả thêm `{evaluating:true}`. FE poll 3s.
- `PUT /recruitment/me/interviews/:id/answers/:questionId` `{answerText}` → lưu answer, câu hỏi hiện tại chuyển sang answered.
- `POST /recruitment/me/interviews/:id/conversation/next` → câu hỏi kế (hoặc `currentQuestion:null` kèm `{finished:true}`).
- `POST /recruitment/me/interviews/:id/conversation/clarify` → `{message:"..."}` — AI giải thích lại câu hỏi (ghi thêm message role `ai`).
- `POST /recruitment/me/interviews/:id/skip` → bỏ qua câu hiện tại (câu bị đánh dấu skipped, không tính điểm).
- `POST /recruitment/me/interviews/:id/submit` → chuyển `evaluating`, đợi 2.5s (FE poll) rồi có result; status → completed; recruitment → passed/failed.
- `POST /recruitment/me/interviews/:id/retry-evaluation` → chạy lại đánh giá (kết quả có thể khác).
- `GET /recruitment/me/result` → result mới nhất hoặc null.
- Result shape:
```json
{ "id","sessionId","roleCode":"frontend","decision":"passed","technicalScore":78,"softSkillScore":82,"englishScore":70,"overallScore":77,
  "criteria":[{"code":"TECH_FOUNDATION","label":"Nền tảng kỹ thuật","score":78,"feedback":"..."}, ...4-5 tiêu chí],
  "strengths":["..."],"weaknesses":["..."],"feedback":"nhận xét tổng quan","recommendedRole":"frontend","evaluatedAt" }
```
- Đánh giá heuristic: mỗi câu hỏi có `expectedConcepts[]`; điểm câu = min(100, 40 + 8*mỗi khái niệm xuất hiện + độ dài hợp lý). Tổng hợp: technical từ câu technical, soft từ communication+introduction, english từ câu english. `overall = 0.5*tech + 0.3*soft + 0.2*english`. ≥60 passed.

## 3. Tasks & công việc

- `GET /tasks?mine=true&page=&pageSize=&status=&priority=&search=&sortBy=dueDate&sortOrder=asc` → page of Task. Intern truyền `mine=true`.
- Task: `{id, code:"TSK-01", title, description, status:"todo|doing|review|done", priority:"low|medium|high|critical", progress:0-100, storyPoints, dueDate, assigneeId, assigneeName, projectId, sprintId, sprintCode, version, role:"frontend", estimatedHours, createdAt}`
- `GET /tasks/:id` → Task + `dependencies:[{taskId,code,title,status}]`, `comments` (đã nhúng sẵn 3-5 comment cho demo), `history:[{fromStatus,toStatus,changedBy,at,reason}]`.
- `GET /tasks/:id/spec` → `{requirements, role, dod:["..."], documentation, expectedOutput, skillTags:["React","Zustand"], complexity:"medium", estimatedHours, blocked:false}`
- `GET /tasks/:id/comments` → page `{id,taskId,authorId,authorName,content,at}` · `POST /tasks/:id/comments` `{content}` → comment mới.
- `PATCH /tasks/:id/my` `{status?, progress?, reason?, expectedVersion}` → Task mới. Rule intern: `todo→doing→review` (không tự done). Sai version → 409.
- Quản lý (instructor): `POST /tasks` `{title,description,projectId,sprintId,assigneeId,priority,storyPoints,dueDate}` → Task `todo`; `PATCH /tasks/:id` (status bất kỳ hợp lệ, assignee, v.v.); `DELETE /tasks/:id`.

## 4. Sprint & project (intern)

- `GET /intern/me/sprint/board` → `{sprint:{id,code,name,goal,status,startDate,endDate,progress}, overdueOpenTaskCount, columns:[{status:"todo|doing|review|done", count, tasks:[Task]}]}`
- `GET /intern/me/project` → `{assignment:{id,role,assignedAt}, project:{id,code,name,description,status,techStack[],templateName}, session:{id,code,name,status,startDate,endDate}, members:[{userId,displayName,role,avatarColor}], sprints:[{id,code,name,status,progress,startDate,endDate}]}`

## 5. Submissions & AI code review

- `GET /tasks/:taskId/submissions` → `[{id,taskId,internId,internName,prUrl,summary,status:"submitted|approved|rework|withdrawn",score,feedback,headSha:"a1b2c3d",submittedAt}]`
- `POST /tasks/:taskId/submissions` `{prUrl, summary}` → tạo submission `submitted` + TỰ ĐỘNG tạo code review status `running`; task → `review`.
- `POST /submissions/:id/withdraw` → status `withdrawn`.
- `GET /submissions/:id/code-reviews` → `[{id,submissionId,status:"running|awaiting_instructor|needs_changes|passed",model:"gemini-2.0-flash",result,scoredAt}]` — khi `running`, FE poll 3s; sau ~4s backend tự sinh kết quả:
```json
{ "result": { "score": 82, "rubric": {"functional":85,"quality":80,"testing":70,"errors":90,"security":85,"dod":80},
  "summary":"...", "limitations":["Chưa có test E2E"],"findings":[{"file":"src/components/Cart.tsx","line":42,"message":"...","severity":"warning|error|info"}] },
  "evidence": { "complete": true, "trustedTests": {"status":"passed","passed":8,"failed":0,"executionTimeMs":4200,"checks":[{"name":"build","passed":true,"log":"..."}]} } }
```
- `POST /submissions/:id/review` (instructor) `{scores:{functional,quality,testing,errors,security,dod}, feedback, overrideReason?}` → chốt: avg ≥70 → submission `approved` + task `done`; ngược lại `rework` + task về `doing`. Trả submission + review.

## 6. AI Mentor (intern) — LLM THẬT qua z-ai-web-dev-sdk

- `GET /intern/me/ai-mentor/conversations?page=&pageSize=20&status=active|archived` → page `{id,title,createdAt,lastMessageAt,messageCount,status}`
- `POST /intern/me/ai-mentor/conversations` `{title?}` → conversation mới.
- `GET /intern/me/ai-mentor/conversations/:id` → `{conversation, messages:[{id,role:"user|assistant",content,at,taskId?}]}`
- `POST /intern/me/ai-mentor/conversations/:id/messages` `{content, taskId?}` → `{userMessage, assistantMessage:{content,...}, followUps:["gợi ý câu hỏi kế",...]}`
  - Backend: gọi `zai.chat.completions.create` với system prompt "Mentor AI của V-Intern — cố vấn kỹ thuật dày dạn, trả lời tiếng Việt ngắn gọn, thực chiến, kèm ví dụ code khi cần" + 10 tin nhắn gần nhất + ngữ cảnh (tên dự án, vai trò intern). Lỗi/timeout → fallback canned trả lời hợp lý. Delay tối đa 20s.
- `POST /intern/me/ai-mentor/conversations/:id/archive` → status archived.

## 7. Outcomes (intern)

- `GET /intern/me/evaluations` → `[{id,cycleId,cycleName,status:"draft|submitted|finalized",overallScore,summary,evaluatorName,finalizedAt,submittedAt, scores:[{criterionCode,label,score,comment}]}]` (nhúng scores luôn cho đơn giản).
- `GET /intern/me/performance` → `{totalTaskCount,completedTaskCount,taskCompletionRate,committedStoryPoints,completedStoryPoints,storyPointCompletionRate,onTimeCompletionRate,overdueOpenTaskCount,averageEvaluationScore,finalizedEvaluationCount,activeSprintProgress}` (số liệu khớp seed tasks của An: 14 tasks, 8 done, SP 21/34...)
- `GET /intern/me/kpi` → `[{id,period:"2025-Q2",status:"calculated",finalScore:82.5,calculatedAt}]`
- `GET /intern/me/kpi/:id` → `{...,metrics:[{metricCode:"TASK_COMPLETION",label:"Tỷ lệ hoàn thành task",sourceValue:57.1,configuredWeight:0.3,effectiveWeight:0.3,weightedContribution:17.1,sourceJson:{...}}]}` (5 metrics)
- `GET /intern/me/virtual-salary` → `{balance:6480000,unit:"VND",virtual:true,earnedThisPeriod:2400000,latestEntries:[...5]}`
- `GET /intern/me/virtual-salary/ledger?page=&pageSize=20` → page `{id,type:"kpi_earning|bonus|penalty|adjustment",amount,description,at}` (12-15 entries đủ scroll)
- `GET /intern/me/certificates` → `[{id,certificateNumber:"CERT-2025-0142",status:"issued",issuedAt,projectName,sessionName}]`
- `GET /intern/me/certificates/:id` → `{...,"verificationCode":"VIT-XXXX-XXXX",completedAt,policyCode:"CERT-SILVER",revokedAt:null}`
- `GET /certificates/verify/:code` (PUBLIC) → `{valid:true,certificateNumber,holderName,projectName,sessionName,issuedAt}` | revoked → `{valid:false,reason}`.
- `GET /intern/me/ai-recommendations` → `{id,createdAt,summary, recommendations:[{type:"skill|process|career",priority:"high|medium|low",title,reason,actions:["..."],evidenceMetricCodes:["TASK_COMPLETION"]}]}` (4 items)
- `POST /intern/me/ai-recommendations/refresh` → sinh lại (đổi createdAt + vài title).

## 8. Notifications & GitHub & Profile (đủ 3 role — route `/notifications`, `/github/me` dùng chung)

- `GET /notifications?page=&pageSize=20&unread=true` → page `{id,category:"task|session|evaluation|kpi|salary|certificate|announcement|system",title,content,read,link,createdAt}` (seed 10-14 cho mỗi user, 3-4 unread, link là hash path hợp lệ)
- `POST /notifications/:id/read` → `{updated:1}` · `POST /notifications/read-all` → `{updated:n}`
- `GET /notifications/preferences` → `[{category,enabled}]` (9 mục) · `PUT /notifications/preferences` `{category,enabled}` → danh sách sau cập nhật.
- `GET /github/me` → `{configured:true,connected:false,login:null,canCreatePublicRepo:true}`; `POST /github/connect` → `{authorizeUrl:"https://github.com/login/oauth/authorize?..."}` + đánh dấu `connected:true, login:"<github-user-demo>"` (giả lập hoàn tất); `DELETE /github/me` → disconnect.
- `GET /users/me/profile` → `{id,email,displayName,role,roleLabel,avatarColor,joinedAt,lastLoginAt,studentId:"SV2021001",university:"ĐH Bách Khoa Hà Nội"}`.

## 9. Project templates (instructor xem, admin sửa)

- `GET /project-templates?page=&pageSize=&search=&category=&difficulty=&status=active` → page TemplateSummary `{id,code:"TPL-ECOM",name:"Sàn Thương mại điện tử",category:"Web App",difficulty:"intermediate",status:"active",version:3,techStack:["Next.js","Node.js","PostgreSQL"],roles:["frontend","backend","fullstack","qa"],teamSize:{min:4,max:6},sprintCount:4,description,createdAt}`
- `GET /project-templates/:id` → detail + `blueprint:{overview, roleDetails:[{code,label,countMin,countMax,skills[],responsibilities[]}], sprints:[{code,name,goal,tasks:[{title,priority,storyPoints,role}]}], milestones:[{title,dueOffsetDays}]}` + `runs:[{sessionId,sessionName,startedAt}]`
- `POST /project-templates/:id/start` `{name?,startDate?,endDate?}` → tạo project + session `planning` + trả `{projectId,sessionId,sessionCode}` (dedupe nếu gọi lại trong 30s với cùng body).
- Admin: `POST /project-templates` (body = TemplateDetail không id) → tạo; `PATCH /project-templates/:id` `{name?,category?,difficulty?,status?,expectedVersion}` → cập nhật (409 nếu sai version); KHÔNG cần editor blueprint đầy đủ — form đơn giản hóa: name/category/difficulty/description/status.

## 10. Sessions (instructor + admin)

- `GET /sessions/overview?page=&pageSize=&q=&status=&sortBy=startDate&sortDirection=desc` → page `{id,code:"SES-2025-01",name,status:"planning|active|completed|cancelled",startDate,endDate,project:{id,code,name},memberCount,sprintCount,taskTotal,taskDone,taskPercent, currentSprint:{id,code,name}, alerts:{overdueTasks,pendingReview,sessionOverdue}}`
- `GET /sessions/:id` → `{id,code,name,status,startDate,endDate,project,description, instructors:[{userId,displayName}], members:[{userId,displayName,role,assignmentStatus:"active",avatarColor}], sprints:[{id,code,name,status,progress,startDate,endDate}], milestones:[{id,title,dueDate,completed}], stats:{taskTotal,taskDone,taskPercent,submissionTotal,pendingReviewCount,activeInternCount}, plan:{status:"none|generating|draft|published",planId}}`
- `GET /sessions/:id/work?page=&pageSize=&status=&priority=&assigneeId=&search=` → page task + mỗi task nhúng `submission` mới nhất (nếu có) kèm `{status,prUrl,aiScore,aiSummary,instructorScore,instructorFeedback}`.
- `GET /sessions/:id/timeline?page=&pageSize=10` → page `{id,action,summary,actorName,createdAt}` (8-12 sự kiện).
- `GET /sessions/member-options?sessionId=&role=` → ứng viên đủ điều kiện `[{userId,displayName,email,selectedRole,result:{overallScore},hasActiveAssignment:false}]` — rule: passed + chưa có assignment active + đúng role.
- `POST /sessions/:id/members` `{userId, role}` → thêm member + tạo assignment. Trùng/đã có assignment → 409 `ASSIGNMENT_CONFLICT`.
- `DELETE /sessions/:id/members/:userId` → hủy assignment (status cancelled), member rời session.
- `PATCH /sessions/:id` `{status}` → chuyển trạng thái session.

## 11. AI Kế hoạch sprint (instructor)

- `POST /ai-generations/plans/generate` `{sessionId}` → tạo plan `generating` → sau 3.5s có `draft` (FE poll). Trả `{planId,status}`.
- `GET /ai-generations/plans?sessionId=` → `[{planId,sessionId,status:"generating|draft|published|failed",createdAt,sprintCount,taskCount}]`
- `GET /ai-generations/plans/:planId` → `{planId,status,draft:{sprints:[{code:"SPR-01",name,goal,tasks:[{key:"T1",dependsOn:[],title,description,priority,storyPoints,dueDate,suggestedRole}]}], milestones:[{title,dueOffsetDays}]}, warnings:[], error:null}` (sinh từ blueprint template: 3 sprint × 6-8 task, phụ thuộc dạng chuỗi)
- `POST /ai-generations/sprint-plan/confirm` `{planId}` → publish: tạo sprint + task thật (gán code TSK-xx, todo, chưa gán người nếu chưa có member matching role → gán được thì gán), session → `active`. Trả `{sprintIds[],taskIds[],sprintCount,taskCount}`.

## 12. Candidates & assignments (instructor)

- `GET /recruitment/candidates?page=&pageSize=&search=&role=&status=passed` → page `{userId,displayName,email,selectedRole,attemptCount,recruitedAt,hasActiveAssignment,activeProjectName, result:{overallScore,technicalScore,softSkillScore,decision,strengths,weaknesses}}`
- `GET /recruitment/candidates/:userId` → chi tiết + `interview:{questions:[{prompt,answer,score,phase}], ...}` (lấy từ interview session hoàn chỉnh gần nhất).
- `GET /assignments?sessionId=` → `[{id,internId,internName,role,projectId,sessionId,status:"active|cancelled",assignedAt}]`
- `POST /assignments/:id/cancel` → status cancelled.

## 13. Evaluation cycles & evaluations (instructor)

- `GET /evaluation-cycles` → `[{id,name:"Đánh giá giữa kỳ S1",status:"open",startDate,endDate,evaluationCount,criteriaCount}]` (3 cycle: draft/open/archived)
- `POST /evaluation-cycles` `{name,startDate,endDate}` → mới `draft`.
- `POST /evaluation-cycles/:id/status` `{status:"draft|open|closed|archived"}` → chuyển.
- `GET /evaluation-cycles/:id/criteria` → `[{id,code,label,weight,maxScore}]` (5 tiêu chí, weight tổng 1)
- `POST /evaluation-cycles/:id/criteria` `{code,label,weight,maxScore}` → thêm; `PATCH /criteria/:id`; `DELETE /criteria/:id`.
- `GET /evaluations?cycleId=&status=&page=` → page `{id,cycleId,cycleName,internId,internName,status:"draft|submitted|finalized",overallScore,evaluatorName,updatedAt}`
- `POST /evaluations` `{cycleId,internId}` → evaluation draft mới (chỉ với intern có assignment).
- `GET /evaluations/:id` → `{evaluation:{...}, scores:[{criterionId,criterionCode,label,score|null,comment}] , intern:{...}}`
- `PATCH /evaluations/:id` `{scores:[{criterionId,score,comment}], summary}` → lưu nháp.
- `POST /evaluations/:id/submit` → submitted. `POST /evaluations/:id/finalize` → finalized + ghi sang outcomes intern ( evaluations của intern nhìn thấy).
- `POST /evaluations/:id/ai-suggestions` → `{summary, strengths:[...], improvementAreas:[...], criteriaSuggestions:[{criterionCode,label,suggestedScore,comment,evidence:["TSK-12 hoàn thành đúng hạn",...]}]}` — sinh heuristic từ performance intern (delay 1.5s).

## 14. Performance (instructor)

- `GET /performance/interns?projectId=&sessionId=&search=&page=` → page `{userId,displayName,role,totalTaskCount,completedTaskCount,taskCompletionRate,storyPointCompletionRate,averageEvaluationScore,onTimeCompletionRate,rank}` (5-6 intern có data)
- `GET /performance/interns/:userId/detail` → `{profile:{userId,displayName,email,role}, metrics:{...như /intern/me/performance}, assignments:[{projectName,sessionName,role,status}], tasks:{items:[Task + submission info]}, trend:[{month:"2025-01",created:4,completed:3} ...6 tháng], interviewSummary:{decision,overallScore,technicalScore,softSkillScore}}`

## 15. Reports (instructor)

- `GET /reports` → `{items:[{id,kind:"progress|performance|evaluation|review|risk",title,scope,createdAt,authorName}], counts:[{kind,count}]}` (seed 5 report các loại)
- `POST /reports` `{kind,sessionId?,title}` → tạo snapshot (dedupe 30s) → `{id}`.
- `GET /reports/:id` → `{id,kind,title,createdAt,projectName,scope, summary:{total,completed,overdue,blocked,unassigned,risk:"low|medium|high",reasons[]}, members:[{displayName,totalTaskCount,completedTaskCount,taskCompletionRate,averageEvaluationScore,submissionCount,approvedCount,reworkCount}], tasks:[{code,title,status,assigneeName,priority,dueDate}], timeline:[{at,action,summary,actorName}]}` — snapshot tính từ dữ liệu thật của session.
- `GET /reports/:id/csv` → text/csv attachment (FE tạo blob download). (PDF = trả text đơn giản hóa cũng được — FE tải file `.txt` nếu không làm PDF được; ưu tiên CSV.)

## 16. Admin

- `GET /admin/dashboard` → `{counts:{users,interns,instructors,admins,sessions,activeSessions,templates,questions,certificates}, recentActivity:[{id,action,actorName,at,summary} ...8], systemHealth:"operational"}`
- `GET /admin/users?page=&pageSize=&q=&role=&status=` → page `{id,email,displayName,role,status:"active|pending|locked",joinedAt,lastLoginAt}` (12+ users)
- `POST /admin/users` `{email,displayName,password,role}` → mới (409 nếu email trùng) · `PATCH /admin/users/:id` `{displayName?,role?}` · `PATCH /admin/users/:id/status` `{status}` .
- `GET /admin/question-bank?page=&pageSize=&role=&phase=&difficulty=&search=` → page `{id,roleCode,phase:"introduction|technical|english|communication",difficulty:"easy|medium|hard",language:"vi",prompt,expectedConcepts[],isActive,version}` (16+ câu) + `GET /admin/question-bank/coverage` → `[{roleCode, phase, count}]`
- `POST /admin/question-bank` `{roleCode,phase,difficulty,prompt,expectedConcepts}` → mới; `PUT /admin/question-bank/:id` (kèm `{version}`) → cập nhật (409 sai version); `DELETE /admin/question-bank/:id?version=` → retire (isActive=false).
- `GET /admin/ai-configuration` → `{model:"gemini-2.0-flash",timeoutMs:60000,maxRetries:2,version:4, provider:"connected", fallbackEnabled:true}` · `PUT /admin/ai-configuration` `{model,timeoutMs,maxRetries}` → validate model pattern `^[a-z0-9.-]+$`, timeout 10000-180000, retries 0-3 → lưu + version+1.
- `GET /admin/system/status` → `{status:"operational",database:{latencyMs:12,connected:true}, counts:{users,sessions,tasks,submissions}, githubIntegration:{configured:true,webhookHealthy:true}, aiRunsLast24h:47, learningAlerts:2, services:[{name:"API Gateway",status:"healthy",latencyMs:8},{name:"AI Engine",status:"healthy",latencyMs:210},{name:"GitHub Sync",status:"healthy",latencyMs:95},{name:"Notification",status:"degraded",latencyMs:180}]}`
- `GET /admin/settings` → `[{key,value,description,isSecret}]` (8-10 khóa, isSecret che value) · `PATCH /admin/settings` `{key,value}` → cập nhật.
- `GET /admin/activity-events?page=&pageSize=&module=&search=` → page `{id,module:"auth|recruitment|session|task|evaluation|system",action,actorName,summary,at}` (15+ sự kiện)
- `GET /admin/audit-logs?page=&pageSize=&actor=&action=` → page `{id,actorName,action:"LOGIN|CREATE|UPDATE|DELETE|STATUS_CHANGE",target,at,ip:"10.0.x.x"}` (15+ bản ghi)

## 17. Ghi chú triển khai backend

- File đề xuất: `src/lib/server/store.ts` (types + seed đầy đủ), `src/lib/server/handlers/{auth,workspace,recruitment,tasks,sprints,submissions,mentor,outcomes,notifications,templates,sessions,plans,candidates,evaluations,performance,reports,admin}.ts`, gộp tự do miễn đúng contract. `route.ts` phân tích path + method + query + body → gọi handler.
- ID: chuỗi ngắn (`usr_xxx`, `tsk_xxx`, `tsk` code hiển thị `TSK-01`...). Mã task tạo mới: lấy max số hiện có + 1.
- Seed phải KHỚP chéo: taskSummary của An = đếm task thật; performance tính từ tasks; session memberCount/stats = từ members; report snapshot tính động.
- Đề xuất seed thời gian: "hiện tại trừ X ngày" (dùng Date.now()) để hạn/kết thúc trông thật.
- Mentor LLM: dùng `import ZAI from "z-ai-web-dev-sdk"` — chỉ trong server. System prompt tiếng Việt. Timeout 20s → fallback.
