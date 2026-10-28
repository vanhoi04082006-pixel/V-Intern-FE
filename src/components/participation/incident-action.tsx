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
  extendParticipationDeadline,
  resolveParticipation,
  type ParticipationIncident,
} from "@/lib/api/participation";
export type IncidentAction = "extend" | "excused" | "reversed";
const titles = {
  extend: "Gia hạn nhiệm vụ",
  excused: "Miễn trừ ghi nhận",
  reversed: "Hoàn tác ghi nhận",
};
export function IncidentActionDialog({
  item,
  action,
  onSaved,
  onClose,
}: {
  item: ParticipationIncident;
  action: IncidentAction;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(""),
    [until, setUntil] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (reason.trim().length < 10) {
      setError("Ghi lý do cụ thể, ít nhất 10 ký tự.");
      return;
    }
    const deadline = new Date(until);
    if (
      action === "extend" &&
      (!Number.isFinite(deadline.getTime()) || deadline <= new Date(item.dueAt))
    ) {
      setError("Hạn mới phải sau hạn hiệu lực hiện tại.");
      return;
    }
    setBusy(true);
    try {
      if (action === "extend")
        await extendParticipationDeadline(item.sessionId, item.taskId, {
          expectedVersion: item.deadlineVersion,
          until: deadline.toISOString(),
          reason: reason.trim(),
        });
      else
        await resolveParticipation(item.sessionId, item.id, {
          action,
          expectedDeadlineVersion: item.deadlineVersion,
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
      title={titles[action]}
      onClose={() => {
        if (!busy) onClose();
      }}
      description={`${item.taskCode} · ${item.displayName}`}
    >
      <form className="space-y-5" onSubmit={submit} aria-busy={busy}>
        <p className="text-body leading-6 text-muted-foreground">
          Hạn hiện tại: {new Date(item.dueAt).toLocaleString("vi-VN")}. Thao tác
          được lưu lịch sử và thông báo sinh viên; điểm bài đã duyệt và KPI đã
          chốt được giữ nguyên.
        </p>
        {action === "extend" && (
          <Field
            htmlFor="incident-until"
            label="Hạn mới"
            hint="Nhập theo múi giờ thiết bị; máy chủ kiểm tra lại thời hạn."
            required
          >
            <input
              id="incident-until"
              type="datetime-local"
              className={inputClass}
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              required
              disabled={busy}
              aria-describedby="incident-until-hint"
            />
          </Field>
        )}
        <Field htmlFor="incident-reason" label="Lý do xử lý" required>
          <textarea
            id="incident-reason"
            className={textareaClass}
            required
            minLength={10}
            maxLength={1000}
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
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
