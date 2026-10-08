/** Real Nest/SQL negative UAT; credentials never enter evidence. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"), req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (process.env.NODE_ENV !== "test" || !process.env.DB_NAME?.startsWith("VIntern_Phase715_")) throw Error("Disposable test environment required");
const ds = req(path.join(be, "dist/database/data-source.js")).default; await ds.initialize();
const f = JSON.parse(fs.readFileSync("../phase7-local/outcomes.json", "utf8"));
const api = "http://localhost:8080/api/v1", results = [], network = [], cache = new Map();
const emails = { admin: "admin@phase715.test", instructor: "instructor@phase715.test", other: "required@phase715.test", graduate: f.email };
async function token(persona) {
  const entry = cache.get(persona); if (entry && Date.now() - entry.time < 8000) return entry.token;
  const r = await fetch(api + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: emails[persona], password: process.env.LIVE_PASSWORD }) });
  assert.equal(r.status, 200); const value = (await r.json()).accessToken; cache.set(persona, { token: value, time: Date.now() }); return value;
}
async function check(name, persona, endpoint, expected, method = "GET", body) {
  try {
    const r = await fetch(api + endpoint, { method, headers: { ...(persona ? { authorization: "Bearer " + await token(persona) } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    network.push({ url: api + endpoint.split("?")[0], method, status: r.status });
    const data = r.status === 204 ? null : await r.json();
    assert.ok([expected].flat().includes(r.status), endpoint + ": " + r.status + ", expected " + expected);
    if (!r.ok) assert.equal(/\$2[aby]\$\d\d\$|node_modules|QueryFailedError|stack trace/i.test(JSON.stringify(data)), false, "internal error leakage");
    results.push({ name, status: "PASS", httpStatus: r.status, code: data?.code }); return data;
  } catch (error) { results.push({ name, status: "FAIL", error: String(error) }); }
}
try {
  await check("unauthenticated management", null, "/users", 401);
  await check("Intern denied Admin users", "other", "/users", 403);
  await check("Intern denied project creation", "other", "/projects", 403, "POST", {});
  await check("Intern denied evaluation finalize", "other", "/evaluations/" + f.evaluationId + "/finalize", 403, "POST");
  await check("Instructor denied Admin revision", "instructor", "/evaluations/" + f.evaluationId + "/revisions", 403, "POST", { reason: "UAT unauthorized revision" });
  for (const [name, endpoint] of [["evaluation", "/intern/me/evaluations/" + f.evaluationId], ["KPI", "/intern/me/kpi/" + f.kpiResultId], ["certificate", "/intern/me/certificates/" + f.certificateId], ["private PDF", "/intern/me/certificates/" + f.certificateId + "/pdf"]]) await check("foreign " + name + " 404-safe", "other", endpoint, 404);
  await check("foreign salary permission protected", "other", "/virtual-salary/users/" + f.userId + "/balance", 403);
  const c = await check("owner creates UAT conversation", "graduate", "/intern/me/ai-mentor/conversations", 201, "POST", { title: "UAT privacy" });
  if (c) {
    await check("foreign conversation read 404-safe", "other", "/intern/me/ai-mentor/conversations/" + c.id, 404);
    await check("foreign conversation send 404-safe", "other", "/intern/me/ai-mentor/conversations/" + c.id + "/messages", 404, "POST", { content: "Unauthorized test" });
    await check("AI acting-user overposting rejected", "graduate", "/intern/me/ai-mentor/conversations/" + c.id + "/messages", 400, "POST", { content: "test", userId: f.userId });
    await check("oversized AI input rejected", "graduate", "/intern/me/ai-mentor/conversations/" + c.id + "/messages", 400, "POST", { content: "x".repeat(20000) });
  }
  const tag = Date.now().toString(36), email = "uat-instructor-b-" + tag + "@phase715.test";
  const instructor = await check("Instructor B created through dev API", "admin", "/users", 201, "POST", { email, username: "uat-instructor-b-" + tag, displayName: "UAT Instructor B", password: process.env.LIVE_PASSWORD, roleCodes: ["instructor"] });
  if (instructor) {
    emails.foreign = email;
    for (const [name, endpoint] of [["evaluation", "/evaluations/" + f.evaluationId], ["performance", "/performance/interns/" + f.userId], ["cycle criteria", "/evaluation-cycles/" + f.cycleId + "/criteria"]]) await check("foreign Instructor " + name, "foreign", endpoint, 403);
  }
  await check("malformed UUID", "admin", "/users/not-a-uuid", 400);
  await check("invalid enum", "admin", "/users/" + f.userId + "/status", 400, "PATCH", { status: "super-admin" });
  for (const endpoint of ["/users?pageSize=100000", "/groups?page=-1", "/catalogs/types?pageSize=NaN"]) await check("invalid pagination " + endpoint, "admin", endpoint, 400);
  const badEmail = "uat-overpost-" + tag + "@phase715.test";
  await check("account overposting rejected", "admin", "/users", 400, "POST", { email: badEmail, username: "uat-overpost-" + tag, displayName: "UAT rejected payload", password: process.env.LIVE_PASSWORD, passwordHash: "untrusted", status: "active" });
  const rows = await ds.query("SELECT COUNT(*) AS n FROM users WHERE email=@0", [badEmail]); assert.equal(Number(rows[0].n), 0);
  await check("unknown public certificate", null, "/certificates/verify/unknown-UAT-code", 404);
  await check("malformed public code fails safely", null, "/certificates/verify/%3Cscript%3E", [400, 404]);
  const verified = await check("real revoked certificate verification", null, "/certificates/verify/" + f.verificationCode, 200);
  if (verified) {
    assert.equal(verified.valid, false); assert.equal(verified.status, "revoked");
    for (const key of ["email", "userId", "id", "evaluationId", "kpiResultId", "scores", "passwordHash"]) assert.equal(Object.hasOwn(verified, key), false, key + " public leakage");
    results.push({ name: "public response has no private IDs or scores", status: "PASS", keys: Object.keys(verified) });
  }
} finally {
  await ds.destroy(); fs.mkdirSync("phase7-evidence/final", { recursive: true });
  fs.writeFileSync("phase7-evidence/final/uat-negative-live-results.json", JSON.stringify({ results, network }, null, 2));
}
console.log(JSON.stringify(results, null, 2)); if (results.some(r => r.status !== "PASS")) process.exitCode = 1;
