/** Audit runtime imports from production route entrypoints; erase type-only imports first. */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = path.resolve("src"),
  seen = new Set();
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
function scan(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.Preserve,
    },
  }).outputText;
  for (const match of js.matchAll(
    /(?:from\s*|import\s*)(?:\(\s*)?["']([^"']+)["']/g,
  )) {
    const source = match[1];
    if (!source.startsWith(".") && !source.startsWith("@/")) continue;
    const base = source.startsWith("@/")
      ? path.join(root, source.slice(2))
      : path.resolve(path.dirname(file), source);
    const target = [".tsx", ".ts", "/index.tsx", "/index.ts"]
      .map((s) => base + s)
      .find((p) => fs.existsSync(p));
    if (target) scan(target);
  }
}
const entries = walk(path.join(root, "app")).filter(
  (f) =>
    /^(page|layout|loading|error|not-found|template|default)\.(tsx|ts)$/.test(
      path.basename(f),
    ) && !f.includes("__tests__"),
);
entries.forEach(scan);
const files = [...seen]
  .map((f) => path.relative(process.cwd(), f).replaceAll("\\", "/"))
  .sort();
const forbidden = files.filter((f) =>
  /mock-data|src\/server|src\/test|prisma|sqlite|route\.ts$/.test(f),
);
const routeHandlers = walk(path.join(root, "app")).filter((f) =>
  /^route\.(ts|tsx)$/.test(path.basename(f)),
);
fs.mkdirSync("phase7-evidence/final", { recursive: true });
fs.writeFileSync(
  "phase7-evidence/final/runtime-import-audit.json",
  JSON.stringify(
    {
      entryCount: entries.length,
      runtimeModuleCount: files.length,
      runtimeBusinessMockImports: forbidden,
      businessRouteHandlers: routeHandlers,
      files,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    entryCount: entries.length,
    runtimeModuleCount: files.length,
    forbidden,
    routeHandlers,
  }),
);
if (forbidden.length || routeHandlers.length) process.exitCode = 1;
