"use client";
import { useCallback, useState } from "react";
import { StudentHeading } from "@/components/intern/student-ui";
import { Pager, btn } from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { NoteCard, PaperDivider } from "@/components/workspace/notebook";
import { Tape } from "@/components/v-intern/doodles";
import { ownParticipation } from "@/lib/api/participation";
import { useResource } from "@/lib/api/use-resource";
import { IncidentList } from "./incident-list";
import { ParticipationSummary } from "./summary";
import { ReplacementHistory } from "./replacement-history";
import { RepositoryAccessStatus } from "./repository-access";
export function ParticipationStudent() {
  const [page, setPage] = useState(1);
  const report = useResource(
    useCallback(
      (signal: AbortSignal) => ownParticipation(page, signal),
      [page],
    ),
  );
  return (
    <div className="space-y-6">
      <StudentHeading
        title="Thời hạn & ghi nhận"
        description="Theo dõi bằng chứng nộp bài, gia hạn và điểm phạt của bạn."
        action={
          <button
            type="button"
            className={btn("secondary")}
            disabled={report.loading}
            onClick={report.reload}
          >
            Cập nhật
          </button>
        }
      />
      <p className="max-w-3xl text-body leading-6 text-muted-foreground">
        Thời điểm nộp hợp lệ đầu tiên quyết định đúng hạn. Thời gian giảng viên
        chấm hoặc yêu cầu sửa bài không tự tạo thêm một lần vi phạm.
      </p>
      {/* Ghi chú tay — luật chơi ngắn cho dễ nhớ */}
      <div className="max-w-md">
        <NoteCard rotate={-1} title="Ghi nhớ">
          Nộp sớm một bài đúng hạn vẫn hơn nộp muộn ba bài hoàn chỉnh — hệ
          thống tính theo lần nộp hợp lệ đầu tiên.
        </NoteCard>
      </div>
      {report.loading && <LoadingState />}
      {Boolean(report.error) && (
        <ErrorState error={report.error} onRetry={report.reload} />
      )}
      {report.data && (
        <>
          <div className="relative group">
            <Tape className="-top-3 left-6" rotate={-5} />
            <ParticipationSummary {...report.data.summary} />
          </div>
          <p className="text-caption leading-5 text-muted-foreground">
            Điểm phạt ghi nhận là căn cứ xem xét khi chấm bài, không phải tổng
            điểm đã trừ. Điểm đã chốt hiển thị riêng theo từng bài; miễn trừ sau
            đó không tự sửa kết quả đã duyệt.
          </p>
          <IncidentList items={report.data.items} />
          <Pager
            page={page}
            total={report.data.summary.total}
            totalPages={Math.ceil(
              report.data.summary.total / report.data.pageSize,
            )}
            onChange={setPage}
            unit="ghi nhận"
          />
        </>
      )}
      <PaperDivider />
      <ReplacementHistory />
      <RepositoryAccessStatus />
    </div>
  );
}
