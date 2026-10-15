"use client";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, GitPullRequest } from "lucide-react";
import {
  confirmCodeReview,
  listCodeReviews,
  listSubmissions,
  rubricKeys,
  runCodeReview,
  submitCode,
  withdrawCode,
  type ReviewRubric,
  type TaskSubmission,
} from "@/lib/api/submissions";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import { getSessionUser } from "@/lib/auth/session";
import type { Task } from "@/lib/api/work";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Badge, buttonClass, Empty, inputClass, Panel } from "./primitives";

const statuses = {
  submitted: "Đợi AI / giảng viên review",
  approved: "Giảng viên đã duyệt",
  rework: "Cần làm lại",
  withdrawn: "Đã rút bài",
};
const aiStatuses = {
  running: "AI đang kiểm tra code",
  awaiting_instructor: "AI đề xuất đạt · Chờ giảng viên xác nhận",
  needs_changes: "AI phát hiện điểm cần sửa",
  inconclusive: "Chưa đủ bằng chứng để kết luận",
  failed: "Chưa chấm được · Có thể thử lại",
};
const labels: Record<string, string> = {
  functional: "Chức năng",
  quality: "Chất lượng code",
  testing: "Kiểm thử",
  errors: "Xử lý lỗi",
  security: "Bảo mật",
  dod: "Tiêu chí hoàn thành",
};

export function CodeSubmissions({
  task,
  managed,
  onUpdated,
}: {
  task: Task;
  managed: boolean;
  onUpdated: () => void;
}) {
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => listSubmissions(task.id, signal),
      [task.id],
    ),
  );
  const [url, setUrl] = useState(""),
    [ref, setRef] = useState(""),
    [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const owner =
    task.assigneeId?.toLowerCase() === getSessionUser()?.id.toLowerCase();
  const pending = data.data?.some((s) => s.status === "submitted");
  async function send() {
    setBusy(true);
    setError("");
    try {
      await submitCode(task.id, {
        prUrl: url.trim(),
        ...(ref.trim() ? { ref: ref.trim() } : {}),
        summary,
        version: task.version,
      });
      setUrl("");
      setSummary("");
      data.reload();
      onUpdated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <GitPullRequest size={18} />
          Bài nộp & đánh giá code
        </span>
      }
    >
      <p className="mb-4 text-sm leading-6 text-slate-600">
        Nộp PR đang mở trong repo của phiên, hoặc link repo kèm branch/ref. Hệ
        thống khóa commit để chấm. Task chỉ hoàn thành sau khi giảng viên xác
        nhận.
      </p>
      {owner && !managed && !pending && task.status === "doing" && (
        <form
          className="mb-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label className="block text-sm font-semibold">
            Link PR, commit hoặc repository
            <input
              type="url"
              required
              maxLength={512}
              placeholder="https://github.com/giang-vien/repo/pull/1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Branch/ref nếu nộp link repository
            <input
              maxLength={200}
              placeholder="feature/task-01"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Bạn đã làm gì và kiểm thử thế nào?
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>
          <button disabled={busy} className={buttonClass}>
            {busy ? "Đang xác minh code…" : "Nộp code để review"}
          </button>
        </form>
      )}
      {owner && task.status === "todo" && (
        <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm">
          Bấm bắt đầu công việc trước khi nộp code.
        </p>
      )}
      {error && (
        <p role="alert" className="my-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : data.data?.length ? (
        <div className="space-y-5">
          {data.data.map((s) => (
            <SubmissionReview
              key={s.id}
              submission={s}
              task={task}
              managed={managed}
              onUpdated={() => {
                data.reload();
                onUpdated();
              }}
            />
          ))}
        </div>
      ) : (
        <Empty>Chưa có bài nộp code cho task này.</Empty>
      )}
      <button onClick={data.reload} className="mt-4 text-sm text-blue-700">
        Tải lại bài nộp
      </button>
    </Panel>
  );
}

function SubmissionReview({
  submission,
  task,
  managed,
  onUpdated,
}: {
  submission: TaskSubmission;
  task: Task;
  managed: boolean;
  onUpdated: () => void;
}) {
  const [show, setShow] = useState(submission.status === "submitted");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function withdraw() {
    setBusy(true);
    try {
      await withdrawCode(submission.id);
      onUpdated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>{statuses[submission.status]}</Badge>
        <span className="text-xs text-slate-500">
          {new Date(submission.submittedAt).toLocaleString("vi-VN")}
        </span>
        <a
          href={submission.prUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-sm text-blue-700"
        >
          Xem bài trên GitHub
          <ExternalLink size={13} />
        </a>
      </div>
      <p className="my-3 whitespace-pre-wrap text-sm">{submission.summary}</p>
      {submission.observedHeadSha && submission.observedHeadSha.toLowerCase() !== submission.headSha?.toLowerCase() && <div role="status" className="my-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold">GitHub ghi nhận code thay đổi sau khi nộp bài.</p><p className="mt-1">Hãy kiểm tra commit, rút bài và nộp lại khi cần. Giảng viên sẽ kiểm tra SHA hiện tại trước khi duyệt.</p><p className="mt-2 break-all font-mono text-xs">Commit được ghi nhận: {submission.observedHeadSha}</p></div>}
      {submission.headSha && (
        <p className="break-all font-mono text-xs text-slate-500">
          Commit được nộp: {submission.headSha}
        </p>
      )}
      {submission.score !== null && (
        <p className="mt-3 text-sm font-semibold">
          Điểm giảng viên: {submission.score}/100 · {submission.feedback}
        </p>
      )}
      <div className="mt-3 flex gap-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="text-sm text-blue-700"
        >
          {show ? "Thu gọn đánh giá" : "Xem đánh giá và bằng chứng"}
        </button>
        {!managed && submission.status === "submitted" && (
          <button
            disabled={busy}
            onClick={() => void withdraw()}
            className="text-sm text-amber-800"
          >
            Rút bài để cập nhật code
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {show && submission.headSha && (
        <AiCodeReview
          submission={submission}
          task={task}
          managed={managed}
          onUpdated={onUpdated}
        />
      )}
      {show && !submission.headSha && (
        <p className="mt-3 text-sm text-slate-500">
          Bài nộp lịch sử chưa có snapshot SHA; không có kết quả AI review code.
        </p>
      )}
      {show &&
        managed &&
        !submission.headSha &&
        submission.status === "submitted" && (
          <InstructorCodeDecision
            submission={submission}
            task={task}
            onUpdated={onUpdated}
          />
        )}
    </article>
  );
}
function AiCodeReview({
  submission,
  task,
  managed,
  onUpdated,
}: {
  submission: TaskSubmission;
  task: Task;
  managed: boolean;
  onUpdated: () => void;
}) {
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => listCodeReviews(submission.id, signal),
      [submission.id],
    ),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const review = data.data?.[0];
  useEffect(() => {
    if (review?.status !== "running") return;
    const timer = setTimeout(data.reload, 3000);
    return () => clearTimeout(timer);
  }, [review, data.reload]);
  async function run() {
    setBusy(true);
    setError("");
    try {
      await runCodeReview(submission.id);
      data.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const source = new URL(submission.prUrl),
    base = source.pathname.split("/").slice(0, 3).join("/");
  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : review ? (
        <>
          <p role="status" className="font-semibold text-navy">
            {aiStatuses[review.status]}
          </p>
          {review.result && (
            <>
              <p className="whitespace-pre-wrap text-sm">
                {review.result.summary}
              </p>
              <p className="text-sm">
                Điểm AI đề xuất: <strong>{review.result.score}/100</strong> ·{" "}
                {review.model}
              </p>
              <ul className="space-y-3">
                {review.result.findings.map((f, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-blue-700"
                      href={`https://github.com${base}/blob/${review.headSha}/${f.file.split("/").map(encodeURIComponent).join("/")}#L${f.line}`}
                    >
                      {f.file}:{f.line}
                    </a>
                    <p className="mt-1">
                      {f.severity} · {f.message}
                    </p>
                  </li>
                ))}
              </ul>
              {review.result.limitations.map((v, i) => (
                <p key={i} className="text-sm text-amber-800">
                  Giới hạn: {v}
                </p>
              ))}
            </>
          )}
          {review.evidence && (
            <div className="rounded-xl bg-blue-50/70 p-3 text-sm">
              <p>
                Source:{" "}
                {review.evidence.complete
                  ? "Đủ trong phạm vi kiểm tra"
                  : "Chưa đủ bằng chứng"}
              </p>
              <p>
                Runner: {review.evidence.tests?.status ?? "Chưa có"} ·{" "}
                {review.evidence.tests?.passed ?? 0} passed /{" "}
                {review.evidence.tests?.failed ?? 0} failed
              </p>
              <p>{review.evidence.tests?.summary}</p>
              {review.evidence.tests?.executionTimeMs != null && <p>Thực thi: {(review.evidence.tests.executionTimeMs / 1000).toFixed(2)} giây · Điểm test: {review.evidence.tests.score}/100</p>}
              {Boolean(review.evidence.tests?.checks.length) && <ul className="space-y-1">{review.evidence.tests!.checks.map((check, i) => <li key={i} className={check.passed ? 'text-emerald-700' : 'text-rose-700'}>{check.passed ? 'Đạt' : 'Chưa đạt'} · {check.name}<span className="block text-xs text-slate-500">{check.log}</span></li>)}</ul>}
              {review.evidence.warnings.map((v, i) => (
                <p key={i}>{v}</p>
              ))}
            </div>
          )}
          {review.errorCode && (
            <p className="text-sm text-amber-800">
              Mã trạng thái: {review.errorCode}. Bài nộp vẫn được giữ nguyên.
            </p>
          )}
          <p className="break-all text-xs text-slate-500">
            Lần chấm {review.id} · SHA {review.headSha} · Hash bằng chứng{" "}
            {review.inputHash ?? "chưa có"}
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">
          Chưa có lần AI review. Bạn có thể bắt đầu kiểm tra.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {submission.status === "submitted" && (
        <button
          disabled={busy || review?.status === "running"}
          onClick={() => void run()}
          className={buttonClass}
        >
          {busy ? "AI đang kiểm tra…" : "Chấm / thử lại bằng AI"}
        </button>
      )}
      <button onClick={data.reload} className="ml-4 text-sm text-blue-700">
        Tải lại kết quả AI
      </button>
      {managed &&
        submission.status === "submitted" &&
        !data.loading &&
        !data.error &&
        review?.status !== "running" && (
          <InstructorCodeDecision
            key={review?.id ?? "manual"}
            submission={submission}
            task={task}
            suggested={review?.result?.rubric}
            onUpdated={onUpdated}
          />
        )}
    </div>
  );
}

function InstructorCodeDecision({
  submission,
  task,
  suggested,
  onUpdated,
}: {
  submission: TaskSubmission;
  task: Task;
  suggested?: ReviewRubric;
  onUpdated: () => void;
}) {
  const [rubric, setRubric] = useState<ReviewRubric>(
    suggested ?? {
      functional: 0,
      quality: 0,
      testing: 0,
      errors: 0,
      security: 0,
      dod: 0,
    },
  );
  const [feedback, setFeedback] = useState(""),
    [override, setOverride] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="mt-5 space-y-4 rounded-xl border border-blue-100 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await confirmCodeReview(submission.id, {
            rubric,
            feedback,
            taskVersion: task.version,
            ...(override.trim() ? { overrideReason: override.trim() } : {}),
          });
          onUpdated();
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h4 className="font-semibold">Xác nhận cuối của giảng viên</h4>
      <p className="text-xs text-slate-500">
        Điểm tổng được tính theo rubric. Từ 70/100 là duyệt; dưới 70 là yêu cầu
        làm lại. Kết quả AI là đề xuất để bạn kiểm tra.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rubricKeys.map((key) => (
          <label key={key} className="text-xs">
            {labels[key]}
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              required
              className={inputClass}
              value={rubric[key]}
              onChange={(e) =>
                setRubric({ ...rubric, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
      </div>
      <label className="block text-sm">
        Nhận xét cho sinh viên
        <textarea
          required
          minLength={10}
          maxLength={4000}
          rows={3}
          className={inputClass}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Lý do chấm thủ công nếu kết quả AI chưa đủ cơ sở (tối thiểu 30 ký tự)
        <textarea
          minLength={30}
          maxLength={2000}
          rows={2}
          className={inputClass}
          value={override}
          onChange={(e) => setOverride(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button disabled={busy} className={buttonClass}>
        {busy ? "Đang xác nhận…" : "Lưu kết quả giảng viên"}
      </button>
    </form>
  );
}
