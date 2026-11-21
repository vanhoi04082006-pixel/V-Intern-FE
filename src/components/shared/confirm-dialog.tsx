"use client";

import { type ReactNode } from "react";
import { IconAlertTriangle } from "@/components/v-intern/icons";
import { btn, Modal, Spinner } from "@/components/product/primitives";
import { cn } from "@/lib/utils";

/* =====================================================================
 * CONFIRM DIALOG — "Xé giấy trước khi vứt"
 * Chuẩn hoá mọi xác nhận phá vỡ/huỷ (Section 5 của master brief) thay cho
 * window.confirm() của trình duyệt: cùng thiết kế Notebook, focus trap,
 * thể hiện trạng thái đang chạy và không chặn luồng lỗi.
 *
 * - tone "danger": thao tác không thể hoàn tác (xoá, huỷ, thu hồi).
 * - tone "normal": xác nhận hành vi lớn nhưng không phá dữ liệu.
 * - busy: nút xác nhận quay Spinner + khoá cả dialog (không đóng nhầm).
 * ===================================================================== */

export function ConfirmDialog({
  open,
  title,
  description,
  children,
  tone = "normal",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Nội dung bổ sung (ảnh hưởng, điều kiện) hiển thị dưới mô tả. */
  children?: ReactNode;
  tone?: "normal" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  /** Đang thực thi — khoá cả hai nút để không gửi hai lần. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Modal
      title={title}
      description={description}
      onClose={onCancel}
      closeDisabled={busy}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            className={btn("secondary", "md")}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            className={cn(btn(tone === "danger" ? "danger" : "primary", "md"))}
            onClick={onConfirm}
          >
            {busy && <Spinner className="text-current" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {tone === "danger" && (
          <span
            className="grid size-10 shrink-0 place-items-center rounded-control bg-destructive-subtle text-destructive"
            aria-hidden="true"
          >
            <IconAlertTriangle size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1 text-body leading-6 text-muted-foreground">
          {children}
        </div>
      </div>
    </Modal>
  );
}
