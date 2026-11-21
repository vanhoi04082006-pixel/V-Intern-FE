"use client";

import { useState } from "react";
import { completeAssignment, listSessionAssignments } from "@/lib/api/academic";
import { ErrorState } from "@/components/shared/data-state";
import { btn, Modal } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { ApiError } from "@/lib/auth/api-client";

export function AssignmentCompletion({ sessionId, internId, displayName, onChanged }: {
  sessionId: string;
  internId: string;
  displayName: string;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const action = useAction(onChanged);
  return (
    <div className="mt-2">
      <button type="button" className={btn("secondary")} aria-label={`Hoàn thành phân công của ${displayName}`}
        onClick={() => { action.clearError(); setConfirming(true); }}>
        Hoàn thành phân công
      </button>
      {confirming && <Modal title="Hoàn thành phân công" onClose={() => { if (!action.busy) setConfirming(false); }}>
        <p className="text-body">Xác nhận {displayName} đã hoàn tất công việc được giao. Phân công sẽ kết thúc và sinh viên có thể được giao vào phiên khác. Thành viên, bài nộp và lịch sử của phiên này được giữ lại.</p>
        {Boolean(action.error) && <ErrorState error={action.error} />}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" className={btn("secondary")} disabled={action.busy} onClick={() => setConfirming(false)}>Giữ phân công</button>
          <button type="button" className={btn("primary")} disabled={action.busy} onClick={() => void action.run(async () => {
            // Resolve the current assignment under the selected session and intern,
            // without relying on the first page of the whole session roster.
            const rows = await listSessionAssignments(sessionId, undefined, internId);
            const assignment = rows.find(row => row.internId.toLowerCase() === internId.toLowerCase() && row.status === "active");
            if (!assignment) throw new ApiError(409, "INVALID_ASSIGNMENT_TRANSITION", "Assignment is no longer active.");
            await completeAssignment(assignment.id);
            setConfirming(false);
          })}>{action.busy ? "Đang xử lý…" : "Xác nhận hoàn thành phân công"}</button>
        </div>
      </Modal>}
    </div>
  );
}
