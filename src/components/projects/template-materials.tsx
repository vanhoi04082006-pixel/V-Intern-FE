"use client";
import { useCallback, useState } from "react";
import { Can } from "@/components/auth/can";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { buttonClass, inputClass } from "@/components/product/primitives";
import type { TemplateDetail } from "@/lib/api/templates";
import {
  getAssessment,
  getTemplateRevision,
  listTemplateRevisions,
  parseLearningPackage,
} from "@/lib/api/template-materials";
import { PackageFiles, PackagePreview } from "./package-preview";

function PrivateAssessment({ id, version }: { id: string; version: number }) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => getAssessment(id, version, signal),
      [id, version],
    ),
  );
  if (resource.loading) return <LoadingState />;
  if (resource.error)
    return <ErrorState error={resource.error} onRetry={resource.reload} />;
  const assessment = resource.data?.assessment;
  if (!assessment)
    return (
      <p className="text-sm text-slate-500">
        Phiên bản {version} chưa có tài liệu chấm riêng. Không lấy lời giải của
        phiên bản khác để thay vào.
      </p>
    );
  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-amber-900">
        Tài liệu dành cho người chấm · v{version}. Không đưa các file này vào
        starter hoặc gửi cho sinh viên đang làm bài.
      </p>
      <PackageFiles
        files={[...assessment.solutionFiles, ...assessment.hiddenTestFiles]}
      />
      <table className="w-full text-left text-sm">
        <caption className="mb-3 text-left font-semibold text-navy">
          Rubric tham khảo · tổng 100%
        </caption>
        <tbody className="divide-y divide-slate-100">
          {assessment.rubric.map((row) => (
            <tr key={row.criterion}>
              <th scope="row" className="py-3 pr-4 align-top font-medium">
                {row.criterion}
                <p className="mt-1 font-normal leading-6 text-slate-500">
                  {row.description}
                </p>
              </th>
              <td className="py-3 text-right align-top tabular-nums">
                {row.weight}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs leading-5 text-slate-500">
        Mapping{" "}
        {assessment.taskSuites
          .map((row) => `${row.taskKey} → ${row.suiteId}`)
          .join(" · ")}
        . Digest authoring không tự thay thế seal của operator theo
        task/repository/spec.
      </p>
    </div>
  );
}
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
    <label className="text-sm text-slate-600">
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
      <span className="mt-1 block text-xs text-slate-500">
        {resource.data?.total} phiên bản · hiển thị tối đa 100 gần nhất. Phiên
        đang chạy giữ bản đã ghim.
      </span>
    </label>
  );
}
export function TemplateMaterials({ source }: { source: TemplateDetail }) {
  const [version, setVersion] = useState(source.version),
    [history, setHistory] = useState(false),
    [privateOpen, setPrivateOpen] = useState(false);
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
      className="min-w-0 space-y-5 border-y border-slate-200 py-6"
      aria-label="Tài liệu và phiên bản mẫu"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">
          Gói học tập · v{version}
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
        <div className="space-y-4 border-t border-slate-200 pt-5">
          <button
            type="button"
            className="text-sm font-semibold text-amber-800 underline decoration-amber-300 underline-offset-4"
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
        </div>
      </Can>
    </section>
  );
}
