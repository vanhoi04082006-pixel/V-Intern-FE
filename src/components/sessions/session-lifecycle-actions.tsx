"use client";

import { useState } from "react";
import { sessionTransitions, transitionSession } from "@/lib/api/academic";
import { ErrorState } from "@/components/shared/data-state";
import { btn, Modal } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";

const labels: Record<string, string> = {
  ending: "Chuyển sang Sắp kết thúc",
  completed: "Hoàn thành phiên",
  cancelled: "Hủy phiên",
};

export function SessionLifecycleActions({ id, status, onChanged }: {
  id: string;
  status: string;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState<"completed" | "cancelled" | null>(null);
  const action = useAction(onChanged);
  // Starting stays in the roster/setup flow, where team readiness is visible.
  const choices = sessionTransitions(status).filter(next => next !== "active");
  if (!choices.length) return null;
  return (
    <section aria-label="Quản lý trạng thái phiên" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {choices.map(next => (
          <button key={next} className={btn(next === "cancelled" ? "secondary" : "primary")} disabled={action.busy}
            onClick={() => {
              if (next === "ending") void action.run(() => transitionSession(id, next));
              else if (next === "completed" || next === "cancelled") { action.clearError(); setConfirming(next); }
            }}>
            {action.busy ? "Đang xử lý…" : labels[next]}
          </button>
        ))}
      </div>
      {!confirming && Boolean(action.error) && <ErrorState error={action.error} />}
      {confirming && (
        <Modal title={labels[confirming]} onClose={() => { if (!action.busy) setConfirming(null); }}>
          <p className="text-body">
            {confirming === "completed"
              ? "Kiểm tra nhiệm vụ, đánh giá và hoàn tất các phân công trước khi kết thúc phiên. Phiên đã hoàn thành không thể bắt đầu lại; lịch sử được giữ."
              : "Phiên đã hủy không thể bắt đầu lại. Hãy kiểm tra đội hình và công việc đang thực hiện trước khi xác nhận; lịch sử được giữ."}
          </p>
          {Boolean(action.error) && <ErrorState error={action.error} />}
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button className={btn("secondary")} disabled={action.busy} onClick={() => setConfirming(null)}>Giữ phiên</button>
            <button className={btn(confirming === "cancelled" ? "danger" : "primary")} disabled={action.busy}
              onClick={() => void action.run(async () => { await transitionSession(id, confirming); setConfirming(null); })}>
              {action.busy ? "Đang xử lý…" : confirming === "completed" ? "Xác nhận hoàn thành phiên" : "Xác nhận hủy phiên"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
