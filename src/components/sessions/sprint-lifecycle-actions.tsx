"use client";

import { useState } from "react";
import { transitionSprint } from "@/lib/api/management";
import { ErrorState } from "@/components/shared/data-state";
import { btn, Modal } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { SprintEditDialog } from "./sprint-edit-dialog";

export function SprintLifecycleActions({ id, status, onChanged }: {
  id: string;
  status: string;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const action = useAction(onChanged);
  if (status !== "planned" && status !== "active") return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button className={btn("secondary")} disabled={action.busy} onClick={() => setEditing(true)}>Sửa Sprint</button>
        {status === "active" && (
          <button className={btn("primary")} disabled={action.busy}
            onClick={() => void action.run(() => transitionSprint(id, "completed"))}>
            {action.busy ? "Đang xử lý…" : "Hoàn thành Sprint"}
          </button>
        )}
        <button className={btn("secondary")} disabled={action.busy}
          onClick={() => { action.clearError(); setConfirming(true); }}>
          Hủy Sprint
        </button>
      </div>
      {!confirming && Boolean(action.error) && <ErrorState error={action.error} />}
      {editing && <SprintEditDialog id={id} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); action.clearError(); onChanged(); }} />}
      {confirming && (
        <Modal title="Hủy Sprint" onClose={() => { if (!action.busy) setConfirming(false); }}>
          <p className="text-body">Sau khi hủy, Sprint không thể kích hoạt lại. Hãy kiểm tra tiến độ trước khi xác nhận.</p>
          {Boolean(action.error) && <ErrorState error={action.error} />}
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button className={btn("secondary")} disabled={action.busy} onClick={() => setConfirming(false)}>Giữ Sprint</button>
            <button className={btn("danger")} disabled={action.busy} onClick={() => void action.run(async () => {
              await transitionSprint(id, "cancelled");
              setConfirming(false);
            })}>
              {action.busy ? "Đang hủy…" : "Xác nhận hủy Sprint"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
