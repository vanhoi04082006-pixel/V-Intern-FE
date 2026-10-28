"use client";
import { useState, type FormEvent } from "react";
import {
  Field,
  Modal,
  btn,
  inputClass,
  textareaClass,
} from "@/components/product/primitives";
import { errorMessage } from "@/lib/auth/api-client";
import {
  saveParticipationPolicy,
  type ParticipationPolicy,
} from "@/lib/api/participation";
export function PolicyEditor({
  sessionId,
  policy,
  onSaved,
  onClose,
}: {
  sessionId: string;
  policy: ParticipationPolicy;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [warningFrom, setWarning] = useState(policy.warningFrom),
    [penaltyFrom, setPenalty] = useState(policy.penaltyFrom),
    [replacementFrom, setReplacement] = useState(policy.replacementFrom);
  const [points, setPoints] = useState(
      policy.penaltyPoints === null ? "" : String(policy.penaltyPoints),
    ),
    [cap, setCap] = useState(String(policy.penaltyCap));
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (warningFrom > penaltyFrom || penaltyFrom > replacementFrom) {
      setError(
        "Các ngưỡng phải theo thứ tự cảnh báo ≤ trừ điểm ≤ đề xuất thay.",
      );
      return;
    }
    if (reason.trim().length < 10) {
      setError("Ghi lý do cụ thể, ít nhất 10 ký tự.");
      return;
    }
    setBusy(true);
    try {
      await saveParticipationPolicy(sessionId, {
        expectedVersion: policy.version,
        warningFrom,
        penaltyFrom,
        replacementFrom,
        penaltyPoints: points === "" ? null : Number(points),
        penaltyCap: Number(cap),
        reason: reason.trim(),
      });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Chính sách thời hạn"
      description="Chính sách mới chỉ ghi nhận hạn đến sau thời điểm kích hoạt. Ghi nhận cũ giữ phiên bản chính sách ban đầu."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["warning", "Cảnh báo từ lần", warningFrom, setWarning],
              ["penalty", "Trừ điểm từ lần", penaltyFrom, setPenalty],
              [
                "replacement",
                "Đề xuất thay từ lần",
                replacementFrom,
                setReplacement,
              ],
            ] as const
          ).map(([id, label, value, set]) => (
            <Field key={id} htmlFor={`policy-${id}`} label={label}>
              <input
                className={inputClass}
                id={`policy-${id}`}
                type="number"
                min={1}
                max={50}
                step={1}
                required
                disabled={busy}
                value={value}
                onChange={(e) => set(Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            htmlFor="policy-points"
            label="Điểm trừ mỗi lần"
            hint="Để trống: chỉ cảnh báo, không tự trừ điểm."
          >
            <input
              id="policy-points"
              className={inputClass}
              type="number"
              min={0}
              max={100}
              step="0.01"
              disabled={busy}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              aria-describedby="policy-points-hint"
            />
          </Field>
          <Field
            htmlFor="policy-cap"
            label="Tổng điểm phạt tối đa / sinh viên / phiên"
          >
            <input
              id="policy-cap"
              className={inputClass}
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              disabled={busy}
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </Field>
        </div>
        <p className="text-body leading-6 text-muted-foreground">
          Giảng viên xác nhận phần trừ trước khi lưu điểm bài nộp. Đạt ngưỡng
          thay chỉ tạo đề xuất; hệ thống không tự loại sinh viên.
        </p>
        <Field htmlFor="policy-reason" label="Lý do áp dụng" required>
          <textarea
            id="policy-reason"
            className={textareaClass}
            minLength={10}
            maxLength={1000}
            required
            disabled={busy}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-body text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className={btn("secondary")}
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </button>
          <button type="submit" className={btn("primary")} disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu chính sách"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
