"use client";
import { useCallback } from "react";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  getAssessment,
  getPinnedProjectAssessment,
  type TemplateAssessment,
} from "@/lib/api/template-materials";
import type { TemplateRunRef } from "@/lib/api/templates";
import { useResource } from "@/lib/api/use-resource";
import { PackageFiles } from "./package-preview";

function AssessmentContent({
  version,
  assessment,
  emptyMessage,
}: {
  version: number;
  assessment: TemplateAssessment | null;
  emptyMessage: string;
}) {
  if (!assessment)
    return <p className="text-body text-muted-foreground">{emptyMessage}</p>;
  return (
    <div className="space-y-5">
      <p className="text-body leading-6 text-warning">
        Tài liệu dành cho người chấm, v{version}. Không đưa các file này vào
        starter hoặc gửi cho sinh viên đang làm bài.
      </p>
      <PackageFiles
        files={[...assessment.solutionFiles, ...assessment.hiddenTestFiles]}
      />
      <table className="w-full text-left text-body">
        <caption className="mb-3 text-left font-semibold text-foreground">
          Rubric tham khảo, tổng 100%
        </caption>
        <tbody className="divide-y divide-border">
          {assessment.rubric.map((row) => (
            <tr key={row.criterion}>
              <th scope="row" className="py-3 pr-4 align-top font-medium">
                {row.criterion}
                <p className="mt-1 font-normal leading-6 text-muted-foreground">
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
      <p className="text-caption leading-5 text-muted-foreground">
        Mapping{" "}
        {assessment.taskSuites
          .map((row) => `${row.taskKey} → ${row.suiteId}`)
          .join(", ")}
        . Digest authoring không tự thay thế seal của operator theo
        task/repository/spec.
      </p>
    </div>
  );
}

export function PrivateAssessment({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => getAssessment(id, version, signal),
      [id, version],
    ),
  );
  if (resource.loading) return <LoadingState />;
  if (resource.error)
    return <ErrorState error={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return null;
  return (
    <AssessmentContent
      version={resource.data.version}
      assessment={resource.data.assessment}
      emptyMessage={`Phiên bản ${version} chưa có tài liệu chấm riêng. Không lấy lời giải của phiên bản khác để thay vào.`}
    />
  );
}

export function PinnedRunAssessment({ run }: { run: TemplateRunRef }) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) =>
        getPinnedProjectAssessment(run.projectId, signal),
      [run.projectId],
    ),
  );
  if (resource.loading) return <LoadingState />;
  if (resource.error)
    return <ErrorState error={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return null;
  return (
    <AssessmentContent
      version={resource.data.version}
      assessment={resource.data.assessment}
      emptyMessage={`Phiên này đang ghim phiên bản ${resource.data.version} nhưng chưa có tài liệu chấm. Không lấy lời giải của phiên bản khác để thay vào.`}
    />
  );
}
