/** Deterministic readiness checks; never prints runtime env or credentials. */
import assert from "node:assert/strict";
const deadline = Date.now() + 60000;
let ready = false;
while (Date.now() < deadline) {
  try {
    const api = await fetch("http://localhost:8080/api/v1/health"),
      fe = await fetch("http://localhost:3001/login");
    const health = await api.json();
    if (
      api.ok &&
      fe.ok &&
      health.status === "ok" &&
      health.checks.database === "ok"
    ) {
      ready = true;
      break;
    }
  } catch {
    /* Startup in progress. */
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
assert.equal(ready, true, "Real Next/Nest/database readiness failed");
console.log("Real Next :3001 and Nest :8080 database health ready");
