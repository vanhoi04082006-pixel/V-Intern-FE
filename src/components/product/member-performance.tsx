"use client";
import { SessionSection as Panel } from "@/components/sessions/session-section";
import { InstructorPageTitle as PageTitle } from "@/components/instructor/instructor-page-title";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/auth/api-client";
import {
  listPerformance,
  getMemberRecommendations,
  csvCell,
} from "@/lib/api/management";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { AcademicPicker } from "./academic-picker";
import { Metrics } from "./outcomes";
import { MarginNote } from "@/components/workspace/notebook";
import { StudentPerformanceDetail } from "./student-performance-detail";
import {
  Empty,
  Modal,
  buttonClass,
  inputClass,
  Pager,
} from "./primitives";
export function MemberPerformance({
  reports = false,
  initialProjectId = "",
  initialSessionId = "",
  basePath = "/instructor",
  lockedScope = false,
  embedded = false,
}: {
  reports?: boolean;
  initialProjectId?: string;
  initialSessionId?: string;
  basePath?: "/instructor" | "/admin";
  lockedScope?: boolean;
  embedded?: boolean;
}) {
  const [projectId, setProjectId] = useState(initialProjectId),
    [sessionId, setSessionId] = useState(initialSessionId),
    [search, setSearch] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<string>();
  const [page, setPage] = useState(1),
    [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const rows = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listPerformance(
          new URLSearchParams({
            page: String(page),
            pageSize: "10",
            ...(projectId ? { projectId } : {}),
            ...(sessionId ? { sessionId } : {}),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            ...(debounced ? { q: debounced } : {}),
          }),
          signal,
        ),
      [projectId, sessionId, from, to, debounced, page],
    ),
  );
  const data = rows.data?.items ?? [],
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
      {!embedded && (
        <PageTitle
          title={reports ? "Báo cáo tổng hợp" : "Hiệu suất thành viên"}
          subtitle="Số liệu trong phạm vi quản lý, tính từ nhiệm vụ và đánh giá đã chốt"
          action={
            <button
              className={buttonClass}
              onClick={download}
              disabled={rows.loading || Boolean(rows.error) || !data.length}
            >
              Xuất CSV trang này
            </button>
          }
        />
      )}
      {!embedded && basePath === "/instructor" && (
        <MarginNote className="max-w-md">
          chỉ số tính từ nhiệm vụ và đánh giá đã chốt ✎
        </MarginNote>
      )}
      {basePath === "/instructor" &&
        rows.data &&
        !rows.loading &&
        !rows.error && (
          <p className="mb-4 text-caption leading-6 text-muted-foreground">
            Trang hiện tại hiển thị {data.length}/{rows.data.total} thành viên
            theo bộ lọc. Chỉ số tổng hợp và tệp CSV bên dưới thuộc các thành
            viên trên trang này.
          </p>
        )}
      <div className="mb-5">
        {rows.loading ? (
          <LoadingState />
        ) : rows.error ? (
          <ErrorState error={rows.error} onRetry={rows.reload} />
        ) : (
          <Metrics
            values={[
              ["Thành viên trong trang", data.length],
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
          {!lockedScope && (
            <AcademicPicker
              kind="projects"
              label="Dự án báo cáo"
              value={projectId}
              onChange={(id) => {
                setPage(1);
                setProjectId(id);
                setSessionId("");
              }}
            />
          )}
          {!lockedScope && (
            <AcademicPicker
              kind="sessions"
              label="Phiên báo cáo"
              value={sessionId}
              projectId={projectId}
              onChange={(id) => {
                setPage(1);
                setSessionId(id);
              }}
            />
          )}
          <label className="text-body">
            Từ ngày
            <input
              className={inputClass}
              type="date"
              value={from}
              onChange={(e) => {
                setPage(1);
                setFrom(e.target.value);
              }}
            />
          </label>
          <label className="text-body">
            Đến ngày
            <input
              className={inputClass}
              type="date"
              value={to}
              onChange={(e) => {
                setPage(1);
                setTo(e.target.value);
              }}
            />
          </label>
        </div>
        <label className="mt-4 block text-body">
          Tìm sinh viên
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </Panel>
      {!rows.loading && !rows.error && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <Panel
            title={
              page === 1 && !debounced
                ? "Top 10 sinh viên hiệu suất tốt nhất"
                : "Kết quả tìm kiếm & xếp hạng"
            }
          >
            <p className="mb-3 text-caption text-muted-foreground">
              Ưu tiên tỷ lệ task hoàn thành, điểm đánh giá đã chốt, ít task trễ
              và khối lượng công việc. Các chỉ số tổng hợp bên trên chỉ tính
              trang hiện tại.
            </p>
            {!data.length ? (
              <Empty>Chưa có thành viên hoặc dữ liệu trong bộ lọc này.</Empty>
            ) : (
              <div className="overflow-x-auto" role="region" aria-label="Hiệu suất thành viên theo bộ lọc" tabIndex={0}>
                <table className="workspace-table w-full text-left text-body">
                  <thead className="bg-muted">
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
                      <tr key={m.userId} className="border-b border-border">
                        <td className="p-3">
                          <button
                            className="font-semibold text-primary"
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
            {rows.data && (
              <Pager
                page={page}
                total={rows.data.total}
                totalPages={Math.ceil(rows.data.total / rows.data.pageSize)}
                onChange={setPage}
                unit="sinh viên"
              />
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
                    <p className="mb-2 text-body">{label}: {value}</p>
                    <progress className="h-3 w-full accent-primary" value={Number(value)} max={Math.max(total, 1)} aria-label={String(label)} />
                  </div>
                ))}
                <p className="text-caption text-muted-foreground">
                  Chỉ biểu diễn dữ liệu hiện có. Chưa có chuỗi dữ liệu lịch sử
                  để vẽ xu hướng.
                </p>
              </div>
            </Panel>
            <details className="border-t border-border py-5">
              <summary className="min-h-10 cursor-pointer text-subsection font-semibold text-primary">Thứ hạng trong bộ lọc</summary>
              <ol className="space-y-3">
                {data.map((m, i) => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-3 border-b border-border py-3 text-body"
                  >
                    <span className="font-bold text-primary">
                      {m.rank ?? (page - 1) * 10 + i + 1}
                    </span>
                    <button
                      className="min-w-0 flex-1 break-words text-left font-semibold"
                      onClick={() => setSelected(m.userId)}
                    >
                      {m.displayName ?? m.userId}
                    </button>
                    <strong>
                      {m.taskCompletionRate === null
                        ? "—"
                        : `${m.taskCompletionRate}%`}
                    </strong>
                  </li>
                ))}
              </ol>
              {!data.length && (
                <Empty>Chưa có dữ liệu phù hợp để xếp hạng.</Empty>
              )}
              <p className="mt-3 text-caption text-muted-foreground">
                Thứ tự từ backend; sinh viên chưa có task giữ tỷ lệ chưa đo
                được.
              </p>
            </details>
          </div>
        </div>
      )}
      {selected && (
        <Modal
          title="Chi tiết hiệu suất"
          onClose={() => setSelected(undefined)}
        >
          <MemberDetail
            basePath={basePath}
            id={selected}
            scope={new URLSearchParams({
              ...(projectId ? { projectId } : {}),
              ...(sessionId ? { sessionId } : {}),
              ...(from ? { from } : {}),
              ...(to ? { to } : {}),
            }).toString()}
          />
        </Modal>
      )}
    </>
  );
}
function MemberDetail({
  id,
  scope,
  basePath,
}: {
  id: string;
  scope: string;
  basePath: "/instructor" | "/admin";
}) {
  const ai = useResource(
    useCallback((s: AbortSignal) => getMemberRecommendations(id, s), [id]),
  );
  return (
    <div className="space-y-5">
      <StudentPerformanceDetail
        key={`${id}:${scope}`}
        id={id}
        scope={scope}
        basePath={basePath}
      />
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
              <p className="text-body">{ai.data.summary}</p>
              {ai.data.recommendations.map((r) => (
                <article
                  key={r.title}
                  className="mt-3 border-b border-border py-3 text-body"
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
              <p className="mt-3 text-caption text-muted-foreground">
                Khuyến nghị tham khảo, không thay đổi kết quả đánh giá hay KPI.
              </p>
            </>
          )
        )}
      </Panel>
    </div>
  );
}
