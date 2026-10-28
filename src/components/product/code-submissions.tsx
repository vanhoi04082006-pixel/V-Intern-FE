"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { ApiError, errorMessage, isRecord } from "@/lib/auth/api-client";
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
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const owner =
    task.assigneeId?.toLowerCase() === getSessionUser()?.id.toLowerCase();
  const pending = data.data?.some((s) => s.status === "submitted");
  async function send() {
    setBusy(true);
    setError("");
    setSent(false);
    try {
      await submitCode(task.id, {
        prUrl: url.trim(),
        ...(ref.trim() ? { ref: ref.trim() } : {}),
        summary,
        version: task.version,
      });
      setUrl("");
      setSummary("");
      setSent(true);
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
      <p className="mb-4 text-body leading-6 text-muted-foreground">
        Nộp PR đang mở trong repo của phiên, hoặc link repo kèm branch/ref. Hệ
        thống khóa commit để chấm. Task chỉ hoàn thành sau khi giảng viên xác
        nhận.
      </p>
      {!managed && pending && (
        <p
          role="status"
          className="mb-5 rounded-control border border-warning bg-warning-subtle p-4 text-body leading-7 text-warning"
        >
          Bạn đang có bài nộp chờ xử lý. Theo dõi đánh giá bên dưới; nếu cần
          thay đổi code, rút bài hiện tại rồi nộp lại để hệ thống kiểm tra đúng
          commit mới.
        </p>
      )}
      {owner && !managed && !pending && task.status === "doing" && (
        <form
          id="task-submission-form"
          className="mb-6 space-y-4 border-b border-border pb-6"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="border-l border-primary/30 bg-accent/50 p-4">
            <p className="text-small font-semibold text-foreground">
              Điều kiện để chuyển sang Chờ duyệt
            </p>
            <p className="mt-1.5 text-caption leading-6 text-muted-foreground">
              Nhiệm vụ đang ở Đang làm, bạn là người được giao, link PR/commit
              thuộc repository của phiên, mô tả tối thiểu 10 ký tự và không có
              bài nộp nào đang chờ xử lý. Nếu nhiệm vụ có phụ thuộc, các nhiệm vụ
              đó phải được giảng viên xác nhận Hoàn thành trước.
            </p>
          </div>
          <label className="block text-body font-semibold">
            Link PR, commit hoặc repository
            <input
              id="submission-pr-url"
              type="url"
              required
              maxLength={512}
              placeholder="https://github.com/owner/repository/pull/1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-body">
            Branch/ref nếu nộp link repository
            <input
              maxLength={200}
              placeholder="feature/task-01"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-body font-semibold">
            Bạn đã làm gì và kiểm thử thế nào?
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Các phần đã hoàn thành, cách kiểm thử và kết quả. Nêu rõ phần còn hạn chế nếu có."
              className={inputClass}
            />
          </label>
          <button disabled={busy} className={buttonClass}>
            {busy ? "Đang xác minh code…" : "Nộp code để review"}
          </button>
          {sent && (
            <p
              role="status"
              className="rounded-control border border-success bg-success-subtle p-3 text-body text-success"
            >
              Đã gửi bài. Nhiệm vụ đang được chuyển sang Chờ duyệt sau khi hệ
              thống xác minh.
            </p>
          )}
          <p className="text-caption leading-6 text-muted-foreground">
            Hệ thống chấm phiên bản code tại thời điểm nộp. Push thêm code sau
            đó không tự thay thế commit đã nộp.
          </p>
        </form>
      )}
      {owner && task.status === "todo" && (
        <p className="mb-4 rounded-control bg-accent p-3 text-body">
          Bấm bắt đầu công việc trước khi nộp code.
        </p>
      )}
      {!managed && (
        <details className="student-submission-guide">
          <summary>Quy trình nộp bài và duyệt</summary>
          <ol className="student-step-list mt-3">
            <li>
              <div>
                <strong>Kiểm tra bài làm</strong>
                <p>Chạy kiểm thử và đối chiếu tiêu chí hoàn thành.</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Chuẩn bị liên kết</strong>
                <p>Dùng PR đang mở hoặc repository kèm branch/ref.</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Theo dõi phản hồi</strong>
                <p>AI đưa gợi ý; giảng viên xác nhận kết quả.</p>
              </div>
            </li>
          </ol>
        </details>
      )}
      {error && (
        <p role="alert" className="my-3 text-body text-destructive">
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
      <button onClick={data.reload} className="mt-4 text-body text-primary">
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
    <article className="border-b border-border py-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>{statuses[submission.status]}</Badge>
        <span className="text-caption text-muted-foreground">
          {new Date(submission.submittedAt).toLocaleString("vi-VN")}
        </span>
        <a
          href={submission.prUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-body text-primary"
        >
          Xem bài trên GitHub
          <ExternalLink size={13} />
        </a>
      </div>
      <p className="my-3 whitespace-pre-wrap text-body">{submission.summary}</p>
      {submission.observedHeadSha &&
        submission.observedHeadSha.toLowerCase() !==
          submission.headSha?.toLowerCase() && (
          <div
            role="status"
            className="my-3 rounded-control bg-warning-subtle p-3 text-body text-warning"
          >
            <p className="font-semibold">
              GitHub ghi nhận code thay đổi sau khi nộp bài.
            </p>
            <p className="mt-1">
              Hãy kiểm tra commit, rút bài và nộp lại khi cần. Giảng viên sẽ
              kiểm tra SHA hiện tại trước khi duyệt.
            </p>
            <p className="mt-2 break-all font-mono text-caption">
              Commit được ghi nhận: {submission.observedHeadSha}
            </p>
          </div>
        )}
      {submission.headSha && (
        <p className="break-all font-mono text-caption text-muted-foreground">
          Commit được nộp: {submission.headSha}
        </p>
      )}
      {submission.sourceRef && (
        <p className="mt-2 break-all font-mono text-caption text-muted-foreground">
          {submission.sourceKind === "pull"
            ? `Pull request #${submission.sourceRef}`
            : `${submission.sourceKind === "branch" ? "Nhánh" : submission.sourceKind === "commit" ? "Commit/ref" : "Ref nguồn"}: ${submission.sourceRef}`}
        </p>
      )}
      {submission.score !== null && (
        <p className="mt-3 text-body font-semibold">
          Điểm giảng viên: {submission.score}/100; {submission.feedback}
          {!!submission.latePenalty && submission.baseScore != null && <span className="mt-1 block text-caption text-warning">Rubric gốc {submission.baseScore} − trễ hạn {submission.latePenalty} = {submission.score}/100. Bằng chứng và cách xử lý được lưu tại mục Thời hạn & trách nhiệm.</span>}
        </p>
      )}
      <div className="mt-3 flex gap-4">
        <button
          onClick={() => setShow((v) => !v)}
          className="text-body text-primary"
        >
          {show ? "Thu gọn đánh giá" : "Xem đánh giá và bằng chứng"}
        </button>
        {!managed && submission.status === "submitted" && (
          <button
            disabled={busy}
            onClick={() => void withdraw()}
            className="text-body text-warning"
          >
            Rút bài để cập nhật code
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-body text-destructive">
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
        <p className="mt-3 text-body text-muted-foreground">
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
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : review ? (
        <>
          <p role="status" className="font-semibold text-foreground">
            {review.status === "awaiting_instructor" &&
            submission.status !== "submitted"
              ? `AI đề xuất đạt · ${statuses[submission.status]}`
              : aiStatuses[review.status]}
          </p>
          {review.result && (
            <>
              <p className="whitespace-pre-wrap text-body">
                {review.result.summary}
              </p>
              <p className="text-body">
                Điểm AI đề xuất: <strong>{review.result.score}/100</strong> ·{" "}
                {review.model}
              </p>
              <ul className="space-y-3">
                {review.result.findings.map((f, i) => (
                  <li key={i} className="rounded-control bg-background p-3 text-body">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-caption text-primary"
                      href={`https://github.com${base}/blob/${review.headSha}/${f.file.split("/").map(encodeURIComponent).join("/")}#L${f.line}`}
                    >
                      {f.file}:{f.line}
                    </a>
                    <p className="mt-1">
                      {f.severity}; {f.message}
                    </p>
                  </li>
                ))}
              </ul>
              {review.result.limitations.map((v, i) => (
                <p key={i} className="text-body text-warning">
                  Giới hạn: {v}
                </p>
              ))}
            </>
          )}
          {review.evidence && (
            <div className="rounded-control bg-accent/70 p-3 text-body">
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
              {review.evidence.tests?.executionTimeMs != null && (
                <p>
                  Thực thi:{" "}
                  {(review.evidence.tests.executionTimeMs / 1000).toFixed(2)}{" "}
                  giây · Điểm test: {review.evidence.tests.score}/100
                </p>
              )}
              {Boolean(review.evidence.tests?.checks.length) && (
                <ul className="space-y-1">
                  {review.evidence.tests!.checks.map((check, i) => (
                    <li
                      key={i}
                      className={
                        check.passed ? "text-success" : "text-destructive"
                      }
                    >
                      {check.passed ? "Đạt" : "Chưa đạt"} · {check.name}
                      <span className="block text-caption text-muted-foreground">
                        {check.log}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {review.evidence.warnings.map((v, i) => (
                <p key={i}>{v}</p>
              ))}
            </div>
          )}
          {review.errorCode && (
            <p className="text-body text-warning">
              {review.errorCode === 'AI_REVIEWER_UNAVAILABLE'
                ? errorMessage(new ApiError(403, review.errorCode, ''))
                : <>Mã trạng thái: {review.errorCode}. Bài nộp vẫn được giữ nguyên.</>}
            </p>
          )}
          <p className="break-all text-caption text-muted-foreground">
            Lần chấm {review.id}; SHA {review.headSha}; Hash bằng chứng{" "}
            {review.inputHash ?? "chưa có"}
          </p>
        </>
      ) : (
        <p className="text-body text-muted-foreground">
          Chưa có lần AI review. Bạn có thể bắt đầu kiểm tra.
        </p>
      )}
      {error && (
        <p role="alert" className="text-body text-destructive">
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
      <button onClick={data.reload} className="ml-4 text-body text-primary">
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
  const [penalty, setPenalty] = useState<{ baseScore: number; latePenalty: number; score: number } | null>(null);
  const [acceptedPenalty, setAcceptedPenalty] = useState(false);
  const penaltyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (penalty) penaltyRef.current?.focus(); }, [penalty]);
  return (
    <form
      className="mt-6 space-y-4 border-t border-border pt-5"
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
            ...(penalty && acceptedPenalty ? { confirmedLatePenalty: penalty.latePenalty } : {}),
          });
          onUpdated();
        } catch (e) {
          if (e instanceof ApiError && e.code === 'PARTICIPATION_PENALTY_CONFIRM_REQUIRED' && isRecord(e.details)) {
            const { baseScore, latePenalty, score } = e.details;
            if (typeof baseScore === 'number' && typeof latePenalty === 'number' && typeof score === 'number'
              && [baseScore, latePenalty, score].every(n => Number.isFinite(n) && n >= 0 && n <= 100)
              && latePenalty > 0 && Math.abs(baseScore - latePenalty - score) < 0.01) {
              setPenalty({ baseScore, latePenalty, score }); setAcceptedPenalty(false);
            }
          }
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h4 className="font-semibold">Xác nhận cuối của giảng viên</h4>
      <p className="text-caption text-muted-foreground">
        Điểm tổng được tính theo rubric. Từ 70/100 là duyệt; dưới 70 là yêu cầu
        làm lại. Kết quả AI là đề xuất để bạn kiểm tra.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rubricKeys.map((key) => (
          <label key={key} className="text-caption">
            {labels[key]}
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              required
              className={inputClass}
              value={rubric[key]}
              onChange={(e) => { setRubric({ ...rubric, [key]: Number(e.target.value) }); setPenalty(null); setAcceptedPenalty(false); }}
            />
          </label>
        ))}
      </div>
      <label className="block text-body">
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
      <label className="block text-body">
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
      {penalty && <div ref={penaltyRef} tabIndex={-1} aria-label="Xác nhận điểm trừ do nộp trễ" className="border-l border-warning bg-warning-subtle/70 px-4 py-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <p className="font-semibold text-warning">Điểm sau khi xét thời hạn</p>
        <dl className="my-3 grid grid-cols-3 gap-3"><div><dt className="text-caption text-muted-foreground">Rubric gốc</dt><dd className="font-semibold">{penalty.baseScore}/100</dd></div><div><dt className="text-caption text-muted-foreground">Nộp trễ</dt><dd className="font-semibold text-warning">−{penalty.latePenalty}</dd></div><div><dt className="text-caption text-muted-foreground">Điểm cuối</dt><dd className="font-semibold">{penalty.score}/100</dd></div></dl>
        <label className="flex items-start gap-2 leading-6"><input type="checkbox" checked={acceptedPenalty} onChange={e => setAcceptedPenalty(e.target.checked)} className="mt-1 size-4" />Tôi xác nhận trừ {penalty.latePenalty} điểm theo bằng chứng và chính sách thời hạn của phiên.</label>
        <p className="mt-2 text-caption text-muted-foreground">Điểm cuối từ 70 là duyệt; dưới 70 yêu cầu làm lại. Thay đổi rubric sẽ yêu cầu kiểm tra mức trừ lại.</p>
      </div>}
      {error && (
        <p role="alert" className="text-body text-destructive">
          {error}
        </p>
      )}
      <button disabled={busy || !!penalty && !acceptedPenalty} className={buttonClass}>
        {busy ? "Đang xác nhận…" : "Lưu kết quả giảng viên"}
      </button>
    </form>
  );
}
