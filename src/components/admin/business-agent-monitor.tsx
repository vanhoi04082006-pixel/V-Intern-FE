"use client";
import { useCallback, useState } from "react";
import { agentStatuses, getBusinessRuns } from "@/lib/api/business-agents";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  Badge,
  buttonClass,
  inputClass,
  Pager,
} from "@/components/product/primitives";
const names: Record<string, string> = {
  "interview-conversation": "Hội thoại phỏng vấn",
  "interview-evaluator": "Chấm phỏng vấn",
  "project-planner": "Lập kế hoạch",
  "code-reviewer": "Review code",
  "learning-mentor": "Mentor học tập",
  "performance-advisor": "Tư vấn hiệu suất",
  "instructor-assistant": "Hỗ trợ giảng viên",
};
const statuses: Record<string, string> = {
  queued: "Đang chờ",
  running: "Đang chạy",
  paused: "Tạm dừng",
  succeeded: "Thành công",
  failed: "Lỗi",
  cancelled: "Đã hủy",
};
export function BusinessAgentMonitor({
  get = getBusinessRuns,
}: {
  get?: typeof getBusinessRuns;
}) {
  const [page, setPage] = useState(1),
    [agent, setAgent] = useState(""),
    [status, setStatus] = useState("");
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => get(page, agent, status, signal),
      [get, page, agent, status],
    ),
  );
  const data = resource.data;
  return (
    <section
      aria-label="Vận hành Agent nghiệp vụ"
      className="min-w-0 space-y-5 border-t border-border pt-7"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-section font-bold text-foreground">Agent & lượt chạy</h2>
          <p className="mt-1 max-w-3xl text-body leading-6 text-muted-foreground">
            Registry, phiên bản và trạng thái từ runtime SQL. Chỉ hiển thị
            metadata; không tải prompt, lời giải hay hội thoại. Làm mới không
            gọi model.
          </p>
        </div>
        <button
          type="button"
          disabled={resource.loading}
          className={buttonClass}
          onClick={resource.reload}
        >
          Làm mới lượt chạy
        </button>
      </header>
      {data && (
        <dl className="grid gap-x-6 gap-y-3 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.definitions.map((item) => (
            <div key={item.id}>
              <dt className="text-body font-semibold text-foreground">
                {names[item.id] ?? item.id}{" "}
                <span className="font-normal text-muted-foreground">
                  v{item.version}
                </span>
              </dt>
              <dd className="mt-1 break-all text-caption leading-5 text-muted-foreground">
                {item.id}, tối đa {item.maxToolCalls} lần đọc tool
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="min-w-0 flex-1 text-body">
          Agent
          <select
            aria-label="Lọc Agent"
            className={inputClass}
            value={agent}
            onChange={(event) => {
              setAgent(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả Agent</option>
            {data?.definitions.map((item) => (
              <option key={item.id} value={item.id}>
                {names[item.id] ?? item.id}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 flex-1 text-body">
          Trạng thái
          <select
            aria-label="Lọc trạng thái Agent"
            className={inputClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {agentStatuses.map((item) => (
              <option key={item} value={item}>
                {statuses[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {resource.loading ? (
        <LoadingState />
      ) : resource.error ? (
        <ErrorState error={resource.error} onRetry={resource.reload} />
      ) : data?.items.length ? (
        <div className="min-w-0 overflow-x-auto" role="region" aria-label="Lịch sử chạy Agent" tabIndex={0}>
          <table className="w-full min-w-[680px] text-left text-body">
            <caption className="sr-only">
              Lịch sử Agent, phiên bản, model và trạng thái thực tế
            </caption>
            <thead className="border-y border-border text-caption text-muted-foreground">
              <tr>
                {[
                  "Agent / phiên bản",
                  "Lượt chạy / thời gian",
                  "Model / công cụ",
                  "Trạng thái",
                ].map((title) => (
                  <th key={title} className="px-3 py-3 font-semibold">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((run) => (
                <tr key={run.id} className="align-top hover:bg-muted/70">
                  <td className="max-w-56 px-3 py-4">
                    <p className="font-semibold">
                      {names[run.agentId] ?? run.agentId}, v{run.agentVersion}
                    </p>
                    <p className="mt-1 break-all font-mono text-caption text-muted-foreground">
                      {run.promptVersion}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-mono text-caption">{run.id}</p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <p>{run.model ?? "Chưa có kết quả model"}</p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {run.toolCalls} tool, {run.attempts} lượt thực thi ·{" "}
                      {run.stepCount} bước
                    </p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      Token vào/ra: {run.inputTokens ?? "—"} /{" "}
                      {run.outputTokens ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <Badge
                      tone={
                        run.status === "succeeded"
                          ? "green"
                          : run.status === "failed"
                            ? "red"
                            : "gray"
                      }
                    >
                      {statuses[run.status]}
                    </Badge>
                    {run.errorCode && (
                      <p className="mt-2 max-w-44 break-all font-mono text-caption text-destructive">
                        {run.errorCode}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border-y border-border py-8 text-body text-muted-foreground">
          Chưa có lượt chạy trong bộ lọc này. Sử dụng một chức năng AI nghiệp vụ
          rồi làm mới để xem dữ liệu thực.
        </p>
      )}
      {data && (
        <Pager
          page={page}
          total={data.total}
          totalPages={Math.max(1, Math.ceil(data.total / data.pageSize))}
          onChange={setPage}
        />
      )}
    </section>
  );
}
