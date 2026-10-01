import { Layers, MoreHorizontal, Plus } from "lucide-react";

import {
  CardLinkAction,
  GhostIconButton,
  PrimaryAction,
  ProgressBar,
  SectionCard,
  StatusBadge,
  AvatarStack,
} from "./instructor-primitives";
import { ACTIVE_SESSIONS, SESSION_STATUS_TONES } from "./data/instructor-mock-data";

/**
 * Card "Phiên thực tập đang hoạt động": bảng 4 phiên mock theo reference.
 * Density 12px như reference để 7 cột vừa trong card ở 1366–1440 không cần
 * scroll ngang (text dài tự ellipsis). Toàn bộ hành động (Xem chi tiết,
 * Tạo phiên mới, menu ...) chỉ là trình bày — không state, không API.
 */
export function InstructorSessionsCard() {
  return (
    <SectionCard
      id="instructor-sessions-card"
      icon={Layers}
      tone="blue"
      title="Phiên thực tập đang hoạt động"
      actions={
        <>
          <CardLinkAction label="Xem tất cả phiên" />
          <PrimaryAction>
            <Plus className="size-4" aria-hidden="true" />
            Tạo phiên mới
          </PrimaryAction>
        </>
      }
      bodyClassName="p-0 sm:p-0"
    >
      <div className="overflow-x-auto">
        <table
          aria-label="Danh sách phiên thực tập đang hoạt động"
          className="w-full min-w-[620px] border-collapse text-left text-xs"
        >
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-3 pl-4 pr-1.5 font-semibold sm:pl-5">
                Phiên
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Project
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Số sinh viên
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Tiến độ
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Trạng thái
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Thời gian
              </th>
              <th scope="col" className="py-3 pl-1.5 pr-4 text-right font-semibold sm:pr-5">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_SESSIONS.map((session) => {
              const [from, to] = session.timeframe.split("–").map((part) => part.trim());

              return (
                <tr
                  key={session.id}
                  className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
                >
                  <td className="whitespace-nowrap py-3.5 pl-4 pr-1.5 align-top sm:pl-5">
                    <p className="text-[13px] font-bold text-brand">{session.id}</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">{session.sessionLabel}</p>
                  </td>
                  <td className="max-w-[160px] px-1.5 py-3.5 align-top sm:px-2">
                    <p className="truncate text-[13px] font-semibold text-navy">
                      {session.project}
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                      {session.projectDetail}
                    </p>
                  </td>
                  <td className="px-1.5 py-3.5 align-top sm:px-2">
                    <p className="text-[13px] font-bold text-navy">{session.students}</p>
                    <div className="mt-1.5">
                      <AvatarStack
                        initials={session.avatarInitials}
                        extra={session.extraStudents}
                        avatarClassName="size-6 text-[9px]"
                      />
                    </div>
                  </td>
                  <td className="px-1.5 py-3.5 align-top sm:px-2">
                    <p className="text-[13px] font-bold text-navy">{session.progress}%</p>
                    <ProgressBar value={session.progress} tone="blue" className="mt-1.5 w-12" />
                  </td>
                  <td className="px-1.5 py-3.5 align-top sm:px-2">
                    <StatusBadge
                      tone={SESSION_STATUS_TONES[session.status]}
                      withDot
                      className="px-1.5 py-0.5 text-[10.5px]"
                    >
                      {session.statusLabel}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-3.5 align-top text-[10.5px] text-slate-500 sm:px-2">
                    <p>{from}</p>
                    <p className="mt-0.5">{to}</p>
                  </td>
                  <td className="py-3.5 pl-1.5 pr-4 align-top sm:pr-5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        aria-label={`Xem chi tiết phiên ${session.id}`}
                        className="inline-flex h-7 items-center whitespace-nowrap rounded-md px-1 text-[11.5px] font-semibold text-brand transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        Xem chi tiết
                      </button>
                      <GhostIconButton
                        label={`Thao tác khác cho phiên ${session.id}`}
                        className="size-7"
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </GhostIconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
