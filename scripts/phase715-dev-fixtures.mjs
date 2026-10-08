/** Development-only setup: real migrations, RBAC, users and recruitment through API.
 * Requires an already-created disposable DB and ignored BE .env.local.
 * Never alters production data or installs a production AI fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"),
  req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_") ||
  !process.env.LIVE_PASSWORD
)
  throw new Error(
    "Disposable test DB and local development credential required; do not send secrets in chat.",
  );
const ds = req(path.join(be, "dist/database/data-source.js")).default;
await ds.initialize();
try {
  await ds.runMigrations({ transaction: "each" });
  await req(path.join(be, "dist/bootstrap/ensure-rbac.js")).ensureRbac(ds);
  await req(
    path.join(be, "dist/recruitment/question-seed.js"),
  ).ensureRecruitmentQuestions(ds);
  const { User } = req(path.join(be, "dist/users/entities/user.entity.js")),
    { Role } = req(path.join(be, "dist/rbac/entities/role.entity.js")),
    { UserRole } = req(path.join(be, "dist/rbac/entities/user-role.entity.js"));
  const passwordHash = await req("bcryptjs").hash(
    process.env.LIVE_PASSWORD,
    10,
  );
  for (const [key, roleCode, displayName] of [
    ["admin", "admin", "Live Admin"],
    ["instructor", "instructor", "Live Instructor"],
    ["required", "intern", "Intern Bắt Đầu"],
    ["progress", "intern", "Intern Phỏng Vấn"],
    ["failed", "intern", "Intern Chưa Đạt"],
    ["waiting", "intern", "Nguyễn Chờ Phân Công"],
  ]) {
    const email = key + "@phase715.test";
    if (await ds.getRepository(User).findOneBy({ email })) continue;
    const role = await ds
      .getRepository(Role)
      .findOneByOrFail({ code: roleCode });
    const user = await ds
      .getRepository(User)
      .save({
        email,
        username: "live-" + key,
        displayName,
        passwordHash,
        status: "active",
      });
    await ds
      .getRepository(UserRole)
      .insert({ userId: user.id, roleId: role.id });
  }
  async function call(token, endpoint, method = "GET", body) {
    const response = await fetch("http://localhost:8080/api/v1" + endpoint, {
      method,
      headers: {
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const value = response.status === 204 ? null : await response.json();
    if (!response.ok)
      throw new Error(
        JSON.stringify({ endpoint, status: response.status, code: value.code }),
      );
    return value;
  }
  const auth = (key) =>
    call(null, "/auth/login", "POST", {
      email: key + "@phase715.test",
      password: process.env.LIVE_PASSWORD,
    });
  const instructor = await auth("instructor");
  const assignments = await ds.query(
    "SELECT a.id FROM assignments a JOIN users u ON u.id=a.internId WHERE u.email=@0 AND a.status='active'",
    ["waiting@phase715.test"],
  );
  for (const assignment of assignments)
    await call(
      instructor.accessToken,
      "/assignments/" + assignment.id + "/complete",
      "POST",
    );
  const records = {};
  for (const key of ["progress", "failed", "waiting"]) {
    const user = await auth(key),
      profile = await call(user.accessToken, "/recruitment/me");
    if (profile.status === "not_started") {
      await call(user.accessToken, "/recruitment/me/role", "PATCH", {
        role: key === "failed" ? "qa" : "backend",
      });
      const interview = await call(
        user.accessToken,
        "/recruitment/me/interviews",
        "POST",
      );
      for (const question of key === "progress"
        ? interview.questions.slice(0, 1)
        : interview.questions)
        await call(
          user.accessToken,
          "/recruitment/me/interviews/" +
            interview.session.id +
            "/answers/" +
            question.id,
          "PUT",
          {
            answerText:
              "Controlled development answer saved through the real recruitment API and SQL transaction.",
          },
        );
      if (key !== "progress")
        await call(
          user.accessToken,
          "/recruitment/me/interviews/" + interview.session.id + "/submit",
          "POST",
        );
    }
    records[key] = {
      userId: user.user.id,
      workspace: await call(user.accessToken, "/intern/me/workspace"),
      profile: await call(user.accessToken, "/recruitment/me"),
    };
  }
  for (const key of ["admin", "instructor", "required"]) {
    const user = await auth(key);
    records[key] = { userId: user.user.id };
    if (key === "required")
      records[key].workspace = await call(
        user.accessToken,
        "/intern/me/workspace",
      );
  }
  fs.mkdirSync("../phase715-local", { recursive: true });
  fs.writeFileSync(
    "../phase715-local/scenarios.json",
    JSON.stringify(records, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      setup: "real migrations/RBAC/SQL/API",
      completedAssignments: assignments.length,
      statuses: Object.fromEntries(
        Object.entries(records).map(([key, record]) => [
          key,
          record.workspace?.status || "role-only",
        ]),
      ),
      secretsLogged: false,
    }),
  );
} finally {
  await ds.destroy();
}
