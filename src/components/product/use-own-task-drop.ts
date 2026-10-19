"use client";
import { useRef, useState } from "react";
import { getTask, nextOwnStatus, updateOwnTask, type TaskStatus } from "@/lib/api/work";
import { errorMessage } from "@/lib/auth/api-client";

/** Recheck server state and version; review continues through the submission form. */
export function useOwnTaskDrop(onChanged: () => void, onOpen: (id: string) => void) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function move(id: string, to: TaskStatus) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const task = await getTask(id);
      if (nextOwnStatus(task.status) !== to) throw new Error("Trạng thái đã thay đổi hoặc thao tác không hợp lệ. Hãy tải lại bảng.");
      if (to === "review") {
        onOpen(id);
      } else {
        await updateOwnTask(id, { status: to, expectedVersion: task.version });
        onChanged();
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { move, busy, error };
}
