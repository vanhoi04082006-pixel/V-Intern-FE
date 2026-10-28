import { CircleCheck, Info } from "lucide-react";

import type { RecruitmentResultData } from "./recruitment-model";
import { TagPill } from "./onboarding-primitives";

/**
 * Cột phải (rail) của Result screen (dùng chung pass/fail) , COMPACT
 * theo reference 4A/4B: rail bắt đầu gần đỉnh content, padding gọn:
 * - `NextStepsCard`: "Bước tiếp theo" , 3 bước đánh số.
 * - `HiredRoleCard`: pass-only , "Vị trí đã tuyển dụng" + tags + lưu ý
 *   chưa được phân công Project.
 * - `ResultNotesCard`: "Lưu ý" + quote động viên (line-clamp để rail
 *   không dài hơn main , business info luôn ưu tiên hơn quote).
 */
export function NextStepsCard({
  steps,
}: {
  steps: RecruitmentResultData["nextSteps"];
}) {
  return (
    <section
      aria-labelledby="result-next-steps-heading"
      className="rounded-panel border border-border bg-card p-4 shadow-app-xs"
    >
      <h2
        id="result-next-steps-heading"
        className="flex items-center gap-2 text-small font-bold  text-muted-foreground"
      >
        <CircleCheck className="size-4 text-primary" aria-hidden="true" />
        Bước tiếp theo
      </h2>
      <ol className="mt-2 flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-caption font-bold text-primary"
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-small font-bold leading-snug text-foreground">
                {step.title}
              </span>
              <span className="mt-1 block text-small leading-snug text-muted-foreground">
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
      className="rounded-panel border border-border bg-success-subtle p-4 shadow-app-xs"
    >
      <h2
        id="result-hired-heading"
        className="text-small font-bold  text-success"
      >
        Vị trí đã tuyển dụng
      </h2>
      <p className="mt-2 text-section font-extrabold tracking-tight text-foreground">
        {result.appliedRoleLabel}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Nhóm kỹ năng của vị trí">
        {["React", "TypeScript", "UI/UX", "Web API"].map((tag) => (
          <li key={tag}>
            <TagPill tone="green">{tag}</TagPill>
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-control bg-card px-3 py-2 text-small font-medium leading-snug text-success">
        Chưa có Project nào được phân công , giảng viên sẽ phân bạn vào
        Project và Internship Session sau khi kết quả được duyệt.
      </p>
    </section>
  );
}

export function ResultNotesCard({ result }: { result: RecruitmentResultData }) {
  return (
    <section
      aria-labelledby="result-notes-heading"
      className="rounded-panel border border-border bg-card p-4 shadow-app-xs"
    >
      <h2
        id="result-notes-heading"
        className="flex items-center gap-2 text-small font-bold  text-muted-foreground"
      >
        <Info className="size-4 text-warning" aria-hidden="true" />
        Lưu ý
      </h2>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-small leading-snug text-foreground marker:text-warning">
        {result.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
