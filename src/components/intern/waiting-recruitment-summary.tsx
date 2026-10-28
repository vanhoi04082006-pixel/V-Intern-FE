"use client";
import { useCallback, useState } from "react";
import { BadgeCheck, History, RefreshCw } from "lucide-react";
import { recruitmentApi } from "@/lib/api/recruitment";
import { roleLabel } from "@/lib/api/workspace";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Pager } from "@/components/product/primitives";
import {
  StudentBadge,
  StudentCallout,
  StudentEmpty,
  StudentLink,
  StudentPanel,
} from "@/components/intern/student-ui";

const criterionLabels: Record<string, string> = {
  knowledge: "Kiến thức",
  communication: "Giao tiếp",
  problem_solving: "Giải quyết vấn đề",
  english: "Tiếng Anh",
  confidence: "Sự tự tin",
  reasoning: "Lập luận",
};
const statusLabels: Record<string, string> = {
  completed: "Đã đánh giá",
  expired: "Hết thời gian",
  cancelled: "Đã hủy",
  evaluation_failed: "Cần thử chấm lại",
  submitted: "Đã nộp",
  evaluating: "Đang chấm",
  in_progress: "Đang phỏng vấn",
  created: "Đã tạo",
};
export function WaitingRecruitmentSummary({
  onReload,
}: {
  onReload?: () => void;
}) {
  const [page, setPage] = useState(1);
  const state = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const [profile, history] = await Promise.all([
          recruitmentApi.me(signal),
          recruitmentApi.history(page, signal),
        ]);
        return { profile, history };
      },
      [page],
    ),
  );
  if (state.loading)
    return <LoadingState label="Đang tải kết quả và lịch sử phỏng vấn..." />;
  if (state.error)
    return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  const { profile, history } = state.data;
  const result = profile.result;
  return (
    <div className="space-y-5">
      <StudentPanel
        icon={BadgeCheck}
        title="Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StudentLink secondary href="/intern/notifications">
              Xem thông báo
            </StudentLink>
            {onReload && (
              <button
                type="button"
                className="student-action student-action-secondary student-action-sm"
                onClick={onReload}
              >
                <RefreshCw size={14} aria-hidden="true" />
                Tải lại trạng thái
              </button>
            )}
          </div>
        }
      >
        <p className="text-small leading-7 text-muted-foreground">
          Vị trí đã đăng ký:{" "}
          <strong className="text-[var(--student-navy)]">
            {profile.selectedRoleLabel ?? roleLabel(profile.selectedRole)}
          </strong>
        </p>
        {result ? (
          <>
            <dl className="student-result-grid">
              {[
                ["Tổng điểm", result.overallScore],
                ["Chuyên môn", result.technicalScore],
                ["Giao tiếp & tiếng Anh", result.softSkillScore],
              ].map(([label, score]) => (
                <div key={label} className="student-result-card">
                  <dt>{label}</dt>
                  <dd>{score}/100</dd>
                </div>
              ))}
            </dl>
            <details className="student-help-disclosure">
              <summary>Điểm mạnh, hướng cải thiện & tiêu chí</summary>
            <div className="student-eval-columns">
              <div>
                <h3>Kỹ năng & điểm mạnh</h3>
                {result.strengths.length ? (
                  <ul>
                    {result.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-muted-foreground">
                    Chưa có nhận xét kỹ năng.
                  </p>
                )}
              </div>
              <div>
                <h3>Định hướng cải thiện</h3>
                {result.weaknesses.length ? (
                  <ul>
                    {result.weaknesses.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-muted-foreground">
                    Chưa có đề xuất cải thiện.
                  </p>
                )}
              </div>
            </div>
            {result.criteria.length > 0 && (
              <div className="student-criteria-grid">
                {result.criteria.map((c, index) => (
                  <div className="student-criterion" key={c.code}>
                    <div>
                      <strong>
                        {criterionLabels[c.code] ?? `Tiêu chí ${index + 1}`}
                      </strong>
                      <span>{c.score}/100</span>
                    </div>
                    <p>{c.feedback}</p>
                  </div>
                ))}
              </div>
            )}
            </details>
          </>
        ) : (
          <div className="mt-4">
            <StudentCallout tone="blue" title="Kết quả đang được đồng bộ">
              Kết quả phỏng vấn chưa sẵn sàng. Hãy tải lại sau ít phút; điểm và
              nhận xét sẽ xuất hiện tại đây khi hệ thống hoàn tất.
            </StudentCallout>
          </div>
        )}
      </StudentPanel>

      <StudentPanel
        icon={History}
        title="Lịch sử phỏng vấn"
        action={
          <StudentLink secondary href="/intern/onboarding/result">
            Xem kết quả tuyển dụng
          </StudentLink>
        }
      >
        {history.items.length ? (
          <ol className="student-timeline">
            {history.items.map((s) => (
              <li key={s.id}>
                <span className="student-timeline-marker" aria-hidden="true">
                  {s.attemptNumber}
                </span>
                <div>
                  <div className="student-history-head">
                    <strong>
                      Lần {s.attemptNumber} · {roleLabel(s.roleCode)}
                    </strong>
                    <StudentBadge
                      tone={
                        s.result
                          ? s.result.decision === "passed"
                            ? "green"
                            : "rose"
                          : "slate"
                      }
                    >
                      {s.result
                        ? s.result.decision === "passed"
                          ? "Đã đậu"
                          : "Chưa đạt"
                        : (statusLabels[s.status] ?? s.status)}
                    </StudentBadge>
                    {s.result && (
                      <span className="student-history-score">
                        {s.result.overallScore}/100
                      </span>
                    )}
                  </div>
                  {s.startedAt && (
                    <time>
                      {new Date(s.startedAt).toLocaleString("vi-VN")}
                    </time>
                  )}
                  {s.result && <p>{s.result.feedback}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <StudentEmpty icon={History} title="Chưa có phiên phỏng vấn">
            Lịch sử các lần phỏng vấn sẽ xuất hiện tại đây sau khi bạn hoàn thành.
          </StudentEmpty>
        )}
        {history.total > 5 && (
          <Pager
            page={page}
            total={history.total}
            totalPages={Math.ceil(history.total / 5)}
            onChange={setPage}
            unit="lần phỏng vấn"
          />
        )}
      </StudentPanel>
    </div>
  );
}
