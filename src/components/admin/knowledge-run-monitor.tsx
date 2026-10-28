"use client";
import { useCallback, useEffect, useState } from "react";
import {
  cancelKnowledgeRun,
  createKnowledgeRun,
  getKnowledgeRun,
  resumeKnowledgeRun,
  knowledgeRunStatuses,
  type KnowledgeRun,
} from "@/lib/api/knowledge-runs";
import {
  Badge,
  buttonClass,
  Field,
  InlineAlert,
  inputClass,
  Panel,
} from "@/components/product/primitives";
import { ErrorState } from "@/components/shared/data-state";

const statuses: Record<string, string> = {
  queued: "Đang chờ",
  running: "Đang chạy",
  paused: "Tạm dừng",
  succeeded: "Thành công",
  failed: "Lỗi",
  cancelled: "Đã hủy",
};

/** Poll an in-flight run every 3s; terminal statuses stop the loop. */
const POLL_MS = 3000;
const inFlight = (run: KnowledgeRun | null) =>
  run !== null && (run.status === "queued" || run.status === "running");

export function KnowledgeRunMonitor({
  get = getKnowledgeRun,
  create = createKnowledgeRun,
  cancel = cancelKnowledgeRun,
  resume = resumeKnowledgeRun,
  initialRun = null,
}: {
  get?: typeof getKnowledgeRun;
  create?: typeof createKnowledgeRun;
  cancel?: typeof cancelKnowledgeRun;
  resume?: typeof resumeKnowledgeRun;
  initialRun?: KnowledgeRun | null;
}) {
  const [question, setQuestion] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [run, setRun] = useState<KnowledgeRun | null>(initialRun);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!run || !inFlight(run)) return;
    const runId = run.id;
    const timer = setInterval(() => {
      void get(runId)
        .then((next) => {
          if (next.id === runId) setRun(next);
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [run, get]);

  const act = useCallback(
    async (work: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await work();
      } catch (e) {
        setError(e);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <Panel title="Truy vấn tri thức (Agent)">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy || !question.trim()) return;
          void act(async () => {
            const created = await create(
              question.trim(),
              roleCode.trim() || undefined,
            );
            setRun(created);
          });
        }}
      >
        <Field
          label="Câu hỏi"
          htmlFor="knowledge-run-question"
          hint="3 – 1000 ký tự. Mỗi lần chạy dùng mã yêu cầu riêng để tránh chạy trùng."
        >
          <textarea
            id="knowledge-run-question"
            className={inputClass}
            required
            minLength={3}
            maxLength={1000}
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </Field>
        <Field
          label="Mã vai trò (tùy chọn)"
          htmlFor="knowledge-run-role"
          hint="Chỉ áp dụng ngữ cảnh trả lời; không cấp quyền truy cập."
        >
          <input
            id="knowledge-run-role"
            className={inputClass}
            pattern="[a-z][a-z0-9_]{1,31}"
            maxLength={32}
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={buttonClass}
            disabled={busy || inFlight(run)}
            type="submit"
          >
            {busy ? "Đang gửi…" : "Chạy truy vấn"}
          </button>
          {run && inFlight(run) && (
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => void act(() => cancel(run.id).then(setRun))}
            >
              Hủy lượt chạy
            </button>
          )}
          {run &&
            run.status === "failed" &&
            run.retryable &&
            run.attempts < 3 && (
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() =>
                  void act(async () => {
                    await resume(run.id);
                    setRun(await get(run.id));
                  })
                }
              >
                Chạy lại
              </button>
            )}
          {run && inFlight(run) && (
            <span className="text-caption text-muted-foreground" role="status">
              Tự làm mới sau mỗi 3 giây…
            </span>
          )}
        </div>
        {Boolean(error) && (
          <ErrorState title="Không thể thực hiện thao tác" error={error} />
        )}
      </form>

      {run && (
        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                run.status === "succeeded"
                  ? "green"
                  : run.status === "failed"
                    ? "red"
                    : "sky"
              }
            >
              {statuses[run.status] ?? run.status}
            </Badge>
            <Badge tone="gray">
              {run.attempts} lượt thực thi · {run.steps} bước
            </Badge>
            <Badge tone="gray">
              Token vào/ra: {run.inputTokens ?? "—"} / {run.outputTokens ?? "—"}
            </Badge>
          </div>
          <p className="break-all font-mono text-caption text-muted-foreground">
            {run.id} · hạn xử lý {new Date(run.deadlineAt).toLocaleString("vi-VN")}
          </p>
          {run.errorCode && (
            <p className="break-all font-mono text-caption text-destructive">
              {run.errorCode}
            </p>
          )}
          {run.output && (
            <div className="space-y-2">
              <p className="text-body leading-6 text-foreground">
                {run.output.answer}
              </p>
              {run.output.insufficientEvidence && (
                <InlineAlert tone="warning">
                  Agent báo không đủ bằng chứng trong thư viện; câu trả lời
                  cần kiểm chứng thêm.
                </InlineAlert>
              )}
              <p className="text-caption text-muted-foreground">
                {run.output.citations.length} trích dẫn nguồn.
              </p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

export { knowledgeRunStatuses };