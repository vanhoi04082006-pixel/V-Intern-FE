import { CodeXml, MoreHorizontal } from "lucide-react";

import {
  Avatar,
  CardLinkAction,
  GhostIconButton,
  PillButton,
  SectionCard,
  StatusBadge,
} from "./instructor-primitives";
import { PR_REVIEWS, PR_STATUS_TONES } from "./data/instructor-mock-data";

/**
 * Card "Review & Đánh giá (Pull Request)": 5 PR mock với điểm AI và trạng
 * thái semantic. Density 12px để vừa card phải ở 1366–1440. Nút Duyệt/Xem
 * chỉ là trình bày (không mutation thật).
 */
export function InstructorPrReviewCard() {
  return (
    <SectionCard
      id="instructor-pr-review-card"
      icon={CodeXml}
      tone="blue"
      title="Review & Đánh giá (Pull Request)"
      actions={<CardLinkAction label="Xem tất cả" />}
      bodyClassName="p-0 sm:p-0 @container"
    >
      <div className="overflow-x-auto">
        <table
          aria-label="Danh sách pull request chờ đánh giá"
          className="w-full min-w-[450px] border-collapse text-left text-xs"
        >
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-3 pl-4 pr-1.5 font-semibold sm:pl-5">
                PR / Task
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Sinh viên
              </th>
              <th scope="col" className="px-1.5 py-3 font-semibold sm:px-2">
                Điểm AI
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
            {PR_REVIEWS.map((pr) => (
              <tr
                key={pr.id}
                className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
              >
                <td className="max-w-[116px] py-3 pl-4 pr-1.5 align-top @min-[510px]:max-w-[128px] sm:pl-5">
                  <p className="truncate text-xs font-bold">
                    <span className="text-brand">#{pr.number}</span>{" "}
                    <span className="font-semibold text-navy">{pr.title}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] text-slate-500">{pr.detail}</p>
                </td>
                <td className="max-w-[110px] px-1.5 py-3 align-top @min-[510px]:max-w-[171px] sm:px-2">
                  <div className="flex items-center gap-2">
                    <Avatar initials={pr.initials} tone={pr.tone} className="size-6" />
                    <span className="truncate text-xs font-medium text-navy">
                      {pr.student}
                    </span>
                  </div>
                </td>
                <td className="px-1.5 py-3 align-top text-xs font-bold text-navy sm:px-2">
                  {pr.score}
                </td>
                <td className="px-1.5 py-3 align-top sm:px-2">
                  <StatusBadge
                    tone={PR_STATUS_TONES[pr.status]}
                    withDot
                    className="px-1.5 py-0.5 text-[10.5px]"
                  >
                    {pr.statusLabel}
                  </StatusBadge>
                </td>
                <td className="py-3 pl-1.5 pr-4 align-top sm:pr-5">
                  <div className="flex items-center justify-end gap-0.5">
                    {pr.action === "approve" ? (
                      <PillButton
                        variant="soft"
                        ariaLabel={`Duyệt pull request #${pr.number}`}
                        className="h-7 px-2 text-[11.5px]"
                      >
                        Duyệt
                      </PillButton>
                    ) : (
                      <PillButton
                        variant="outline"
                        ariaLabel={`Xem pull request #${pr.number}`}
                        className="h-7 px-2 text-[11.5px]"
                      >
                        Xem
                      </PillButton>
                    )}
                    <GhostIconButton
                      label={`Thao tác khác cho pull request #${pr.number}`}
                      className="size-7"
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </GhostIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
