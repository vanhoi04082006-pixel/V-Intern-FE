"use client";
import { useRef, useState } from "react";
import {
  btn,
  Field,
  inputClass,
  textareaClass,
} from "@/components/product/primitives";
import { ErrorState } from "@/components/shared/data-state";
import { useAction } from "@/components/product/use-action";
import {
  previewCredentialRecovery,
  recoverApplicationCredentials,
} from "@/lib/api/credential-recovery";
import type { roundDetail } from "@/lib/api/applications";
export function CredentialRecovery({
  roundId,
  applicationId,
  slots,
  onChanged,
}: {
  roundId: string;
  applicationId: string;
  slots: Awaited<ReturnType<typeof roundDetail>>["slots"];
  onChanged: () => Promise<void>;
}) {
  const [slotId, setSlotId] = useState(""),
    [preview, setPreview] = useState<Awaited<
      ReturnType<typeof previewCredentialRecovery>
    > | null>(null),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [notice, setNotice] = useState("");
  const action = useAction(),
    noticeRef = useRef<HTMLParagraphElement>(null);
  return (
    <section
      aria-label="Khôi phục mật khẩu tạm"
      className="space-y-4 border-b border-slate-200 py-4"
    >
      <div>
        <h3 className="font-semibold text-slate-900">Mật khẩu tạm hết hạn</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Dành cho tài khoản CV chưa đổi mật khẩu và đã xác minh email trong 24
          giờ. Tài khoản dùng mật khẩu chính thức được giữ nguyên.
        </p>
      </div>
      <Field
        htmlFor="recovery-slot"
        label="Lịch dùng để tính hạn mật khẩu"
        hint="Chỉ tính thời hạn; thao tác này không giữ chỗ, không đổi lịch hoặc cấp thêm lượt phỏng vấn."
      >
        <select
          id="recovery-slot"
          className={inputClass}
          value={slotId}
          disabled={action.busy}
          onChange={(e) => {
            setSlotId(e.target.value);
            setPreview(null);
            setConfirmed(false);
            setNotice("");
          }}
        >
          <option value="">Chọn khung giờ đang mở</option>
          {slots
            .filter((s) => s.status === "open")
            .map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.startsAt).toLocaleString("vi-VN")} · {s.roleCode} ·{" "}
                {s.timezone}
              </option>
            ))}
        </select>
      </Field>
      <button
        className={btn("secondary")}
        disabled={!slotId || action.busy}
        onClick={() =>
          void action.run(async () => {
            setPreview(null);
            setConfirmed(false);
            setPreview(
              await previewCredentialRecovery(roundId, applicationId, slotId),
            );
          })
        }
      >
        {action.busy ? "Đang xử lý…" : "Kiểm tra điều kiện"}
      </button>
      {preview && (
        <div className="space-y-3 border-l-2 border-amber-300 pl-4">
          <p className="text-sm leading-6 text-slate-700">{preview.message}</p>
          {preview.allowed && (
            <>
              <p className="text-sm leading-6 text-slate-600">
                Phiên đăng nhập cũ sẽ bị thu hồi. Mật khẩu mới chỉ được gửi qua
                email, có hạn đến{" "}
                {preview.expiresAt
                  ? new Date(preview.expiresAt).toLocaleString("vi-VN")
                  : "mốc server xác nhận"}
                . Sau đó hẹn lại bằng thao tác riêng nếu cần.
              </p>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (
                    !preview.revision ||
                    !confirmed ||
                    reason.trim().length < 10
                  )
                    return;
                  void action.run(async () => {
                    try {
                      await recoverApplicationCredentials(
                        roundId,
                        applicationId,
                        {
                          slotId,
                          expectedRevision: preview.revision!,
                          reason: reason.trim(),
                        },
                      );
                      setPreview(null);
                      setConfirmed(false);
                      setNotice(
                        "Đã cấp lại mật khẩu tạm và đưa email vào hàng đợi. Giữ nguyên lịch hẹn và số lượt đã dùng.",
                      );
                      await onChanged();
                      requestAnimationFrame(() => noticeRef.current?.focus());
                    } catch (error) {
                      setPreview(null);
                      setConfirmed(false);
                      throw error;
                    }
                  });
                }}
              >
                <Field htmlFor="recovery-reason" label="Lý do cấp lại">
                  <textarea
                    id="recovery-reason"
                    className={textareaClass}
                    value={reason}
                    minLength={10}
                    maxLength={1000}
                    disabled={action.busy}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </Field>
                <label className="flex items-start gap-2 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    disabled={action.busy}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1"
                  />
                  Tôi đã đối chiếu hồ sơ và đồng ý thu hồi phiên đăng nhập cũ.
                </label>
                <button
                  className={btn("primary")}
                  disabled={
                    action.busy || !confirmed || reason.trim().length < 10
                  }
                >
                  Cấp lại mật khẩu tạm
                </button>
              </form>
            </>
          )}
        </div>
      )}
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {notice && (
        <p
          ref={noticeRef}
          tabIndex={-1}
          role="status"
          className="text-sm leading-6 text-emerald-800"
        >
          {notice}
        </p>
      )}
    </section>
  );
}
