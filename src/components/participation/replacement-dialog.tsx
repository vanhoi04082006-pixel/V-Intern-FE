"use client";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import {
  Modal,
  Field,
  btn,
  inputClass,
  textareaClass,
} from "@/components/product/primitives";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
import {
  replacementAdvice,
  prepareReplacement,
  approveReplacement,
  type ReplacementAdvice,
  type ReplacementPreview,
  type ReplacementResult,
} from "@/lib/api/replacements";
const date = (value: string) => new Date(value).toLocaleString("vi-VN");
export function ReplacementDialog({
  sessionId,
  incidentId,
  studentName,
  onClose,
  onSaved,
}: {
  sessionId: string;
  incidentId: string;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [advice, setAdvice] = useState<ReplacementAdvice | null>(null),
    [candidate, setCandidate] = useState(""),
    [hours, setHours] = useState("24"),
    [preview, setPreview] = useState<ReplacementPreview | null>(null),
    [result, setResult] = useState<ReplacementResult | null>(null);
  const [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!preview) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [preview]);
  const expired = Boolean(
    preview && now >= new Date(preview.expiresAt).getTime(),
  );
  function invalidate() {
    setPreview(null);
    setConfirmed(false);
    setError("");
  }
  async function generate() {
    if (busy) return;
    setBusy("advice");
    setError("");
    invalidate();
    setAdvice(null);
    setCandidate("");
    try {
      const next = await replacementAdvice(sessionId, incidentId);
      setAdvice(next);
      setCandidate(next.advice.candidateId ?? "");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function prepare() {
    if (busy || !advice || !candidate) return;
    const handoverHours = Number(hours);
    if (
      !Number.isInteger(handoverHours) ||
      handoverHours < 1 ||
      handoverHours > 168
    ) {
      setError("Khoảng bàn giao phải là số nguyên từ 1 đến 168 giờ.");
      return;
    }
    setBusy("preview");
    invalidate();
    try {
      const next = await prepareReplacement(sessionId, incidentId, {
        adviceId: advice.id,
        candidateId: candidate,
        handoverHours,
      });
      setPreview(next);
      setNow(Date.now());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function approve() {
    if (
      busy ||
      !preview ||
      !confirmed ||
      reason.trim().length < 10 ||
      Date.now() >= new Date(preview.expiresAt).getTime()
    )
      return;
    setBusy("approve");
    setError("");
    try {
      const next = await approveReplacement(sessionId, preview.id, {
        expectedPreviewHash: preview.previewHash,
        reason: reason.trim(),
      });
      setResult(next);
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 409) {
        setPreview(null);
        setConfirmed(false);
      }
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  return (
    <Modal
      title={
        result ? "Đã phê duyệt thay thành viên" : "Xem xét thay thành viên"
      }
      description={studentName}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {result ? (
        <div className="space-y-4" role="status">
          <CheckCircle2
            className="text-success"
            size={28}
            aria-hidden="true"
          />
          <p className="text-body leading-6 text-foreground">
            Đã chuyển {result.transferredTaskIds.length} nhiệm vụ còn mở.{" "}
            {result.preservedTaskCount} bài và phần lịch sử được giữ nguyên tác
            giả, bài nộp và điểm đã chấm.
          </p>
          <p className="text-body text-muted-foreground">
            Quyền GitHub đang chờ đối chiếu riêng. Sinh viên đã được gửi thông
            báo trong hệ thống; trạng thái này chưa xác nhận cấp hoặc thu hồi
            quyền trên GitHub.
          </p>
          <button className={btn("secondary")} onClick={onClose}>
            Đóng kết quả
          </button>
        </div>
      ) : (
        <div className="space-y-5" aria-busy={Boolean(busy)}>
          <p className="text-body leading-6 text-muted-foreground">
            Agent đối chiếu ứng viên đã đạt đúng vai trò và còn khả dụng. Bạn
            quyết định sau khi xem ảnh hưởng. Các bài đã chấm, tài khoản và lịch
            sử không bị xóa.
          </p>
          <button
            className={btn("secondary")}
            disabled={Boolean(busy)}
            onClick={generate}
          >
            <Sparkles size={16} aria-hidden="true" />
            {busy === "advice"
              ? "Agent đang đối chiếu…"
              : "Yêu cầu Agent đối chiếu"}
          </button>
          {error && (
            <p
              role="alert"
              className="border-l border-border pl-3 text-body text-destructive"
            >
              {error}
              {preview &&
                " Nếu chưa rõ yêu cầu đã được lưu hay chưa, thử lại sẽ dùng cùng bản xem trước và không tạo lần thay trùng."}
            </p>
          )}
          {advice && (
            <>
              <section
                aria-label="Tư vấn của Agent"
                className="space-y-2 border-t border-border pt-4"
              >
                <h3 className="font-semibold text-foreground">
                  Nhận định từ bằng chứng
                </h3>
                <p className="text-body leading-6 text-muted-foreground">
                  {advice.advice.reason}
                </p>
                {advice.searchLimited && (
                  <p className="text-body text-warning">
                    Lượt đối chiếu giới hạn tối đa 60 hồ sơ; đây chưa phải toàn
                    bộ ứng viên.
                  </p>
                )}
                {advice.advice.limitations.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-body text-muted-foreground">
                    {advice.advice.limitations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
              {advice.candidates.length > 0 && (
                <>
                  <fieldset disabled={Boolean(busy)}>
                    <legend className="mb-2 text-body font-semibold text-foreground">
                      Ứng viên thay thế, chọn một người
                    </legend>
                    <div className="max-h-64 divide-y divide-border overflow-y-auto">
                      {advice.candidates.map((c) => (
                        <label
                          key={c.userId}
                          className="flex cursor-pointer items-start gap-3 py-3"
                        >
                          <input
                            type="radio"
                            name="replacement-candidate"
                            className="mt-1 accent-primary"
                            checked={candidate === c.userId}
                            onChange={() => {
                              setCandidate(c.userId);
                              invalidate();
                            }}
                            value={c.userId}
                          />
                          <span className="min-w-0 text-body">
                            <span className="font-semibold text-foreground">
                              {c.displayName}
                            </span>
                            {advice.advice.candidateId === c.userId && (
                              <span className="ml-2 text-caption text-primary">
                                Agent đề xuất
                              </span>
                            )}
                            <span className="mt-1 block text-muted-foreground">
                              {c.roleCode}, Tổng điểm{" "}
                              {c.overallScore === null
                                ? "chưa có"
                                : `${c.overallScore}/100`}{" "}
                             , Kỹ thuật{" "}
                              {c.technicalScore === null
                                ? "chưa có"
                                : `${c.technicalScore}/100`}
                            </span>
                            {c.strengths.length > 0 && (
                              <span className="mt-1 block text-muted-foreground">
                                {c.strengths.join(", ")}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Field
                    htmlFor="replacement-hours"
                    label="Khoảng bàn giao (giờ)"
                    hint="Từ 1 đến 168 giờ. Hạn sớm hơn mốc bàn giao được gia hạn; nhiệm vụ chưa có hạn vẫn giữ nguyên."
                  >
                    <input
                      id="replacement-hours"
                      type="number"
                      min={1}
                      max={168}
                      step={1}
                      className={inputClass}
                      value={hours}
                      disabled={Boolean(busy)}
                      onChange={(e) => {
                        setHours(e.target.value);
                        invalidate();
                      }}
                    />
                  </Field>
                  <button
                    className={btn("secondary")}
                    disabled={Boolean(busy) || !candidate}
                    onClick={prepare}
                  >
                    {busy === "preview"
                      ? "Đang kiểm tra ảnh hưởng…"
                      : "Xem trước ảnh hưởng"}
                  </button>
                </>
              )}
            </>
          )}
          {preview && (
            <section
              aria-label="Ảnh hưởng cần phê duyệt"
              className="space-y-4 border-t border-border pt-5"
            >
              <div>
                <h3 className="font-semibold text-foreground">
                  {preview.document.summary.projectName} ·{" "}
                  {preview.document.summary.roleName}
                </h3>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-body">
                  <span>{preview.document.summary.oldInternName}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                  <strong>{preview.document.summary.candidateName}</strong>
                </p>
              </div>
              <p className="text-body text-muted-foreground">
                Chuyển {preview.document.taskPlan.transfers.length} nhiệm vụ còn
                mở; {preview.document.taskPlan.preservedCount} bài và phần lịch
                sử giữ nguyên.
              </p>
              <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                {preview.document.taskPlan.transfers.map((t) => (
                  <li key={t.id} className="py-3 text-body">
                    <span className="text-caption text-muted-foreground">{t.code}</span>
                    <p className="font-medium text-foreground">{t.title}</p>
                    <p className="mt-1 text-caption leading-5 text-muted-foreground">
                      Hạn cũ: {t.dueAt ? date(t.dueAt) : "Chưa đặt"}
                      <br />
                      Hạn bàn giao:{" "}
                      {t.handoverDueAt
                        ? date(t.handoverDueAt)
                        : "Giữ trạng thái chưa đặt hạn"}
                    </p>
                  </li>
                ))}
              </ul>
              {preview.document.warnings.map((warning, i) => (
                <p
                  key={i}
                  className="border-l border-border pl-3 text-body leading-6 text-warning"
                >
                  {warning}
                </p>
              ))}
              <p
                role={expired ? "alert" : undefined}
                className={`text-caption ${expired ? "text-destructive" : "text-muted-foreground"}`}
              >
                {expired
                  ? "Bản xem trước đã hết hạn. Hãy xem trước lại trước khi duyệt."
                  : `Hiệu lực đến ${date(preview.expiresAt)}. Máy chủ kiểm tra lại bằng chứng và ứng viên khi duyệt.`}
              </p>
              <Field
                htmlFor="replacement-reason"
                label="Lý do quyết định"
                required
                hint="Từ 10 đến 1000 ký tự; được lưu lịch sử và thông báo cho sinh viên."
              >
                <textarea
                  id="replacement-reason"
                  minLength={10}
                  maxLength={1000}
                  className={textareaClass}
                  value={reason}
                  disabled={Boolean(busy)}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <label className="flex items-start gap-3 text-body leading-6 text-foreground">
                <input
                  type="checkbox"
                  className="mt-1 accent-primary"
                  checked={confirmed}
                  disabled={Boolean(busy) || expired}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Tôi đã kiểm tra bằng chứng, người thay và các hạn bàn giao; đồng
                ý kết thúc phân công hiện tại.
              </label>
              <button
                className={btn("primary")}
                disabled={
                  Boolean(busy) ||
                  expired ||
                  !confirmed ||
                  reason.trim().length < 10
                }
                onClick={approve}
              >
                {busy === "approve"
                  ? "Đang phê duyệt…"
                  : "Phê duyệt thay thành viên"}
              </button>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
