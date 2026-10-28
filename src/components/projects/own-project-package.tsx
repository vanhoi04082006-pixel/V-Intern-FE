"use client";
import { useCallback, useState } from "react";
import { getOwnProjectPackage } from "@/lib/api/template-materials";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { PackagePreview } from "./package-preview";
function OwnMaterial({ projectId }: { projectId: string }) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => getOwnProjectPackage(projectId, signal),
      [projectId],
    ),
  );
  if (resource.loading) return <LoadingState />;
  if (resource.error)
    return <ErrorState error={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return null;
  return (
    <div className="min-w-0 space-y-3">
      <p className="text-caption font-medium text-muted-foreground">
        {resource.data.templateCode} · bản được giao v
        {resource.data.templateVersion}
      </p>
      <PackagePreview
        material={resource.data.learningPackage}
        archiveName={`${resource.data.templateCode}-v${resource.data.templateVersion}`}
      />
    </div>
  );
}
export function OwnProjectPackage({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="my-5 min-w-0 border-y border-border py-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-body font-semibold text-primary underline decoration-blue-200 underline-offset-4"
      >
        {open
          ? "Đóng starter và hướng dẫn dự án"
          : "Mở starter và hướng dẫn dự án"}
      </button>
      {open && (
        <div className="mt-5">
          <OwnMaterial projectId={projectId} />
        </div>
      )}
    </section>
  );
}
