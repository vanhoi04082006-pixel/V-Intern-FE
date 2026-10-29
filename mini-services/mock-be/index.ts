// index.ts — mock V-Intern backend. Pure Bun HTTP server on port 3020.
import { err, notFound, hasPerm, userFromBearer, type Handler, type Ctx } from "./lib";
import * as auth from "./handlers/auth";
import * as intern from "./handlers/intern";
import * as tasks from "./handlers/tasks";
import * as staff from "./handlers/staff";
import * as evalh from "./handlers/eval";
import * as recruit from "./handlers/recruit";
import * as admin from "./handlers/admin";

const PORT = 3020;
const BASE = "/api/v1";

/* ============================ Router ============================ */

interface Route {
  method: string;
  segs: string[];
  perm: string | string[] | null; // null => any authenticated user
  pub: boolean; // true => no auth at all
  handler: Handler;
}

const routes: Route[] = [];

/** Authenticated route with a required permission. */
function R(method: string, path: string, perm: string | string[] | null, handler: Handler) {
  routes.push({ method, segs: path.split("/").filter(Boolean), perm, pub: false, handler });
}
/** Authenticated route, no specific permission needed. */
function A(method: string, path: string, handler: Handler) {
  routes.push({ method, segs: path.split("/").filter(Boolean), perm: null, pub: false, handler });
}
/** Fully public route. */
function P(method: string, path: string, handler: Handler) {
  routes.push({ method, segs: path.split("/").filter(Boolean), perm: null, pub: true, handler });
}

/* ============================ Route table ============================ */

const p = (s: string) => `${BASE}${s}`;

/* ---- health & auth ---- */
P("GET", p("/health"), admin.health);
P("POST", p("/auth/login"), auth.login);
P("POST", p("/auth/refresh"), auth.refresh);
P("POST", p("/auth/logout"), auth.logout);
P("POST", p("/auth/register"), auth.register);
A("GET", p("/auth/me"), auth.me);
A("POST", p("/auth/change-password"), auth.changePassword);

/* ---- intern workspace ---- */
R("GET", p("/intern/me/workspace"), ["intern.workspace.view"], intern.workspace);
R("GET", p("/intern/me/project"), ["intern.workspace.view"], intern.myProjectDetail);
R("GET", p("/intern/me/sprint/board"), ["intern.workspace.view"], intern.currentSprintBoard);
R("GET", p("/intern/me/sprints/:id/board"), ["intern.workspace.view"], intern.sprintBoardById);
R("GET", p("/intern/me/sprints"), ["intern.workspace.view"], intern.mySprints);
R("GET", p("/intern/me/performance"), ["performance.view.own", "performance.view"], intern.myPerformance);
R("GET", p("/intern/me/evaluations"), ["evaluations.view.own", "evaluations.view"], intern.myEvaluations);
R("GET", p("/intern/me/kpi"), ["kpi.view.own", "kpi.view"], intern.myKpi);
R("GET", p("/intern/me/virtual-salary/ledger"), ["virtual_salary.view.own", "virtual_salary.view"], intern.myVirtualSalaryLedger);
R("GET", p("/intern/me/virtual-salary"), ["virtual_salary.view.own", "virtual_salary.view"], intern.myVirtualSalary);
R("GET", p("/intern/me/certificates/:id/pdf"), ["certificates.view.own", "certificates.view"], intern.myCertificatePdf);
R("GET", p("/intern/me/certificates"), ["certificates.view.own", "certificates.view"], intern.myCertificates);
R("GET", p("/intern/me/ai-mentor/conversations"), ["ai.mentor.use"], intern.conversations);
R("POST", p("/intern/me/ai-mentor/conversations"), ["ai.mentor.use"], intern.createConversation);
R("GET", p("/intern/me/ai-mentor/conversations/:id"), ["ai.mentor.use"], intern.getConversation);
R("POST", p("/intern/me/ai-mentor/conversations/:id/messages"), ["ai.mentor.use"], intern.postMessage);
R("POST", p("/intern/me/ai-mentor/conversations/:id/archive"), ["ai.mentor.use"], intern.archiveConversation);
R("POST", p("/intern/me/ai-recommendations/refresh"), ["ai.recommendations.view.own", "ai.recommendations.view"], intern.refreshRecommendations);
R("GET", p("/intern/me/ai-recommendations"), ["ai.recommendations.view.own", "ai.recommendations.view"], intern.myRecommendations);
R("GET", p("/intern/me/projects/:id/learning-package"), ["intern.workspace.view"], intern.learningPackage);

/* ---- tasks ---- */
R("GET", p("/tasks"), ["tasks.view", "tasks.view.own"], tasks.listTasks);
R("POST", p("/tasks"), "tasks.manage", tasks.createTask);
R("GET", p("/tasks/:id"), ["tasks.view", "tasks.view.own"], tasks.getTask);
R("PATCH", p("/tasks/:id"), "tasks.manage", tasks.patchTask);
R("DELETE", p("/tasks/:id"), "tasks.manage", tasks.deleteTask);
R("PATCH", p("/tasks/:id/my"), ["tasks.update.own", "tasks.manage"], tasks.patchMyTask);
A("GET", p("/tasks/:id/comments"), tasks.listComments);
A("POST", p("/tasks/:id/comments"), tasks.createComment);
A("GET", p("/tasks/:id/history"), tasks.taskHistory);
A("GET", p("/tasks/:id/spec"), tasks.taskSpec);
A("GET", p("/tasks/:id/submissions"), tasks.listSubmissions);
R("POST", p("/tasks/:id/submissions"), ["tasks.update.own"], tasks.createSubmission);
R("POST", p("/submissions/:id/withdraw"), ["tasks.update.own", "tasks.manage"], tasks.withdrawSubmission);
R("POST", p("/submissions/:id/review"), "tasks.manage", tasks.reviewSubmission);
A("GET", p("/submissions/:id/code-reviews"), tasks.listCodeReviews);
A("POST", p("/submissions/:id/code-reviews"), tasks.rerunCodeReview);

/* ---- sprints ---- */
R("GET", p("/sprints"), "sprints.view", staff.listSprints);
R("POST", p("/sprints"), "sprints.manage", staff.createSprint);
R("PATCH", p("/sprints/:id"), "sprints.manage", staff.patchSprint);
R("POST", p("/sprints/:id/status"), "sprints.manage", staff.sprintStatus);
R("GET", p("/sprints/:id/board"), "sprints.view", staff.sprintBoard);
R("GET", p("/sprints/:id/completion"), "sprints.view", staff.sprintCompletion);
R("GET", p("/dashboard/sprints/:id/burndown"), ["tasks.view", "sprints.view"], staff.sprintBurndown);

/* ---- sessions (register option-lists before /:id) ---- */
R("GET", p("/sessions/instructor-options"), "sessions.view", staff.instructorOptions);
R("GET", p("/sessions/member-options"), "sessions.view", staff.memberOptions);
R("GET", p("/sessions"), "sessions.view", staff.listSessions);
R("POST", p("/sessions"), "sessions.manage", staff.createSession);
R("GET", p("/sessions/:id"), "sessions.view", staff.getSession);
R("PATCH", p("/sessions/:id"), "sessions.manage", staff.patchSession);
R("GET", p("/sessions/:id/members"), "sessions.view", staff.sessionMembers);
R("POST", p("/sessions/:id/members"), "sessions.manage", staff.addSessionMembers);
R("DELETE", p("/sessions/:id/members/:userId"), "sessions.manage", staff.removeSessionMember);
R("GET", p("/sessions/:id/instructors"), "sessions.view", staff.sessionInstructors);
R("POST", p("/sessions/:id/instructors"), "sessions.manage", staff.addSessionInstructors);
R("GET", p("/sessions/:id/milestones"), "sessions.view", staff.sessionMilestones);
R("POST", p("/sessions/:id/milestones"), "sessions.manage", staff.addSessionMilestone);
R("GET", p("/sessions/:id/timeline"), "sessions.view", staff.sessionTimeline);
R("GET", p("/sessions/:id/github"), "sessions.view", staff.sessionGithub);
R("POST", p("/sessions/:id/github/provision"), "sessions.manage", staff.sessionGithubProvision);
R("POST", p("/sessions/:id/github/invite"), "sessions.manage", staff.sessionGithubInvite);
R("GET", p("/sessions/:id/participation"), "sessions.view", staff.sessionParticipation);
R("POST", p("/sessions/:id/participation/refresh"), "sessions.manage", staff.sessionParticipationRefresh);

/* ---- classes ---- */
R("GET", p("/classes"), "classes.view", staff.listClasses);
R("POST", p("/classes"), "classes.manage", staff.createClass);
R("GET", p("/classes/:id/members"), "classes.view", staff.classMembers);
R("POST", p("/classes/:id/members"), "classes.manage", staff.addClassMembers);
R("DELETE", p("/classes/:id/members/:userId"), "classes.manage", staff.removeClassMember);
R("GET", p("/classes/:id/lessons"), "classes.view", staff.classLessons);
R("POST", p("/classes/:id/lessons"), "classes.manage", staff.createLesson);
R("GET", p("/classes/:id/lessons/:lessonId/attendance"), "classes.view", staff.lessonAttendance);
R("PUT", p("/classes/:id/lessons/:lessonId/attendance"), "classes.manage", staff.updateLessonAttendance);

/* ---- projects (register filter-options before /:id) ---- */
R("GET", p("/projects/filter-options"), "projects.view", staff.projectFilterOptions);
R("GET", p("/projects"), "projects.view", staff.listProjects);
R("POST", p("/projects"), "projects.manage", staff.createProject);
R("GET", p("/projects/:id"), "projects.view", staff.getProject);
R("PATCH", p("/projects/:id"), "projects.manage", staff.patchProject);
R("GET", p("/projects/:id/members"), "projects.view", staff.projectMembers);
R("GET", p("/projects/:id/sessions"), "projects.view", staff.projectSessions);

/* ---- assignments ---- */
R("GET", p("/assignments"), "assignments.view", staff.listAssignments);
R("POST", p("/assignments"), "assignments.manage", staff.createAssignment);
R("POST", p("/assignments/:id/complete"), "assignments.manage", staff.completeAssignment);
R("POST", p("/assignments/:id/cancel"), "assignments.manage", staff.cancelAssignment);

/* ---- evaluation cycles & evaluations ---- */
R("GET", p("/evaluation-cycles"), "evaluations.view", evalh.listCycles);
R("POST", p("/evaluation-cycles"), "evaluations.manage", evalh.createCycle);
R("POST", p("/evaluation-cycles/:id/status"), "evaluations.manage", evalh.cycleStatus);
R("GET", p("/evaluation-cycles/:id/criteria"), "evaluations.view", evalh.cycleCriteria);
R("GET", p("/evaluations"), "evaluations.view", evalh.listEvaluations);
R("POST", p("/evaluations"), "evaluations.manage", evalh.createEvaluation);
R("PATCH", p("/evaluations/:id"), "evaluations.manage", evalh.patchEvaluation);
R("POST", p("/evaluations/:id/submit"), "evaluations.manage", evalh.submitEvaluation);
R("POST", p("/evaluations/:id/finalize"), "evaluations.manage", evalh.finalizeEvaluation);
R("GET", p("/evaluations/:id/ai-suggestions"), "ai.evaluation.assist", evalh.aiSuggestions);
R("POST", p("/evaluations/:id/ai-suggestions"), "ai.evaluation.assist", evalh.createAiSuggestion);
R("GET", p("/imported-reviews"), "evaluations.view", evalh.listImportedReviews);
R("PATCH", p("/imported-reviews/:id"), "evaluations.manage", evalh.patchImportedReview);

/* ---- recruitment (intern) ---- */
R("GET", p("/recruitment/me"), ["recruitment.view.own", "recruitment.view"], recruit.recruitmentMe);
R("PATCH", p("/recruitment/me/role"), ["recruitment.start.own", "recruitment.view.own"], recruit.selectRole);
R("POST", p("/recruitment/me/interviews"), "recruitment.start.own", recruit.createInterview);
R("GET", p("/recruitment/me/interviews"), ["recruitment.view.own", "recruitment.view"], recruit.listInterviews);
R("GET", p("/recruitment/me/interviews/:id"), ["recruitment.view.own", "recruitment.view"], recruit.getInterview);
R("GET", p("/recruitment/me/interviews/:id/questions"), ["recruitment.view.own", "recruitment.answer.own"], recruit.interviewQuestions);
R("GET", p("/recruitment/me/interviews/:id/conversation"), ["recruitment.view.own", "recruitment.answer.own"], recruit.interviewConversation);
R("POST", p("/recruitment/me/interviews/:id/conversation/clarify"), "recruitment.answer.own", recruit.conversationClarify);
R("POST", p("/recruitment/me/interviews/:id/conversation/next"), "recruitment.answer.own", recruit.conversationNext);
R("PUT", p("/recruitment/me/interviews/:id/answers/:questionId"), "recruitment.answer.own", recruit.saveAnswer);
R("PUT", p("/recruitment/me/interviews/:id/follow-ups/:questionId"), "recruitment.answer.own", recruit.saveFollowUp);
R("POST", p("/recruitment/me/interviews/:id/submit"), "recruitment.submit.own", recruit.submitInterview);
R("POST", p("/recruitment/me/interviews/:id/retry-evaluation"), "recruitment.submit.own", recruit.retryEvaluation);
R("GET", p("/recruitment/me/result"), ["recruitment.view.own", "recruitment.view"], recruit.recruitmentResult);
A("GET", p("/career-roles"), recruit.careerRoles);
R("GET", p("/recruitment/candidates"), "recruitment.view", recruit.candidates);

/* ---- applications (PUBLIC) ---- */
P("GET", p("/applications/rounds"), recruit.applicationRounds);
P("POST", p("/applications"), recruit.submitApplication);
P("POST", p("/applications/verify"), recruit.verifyApplication);
P("GET", p("/applications/me"), recruit.applicationMe);
P("POST", p("/applications/me/cv"), recruit.applicationUploadCv);
P("POST", p("/applications/leave"), recruit.applicationLeave);
P("POST", p("/applications/request-access"), recruit.requestAccess);

/* ---- recruitment admin (staff) ---- */
R("GET", p("/recruitment-rounds"), "applications.manage", recruit.listRounds);
R("POST", p("/recruitment-rounds"), "applications.manage", recruit.createRound);
R("POST", p("/recruitment-rounds/:id/status"), "applications.manage", recruit.roundStatus);
R("GET", p("/recruitment-rounds/:id/applications"), "applications.manage", recruit.roundApplications);
R("GET", p("/admin/question-bank"), "recruitment.manage", recruit.listQuestions);
R("POST", p("/admin/question-bank"), "recruitment.manage", recruit.createQuestion);
R("DELETE", p("/admin/question-bank/:id"), "recruitment.manage", recruit.deleteQuestion);
R("GET", p("/admin/career-roles"), "recruitment.manage", recruit.adminListRoles);
R("POST", p("/admin/career-roles"), "recruitment.manage", recruit.adminCreateRole);
R("PUT", p("/admin/career-roles/:code"), "recruitment.manage", recruit.adminUpdateRole);
R("POST", p("/admin/career-roles/:code/archive"), "recruitment.manage", recruit.adminArchiveRole);

/* ---- KPI / virtual salary / certificates ---- */
R("GET", p("/kpi-periods"), "kpi.view", evalh.listKpiPeriods);
R("POST", p("/kpi-periods"), "kpi.manage", evalh.createKpiPeriod);
R("POST", p("/kpi-periods/:id/status"), "kpi.manage", evalh.kpiPeriodStatus);
R("POST", p("/kpi-periods/:id/calculate"), "kpi.manage", evalh.kpiCalculate);
R("POST", p("/kpi-periods/:id/finalize"), "kpi.manage", evalh.kpiFinalize);
R("GET", p("/kpi-periods/:id/results"), "kpi.view", evalh.kpiResults);
R("POST", p("/virtual-salary/generate/:kpiPeriodId"), "virtual_salary.manage", evalh.generateSalary);
R("POST", p("/virtual-salary/adjustments"), "virtual_salary.manage", evalh.createAdjustment);
R("GET", p("/virtual-salary"), "virtual_salary.view", evalh.listSalaryEntries);
R("GET", p("/virtual-salary/users/:userId/balance"), "virtual_salary.view", evalh.salaryBalance);
R("GET", p("/certificates"), "certificates.view", evalh.listCertificates);
R("POST", p("/certificates/issue"), "certificates.manage", evalh.issueCertificate);
R("POST", p("/certificates/:id/revoke"), "certificates.manage", evalh.revokeCertificate);
R("GET", p("/certificates/:id/pdf"), "certificates.view", evalh.certificatePdf);
P("GET", p("/certificates/verify/:code"), evalh.verifyCertificate);

/* ---- dashboards / performance / reports ---- */
R("GET", p("/dashboard/admin"), "users.read", staff.adminDashboard);
R("GET", p("/dashboard/instructor"), "sessions.view", staff.instructorDashboard);
R("GET", p("/performance/interns"), "performance.view", staff.performanceInterns);
R("GET", p("/reports"), "performance.view", staff.listReports);
R("POST", p("/reports"), "performance.view", staff.createReport);
R("GET", p("/reports/:id/pdf"), "performance.view", staff.reportPdf);
R("GET", p("/reports/:id/xlsx"), "performance.view", staff.reportXlsx);

/* ---- notifications ---- */
A("GET", p("/notifications"), admin.listNotifications);
A("GET", p("/notifications/unread-count"), admin.unreadCount);
A("POST", p("/notifications/:id/read"), admin.markRead);
A("POST", p("/notifications/read-all"), admin.markAllRead);
A("GET", p("/notifications/preferences"), admin.notificationPreferences);
A("PUT", p("/notifications/preferences"), admin.updateNotificationPreferences);

/* ---- github ---- */
A("GET", p("/github/me"), admin.githubMe);
A("POST", p("/github/connect"), admin.githubConnect);
A("DELETE", p("/github/me"), admin.githubDisconnect);
R("GET", p("/github/repository-account"), "settings.read", admin.githubRepositoryAccount);
R("POST", p("/github/repository-account"), "settings.update", admin.setGithubRepositoryAccount);

/* ---- users / roles / groups / settings ---- */
R("GET", p("/users"), "users.read", admin.listUsers);
R("POST", p("/users"), "users.create", admin.createUser);
R("PATCH", p("/users/:id"), "users.update", admin.patchUser);
R("PATCH", p("/users/:id/status"), "users.status", admin.patchUserStatus);
R("GET", p("/roles"), "roles.read", admin.listRoles);
R("GET", p("/permissions"), "roles.read", admin.listPermissions);
R("GET", p("/roles/:id/permissions"), "roles.read", admin.rolePermissions);
R("GET", p("/groups"), "users.read", admin.listGroups);
R("POST", p("/groups"), "users.update", admin.createGroup);
R("POST", p("/groups/:id/members"), "users.update", admin.addGroupMembers);
R("DELETE", p("/groups/:id/members/:userId"), "users.update", admin.removeGroupMember);
R("GET", p("/settings"), "settings.read", admin.listSettings);
R("PATCH", p("/settings"), "settings.update", admin.upsertSetting);

/* ---- catalogs / knowledge / audit / activity / agents / communications / system ---- */
R("GET", p("/catalogs/types"), "catalogs.read", admin.listCatalogTypes);
R("POST", p("/catalogs/types"), "catalogs.manage", admin.createCatalogType);
R("GET", p("/catalogs/items"), "catalogs.read", admin.listCatalogItems);
R("POST", p("/catalogs/items"), "catalogs.manage", admin.createCatalogItem);
R("PATCH", p("/catalogs/items/:id"), "catalogs.manage", admin.patchCatalogItem);
R("GET", p("/admin/knowledge"), "knowledge.read", admin.listKnowledge);
R("POST", p("/admin/knowledge"), "knowledge.manage", admin.createKnowledge);
R("PUT", p("/admin/knowledge/:code"), "knowledge.manage", admin.updateKnowledge);
R("POST", p("/admin/knowledge/:code/publish"), "knowledge.manage", admin.publishKnowledge);
R("GET", p("/audit-logs"), "audit.read", admin.listAuditLogs);
R("GET", p("/activity-events"), "audit.read", admin.listActivityEvents);
R("POST", p("/admin/agents/knowledge-runs"), "agents.manage", admin.createAgentRun);
R("GET", p("/admin/agents/knowledge-runs/:id"), "agents.manage", admin.getAgentRun);
R("POST", p("/admin/agents/knowledge-runs/:id/cancel"), "agents.manage", admin.cancelAgentRun);
R("POST", p("/admin/agents/knowledge-runs/:id/resume"), "agents.manage", admin.resumeAgentRun);
R("GET", p("/admin/communications"), "communications.read", admin.listCommunications);
R("POST", p("/admin/communications/:id/resend"), "communications.manage", admin.resendCommunication);
R("GET", p("/admin/system/status"), "system.read", admin.systemStatus);

/* ============================ Matching ============================ */

function matchRoute(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
  const parts = pathname.split("/").filter(Boolean);
  for (const r of routes) {
    if (r.method !== method || r.segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < parts.length; i++) {
      const seg = r.segs[i];
      if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
      else if (seg !== parts[i]) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

async function readBody(req: Request): Promise<any> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) return {};
  if (req.method === "GET" || req.method === "HEAD") return {};
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function handle(req: Request, url: URL): Promise<Response> {
  const pathname = url.pathname;
  if (!pathname.startsWith(`${BASE}/`)) return notFound();

  const found = matchRoute(req.method, pathname);
  if (!found) return notFound();
  const { route, params } = found;

  const ctx: Ctx = { req, url, params, user: null, body: await readBody(req) };

  if (!route.pub) {
    const res = userFromBearer(req);
    if (res.error) {
      const messages: Record<string, string> = {
        TOKEN_MISSING: "Thiếu access token. Hãy đính kèm header Authorization: Bearer <token>.",
        TOKEN_EXPIRED: "Access token đã hết hạn. Vui lòng làm mới token.",
        TOKEN_INVALID: "Access token không hợp lệ.",
      };
      return err(401, res.error, messages[res.error] ?? "Xác thực thất bại.");
    }
    ctx.user = res.user;
    if (!hasPerm(ctx.user, route.perm)) {
      return err(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
    }
  }

  return await route.handler(ctx);
}

/* ============================ Server ============================ */

const server = Bun.serve({
  port: PORT,
  async fetch(req): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    let res: Response;
    try {
      res = await handle(req, url);
    } catch (e: any) {
      console.error("[mock-be] unhandled error:", e);
      res = err(500, "INTERNAL_ERROR", e?.message ?? "Lỗi máy chủ nội bộ.");
    }

    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    console.log(`${req.method} ${url.pathname}${url.search} → ${out.status}`);
    return out;
  },
});

console.log(`[mock-be] V-Intern mock backend listening on http://localhost:${server.port} (routes: ${routes.length})`);
