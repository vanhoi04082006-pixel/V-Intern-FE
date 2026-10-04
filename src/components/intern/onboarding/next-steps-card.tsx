import { CircleCheck, Info } from "lucide-react";

import type { RecruitmentResultData } from "./data/recruitment-mock-data";
import { TagPill } from "./onboarding-primitives";

/**
 * Cột phải (rail) của Result screen (dùng chung pass/fail) — COMPACT
 * theo reference 4A/4B: rail bắt đầu gần đỉnh content, padding gọn:
 * - `NextStepsCard`: "Bước tiếp theo" — 3 bước đánh số.
 * - `HiredRoleCard`: pass-only — "Vị trí đã tuyển dụng" + tags + lưu ý
 *   chưa được phân công Project.
 * - `ResultNotesCard`: "Lưu ý" + quote động viên (line-clamp để rail
 *   không dài hơn main — business info luôn ưu tiên hơn quote).
 */
export function NextStepsCard({
  steps,
}: {
  steps: RecruitmentResultData["nextSteps"];
}) {
  return (
    <section
      aria-labelledby="result-next-steps-heading"
      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <h2
        id="result-next-steps-heading"
        className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-500"
      >
        <CircleCheck className="size-4 text-brand" aria-hidden="true" />
        Bước tiếp theo
      </h2>
      <ol className="mt-2 flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-brand"
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-snug text-navy">
                {step.title}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-slate-600">
                {step.description}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Pass-only: vai trò đã trúng tuyển + nhắc chưa có Project được phân công. */
export function HiredRoleCard({ result }: { result: RecruitmentResultData }) {
  if (!result.passed) return null;

  return (
    <section
      aria-labelledby="result-hired-heading"
      className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <h2
        id="result-hired-heading"
        className="text-[13px] font-bold uppercase tracking-wide text-emerald-700"
      >
        Vị trí đã tuyển dụng
      </h2>
      <p className="mt-2 text-lg font-extrabold tracking-tight text-navy">
        {result.appliedRoleLabel}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Nhóm kỹ năng của vị trí">
        {["React", "TypeScript", "UI/UX", "Web API"].map((tag) => (
          <li key={tag}>
            <TagPill tone="green">{tag}</TagPill>
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[13px] font-medium leading-snug text-emerald-800">
        Chưa có Project nào được phân công — giảng viên sẽ phân bạn vào
        Project và Internship Session sau khi kết quả được duyệt.
      </p>
    </section>
  );
}

export function ResultNotesCard({ result }: { result: RecruitmentResultData }) {
  return (
    <section
      aria-labelledby="result-notes-heading"
      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <h2
        id="result-notes-heading"
        className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-500"
      >
        <Info className="size-4 text-amber-500" aria-hidden="true" />
        Lưu ý
      </h2>
      <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-[13px] leading-snug text-slate-700 marker:text-amber-500">
        {result.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
