"use client";
import { useEffect, useRef, useState } from "react";
import {
  rebookApplication,
  type StaffApplication,
  type roundDetail,
} from "@/lib/api/applications";
import { useAction } from "@/components/product/use-action";
import {
  buttonClass,
  inputClass,
  Modal,
} from "@/components/product/primitives";
import { ErrorState } from "@/components/shared/data-state";
import { roleLabel } from "@/lib/api/workspace";

export function InterviewRebooking({
  roundId,
  application,
  slots,
  onChanged,
}: {
  roundId: string;
  application: StaffApplication;
  slots: Awaited<ReturnType<typeof roundDetail>>["slots"];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [notice, setNotice] = useState("");
  const noticeRef = useRef<HTMLParagraphElement>(null),
    action = useAction(),
    policy = application.interviewPolicy;
  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);
  if (!policy) return null;
  const offered = slots.filter(
    (slot) =>
      policy.allowedRoleCodes.includes(slot.roleCode) &&
      slot.status === "open" &&
      slot.booked < slot.capacity &&
      Date.parse(slot.startsAt) >=
        Date.parse(policy.serverNow) + slot.minimumPreparationMinutes * 60000 &&
      (!policy.nextEligibleAt ||
        Date.parse(slot.startsAt) >= Date.parse(policy.nextEligibleAt)),
  );
  return (
    <section className="space-y-3 border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body text-muted-foreground">
          Đã dùng <strong className="text-foreground">{policy.attemptsUsed}</strong>{" "}
          lượt · còn{" "}
          <strong className="text-foreground">{policy.attemptsRemaining}</strong> lượt
        </p>
        <button
          className={buttonClass}
          disabled={!policy.canRebook || action.busy}
          onClick={() => setOpen(true)}
        >
          Hẹn phỏng vấn lại
        </button>
      </div>
      {policy.nextEligibleAt && (
        <p className="text-caption text-muted-foreground">
          Lịch mới phải sau{" "}
          {new Date(policy.nextEligibleAt).toLocaleString("vi-VN")}.
        </p>
      )}
      {!policy.canRebook && (
        <p className="text-caption leading-6 text-muted-foreground">
          Chỉ hẹn lại khi lịch trước đã được dùng hoặc ghi nhận vắng mặt, còn
          lượt và không có phiên/đánh giá đang chạy.
        </p>
      )}
      {notice && (
        <p
          role="status"
          tabIndex={-1}
          ref={noticeRef}
          className="text-body text-success focus:outline-none"
        >
          {notice}
        </p>
      )}
      {open && (
        <Modal
          title="Hẹn phỏng vấn lại"
          onClose={() => {
            if (!action.busy) setOpen(false);
          }}
        >
          <p className="mb-4 text-body leading-7 text-muted-foreground">
            {application.status === "deferred"
              ? "Đây là ngoại lệ mở lại hồ sơ vắng mặt và sẽ ghi audit cùng lý do. "
              : "Lịch mới giữ lịch sử của lượt trước. "}
            Không đặt lại mật khẩu hoặc số lượt đã dùng.
          </p>
          {!offered.length && (
            <p className="mb-4 text-body text-warning">
              Chưa có khung giờ đủ điều kiện. Mở thêm lịch đúng nghề, sức chứa
              và thời gian chờ trước khi hẹn lại.
            </p>
          )}
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!event.currentTarget.reportValidity()) return;
              const data = new FormData(event.currentTarget);
              void action.run(async () => {
                await rebookApplication(
                  roundId,
                  application.id,
                  String(data.get("slot")),
                  String(data.get("reason")).trim(),
                );
                setOpen(false);
                await onChanged();
                setNotice(
                  "Đã hẹn lại và ghi lý do. Không đặt lại mật khẩu hoặc số lượt.",
                );
              });
            }}
          >
            <fieldset disabled={action.busy} className="space-y-4">
              <label className="block text-body font-medium">
                Khung giờ mới
                <select name="slot" required className={`${inputClass} mt-2`}>
                  <option value="">Chọn lịch mở và còn chỗ</option>
                  {offered.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {roleLabel(slot.roleCode)} ·{" "}
                      {new Date(slot.startsAt).toLocaleString("vi-VN")} ·{" "}
                      {slot.timezone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-body font-medium">
                Lý do hẹn lại / ngoại lệ
                <textarea
                  name="reason"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  className={`${inputClass} mt-2`}
                />
              </label>
              <button
                className={buttonClass}
                disabled={action.busy || !offered.length}
              >
                Xác nhận hẹn lại
              </button>
            </fieldset>
            {action.error ? <ErrorState error={action.error} /> : null}
          </form>
        </Modal>
      )}
    </section>
  );
}
