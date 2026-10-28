"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  destructive,
  busy,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="card-surface max-w-md rounded-2xl border-line bg-panel p-0 overflow-hidden">
        <AlertDialogHeader className="px-6 pt-6">
          <AlertDialogTitle className="text-left text-base font-semibold text-ink">
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-dim">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {children ? <div className="px-6 py-4">{children}</div> : null}
        <AlertDialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
          <AlertDialogCancel className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={cn(
              "rounded-lg font-semibold",
              destructive
                ? "bg-rose text-white hover:bg-rose/85"
                : "bg-brand text-on-brand hover:bg-brand-bright"
            )}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
