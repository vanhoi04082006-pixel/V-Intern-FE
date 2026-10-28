"use client";
import Link from "next/link";
import { Clock3, FileCheck2 } from "lucide-react";
import type { ParticipationIncident } from "@/lib/api/participation";
import { Badge, Empty } from "@/components/product/primitives";
const date = (value: string) => new Date(value).toLocaleString("vi-VN");
export function IncidentList({
  items,
  manage = false,
  onAction,
  onReplace,
}: {
  items: ParticipationIncident[];
  manage?: boolean;
  onAction?: (
    item: ParticipationIncident,
    action: "excused" | "reversed" | "extend",
  ) => void;
  onReplace?: (item: ParticipationIncident) => void;
}) {
  if (!items.length)
    return (
      <Empty>
        Chưa có ghi nhận vi phạm thời hạn. Thời điểm bài nộp hợp lệ đầu tiên
        quyết định đúng hạn; thời gian giảng viên chấm không tạo vi phạm.
      </Empty>
    );
  return (
    <ol className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="py-5 first:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-caption font-medium text-muted-foreground">
                {item.taskCode} · {manage ? item.displayName : item.sessionName}
              </p>
              <h3 className="mt-1 text-subsection font-semibold text-foreground">
                {item.taskTitle}
              </h3>
            </div>
            <Badge tone={item.status === "active" ? "amber" : "green"}>
              {item.status === "excused"
                ? "Đã miễn trừ"
                : item.status === "reversed"
                  ? "Đã hoàn tác"
                  : item.kind === "missing"
                    ? "Quá hạn · Chưa nộp"
                    : "Đã nộp trễ"}
            </Badge>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-body sm:grid-cols-3">
            <div>
              <dt className="text-caption text-muted-foreground">Hạn hiệu lực</dt>
              <dd className="mt-1 flex items-center gap-2">
                <Clock3 size={13} aria-hidden="true" />
                {date(item.dueAt)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Bài nộp đầu tiên</dt>
              <dd className="mt-1">
                {item.submittedAt ? date(item.submittedAt) : "Chưa ghi nhận"}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Điểm phạt ghi nhận</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {item.points} điểm{" "}
                <span className="font-normal text-muted-foreground">
                  · lần {item.ordinal}
                </span>
              </dd>
            </div>
          </dl>
          {item.baseScore !== null && (
            <p className="mt-3 flex items-center gap-2 text-body text-muted-foreground">
              <FileCheck2 size={15} aria-hidden="true" />
              Rubric {item.baseScore} − trễ hạn {item.latePenalty ?? 0} ={" "}
              <strong>{item.score}/100</strong>
              {item.submissionStatus === "approved" && " · Đã chốt bài"}
            </p>
          )}
          {item.status === "active" && item.recommendReplacement && (
            <p className="mt-3 border-l border-border pl-3 text-body text-warning">
              {item.replacementEligible
                ? "Đủ ngưỡng để giảng viên xem xét hỗ trợ hoặc thay thành viên; hệ thống không tự loại sinh viên."
                : "Ghi nhận này từng đạt ngưỡng xem xét thay thành viên. Quyết định mới phải dựa trên vi phạm còn hiệu lực và phân công hiện tại."}
            </p>
          )}
          {item.reason && (
            <p className="mt-3 border-l border-border pl-3 text-body text-muted-foreground">
              Lý do xử lý: {item.reason}
            </p>
          )}
          <p className="mt-2 text-caption text-muted-foreground">
            Chính sách v{item.policyVersion} · Hạn v{item.deadlineVersion}. Hoàn
            tác sau khi chốt không tự sửa điểm đã duyệt.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-body">
            <Link
              className="font-medium text-primary hover:underline"
              href={
                manage
                  ? `/instructor/tasks/${item.taskId}`
                  : `/intern/work/${item.taskId}`
              }
            >
              Xem nhiệm vụ
            </Link>
            {manage && item.status === "active" && (
              <>
                <button
                  onClick={() => onAction?.(item, "extend")}
                  className="text-primary hover:underline"
                >
                  Gia hạn
                </button>
                <button
                  onClick={() => onAction?.(item, "excused")}
                  className="text-primary hover:underline"
                >
                  Miễn trừ
                </button>
                <button
                  onClick={() => onAction?.(item, "reversed")}
                  className="text-muted-foreground hover:underline"
                >
                  Hoàn tác
                </button>
                {item.replacementEligible && onReplace && (
                  <button
                    type="button"
                    onClick={() => onReplace(item)}
                    className="font-medium text-warning hover:underline"
                  >
                    Xem xét thay thành viên
                  </button>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
