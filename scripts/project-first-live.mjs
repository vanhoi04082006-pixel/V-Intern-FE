/** Real Project-first browser/API/SQL contract. No route interception or delivery seeding. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readDelivery, assertUnpublished, assertPublishedDelivery, assertReplayDelivery } from "./project-first-delivery.mjs";
import { createRequire } from "node:module";
import { chromium, expect } from "@playwright/test";
import { answerTestInterview } from "./project-first-provider.mjs";
const be = path.resolve(process.env.LIVE_BE_ROOT), req = createRequire(path.join(be, "package.json"));
assert.equal(process.env.NODE_ENV, "test");
assert.match(process.env.DB_NAME ?? "", /^VIntern_Phase715_[A-Za-z0-9_]+$/);
assert.ok(process.env.LIVE_PASSWORD);
const ds = req(path.join(be, "dist/database/data-source.js")).default;
await ds.initialize();
const api = "http://localhost:8080/api/v1", base = "http://localhost:3001", tag = randomUUID().slice(0, 8), evidence = "phase7-evidence/final";
fs.mkdirSync(evidence, { recursive: true });
const results = [], network = [], errors = [], cache = new Map();
const deliveryEvidence = { unpublished: [], isolation: [], publication: null, replays: [] };
const users = { admin: { email: "admin@phase715.test" }, instructor: { email: "instructor@phase715.test" } };
async function call(persona, endpoint, method = "GET", body, status = 200, code) {
  let auth = cache.get(persona);
  if (!auth || Date.now() - auth.at > 8000) {
    const login = await fetch(api + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: users[persona].email, password: process.env.LIVE_PASSWORD }), signal: AbortSignal.timeout(15000) });
    assert.equal(login.status, 200, `Login ${persona}`);
    auth = { token: (await login.json()).accessToken, at: Date.now() }; cache.set(persona, auth);
  }
  const r = await fetch(api + endpoint, { method, headers: { authorization: `Bearer ${auth.token}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  const data = r.status === 204 ? null : await r.json();
  network.push({ source: "api", endpoint, method, status: r.status });
  assert.equal(r.status, status, `${endpoint}: ${data?.code ?? ""} ${JSON.stringify(data?.message ?? "")}`); if (code) assert.equal(data.code, code);
  return data;
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
page.on("pageerror", e => errors.push(e.message));
page.on("response", r => { if (r.url().startsWith(api)) network.push({ source: "browser", endpoint: new URL(r.url()).pathname, method: r.request().method(), status: r.status() }); });
let stage = "fixtures";
try {
  assert.equal(await ds.showMigrations(), false);
  for (const [key, role, name] of [["frontend", "intern", "CI Frontend One"], ["frontend2", "intern", "CI Frontend Two"], ["frontendExtra", "intern", "CI Frontend Capacity"], ["backend", "intern", "CI Backend"], ["invalid", "intern", "CI Unpassed"], ["foreign", "instructor", "CI Foreign Instructor"]]) {
    const username = `${key}-${tag}`.toLowerCase(), email = `${username}@projectfirst.test`;
    const u = await call("admin", "/users", "POST", { email, username, displayName: name, password: process.env.LIVE_PASSWORD, roleCodes: [role] }, 201);
    users[key] = { id: u.id.toLowerCase(), email, name };
  }
  for (const key of ["frontend", "frontend2", "frontendExtra", "backend"]) {
    await call(key, "/recruitment/me/role", "PATCH", { role: key.startsWith("frontend") ? "frontend" : "backend" });
    const interview = await call(key, "/recruitment/me/interviews", "POST", {}, 201);
    assert.equal(interview.session.questionCount, 10);
    await answerTestInterview((endpoint, method, body) => call(key, endpoint, method, body, method === 'POST' ? 201 : 200), interview,
      'Controlled contract answer: clarify requirements, implement with tests and verify persisted results.');
    // The idempotent submit endpoint explicitly returns HTTP 200, not Nest's POST default.
    assert.equal((await call(key, `/recruitment/me/interviews/${interview.session.id}/submit`, "POST", {}, 200)).result.decision, "passed");
  }
  const definition = {
    name: "Project-first CI Store", description: "Real database template for the reviewed Project-first browser contract.", difficulty: "intermediate", techStack: ["React", "NestJS", "SQL Server"], roles: ["frontend", "backend"], modules: ["Catalog", "Cart"],
    objectives: { business: "Deliver a store", learning: ["Full-stack collaboration"], product: ["Working store"] }, functionalRequirements: ["Catalog search", "Cart persistence"],
    roleDetails: [{ code: "frontend", title: "Frontend Developer", countMin: 2, countMax: 2, requiredSkills: ["React"] }, { code: "backend", title: "Backend Developer", countMin: 1, countMax: 1, requiredSkills: ["SQL"] }],
    sprints: [{ name: "Foundation milestone", goal: "Verified foundation", durationDays: 14, tasks: [{ title: "Catalog API", requirements: "Search catalog", dod: ["Search works"], role: "backend", storyPoints: 3 }] }],
    expectedOutputs: { deliverables: ["Store demo"] }, acceptance: { definitionOfDone: ["Demonstrated store"], qualityGates: ["Regression tests pass"] }, dod: ["Demonstrated store"], rubricVersion: "task-review-v1", scenarios: ["Search catalog"], documentation: "Documented local setup, API requirements and test evidence for the store.",
  };
  const templates = [];
  for (let i = 0; i < 10; i++) templates.push(await call("instructor", "/project-templates", "POST", { ...definition, name: `${definition.name} ${i}`, code: `PFCI-${tag}-${i}`, category: `pf-${tag}`, difficulty: i === 9 ? "advanced" : "intermediate" }, 201));
  const template = templates[0];
  stage = "entry-library";
  await page.goto(base + "/login"); await page.getByLabel("Email", { exact: true }).fill(users.instructor.email); await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/instructor"); await expect(page.getByRole("heading", { name: "Workspace giảng viên", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Khởi tạo phiên từ thư viện", exact: true })).toBeVisible();
  assert.equal(await page.getByRole("link", { name: /^(Lớp học|Class|Attendance|Điểm danh)$/ }).count(), 0);
  assert.equal(await page.getByText(/Quick Setup|Dữ liệu mẫu|Mock QA/).count(), 0);
  await page.goto(base + "/instructor/classes"); await page.waitForURL("**/instructor/projects"); await expect(page.getByRole("heading", { name: "Thư viện dự án", exact: true })).toBeVisible();
  // Wait for this run's debounced search, not a possibly identical count from the initial list.
  const filtered = page.waitForResponse(r => {
    const url = new URL(r.url());
    return url.pathname === "/api/v1/project-templates" && url.searchParams.get("search") === `PFCI-${tag}` && url.searchParams.get("category") === `pf-${tag}`;
  });
  await page.getByLabel("Lọc theo nhóm").fill(`pf-${tag}`);
  await page.getByLabel("Tìm project mẫu").fill(`PFCI-${tag}`);
  const filteredResponse = await filtered; assert.equal(filteredResponse.status(), 200);
  assert.equal((await filteredResponse.json()).meta.total, 10);
  await expect(page.getByText(/10 bản ghi/)).toBeVisible();
  const nextPage = page.waitForResponse(r => {
    const url = new URL(r.url());
    return url.pathname === "/api/v1/project-templates" && url.searchParams.get("search") === `PFCI-${tag}` && url.searchParams.get("category") === `pf-${tag}` && url.searchParams.get("page") === "2";
  });
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  const nextPageResult = await (await nextPage).json();
  assert.equal(nextPageResult.meta.page, 2); assert.equal(nextPageResult.meta.totalPages, 2);
  await expect(page.getByText(/Trang\s+2\s*\/\s*2/)).toBeVisible();
  await page.getByLabel("Lọc theo độ khó").selectOption("advanced"); await expect(page.getByText(/1 bản ghi/)).toBeVisible();
  await page.getByLabel("Lọc theo độ khó").selectOption(""); await page.getByLabel("Tìm project mẫu").fill(template.code); await expect(page.getByText(/1 bản ghi/)).toBeVisible();
  const templateCard = page.locator("li").filter({ hasText: template.code });
  await expect(templateCard).toHaveCount(1);
  await templateCard.getByRole("link", { name: "Xem chi tiết →", exact: true }).click();
  for (const name of ["Foundation milestone", "Store demo", "Demonstrated store", "Frontend Developer", "Backend Developer"]) await expect(page.getByText(name).first()).toBeVisible();
  await expect(page.getByText(/phiên bản 1/)).toBeVisible();
  results.push({ name: "Real library pagination/search/filter/detail and Class redirect", status: "PASS" });
  stage = "create-session";
  const startDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10), endDate = new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("Tên phiên", { exact: true }).fill(`Project-first ${tag}`); await page.getByLabel("Ngày bắt đầu").fill(startDate); await page.getByLabel("Ngày kết thúc").fill(startDate);
  await page.getByRole("button", { name: "Khởi tạo phiên thực tập", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /^Ngày kết thúc phải sau ngày bắt đầu\.$/ })).toHaveText("Ngày kết thúc phải sau ngày bắt đầu.");
  await page.getByLabel("Ngày kết thúc").fill(endDate);
  const creation = page.waitForResponse(r => r.url().toLowerCase().endsWith(`/project-templates/${template.id}/start`.toLowerCase()) && r.request().method() === "POST");
  await page.getByRole("button", { name: "Khởi tạo phiên thực tập", exact: true }).evaluate(b => { b.click(); b.click(); });
  const creationResponse = await creation; assert.equal(creationResponse.status(), 201);
  const created = await creationResponse.json(), creationBody = creationResponse.request().postDataJSON();
  assert.equal((await call("instructor", `/project-templates/${template.id}/start`, "POST", creationBody, 201)).sessionId.toLowerCase(), created.sessionId.toLowerCase());
  assert.equal((await ds.query("SELECT COUNT(*) n FROM template_runs WHERE requestId=@0", [creationBody.requestId]))[0].n, 1);
  const second = await call("instructor", `/project-templates/${template.id}/start`, "POST", { ...creationBody, name: `Isolated ${tag}`, requestId: randomUUID() }, 201);
  assert.notEqual(second.projectId, created.projectId); assert.notEqual(second.sessionId, created.sessionId);
  await call("instructor", `/project-templates/${template.id}`, "PATCH", { definition: { ...definition, description: definition.description + " Revised version." } });
  assert.equal((await call("instructor", `/project-templates/${template.id}`)).version, 2);
  const pinned = await call("instructor", `/projects/${created.projectId}/template-context`); assert.equal(pinned.templateVersion, 1); assert.equal(pinned.definition.description, definition.description);
  await page.getByRole("link", { name: "Mở Session Setup →", exact: true }).click(); await expect(page.getByRole("heading", { name: `Setup: Project-first ${tag}`, exact: true })).toBeVisible();
  const assignment = key => ({ internId: users[key].id, sessionId: created.sessionId, projectId: created.projectId, role: key.startsWith("frontend") ? "frontend" : "backend" });
  await call("instructor", "/assignments", "POST", { ...assignment("invalid"), role: "frontend" }, 409, "INTERN_NOT_RECRUITED");
  await call("instructor", "/assignments", "POST", { ...assignment("backend"), role: "frontend" }, 409, "INTERVIEW_ROLE_MISMATCH");
  await call("instructor", `/sessions/${created.sessionId}`, "PATCH", { status: "active" }, 409, "SESSION_TEAM_INCOMPLETE");
  stage = "eligible-team";
  for (const key of ["frontend", "backend"]) {
    await page.getByLabel("Tìm sinh viên", { exact: true }).fill(users[key].email);
    const row = page.locator("li").filter({ hasText: users[key].email }); await row.getByRole("button", { name: "Chi tiết", exact: true }).click();
    await expect(row.locator("pre")).toContainText(users[key].name);
    assert.equal((await page.locator("pre").allTextContents()).some(text => text.includes(users[key === "frontend" ? "backend" : "frontend"].name)), false);
  }
  for (const key of ["frontend", "frontend2", "backend"]) {
    await page.getByLabel("Tìm sinh viên", { exact: true }).fill(users[key].email);
    await page.locator("li").filter({ hasText: users[key].email }).getByRole("button", { name: "Thêm", exact: true }).click();
    await expect(page.getByText(`Đã phân công ${users[key].name}.`, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Thành viên (3)", exact: true })).toBeVisible();
  // A fourth genuinely passed, available candidate cannot overfill a frontend role slot.
  await page.getByLabel("Lọc theo role", { exact: true }).selectOption("frontend");
  await page.getByLabel("Tìm sinh viên", { exact: true }).fill(users.frontendExtra.email);
  const extraCandidate = page.locator("li").filter({ hasText: users.frontendExtra.email });
  await expect(extraCandidate.getByText(/Recruitment: passed/)).toBeVisible();
  await expect(extraCandidate.getByRole("button", { name: "Thêm", exact: true })).toBeDisabled();
  await call("instructor", "/assignments", "POST", assignment("frontendExtra"), 409, "ROLE_SLOT_FULL");
  await call("instructor", "/assignments", "POST", { ...assignment("frontend"), projectId: second.projectId, sessionId: second.sessionId }, 409, "ASSIGNMENT_CONFLICT");
  results.push({ name: "Version pin/create replay; real PASS recruitment/role slots, reject/conflict and nonstale detail", status: "PASS" });
  stage = "start-draft-publish";
  const scope = { sessionId: created.sessionId, projectId: created.projectId };
  const secondary = { sessionId: second.sessionId, projectId: second.projectId };
  const isolated = async phase => deliveryEvidence.isolation.push(assertUnpublished(secondary, await readDelivery(ds, secondary), phase));
  const unpublished = async phase => {
    deliveryEvidence.unpublished.push(assertUnpublished(scope, await readDelivery(ds, scope), phase));
    await isolated(phase);
  };
  await unpublished("before-start");
  const started = page.waitForResponse(r => r.url().toLowerCase().endsWith(`/sessions/${created.sessionId}`.toLowerCase()) && r.request().method() === "PATCH");
  await page.getByRole("button", { name: "Start Session", exact: true }).evaluate(b => { b.click(); b.click(); }); assert.equal((await started).status(), 200);
  await unpublished("after-start");
  await expect(page.getByRole("button", { name: "Chỉnh sửa bản nháp", exact: true })).toBeVisible({ timeout: 30000 });
  const plan = (await call("instructor", `/ai-generations/plans?sessionId=${created.sessionId}`)).find(p => p.status === "ready"); assert.ok(plan);
  const stored = await call("instructor", `/ai-generations/plans/${plan.planId}`);
  assert.equal(stored.status, "ready");
  assert.equal(stored.sessionId.toLowerCase(), scope.sessionId.toLowerCase());
  assert.equal(stored.projectId.toLowerCase(), scope.projectId.toLowerCase());
  const readyDraft = structuredClone(stored.draft);
  assert.equal(plan.sprintCount, readyDraft.sprints.length);
  assert.equal(plan.taskCount, readyDraft.sprints.reduce((n, s) => n + s.tasks.length, 0));
  deliveryEvidence.readyDraft = readyDraft;
  await unpublished("draft-ready");
  await call("instructor", `/sessions/${created.sessionId}`, "PATCH", { status: "active" });
  const assignments = await ds.query("SELECT id FROM assignments WHERE sessionId=@0", [created.sessionId]);
  await call("instructor", `/assignments/${assignments[0].id}/cancel`, "POST", {}, 409, "SESSION_NOT_SETUP");
  await page.getByRole("button", { name: "Chỉnh sửa bản nháp", exact: true }).click();
  const description = "Reviewed Project-first description persisted through atomic Confirm.", criteria = ["Reviewed acceptance one", "Reviewed acceptance two"];
  await page.getByRole("textbox", { name: /^Mô tả task\s+1\.1$/ }).fill(description);
  await page.getByRole("textbox", { name: /^Tiêu chí hoàn thành task\s+1\.1$/ }).fill(criteria.join("\n"));
  const firstAssignee = stored.draft.sprints[0].tasks[0].assigneeId.toLowerCase();
  const assignee = firstAssignee === users.frontend2.id ? users.frontend.id : users.frontend2.id;
  assert.notEqual(assignee, firstAssignee);
  const assigneeSelect = page.getByRole("combobox", { name: /^Người nhận task\s+1\.1$/ });
  await expect(assigneeSelect.locator(`option[value="${assignee}"]`)).toHaveCount(1); await assigneeSelect.selectOption(assignee);
  await page.getByLabel(/^Hạn task\s+1\.1$/).fill(startDate);
  const expectedDraft = structuredClone(readyDraft);
  Object.assign(expectedDraft.sprints[0].tasks[0], { description, acceptanceCriteria: criteria, assigneeId: assignee, dueDate: startDate });
  deliveryEvidence.editedDraft = expectedDraft;
  await expect(page.getByRole("textbox", { name: /^Mô tả task\s+1\.1$/ })).toHaveValue(description);
  await expect(page.getByRole("textbox", { name: /^Tiêu chí hoàn thành task\s+1\.1$/ })).toHaveValue(criteria.join("\n"));
  await expect(assigneeSelect).toHaveValue(assignee);
  await expect(page.getByLabel(/^Hạn task\s+1\.1$/)).toHaveValue(startDate);
  await unpublished("pre-confirm");
  const publication = page.waitForResponse(r => r.url().endsWith("/ai-generations/sprint-plan/confirm") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Xác nhận & publish", exact: true }).click();
  const published = await publication; assert.equal(published.status(), 201);
  const publishBody = published.request().postDataJSON(), summary = await published.json();
  await expect(page.getByText("Kế hoạch đã được publish.", { exact: true })).toBeVisible();
  assert.equal(publishBody.sessionId.toLowerCase(), scope.sessionId.toLowerCase());
  assert.equal(publishBody.projectId.toLowerCase(), scope.projectId.toLowerCase());
  assert.equal(publishBody.planId.toLowerCase(), plan.planId.toLowerCase());
  assert.deepEqual(publishBody.draft, expectedDraft, "Confirm must submit exactly the edited Ready draft");
  assert.equal(summary.deduped, false);
  const publishedRows = await readDelivery(ds, scope);
  const proof = assertPublishedDelivery(scope, expectedDraft, summary, publishedRows);
  deliveryEvidence.publication = proof;
  const before = { sprints: proof.sprintCount, tasks: proof.taskCount };
  await isolated("post-confirm");
  for (const [kind, body] of [["same-request", publishBody], ["new-request-same-plan", { ...publishBody, requestId: randomUUID() }]]) {
    const replay = await call("instructor", "/ai-generations/sprint-plan/confirm", "POST", body, 201);
    deliveryEvidence.replays.push({ kind, ...assertReplayDelivery(scope, expectedDraft, replay, await readDelivery(ds, scope), proof) });
    await isolated(kind);
  }
  await call("instructor", "/ai-generations/sprint-plan/confirm", "POST", { ...publishBody, projectId: second.projectId, sessionId: second.sessionId }, 409, "GENERATION_REQUEST_CONFLICT");
  assert.deepEqual(assertPublishedDelivery(scope, expectedDraft, summary, await readDelivery(ds, scope)), proof, "Rejected cross-session replay changed target delivery");
  await isolated("rejected-cross-session-request");
  const edited = publishedRows.tasks.find(t => t.id.toLowerCase() === summary.taskIds[0].toLowerCase());
  assert.ok(edited, "Edited task resolved by ordered Confirm ID, never by nonunique title/description");
  assert.equal(edited.assigneeId.toLowerCase(), assignee); assert.equal(edited.dueDate.toISOString().slice(0, 10), startDate); assert.deepEqual(JSON.parse(edited.specJson).dod, criteria);
  const runs = await ds.query("SELECT provider,status FROM ai_runs WHERE resourceId=@0 AND feature='sprint-plan'", [created.projectId]); assert.equal(runs.length, 1); assert.deepEqual(runs[0], { provider: "test", status: "succeeded" });
  for (const endpoint of [`/sessions/${created.sessionId}`, `/projects/${created.projectId}`, `/ai-generations/plans/${plan.planId}`, `/sprints/${edited.sprintId}`, `/tasks/${edited.id}`]) await call("foreign", endpoint, "GET", undefined, 403);
  results.push({ name: "Test AI Start/ready/edit/Confirm/replay; SQL fields, cross-session and instructor isolation", status: "PASS", counts: before });
  stage = "session-delivery";
  await page.goto(`${base}/instructor/sessions/${created.sessionId}`); await expect(page.getByRole("heading", { name: "Thành viên (3)", exact: true })).toBeVisible(); await expect(page.getByText("Catalog search", { exact: true })).toBeVisible(); await expect(page.getByRole("heading", { name: `Task (${before.tasks})`, exact: true })).toBeVisible();
  await page.goto(`${base}/instructor/sprints?projectId=${created.projectId}&sessionId=${created.sessionId}`); await page.getByRole("link", { name: "Contract Sprint 1", exact: true }).click(); await expect(page.getByText(/Contract Sprint 1/).first()).toBeVisible();
  await page.goto(`${base}/instructor/sprints?projectId=${created.projectId}&sessionId=${created.sessionId}`);
  await page.getByRole("button", { name: "Task", exact: true }).click();
  const scopedTasks = page.waitForResponse(r => {
    const url = new URL(r.url());
    return url.pathname === "/api/v1/tasks" && url.searchParams.get("projectId")?.toLowerCase() === created.projectId.toLowerCase() && url.searchParams.get("sessionId")?.toLowerCase() === created.sessionId.toLowerCase() && url.searchParams.get("search") === edited.title && url.searchParams.get("status") === "todo";
  });
  await page.getByLabel("Tìm Task", { exact: true }).fill(edited.title);
  await page.getByLabel("Trạng thái", { exact: true }).selectOption("todo");
  const scopedTaskResult = await (await scopedTasks).json();
  assert.ok(scopedTaskResult.data.some(t => t.id.toLowerCase() === edited.id.toLowerCase()));
  assert.ok(scopedTaskResult.data.every(t => t.projectId.toLowerCase() === created.projectId.toLowerCase() && t.status === "todo"));
  await page.locator(`a[href="/instructor/tasks/${edited.id}" i]`).click();
  await expect(page.getByText(description, { exact: true }).first()).toBeVisible(); await expect(page.getByText(criteria[0], { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + "/instructor/classes"); await page.waitForURL("**/instructor/projects"); await expect(page.getByRole("heading", { name: "Thư viện dự án", exact: true })).toBeVisible();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); assert.equal((await ds.query("SELECT COUNT(*) n FROM sys.tables WHERE name IN ('classes','class_members','class_attendance')"))[0].n, 3); assert.deepEqual(errors, []);
  await page.screenshot({ path: `${evidence}/project-first-mobile.png`, fullPage: true });
  fs.mkdirSync("../phase7-local", { recursive: true });
  fs.writeFileSync("../phase7-local/academic.json", JSON.stringify({ sessions: created.sessionId, projects: created.projectId, projectCode: (await call("instructor", `/projects/${created.projectId}`)).code, sessionCode: (await call("instructor", `/sessions/${created.sessionId}`)).code, startDate, endDate, sprintId: edited.sprintId, taskId: edited.id, taskTitle: edited.title, graduateEmail: Object.values(users).find(u => u.id === assignee).email, graduateId: assignee, foreignEmail: users.foreign.email, planId: plan.planId, summary }, null, 2));
  results.push({ name: "Session roster/snapshot/progress, delivery details and retained Class storage", status: "PASS" });
} catch (error) {
  results.push({ stage, status: "FAIL", error: String(error) }); await page.screenshot({ path: `${evidence}/project-first-failure.png`, fullPage: true }).catch(() => undefined); throw error;
} finally {
  fs.writeFileSync(`${evidence}/delivery-invariants.json`, JSON.stringify(deliveryEvidence, null, 2));
  fs.writeFileSync(`${evidence}/academic-live-results.json`, JSON.stringify({ stage, results, network, errors, interception: false }, null, 2)); await browser.close(); await ds.destroy();
}
console.log(JSON.stringify({ results }));
