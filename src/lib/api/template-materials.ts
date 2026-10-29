import { zipSync, strToU8 } from "fflate";
import { request } from "./client";
import { array, invalid, number, record, string } from "./parse";
export interface PackageFile {
  path: string;
  content: string;
}
export interface LearningPackage {
  schemaVersion: 1;
  prerequisites: string[];
  setup: string;
  run: string;
  starterFiles: PackageFile[];
  sampleData?: PackageFile[];
}
export interface TemplateAssessment {
  schemaVersion: 1;
  solutionFiles: PackageFile[];
  hiddenTestFiles: PackageFile[];
  rubric: { criterion: string; description: string; weight: number }[];
  taskSuites: { taskKey: string; suiteId: string; digest: string }[];
}
const strict = (value: Record<string, unknown>, keys: string[]) => {
  if (Object.keys(value).some((key) => !keys.includes(key))) invalid();
};
const text = (value: unknown, max: number, min = 1) => {
  const result = string(value);
  return result.trim().length >= min && result.length <= max
    ? result
    : invalid();
};
function files(value: unknown, max: number, min = 1): PackageFile[] {
  const result = array(value, (raw) => {
    const row = record(raw);
    strict(row, ["path", "content"]);
    const path = text(row.path, 160),
      content = text(row.content, 20000, 0);
    if (
      !/^[a-zA-Z0-9._/-]+$/.test(path) ||
      path.startsWith("/") ||
      path.split("/").length > 8 ||
      path
        .split("/")
        .some(
          (part) =>
            !part ||
            part === "." ||
            part === ".." ||
            part.endsWith(".") ||
            [
              ".git",
              ".hg",
              ".svn",
              ".github",
              "node_modules",
              ".env",
              ".npmrc",
            ].includes(part.toLowerCase()) ||
            /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
        )
    )
      invalid();
    return { path, content };
  });
  return result.length >= min && result.length <= max ? result : invalid();
}
function validateFiles(files: PackageFile[], budget: number) {
  const names = files.map((file) => file.path.toLowerCase()),
    unique = new Set(names);
  if (unique.size !== names.length) invalid();
  for (const name of names) {
    const parts = name.split("/");
    parts.pop();
    while (parts.length) {
      if (unique.has(parts.join("/"))) invalid();
      parts.pop();
    }
  }
  if (strToU8(JSON.stringify(files)).length > budget) invalid();
}
export function parseLearningPackage(value: unknown): LearningPackage | null {
  if (value === undefined || value === null) return null;
  const row = record(value);
  strict(row, [
    "schemaVersion",
    "prerequisites",
    "setup",
    "run",
    "starterFiles",
    "sampleData",
  ]);
  if (row.schemaVersion !== 1) invalid();
  const prerequisites = array(row.prerequisites, (item) => text(item, 256));
  if (!prerequisites.length || prerequisites.length > 12) invalid();
  const result: LearningPackage = {
    schemaVersion: 1,
    prerequisites,
    setup: text(row.setup, 3000),
    run: text(row.run, 3000),
    starterFiles: files(row.starterFiles, 30),
    ...(row.sampleData === undefined
      ? {}
      : { sampleData: files(row.sampleData, 8, 0) }),
  };
  validateFiles([...result.starterFiles, ...(result.sampleData ?? [])], 128000);
  return result;
}
export function parseTemplateAssessment(
  value: unknown,
): TemplateAssessment | null {
  if (value === null) return null;
  const row = record(value);
  strict(row, [
    "schemaVersion",
    "solutionFiles",
    "hiddenTestFiles",
    "rubric",
    "taskSuites",
  ]);
  if (row.schemaVersion !== 1) invalid();
  const solutionFiles = files(row.solutionFiles, 30),
    hiddenTestFiles = files(row.hiddenTestFiles, 30);
  validateFiles([...solutionFiles, ...hiddenTestFiles], 256000);
  const rubric = array(row.rubric, (raw) => {
    const item = record(raw);
    strict(item, ["criterion", "description", "weight"]);
    const weight = number(item.weight);
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) invalid();
    return {
      criterion: text(item.criterion, 128),
      description: text(item.description, 1000),
      weight,
    };
  });
  if (
    !rubric.length ||
    rubric.length > 20 ||
    rubric.reduce((sum, item) => sum + item.weight, 0) !== 100
  )
    invalid();
  const taskSuites = array(row.taskSuites, (raw) => {
    const item = record(raw);
    strict(item, ["taskKey", "suiteId", "digest"]);
    const taskKey = string(item.taskKey),
      suiteId = string(item.suiteId),
      digest = string(item.digest);
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(taskKey) ||
      !/^[a-z0-9][a-z0-9_-]{2,99}$/.test(suiteId) ||
      !/^[a-f0-9]{64}$/.test(digest)
    )
      invalid();
    return { taskKey, suiteId, digest };
  });
  if (
    !taskSuites.length ||
    taskSuites.length > 60 ||
    new Set(taskSuites.map((item) => item.taskKey)).size !== taskSuites.length
  )
    invalid();
  return {
    schemaVersion: 1,
    solutionFiles,
    hiddenTestFiles,
    rubric,
    taskSuites,
  };
}
function parseVersionedAssessment(value: unknown) {
  const row = record(value);
  return {
    version: number(row.version),
    assessment: parseTemplateAssessment(row.assessment),
  };
}
export function starterArchive(material: LearningPackage | null): Uint8Array {
  if (!material) return invalid();
  const parsed = parseLearningPackage(material)!;
  return zipSync(
    Object.fromEntries(
      [...parsed.starterFiles, ...(parsed.sampleData ?? [])].map((file) => [
        file.path,
        strToU8(file.content),
      ]),
    ),
    { level: 0 },
  );
}
export function downloadStarter(material: LearningPackage, name: string) {
  const bytes = starterArchive(material),
    url = URL.createObjectURL(
      new Blob([new Uint8Array(bytes)], { type: "application/zip" }),
    );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 100)}-starter.zip`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const getAssessment = (
  id: string,
  version?: number,
  signal?: AbortSignal,
) =>
  request(
    `/project-templates/${encodeURIComponent(id)}/${version === undefined ? "" : `revisions/${version}/`}assessment`,
    parseVersionedAssessment,
    { signal },
  );
export const getPinnedProjectAssessment = (
  projectId: string,
  signal?: AbortSignal,
) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/template-assessment`,
    parseVersionedAssessment,
    { signal },
  );
export const listTemplateRevisions = (id: string, signal?: AbortSignal) =>
  request(
    `/project-templates/${encodeURIComponent(id)}/revisions?pageSize=100`,
    (raw) => {
      const row = record(raw);
      return {
        total: number(row.total),
        items: array(row.items, (item) => {
          const r = record(item);
          return {
            version: number(r.version),
            sha256: text(r.sha256, 64),
            createdAt: string(r.createdAt),
          };
        }),
      };
    },
    { signal },
  );
export const getTemplateRevision = (
  id: string,
  version: number,
  signal?: AbortSignal,
) =>
  request(
    `/project-templates/${encodeURIComponent(id)}/revisions/${version}`,
    (raw) => {
      const row = record(raw);
      return {
        version: number(row.version),
        sha256: text(row.sha256, 64),
        definition: record(row.definition),
      };
    },
    { signal },
  );
export const getOwnProjectPackage = (projectId: string, signal?: AbortSignal) =>
  request(
    `/intern/me/projects/${encodeURIComponent(projectId)}/learning-package`,
    (raw) => {
      const row = record(raw);
      return {
        templateVersion: number(row.templateVersion),
        templateCode: string(row.templateCode),
        learningPackage: parseLearningPackage(row.learningPackage),
      };
    },
    { signal },
  );
