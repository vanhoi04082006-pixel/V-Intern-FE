"use client";
import { useCallback, useState } from "react";
import { getTaskSpec, getTaskSpecSource } from "@/lib/api/templates";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Panel } from "./primitives";
import { roleLabel } from "@/lib/api/workspace";
import { StudentPanel } from "@/components/intern/student-ui";
import {
  IconClipboardCheck,
  IconCodeXml,
  IconFileText,
} from "@/components/v-intern/icons";

/** GET tasks/:id/spec/source — nguồn spec thô (bản chấm điểm ràng buộc), hiển thị cạnh bản đã dựng. */
function TaskSpecSource({ id }: { id: string }) {
  const source = useResource(
    useCallback((signal: AbortSignal) => getTaskSpecSource(id, signal), [id]),
  );
  if (source.loading)
    return (
      <p role="status" className="mt-3 text-body text-muted-foreground">
        Đang tải spec nguồn...
      </p>
    );
  if (source.error) return <ErrorState error={source.error} onRetry={source.reload} />;
  if (!source.data) return null;
  return (
    <details className="mt-3 border-t border-border pt-3" open>
      <summary className="cursor-pointer text-body font-semibold text-primary">
        <IconCodeXml size={16} className="mr-2 inline" aria-hidden="true" />
        Spec nguồn (dùng để chấm điểm)
      </summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-control bg-muted p-3 text-caption leading-6 text-foreground">
        {JSON.stringify(source.data, null, 2)}
      </pre>
    </details>
  );
}

export function TaskSpec({ id, own = false }: { id: string; own?: boolean }) {
  const [showSource, setShowSource] = useState(false);
  const data = useResource(
    useCallback((signal: AbortSignal) => getTaskSpec(id, signal), [id]),
  );
  if (data.loading) return <LoadingState />;
  if (data.error)
    return <ErrorState error={data.error} onRetry={data.reload} />;
  if (!data.data) return null;
  const spec = data.data;
  if (own)
    return (
      <StudentPanel
        title="Tiêu chí hoàn thành & tài liệu"
        icon={IconClipboardCheck}
      >
        <p className="whitespace-pre-wrap text-body leading-8 text-muted-foreground">
          {spec.requirements}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            roleLabel(spec.role),
            ...(spec.estimatedHours
              ? [`Ước lượng ${spec.estimatedHours} giờ`]
              : []),
            ...spec.skillTags,
          ].map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="rounded-control bg-muted px-3 py-2 text-caption text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        {spec.expectedOutput && (
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-body font-bold text-primary">
              Đầu ra cần bàn giao
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-body leading-7 text-muted-foreground">
              {spec.expectedOutput}
            </p>
          </div>
        )}
        {(spec.blocked || spec.dependencies.length > 0) && (
          <div
            className={`mt-5 rounded-control p-4 text-body ${spec.blocked ? "bg-warning-subtle text-warning" : "bg-success-subtle text-success"}`}
          >
            <h3 className="font-semibold">
              {spec.blocked
                ? "Đang chờ nhiệm vụ phụ thuộc"
                : "Nhiệm vụ phụ thuộc đã hoàn thành"}
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-2 leading-6">
              {spec.dependencies.map((d) => (
                <li key={d.taskId}>
                  {d.code}: {d.title} ·{" "}
                  {d.status === "done"
                    ? "Đã hoàn thành"
                    : "Chưa được xác nhận hoàn thành"}
                </li>
              ))}
            </ul>
          </div>
        )}
        <h3 className="mb-3 mt-6 text-body font-bold">Đối chiếu trước khi nộp</h3>
        {spec.dod.length ? (
          <ol className="space-y-3">
            {spec.dod.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 border-b border-border py-3 text-body leading-7 text-muted-foreground"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-caption font-bold text-primary">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-body text-muted-foreground">
            Chưa có danh sách tiêu chí riêng. Đối chiếu phần yêu cầu phía trên.
          </p>
        )}
        <details className="mt-5 border-t border-border pt-4">
          <summary className="cursor-pointer text-body font-semibold text-primary">
            <IconFileText size={16} className="mr-2 inline" aria-hidden="true" />
            Tài liệu dự án
          </summary>
          <p className="mt-4 whitespace-pre-wrap text-body leading-8 text-muted-foreground">
            {spec.documentation || "Chưa có tài liệu bổ sung."}
          </p>
        </details>
        {showSource && <TaskSpecSource id={id} />}
      </StudentPanel>
    );
  return (
    <Panel
      title="Tiêu chí hoàn thành & tài liệu"
      action={
        <button
          type="button"
          aria-expanded={showSource}
          aria-controls="task-spec-source"
          className="rounded border border-primary px-3 py-1.5 text-caption font-semibold text-primary hover:bg-accent"
          onClick={() => setShowSource((v) => !v)}
        >
          {showSource ? "Ẩn nguồn" : "Xem nguồn"}
        </button>
      }
    >
      <p className="mb-3 whitespace-pre-wrap text-body">{spec.requirements}</p>
      <p className="text-caption text-muted-foreground">
        Vai trò: {roleLabel(spec.role)}
        {spec.estimatedHours ? `: Ước lượng ${spec.estimatedHours} giờ` : ""}
        {spec.skillTags.length ? `: ${spec.skillTags.join(", ")}` : ""}
      </p>
      {spec.expectedOutput && (
        <p className="mt-3 whitespace-pre-wrap text-body">
          <strong>Đầu ra cần bàn giao: </strong>
          {spec.expectedOutput}
        </p>
      )}
      {(spec.blocked || spec.dependencies.length > 0) && (
        <div
          className={`mt-4 rounded-control p-3 text-body ${spec.blocked ? "bg-warning-subtle text-warning" : "bg-success-subtle text-success"}`}
        >
          <h3 className="font-semibold">
            {spec.blocked
              ? "Đang chờ nhiệm vụ phụ thuộc"
              : "Nhiệm vụ phụ thuộc đã hoàn thành"}
          </h3>
          <ul className="mt-2 list-inside list-disc">
            {spec.dependencies.map((d) => (
              <li key={d.taskId}>
                {d.code}: {d.title} ·{" "}
                {d.status === "done"
                  ? "Đã hoàn thành"
                  : "Chưa được xác nhận hoàn thành"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="my-3 list-inside list-disc text-body">
        {spec.dod.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
      <details>
        <summary className="cursor-pointer text-body font-semibold text-primary">
          Tài liệu dự án
        </summary>
        <p className="whitespace-pre-wrap text-body">{spec.documentation}</p>
      </details>
      {showSource && (
        <div id="task-spec-source">
          <TaskSpecSource id={id} />
        </div>
      )}
    </Panel>
  );
}
