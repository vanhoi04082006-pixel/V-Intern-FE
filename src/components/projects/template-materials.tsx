"use client";
import { useCallback, useState } from "react";
import { Can } from "@/components/auth/can";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { buttonClass, inputClass } from "@/components/product/primitives";
import type { TemplateDetail } from "@/lib/api/templates";
import {
  getTemplateRevision,
  listTemplateRevisions,
  parseLearningPackage,
} from "@/lib/api/template-materials";
import { PackagePreview } from "./package-preview";
import {
  PinnedRunAssessment,
  PrivateAssessment,
} from "./template-assessment";
function RevisionPicker({
  id,
  version,
  onChange,
}: {
  id: string;
  version: number;
  onChange: (version: number) => void;
}) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => listTemplateRevisions(id, signal),
      [id],
    ),
  );
  if (resource.loading) return <LoadingState />;
  if (resource.error)
    return <ErrorState error={resource.error} onRetry={resource.reload} />;
  return (
    <label className="text-body text-muted-foreground">
      Phiên bản public
      <select
        className={`${inputClass} mt-1`}
        value={version}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {resource.data?.items.map((row) => (
          <option value={row.version} key={row.version}>
            v{row.version} ·{" "}
            {new Date(row.createdAt).toLocaleDateString("vi-VN")}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-caption text-muted-foreground">
        {resource.data?.total} phiên bản, hiển thị tối đa 100 gần nhất. Phiên
        đang chạy giữ bản đã ghim.
      </span>
    </label>
  );
}
export function TemplateMaterials({ source }: { source: TemplateDetail }) {
  const [version, setVersion] = useState(source.version),
    [history, setHistory] = useState(false),
    [privateOpen, setPrivateOpen] = useState(false),
    [selectedRunId, setSelectedRunId] = useState("");
  const selectedRun = source.runs.find((run) => run.id === selectedRunId);
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) =>
        version === source.version
          ? Promise.resolve({ definition: source.definition })
          : getTemplateRevision(source.id, version, signal),
      [source.id, source.version, source.definition, version],
    ),
  );
  return (
    <section
      className="min-w-0 space-y-5 border-y border-border py-6"
      aria-label="Tài liệu và phiên bản mẫu"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-section font-bold text-foreground">
          Gói học tập, v{version}
        </h2>
        <button
          type="button"
          className={buttonClass}
          onClick={() => setHistory((value) => !value)}
        >
          {history ? "Ẩn lịch sử phiên bản" : "Xem lịch sử phiên bản"}
        </button>
      </div>
      {history && (
        <RevisionPicker
          id={source.id}
          version={version}
          onChange={(value) => {
            setPrivateOpen(false);
            setSelectedRunId("");
            setVersion(value);
          }}
        />
      )}
      {resource.loading ? (
        <LoadingState />
      ) : resource.error ? (
        <ErrorState error={resource.error} onRetry={resource.reload} />
      ) : (
        resource.data && (
          <PackagePreview
            key={version}
            material={parseLearningPackage(
              resource.data.definition.learningPackage,
            )}
            archiveName={`${source.code}-v${version}`}
          />
        )
      )}
      <Can perm="templates.assessment.read">
        <div className="space-y-4 border-t border-border pt-5">
          <button
            type="button"
            className="text-body font-semibold text-warning underline decoration-amber-300 underline-offset-4"
            aria-expanded={privateOpen}
            onClick={() => setPrivateOpen((value) => !value)}
          >
            {privateOpen
              ? "Đóng tài liệu chấm riêng"
              : "Mở tài liệu chấm riêng"}
          </button>
          {privateOpen && (
            <PrivateAssessment key={version} id={source.id} version={version} />
          )}
          {source.runs.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-body font-semibold text-foreground">
                Tài liệu chấm theo phiên đã khởi tạo
              </h3>
              <label className="block text-body text-muted-foreground">
                Chọn phiên
                <select
                  className={`${inputClass} mt-1`}
                  value={selectedRunId}
                  onChange={(event) => setSelectedRunId(event.target.value)}
                >
                  <option value="">Chọn phiên để xem tài liệu chấm</option>
                  {source.runs.map((run) => (
                    <option value={run.id} key={run.id}>
                      Phiên {run.sessionId.slice(0, 8)} · v{run.templateVersion}
                      {run.createdAt
                        ? ` · ${new Date(run.createdAt).toLocaleDateString("vi-VN")}`
                        : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-caption text-muted-foreground">
                  Tài liệu được lấy theo phiên bản đã ghim cho project của
                  phiên.
                </span>
              </label>
              {selectedRun && (
                <PinnedRunAssessment key={selectedRun.id} run={selectedRun} />
              )}
            </div>
          )}
        </div>
      </Can>
    </section>
  );
}
