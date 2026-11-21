"use client";

import { useCallback } from "react";
import { getManagedSprint } from "@/lib/api/management";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Modal } from "@/components/product/primitives";
import { SprintForm } from "@/components/product/sprint-management";

export function SprintEditDialog({ id, onClose, onSaved }: {
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const detail = useResource(useCallback((signal: AbortSignal) => getManagedSprint(id, signal), [id]));
  return (
    <Modal title="Sửa Sprint" onClose={onClose}>
      {detail.loading ? <LoadingState label="Đang tải thông tin Sprint…" />
        : detail.error ? <ErrorState error={detail.error} onRetry={detail.reload} />
          : detail.data ? <SprintForm sprint={detail.data} onSaved={onSaved} /> : null}
    </Modal>
  );
}
