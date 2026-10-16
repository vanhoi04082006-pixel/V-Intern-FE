/** Development/CI fixture setup through REAL APIs. No production runtime data, no secrets written to evidence. */
import path from "node:path";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { answerTestInterview } from './project-first-provider.mjs';
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"),
  req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_")
)
  throw new Error("Disposable environment required");
const api = "http://localhost:8080/api/v1",
  tag = Date.now().toString(36),
  email = `uat-finance-${tag}@phase715.test`,
  auths = new Map();
const emails = {
  admin: "admin@phase715.test",
  instructor: "instructor@phase715.test",
  graduate: email,
};
async function raw(token, endpoint, method = "GET", body) {
  const r = await fetch(api + endpoint, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = r.status === 204 ? null : await r.json();
  assert.equal(r.ok, true, `${endpoint}: ${r.status} ${data?.code ?? ""}`);
  return data;
}
async function auth(role) {
  const cached = auths.get(role);
  if (cached && Date.now() - cached.time < 12000) return cached.data;
  const data = await raw(null, "/auth/login", "POST", {
    email: emails[role],
    password: process.env.LIVE_PASSWORD,
  });
  auths.set(role, { data, time: Date.now() });
  return data;
}
async function call(role, endpoint, method = "GET", body) {
  return raw((await auth(role)).accessToken, endpoint, method, body);
}
await call("admin", "/users", "POST", {
  email,
  username: `graduate-${tag}`,
  displayName: "UAT Finance 83.8",
  password: process.env.LIVE_PASSWORD,
  roleCodes: ["intern"],
});
const graduate = await auth("graduate"),
  instructor = await auth("instructor");
await call("graduate", "/recruitment/me/role", "PATCH", { role: "backend" });
const interview = await call("graduate", "/recruitment/me/interviews", "POST");
await answerTestInterview((endpoint, method, body) => call('graduate', endpoint, method, body), interview,
  'Development integration answer: clarify constraints, break down work, implement with tests and verify the result.');
const recruitment = await call(
  "graduate",
  `/recruitment/me/interviews/${interview.session.id}/submit`,
  "POST",
);
assert.equal(recruitment.result.decision, "passed");
const startDate = new Date(Date.now() - 86400000).toISOString(),
  endDate = new Date(Date.now() + 2 * 86400000).toISOString();
const project = await call("instructor", "/projects", "POST", {
  code: `GRAD-${tag}`,
  name: `Dự án chứng nhận ${tag}`,
  description:
    "Development API fixture for official outcomes and live FE verification.",
  status: "active",
  mentorId: instructor.user.id,
  technologies: ["Next.js", "NestJS", "SQL Server"],
});
const session = await call("instructor", "/sessions", "POST", {
  code: `GS-${tag}`,
  name: `Phiên tốt nghiệp ${tag}`,
  status: "active",
  leadInstructorId: instructor.user.id,
  startDate,
  endDate,
});
const assignment = await call("instructor", "/assignments", "POST", {
  internId: graduate.user.id,
  projectId: project.id,
  sessionId: session.id,
});
const sprint = await call("instructor", "/sprints", "POST", {
  code: `SPR-G-${tag}`,
  name: "Sprint hoàn tất",
  projectId: project.id,
  sessionId: session.id,
  startDate,
  endDate,
});
await call("instructor", `/sprints/${sprint.id}/status`, "POST", {
  status: "active",
});
const task = await call("instructor", "/tasks", "POST", {
  title: "Nhiệm vụ tốt nghiệp live",
  projectId: project.id,
  sprintId: sprint.id,
  assigneeId: graduate.user.id,
  storyPoints: 8,
});
await call("graduate", `/tasks/${task.id}/my`, "PATCH", {
  status: "doing",
  progress: 50,
});
await call("graduate", `/tasks/${task.id}/my`, "PATCH", {
  status: "review",
  progress: 90,
});
await call("instructor", `/tasks/${task.id}`, "PATCH", { status: "done" });
await call("instructor", "/tasks", "POST", {
  title: "UAT finance backlog 2 points",
  projectId: project.id,
  sprintId: sprint.id,
  assigneeId: graduate.user.id,
  storyPoints: 2,
});
const cycle = await call("instructor", "/evaluation-cycles", "POST", {
  code: `EVAL-G-${tag}`,
  name: "Đánh giá tốt nghiệp live",
  type: "sprint",
  projectId: project.id,
  sessionId: session.id,
  startDate,
  endDate,
});
const criteria = (
  await call("instructor", `/evaluation-cycles/${cycle.id}/criteria`)
).items;
await call("instructor", `/evaluation-cycles/${cycle.id}/status`, "POST", {
  status: "open",
});
const evaluation = await call("instructor", "/evaluations", "POST", {
  cycleId: cycle.id,
  internId: graduate.user.id,
});
const suggestion = await call(
  "instructor",
  `/evaluations/${evaluation.id}/ai-suggestions`,
  "POST",
);
assert.equal(suggestion.suggestion.criterionSuggestions[0].suggestedScore, 95);
await call("instructor", `/evaluations/${evaluation.id}`, "PATCH", {
  scores: criteria.map((c) => ({
    criterionId: c.id,
    score: 90,
    comment: "Giảng viên chốt 90, khác đề xuất AI 95.",
  })),
  summary: "Điểm chính thức 90 do giảng viên quyết định.",
});
await call("instructor", `/evaluations/${evaluation.id}/submit`, "POST");
const final = await call(
  "instructor",
  `/evaluations/${evaluation.id}/finalize`,
  "POST",
);
assert.equal(Number(final.evaluation.overallScore), 90);
const period = await call("admin", "/kpi-periods", "POST", {
  code: `KPI-G-${tag}`,
  name: "KPI tốt nghiệp live",
  startDate,
  endDate,
});
await call("admin", `/kpi-periods/${period.id}/status`, "POST", {
  status: "open",
});
await call("admin", `/kpi-periods/${period.id}/calculate`, "POST");
await call("admin", `/kpi-periods/${period.id}/finalize`, "POST");
await call("admin", "/settings", "PATCH", {
  key: "virtual_salary.base_amount",
  value: "10000000",
});
await call("admin", "/settings", "PATCH", {
  key: "virtual_salary.unit",
  value: "VND_VIRTUAL",
});
await call("admin", `/virtual-salary/generate/${period.id}`, "POST");
await call("instructor", `/assignments/${assignment.id}/complete`, "POST");
const certificate = await call("admin", "/certificates/issue", "POST", {
  userId: graduate.user.id,
});
await call("instructor", "/assignments", "POST", {
  internId: graduate.user.id,
  projectId: project.id,
  sessionId: session.id,
});
const kpi = (await call("graduate", "/intern/me/kpi")).items.find(
  (k) => k.periodId === period.id,
);
const salary = await call("graduate", "/intern/me/virtual-salary");
assert.equal(Number(kpi.finalScore), 83.8);
assert.equal(salary.balance, 8380000);
const output = {
  periodId: period.id,
  email,
  userId: graduate.user.id,
  projectId: project.id,
  sessionId: session.id,
  sprintId: sprint.id,
  taskId: task.id,
  cycleId: cycle.id,
  evaluationId: evaluation.id,
  kpiResultId: kpi.id,
  kpiFinalScore: Number(kpi.finalScore),
  salaryBalance: salary.balance,
  certificateId: certificate.id,
  certificateNumber: certificate.certificateNumber,
  verificationCode: certificate.verificationCode,
  officialScore: 90,
  aiSuggestedScore: 95,
};
fs.mkdirSync("../phase7-local", { recursive: true });
fs.writeFileSync(
  "../phase7-local/uat-finance.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    fixture: "REAL API development setup",
    email,
    officialScore: 90,
    aiSuggestedScore: 95,
    certificateNumber: certificate.certificateNumber,
    secretsLogged: false,
  }),
);
