"use client";
import { useCallback, useState } from "react";
import { ApiError } from "@/lib/auth/api-client";
import {
  listPerformance,
  getMemberPerformance,
  getMemberRecommendations,
  csvCell,
} from "@/lib/api/management";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { AcademicPicker } from "./academic-picker";
import { Metrics } from "./outcomes";
import {
  PageTitle,
  Panel,
  Empty,
  Modal,
  buttonClass,
  inputClass,
} from "./primitives";
export function MemberPerformance({ reports = false, initialProjectId = "", initialSessionId = "" }: { reports?: boolean; initialProjectId?: string; initialSessionId?: string }) {
  const [projectId, setProjectId] = useState(initialProjectId),
    [sessionId, setSessionId] = useState(initialSessionId),
    [search, setSearch] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<string>();
  const rows = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listPerformance(
          new URLSearchParams({
            ...(projectId ? { projectId } : {}),
            ...(sessionId ? { sessionId } : {}),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            ...(search ? { q: search } : {}),
          }),
          signal,
        ),
      [projectId, sessionId, from, to, search],
    ),
  );
  const data = rows.data ?? [],
    total = data.reduce((n, m) => n + m.totalTaskCount, 0),
    done = data.reduce((n, m) => n + m.completedTaskCount, 0),
    scores = data.flatMap((m) =>
      m.averageEvaluationScore === null ? [] : [m.averageEvaluationScore],
    );
  function download() {
    const csv = [
      ["Thành viên", "Nhiệm vụ", "Hoàn thành", "Tỷ lệ (%)", "Điểm đánh giá"]
        .map(csvCell)
        .join(","),
      ...data.map((m) =>
        [
          m.displayName ?? m.userId,
          m.totalTaskCount,
          m.completedTaskCount,
          m.taskCompletionRate,
          m.averageEvaluationScore,
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "v-intern-performance.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageTitle
        title={reports ? "Báo cáo tổng hợp" : "Hiệu suất thành viên"}
        subtitle="Số liệu trong phạm vi quản lý, tính từ nhiệm vụ và đánh giá đã chốt"
        action={
          <button
            className={buttonClass}
            onClick={download}
            disabled={rows.loading || Boolean(rows.error) || !data.length}
          >
            Xuất CSV
          </button>
        }
      />
      <div className="mb-5">
        {rows.loading ? (
          <LoadingState />
        ) : rows.error ? (
          <ErrorState error={rows.error} onRetry={rows.reload} />
        ) : (
          <Metrics
            values={[
              ["Thành viên", data.length],
              ["Nhiệm vụ", total],
              ["Nhiệm vụ hoàn thành", done],
              [
                "Hoàn thành (%)",
                total ? Math.round((done / total) * 1000) / 10 : null,
              ],
              [
                "Điểm trung bình thành viên",
                scores.length
                  ? Math.round(
                      (scores.reduce((a, b) => a + b, 0) / scores.length) * 10,
                    ) / 10
                  : null,
              ],
            ]}
          />
        )}
      </div>
      <Panel title="Bộ lọc">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AcademicPicker
            kind="projects"
            label="Dự án báo cáo"
            value={projectId}
            onChange={id => { setProjectId(id); setSessionId(""); }}
          />
          <AcademicPicker
            kind="sessions"
            label="Phiên báo cáo"
            value={sessionId}
            projectId={projectId}
            onChange={setSessionId}
          />
          <label className="text-sm">
            Từ ngày
            <input
              className={inputClass}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Đến ngày
            <input
              className={inputClass}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-4 block text-sm">Tìm sinh viên<input className={inputClass} value={search} onChange={e => setSearch(e.target.value)} /></label>
      </Panel>
      <div className="mt-5" />
      {!rows.loading && !rows.error && (
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <Panel title="Kết quả thành viên">
            {!data.length ? (
              <Empty>Chưa có thành viên hoặc dữ liệu trong bộ lọc này.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Thành viên",
                        "Nhiệm vụ",
                        "Hoàn thành",
                        "Story points (%)",
                        "Đánh giá",
                      ].map((x) => (
                        <th key={x} className="p-3">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((m) => (
                      <tr key={m.userId} className="border-b border-slate-100">
                        <td className="p-3">
                          <button
                            className="font-semibold text-blue-600"
                            onClick={() => setSelected(m.userId)}
                          >
                            {m.displayName ?? m.userId}
                          </button>
                        </td>
                        <td className="p-3">
                          {m.completedTaskCount}/{m.totalTaskCount}
                        </td>
                        <td className="p-3">
                          {m.taskCompletionRate ?? "Chưa đo được"}
                        </td>
                        <td className="p-3">
                          {m.storyPointCompletionRate ?? "Chưa đo được"}
                        </td>
                        <td className="p-3">
                          {m.averageEvaluationScore ?? "Chưa chấm"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <div className="space-y-4">
            <Panel title="Phân bố hoàn thành">
              <div className="space-y-4">
                {[
                  ["Đã hoàn thành", done],
                  ["Chưa hoàn thành", total - done],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="mb-2 text-sm">
                      {label}: {value}
                    </p>
                    <progress
                      className="h-3 w-full accent-blue-600"
                      value={Number(value)}
                      max={Math.max(total, 1)}
                      aria-label={String(label)}
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Chỉ biểu diễn dữ liệu hiện có. Chưa có chuỗi dữ liệu lịch sử
                  để vẽ xu hướng.
                </p>
              </div>
            </Panel>
            <Panel title="Thành viên nổi bật · Top 10">
              <ol className="space-y-3">
                {data
                  .filter((m) => m.averageEvaluationScore !== null)
                  .sort(
                    (a, b) =>
                      (b.averageEvaluationScore ?? 0) -
                        (a.averageEvaluationScore ?? 0) ||
                      a.userId.localeCompare(b.userId),
                  )
                  .slice(0, 10)
                  .map((m, i) => (
                    <li
                      key={m.userId}
                      className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                    >
                      <span className="font-bold text-blue-600">{i + 1}</span>
                      <button
                        className="min-w-0 flex-1 truncate text-left font-semibold"
                        onClick={() => setSelected(m.userId)}
                      >
                        {m.displayName ?? m.userId}
                      </button>
                      <strong>{m.averageEvaluationScore}</strong>
                    </li>
                  ))}
              </ol>
              {!scores.length && (
                <Empty>Chưa có đánh giá đã chốt để xếp hạng.</Empty>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Theo điểm trung bình đánh giá đã chốt, trong bộ lọc hiện tại.
              </p>
            </Panel>
          </div>
        </div>
      )}
      {selected && (
        <Modal
          title="Chi tiết hiệu suất"
          onClose={() => setSelected(undefined)}
        >
          <MemberDetail id={selected} scope={new URLSearchParams({ ...(projectId ? { projectId } : {}), ...(sessionId ? { sessionId } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()} />
        </Modal>
      )}
    </>
  );
}
function MemberDetail({ id, scope }: { id: string; scope: string }) {
  const metrics = useResource(
    useCallback((s: AbortSignal) => getMemberPerformance(id, s, scope), [id, scope]),
  );
  const ai = useResource(
    useCallback((s: AbortSignal) => getMemberRecommendations(id, s), [id]),
  );
  return (
    <div className="space-y-5">
      {metrics.loading ? (
        <LoadingState />
      ) : metrics.error ? (
        <ErrorState error={metrics.error} onRetry={metrics.reload} />
      ) : (
        metrics.data && (
          <Metrics
            values={[
              ["Nhiệm vụ", metrics.data.totalTaskCount],
              ["Hoàn thành", metrics.data.completedTaskCount],
              ["Đúng hạn (%)", metrics.data.onTimeCompletionRate],
              ["Quá hạn", metrics.data.overdueOpenTaskCount],
              ["Điểm đánh giá", metrics.data.averageEvaluationScore],
              ["Story points hoàn thành", metrics.data.completedStoryPoints],
            ]}
          />
        )
      )}
      <Panel title="Khuyến nghị AI">
        {ai.loading ? (
          <LoadingState />
        ) : ai.error instanceof ApiError && ai.error.statusCode === 404 ? (
          <Empty>Chưa có khuyến nghị được lưu.</Empty>
        ) : ai.error ? (
          <ErrorState error={ai.error} onRetry={ai.reload} />
        ) : (
          ai.data && (
            <>
              <p className="text-sm">{ai.data.summary}</p>
              {ai.data.recommendations.map((r) => (
                <article
                  key={r.title}
                  className="mt-3 rounded-lg bg-blue-50 p-3 text-sm"
                >
                  <strong>{r.title}</strong>
                  <p>{r.reason}</p>
                  <ul className="mt-2 list-inside list-disc">
                    {r.actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </article>
              ))}
              <p className="mt-3 text-xs text-slate-500">
                Khuyến nghị tham khảo, không thay đổi kết quả đánh giá hay KPI.
              </p>
            </>
          )
        )}
      </Panel>
    </div>
  );
}
