import { ChartColumn, MoreHorizontal } from "lucide-react";

import {
  Avatar,
  CardLinkAction,
  GhostIconButton,
  PillButton,
  ProgressBar,
  SectionCard,
  StatusBadge,
} from "./instructor-primitives";
import { cn } from "@/lib/utils";
import {
  STUDENT_STATUS_TONES,
  TOP_STUDENTS,
  type TopStudent,
} from "./data/instructor-mock-data";

function ScoreDelta({ delta }: { delta: number }) {
  const rising = delta >= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10.5px] font-semibold",
        rising ? "text-emerald-600" : "text-red-600"
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 10 10"
        className={cn("size-2", rising ? "" : "rotate-180")}
      >
        <path d="M5 1.5 9 8.5H1z" fill="currentColor" />
      </svg>
      {rising ? "+" : ""}
      {delta}%
    </span>
  );
}

function StudentRow({ student }: { student: TopStudent }) {
  return (
    <tr className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60">
      <td className="py-3 pl-3.5 pr-1 align-top text-xs font-semibold text-slate-400 sm:pl-4">
        {student.rank}
      </td>
      <td className="max-w-[138px] px-1.5 py-3 align-top @min-[590px]:max-w-[171px] sm:px-2">
        <div className="flex items-center gap-2">
          <Avatar initials={student.initials} tone={student.tone} className="size-6" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-navy">{student.name}</p>
            <p className="truncate text-[10.5px] text-slate-500">{student.email}</p>
          </div>
        </div>
      </td>
      <td className="px-1.5 py-3 align-top sm:px-2">
        <StatusBadge tone={student.roleTone} className="px-1.5 py-0.5 text-[10.5px]">
          {student.role}
        </StatusBadge>
      </td>
      <td className="px-1.5 py-3 align-top sm:px-2">
        <p className="whitespace-nowrap text-xs font-bold text-navy">
          {student.tasksDone} / {student.tasksTotal}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <ProgressBar value={student.completion} tone="blue" className="w-7" />
          <span className="text-[10.5px] text-slate-500">{student.completion}%</span>
        </div>
      </td>
      <td className="px-1.5 py-3 align-top sm:px-2">
        <p className="text-xs font-bold text-navy">{student.aiScore}</p>
        <ScoreDelta delta={student.scoreDelta} />
      </td>
      <td className="px-1.5 py-3 align-top sm:px-2">
        <StatusBadge
          tone={STUDENT_STATUS_TONES[student.status]}
          withDot
          className="px-1.5 py-0.5 text-[10.5px]"
        >
          {student.statusLabel}
        </StatusBadge>
      </td>
      <td className="py-3 pl-1.5 pr-4 align-top sm:pr-5">
        <div className="flex items-center justify-end gap-0.5">
          <PillButton
            variant="outline"
            ariaLabel={`Xem hiệu suất của ${student.name}`}
            className="h-7 px-2 text-[11.5px]"
          >
            Xem
          </PillButton>
          <GhostIconButton
            label={`Thao tác khác cho ${student.name}`}
            className="size-7"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </GhostIconButton>
        </div>
      </td>
    </tr>
  );
}

/**
 * Card "Hiệu suất sinh viên (Top 5)": bảng xếp hạng 5 sinh viên mock,
 * density 12px để 7 cột vừa card ở 1366–1440. Chỉ trình bày — nút
 * Xem/menu không thực hiện hành động thật.
 */
export function InstructorStudentsCard() {
  return (
    <SectionCard
      id="instructor-students-card"
      icon={ChartColumn}
      tone="blue"
      title="Hiệu suất sinh viên (Top 5)"
      actions={<CardLinkAction label="Xem tất cả" />}
      bodyClassName="p-0 sm:p-0 @container"
    >
      <div className="overflow-x-auto">
        <table
          aria-label="Bảng xếp hạng hiệu suất sinh viên"
          className="w-full min-w-[540px] border-collapse text-left text-xs"
        >
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-3 pl-4 pr-1 font-semibold sm:pl-5">
                #
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Sinh viên
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Vai trò
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Task hoàn thành
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Điểm AI TB
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Trạng thái
              </th>
              <th scope="col" className="py-3 pl-1.5 pr-4 text-right font-semibold sm:pr-5">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {TOP_STUDENTS.map((student) => (
              <StudentRow key={student.rank} student={student} />
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
