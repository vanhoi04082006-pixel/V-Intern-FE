/**
 * Agent phân tích CV (mock): chọn vai trò khớp từ thư viện nghề, sinh confidence
 * 62–91%, facts (kỹ năng + bằng chứng theo trang CV) và missing skills.
 */

import type { AgentAnalysis, CareerRoleRecord } from "./types";
import { getApplyStore } from "./store";
import { hashString, nowIso } from "../util";

/** Gợi ý vai trò từ tên file CV (chữ thường) — chỉ dùng từ khoá rõ nghĩa, tránh false positive. */
const CV_HINTS: Array<{ roleCode: string; keys: string[] }> = [
  { roleCode: "fullstack", keys: ["fullstack", "full-stack", "full_stack", "full"] },
  { roleCode: "frontend", keys: ["frontend", "front-end", "front_end", "react", "ui"] },
  { roleCode: "backend", keys: ["backend", "back-end", "back_end", "node", "api"] },
  { roleCode: "qa", keys: ["qa", "tester", "kiem-thu", "kiemthu", "test"] },
  { roleCode: "business_analyst", keys: ["business", "analyst", "nghiep-vu", "nghiepvu", "ba_" ] },
];

const CONTEXTS = [
  "dự án cá nhân có link demo",
  "đồ án môn học theo nhóm",
  "thực tập part-time tại startup",
  "hoạt động CLB lập trình trường",
  "hackathon 48 giờ",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function factsFor(role: CareerRoleRecord, seed: number, hasCv: boolean): AgentAnalysis["facts"] {
  const required = role.requiredSkills.slice(0, 3).map((s) => s.skill);
  const optional = role.optionalSkills.length ? [role.optionalSkills[0]] : [];
  const source: string[] = [...required, ...optional];
  const n = hasCv ? Math.max(2, 2 + (Math.abs(seed) % 2)) : 1;
  return source.slice(0, n).map((skill, i) => ({
    skill,
    evidence: `page:${(Math.abs(seed >> (i + 1)) % 2) + 1} — ${pick(CONTEXTS, seed + i)}`,
  }));
}

function missingFor(role: CareerRoleRecord, seed: number, hasCv: boolean): string[] {
  const pool = [
    ...role.requiredSkills.slice(3).map((s) => s.skill),
    ...role.optionalSkills.filter((s) => !role.requiredSkills.some((r) => r.skill === s)),
  ];
  const take = Math.min(pool.length, 1 + (Math.abs(seed) % 3));
  const missing = pool.slice(0, take);
  if (!hasCv) missing.unshift("CV bản đầy đủ (chưa nộp tệp CV)");
  return missing.length ? missing : ["Kinh nghiệm làm việc nhóm"];
}

function summaryFor(role: CareerRoleRecord, confidence: number, hasCv: boolean): string {
  if (!hasCv) {
    return `Hồ sơ chưa kèm CV nên Agent chỉ đánh giá sơ bộ ${confidence}% với vai trò ${role.name}. Hãy bổ sung CV để có kết quả phân tích chính xác.`;
  }
  if (confidence >= 80) {
    return `CV thể hiện nền tảng tốt cho vai trò ${role.name} (${confidence}%). Buổi phỏng vấn sẽ đi sâu vào các kỹ năng còn thiếu để xác nhận mức độ thành thạo thực tế.`;
  }
  if (confidence >= 70) {
    return `Nền tảng phù hợp vai trò ${role.name} (${confidence}%) nhưng còn một số lỗ hổng kỹ năng. Kỳ thực tập sẽ kèm mentor bù đắp các mục còn thiếu.`;
  }
  return `Điểm khớp ${confidence}% với vai trò ${role.name} ở vùng xem xét — Agent nhận thấy tiềm năng nhưng cần làm rõ thêm qua phỏng vấn.`;
}

export interface GenerateAnalysisInput {
  fullName: string;
  cvFileName: string | null;
}

/** Sinh phân tích đồng bộ (confidence luôn nằm trong 62–91%). */
export function generateAnalysis(input: GenerateAnalysisInput): AgentAnalysis {
  const store = getApplyStore();
  const published = store.careerRoles.filter((r) => r.status === "published" && r.acceptingApplications);
  const roles = published.length ? published : store.careerRoles.filter((r) => r.status === "published");

  const cv = (input.cvFileName ?? "").toLowerCase();
  let matched = roles.find((r) => CV_HINTS.some((h) => h.roleCode === r.code && h.keys.some((k) => cv.includes(k))));
  if (!matched) {
    const fallback = roles.length ? roles[hashString(input.fullName) % roles.length] : undefined;
    matched = fallback ?? roles[0];
  }
  if (!matched) {
    // Thư viện trống (admin archived hết) — trả phân tích "không xác định".
    return {
      matchedRole: "unknown",
      matchedRoleLabel: "Chưa xác định",
      confidence: 62,
      facts: [],
      missing: ["Thư viện nghề chưa có vai trò đang mở"],
      summary: "Chưa có vai trò đang nhận hồ sơ để so khớp — vui lòng thử lại sau.",
      analyzedAt: nowIso(),
    };
  }

  const seed = hashString(`${input.fullName}|${cv}`);
  const confidence = 62 + (Math.abs(seed) % 30); // 62–91
  const hasCv = !!input.cvFileName;
  return {
    matchedRole: matched.code,
    matchedRoleLabel: matched.name,
    confidence,
    facts: factsFor(matched, seed, hasCv),
    missing: missingFor(matched, seed, hasCv),
    summary: summaryFor(matched, confidence, hasCv),
    analyzedAt: nowIso(),
  };
}
