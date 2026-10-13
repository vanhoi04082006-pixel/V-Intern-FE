/** Read-only post-migration verification against the actual product DataSource. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const be = path.resolve(process.env.LIVE_BE_ROOT), req = createRequire(path.join(be, "package.json"));
assert.equal(process.env.NODE_ENV, "test");
assert.match(process.env.DB_NAME ?? "", /^VIntern_Phase715_[A-Za-z0-9_]+$/);
const ds = req(path.join(be, "dist/database/data-source.js")).default;
assert.equal(ds.options.synchronize, false);
await ds.initialize();
try {
  const [identity] = await ds.query("SELECT DB_NAME() name, CAST(SERVERPROPERTY('ProductMajorVersion') AS int) majorVersion");
  assert.equal(identity.name, process.env.DB_NAME);
  if (process.env.REQUIRE_SQL2019 === "true") assert.equal(identity.majorVersion, 15);
  const pending = await ds.showMigrations();
  assert.equal(pending, false, "Pending product migrations remain");
  const applied = await ds.query("SELECT name FROM migrations ORDER BY timestamp");
  const configured = ds.migrations.map(m => m.name ?? m.constructor.name).sort();
  assert.deepEqual(applied.map(m => m.name).sort(), configured);
  fs.mkdirSync("../V-INTERN-FE/phase7-evidence/final", { recursive: true });
  fs.writeFileSync("../V-INTERN-FE/phase7-evidence/final/migrations.json", JSON.stringify({ identity, applied, configured, pendingCount: 0, synchronize: false }, null, 2));
  console.log(JSON.stringify({ identity, appliedCount: applied.length, pendingCount: 0 }));
} finally { await ds.destroy(); }
