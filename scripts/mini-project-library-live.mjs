/** G2 authoring/pinned learner package: real browser, HTTP and disposable SQL; no route interception. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"),
  req = createRequire(path.join(be, "package.json"));
if (
  process.env.NODE_ENV !== "test" ||
  !/^VIntern_Phase715_/.test(process.env.DB_NAME ?? "") ||
  !process.env.LIVE_PASSWORD
)
  throw Error("Disposable SQL database and test credentials required.");
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const { unzipSync, strFromU8 } = await import("fflate");
const db = req(path.join(be, "dist/database/data-source.js")).default;
const api = process.env.LIVE_API_URL || "http://localhost:8080/api/v1",
  base = process.env.LIVE_FRONTEND_URL || "http://localhost:3001";
const evidence = path.resolve(
  process.env.G2_BROWSER_EVIDENCE || "phase7-evidence/mini-project-library",
);
fs.mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [],
  checks = [],
  viewports = [],
  code = `G2-QA-${Date.now()}`,
  name = `Bài thực hành ${code}`;
const adminContext = await browser.newContext({ acceptDownloads: true }),
  admin = await adminContext.newPage();
admin.on("pageerror", (error) => errors.push(error.message));
async function login(page, email, role) {
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(`**/${role}`);
}
async function token(email) {
  const response = await fetch(api + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: process.env.LIVE_PASSWORD }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).accessToken;
}
async function call(access, route, method = "GET", body, status = 200) {
  const response = await fetch(api + route, {
    method,
    headers: {
      authorization: `Bearer ${access}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, status, `${method} ${route}`);
  return response.json();
}
async function mutation(page, route, method, status, action) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/api/v1${route}` &&
        response.request().method() === method,
    ),
    action(),
  ]);
  assert.equal(response.status(), status);
  return response.json();
}
async function snapshot(page, label) {
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false, `${label}: page overflow ${width}`);
    const dialog = page.getByRole("dialog");
    if (await dialog.count())
      assert.equal(
        await dialog.evaluate((node) => node.scrollWidth > node.clientWidth),
        false,
        `${label}: dialog overflow ${width}`,
      );
    await page.screenshot({
      path: path.join(evidence, `${label}-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    viewports.push({ label, width, overflow });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
async function download(page, expectedMarker) {
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Tải starter ZIP", exact: true }).click(),
  ]);
  const target = path.join(evidence, file.suggestedFilename());
  await file.saveAs(target);
  const files = unzipSync(fs.readFileSync(target));
  assert.ok(Object.hasOwn(files, "README.md"));
  assert.match(strFromU8(files["README.md"]), new RegExp(expectedMarker));
  assert.ok(
    Object.keys(files).every((name) => !/solution|hidden|checks\//i.test(name)),
  );
  return Object.keys(files);
}
try {
  await db.initialize();
  await db.runMigrations();
  await req(path.join(be, "dist/bootstrap/ensure-rbac.js")).ensureRbac(db);
  let access = await token("admin@phase715.test");
  const me = await call(access, "/auth/me");
  const actor = me.id ?? me.user?.id;
  assert.ok(actor);
  await req(
    path.join(be, "dist/templates/mini-project-seed.js"),
  ).ensureMiniProjectLibrary(db, actor);
  const source = (await call(access, "/project-templates?search=MINI-NOTES-V1"))
    .data[0];
  assert.ok(source);
  const sourceDetail = await call(access, `/project-templates/${source.id}`),
    readmeIndex =
      sourceDetail.definition.learningPackage.starterFiles.findIndex(
        (file) => file.path === "README.md",
      ) + 1;
  assert.ok(readmeIndex);
  await login(admin, "admin@phase715.test", "admin");
  await admin.goto(base + "/admin/templates");
  await admin
    .getByLabel("Tìm project template", { exact: true })
    .fill("MINI-NOTES-V1");
  const row = admin.getByRole("listitem").filter({
    has: admin.getByRole("heading", { name: source.name, exact: true }),
  });
  await row.getByRole("button", { name: "Nhân bản", exact: true }).click();
  await admin.getByLabel("Tên mẫu", { exact: true }).fill(name);
  await admin.getByLabel("Mã mẫu", { exact: true }).fill(code);
  await admin
    .getByLabel(`Starter · nội dung ${readmeIndex}`, { exact: false })
    .fill("# G2-PINNED-V1\nHướng dẫn starter công khai của bản được giao.");
  await admin
    .getByLabel("Cách xử lý tài liệu chấm", { exact: false })
    .selectOption("replace");
  for (const [label, value] of [
    ["Lời giải · đường dẫn 1", "src/solution.cjs"],
    ["Lời giải · nội dung 1", 'module.exports = "G2-PRIVATE-REFERENCE";'],
    ["Kiểm thử riêng · đường dẫn 1", "checks/behavior.json"],
    ["Kiểm thử riêng · nội dung 1", '[{"name":"G2-PRIVATE-CHECK"}]'],
    ["Tiêu chí chấm 1", "Đúng hợp đồng input"],
    ["Mô tả chấm 1", "Đối chiếu hành vi và dữ liệu bất biến theo đề."],
    ["Task key 1", "implement-core"],
    ["Mã bộ kiểm thử 1", "g2-private-checks"],
    ["SHA-256 bộ kiểm thử 1", "a".repeat(64)],
  ])
    await admin.getByLabel(label, { exact: true }).fill(value);
  await snapshot(admin, "authoring");
  const created = await mutation(admin, "/project-templates", "POST", 201, () =>
    admin
      .getByRole("button", { name: "Tạo project template", exact: true })
      .click(),
  );
  assert.equal(created.version, 1);
  await admin.getByRole("dialog").waitFor({ state: "hidden" });
  await admin.getByLabel("Tìm project template", { exact: true }).fill(code);
  const custom = admin
    .getByRole("listitem")
    .filter({ has: admin.getByRole("heading", { name, exact: true }) });
  await custom
    .getByRole("button", { name: "Xem blueprint", exact: true })
    .click();
  await admin.getByRole("button", { name: "README.md", exact: true }).click();
  await admin.getByLabel("Nội dung file README.md", { exact: true }).waitFor();
  const publicFiles = await download(admin, "G2-PINNED-V1");
  await admin
    .getByRole("button", { name: "Mở tài liệu chấm riêng", exact: true })
    .click();
  await admin.getByText("G2-PRIVATE-REFERENCE", { exact: false }).waitFor();
  await snapshot(admin, "private-preview");
  await admin.keyboard.press("Escape");
  await custom.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  access = await token("admin@phase715.test");
  const current = await call(access, `/project-templates/${created.id}`);
  await call(access, `/project-templates/${created.id}`, "PATCH", {
    expectedVersion: 1,
    name: name + " từ API đồng thời",
  });
  await admin
    .getByLabel("Tên mẫu", { exact: true })
    .fill(name + " nội dung chưa lưu");
  await mutation(admin, `/project-templates/${created.id}`, "PATCH", 409, () =>
    admin
      .getByRole("button", { name: "Lưu phiên bản mới", exact: true })
      .click(),
  );
  assert.equal(
    await admin.getByLabel("Tên mẫu", { exact: true }).inputValue(),
    name + " nội dung chưa lưu",
  );
  await admin.keyboard.press("Escape");
  checks.push(
    "Admin structured public/private authoring, ZIP public-only, private read permission, real 409 preserves unsaved fields",
  );
  const User = req(path.join(be, "dist/users/entities/user.entity.js")).User,
    Role = req(path.join(be, "dist/rbac/entities/role.entity.js")).Role,
    UserRole = req(
      path.join(be, "dist/rbac/entities/user-role.entity.js"),
    ).UserRole;
  const identities = {};
  for (const roleCode of ["intern", "instructor"]) {
    const id = randomUUID(),
      email = `${id}@g2-browser.test`,
      role = await db.getRepository(Role).findOneByOrFail({ code: roleCode });
    await db.getRepository(User).insert({
      id,
      email,
      username: id,
      displayName: "G2 browser " + roleCode,
      passwordHash: await req("bcryptjs").hash(process.env.LIVE_PASSWORD, 10),
      status: "active",
    });
    await db.getRepository(UserRole).insert({ userId: id, roleId: role.id });
    identities[roleCode] = { id, email };
  }
  const teacherAccess = await token(identities.instructor.email);
  const started = await call(
    teacherAccess,
    `/project-templates/${created.id}/start`,
    "POST",
    {
      name: "G2 pinned browser session",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 6 * 86400000).toISOString(),
      requestId: randomUUID(),
    },
    201,
  );
  const Profile = req(
      path.join(be, "dist/recruitment/entities/recruitment-profile.entity.js"),
    ).RecruitmentProfile,
    Assignment = req(
      path.join(be, "dist/assignments/entities/assignment.entity.js"),
    ).Assignment;
  await db.getRepository(Profile).save({
    userId: identities.intern.id,
    selectedRole: "backend",
    status: "passed",
    attemptCount: 1,
    recruitedAt: new Date(),
  });
  await db.getRepository(Assignment).save({
    internId: identities.intern.id,
    projectId: started.projectId,
    sessionId: started.sessionId,
    status: "active",
    assignedAt: new Date(),
  });
  await call(access, `/project-templates/${created.id}`, "PATCH", {
    expectedVersion: 2,
    definition: {
      ...current.definition,
      name: name + " v3",
      learningPackage: {
        ...current.definition.learningPackage,
        starterFiles: current.definition.learningPackage.starterFiles.map(
          (file) =>
            file.path === "README.md"
              ? { ...file, content: "# G2-LATEST-V3" }
              : file,
        ),
      },
    },
  });
  const teacherContext = await browser.newContext({ acceptDownloads: true }),
    teacher = await teacherContext.newPage();
  teacher.on("pageerror", (error) => errors.push(error.message));
  await login(teacher, identities.instructor.email, "instructor");
  await teacher.goto(`${base}/instructor/projects/${created.id}`);
  await teacher.getByRole("button", { name: "README.md", exact: true }).click();
  await teacher
    .getByLabel("Nội dung file README.md", { exact: true })
    .waitFor();
  await teacher
    .getByRole("button", { name: "Xem lịch sử phiên bản", exact: true })
    .click();
  await teacher
    .getByLabel("Phiên bản public", { exact: false })
    .selectOption("2");
  await teacher.getByText("# G2-PINNED-V1", { exact: false }).waitFor();
  await snapshot(teacher, "teacher-history");
  const learnerContext = await browser.newContext({ acceptDownloads: true }),
    learner = await learnerContext.newPage();
  learner.on("pageerror", (error) => errors.push(error.message));
  const responses = [];
  learner.on("response", (response) => {
    if (response.url().includes("/learning-package")) responses.push(response);
  });
  await login(learner, identities.intern.email, "intern");
  await learner.goto(base + "/intern/work");
  await learner
    .getByRole("button", { name: "Mở starter và hướng dẫn dự án", exact: true })
    .click();
  await learner.getByRole("button", { name: "README.md", exact: true }).click();
  await learner
    .getByLabel("Nội dung file README.md", { exact: true })
    .waitFor();
  const learnerFiles = await download(learner, "G2-PINNED-V1");
  assert.deepEqual(learnerFiles, publicFiles);
  await snapshot(learner, "learner-pinned");
  const payload = await responses.at(-1).json();
  assert.equal(payload.templateVersion, 2);
  assert.ok(
    !JSON.stringify(payload).match(/G2-PRIVATE|solutionFiles|hiddenTestFiles/),
  );
  assert.equal(
    await learner
      .getByRole("button", { name: "Mở tài liệu chấm riêng", exact: true })
      .count(),
    0,
  );
  const learnerAccess = await token(identities.intern.email);
  await call(
    learnerAccess,
    `/project-templates/${created.id}/assessment`,
    "GET",
    undefined,
    403,
  );
  await call(
    learnerAccess,
    `/intern/me/projects/${randomUUID()}/learning-package`,
    "GET",
    undefined,
    404,
  );
  checks.push(
    "Instructor historical version, learner pinned v2 after template v3 edit, identical public ZIP, no private material, foreign project 404 and private endpoint 403",
  );
  const chat = await call(
    learnerAccess,
    "/intern/me/ai-mentor/conversations",
    "POST",
    { title: "G2 monitor acceptance" },
    201,
  );
  await call(
    learnerAccess,
    `/intern/me/ai-mentor/conversations/${chat.id}/messages`,
    "POST",
    { content: "G2-SENSITIVE-MESSAGE: Tôi kiểm input thế nào?" },
    201,
  );
  access = await token("admin@phase715.test");
  const runs = await call(
    access,
    "/admin/agents/business-runs?agentId=learning-mentor&status=succeeded",
  );
  assert.equal(runs.definitions.length, 11);
  assert.deepEqual(runs.definitions.map(definition => definition.id).sort(), [
    'interview-conversation', 'interview-evaluator', 'project-planner', 'code-reviewer',
    'learning-mentor', 'performance-advisor', 'instructor-assistant',
    'cv-analyst', 'role-matcher', 'interview-coordinator', 'replacement-advisor',
  ].sort());
  assert.deepEqual(runs.definitions.find(definition => definition.id === 'replacement-advisor').features, ['replacement-advice']);
  assert.ok(runs.items.length);
  assert.ok(
    !JSON.stringify(runs).match(
      /G2-SENSITIVE-MESSAGE|inputJson|outputJson|followUps/,
    ),
  );
  await admin.goto(base + "/admin/ai");
  const monitor = admin.getByRole("region", {
    name: "Vận hành Agent nghiệp vụ",
  });
  await monitor.getByLabel("Lọc Agent").selectOption("learning-mentor");
  await monitor.getByLabel("Lọc trạng thái Agent").selectOption("succeeded");
  await monitor
    .getByText("phase715-deterministic", { exact: true })
    .first()
    .waitFor();
  assert.equal(
    await monitor.getByText("G2-SENSITIVE-MESSAGE", { exact: false }).count(),
    0,
  );
  await snapshot(admin, "agent-monitor");
  checks.push(
    "G07: real SQL Agent run through explicit test provider; Admin registry/version/run/model/filter; no raw prompt/message/output in response or DOM",
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(evidence, "result.json"),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        passed: true,
        checks,
        viewports,
        errors,
        templateId: created.id,
        pinnedVersion: 2,
        currentVersion: 3,
        provider:
          "Explicit test-only provider creates a real Mentor Agent SQL run for the monitor. Gemini is verified separately.",
      },
      null,
      2,
    ),
  );
  console.log(
    `G2 browser passed: ${checks.length} groups; ${viewports.length} viewport checks.`,
  );
} catch (error) {
  await admin
    .screenshot({ path: path.join(evidence, "failure.png"), fullPage: true })
    .catch(() => {});
  fs.writeFileSync(
    path.join(evidence, "failure-text.txt"),
    await admin
      .locator("body")
      .innerText()
      .catch(() => ""),
  );
  throw error;
} finally {
  await browser.close();
  if (db.isInitialized) await db.destroy();
}
