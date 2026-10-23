"use client";
import { useCallback } from "react";
import { getTaskSpec } from "@/lib/api/templates";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Panel } from "./primitives";
import { roleLabel } from "@/lib/api/workspace";
import { StudentPanel } from "@/components/intern/student-ui";
import { ClipboardCheck, FileText } from "lucide-react";

export function TaskSpec({ id, own = false }: { id: string; own?: boolean }) {
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
        icon={ClipboardCheck}
      >
        <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600">
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
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600"
            >
              {label}
            </span>
          ))}
        </div>
        {spec.expectedOutput && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <h3 className="text-sm font-bold text-blue-900">
              Đầu ra cần bàn giao
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {spec.expectedOutput}
            </p>
          </div>
        )}
        {(spec.blocked || spec.dependencies.length > 0) && (
          <div
            className={`mt-5 rounded-xl p-4 text-sm ${spec.blocked ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}
          >
            <h3 className="font-semibold">
              {spec.blocked
                ? "Đang chờ nhiệm vụ phụ thuộc"
                : "Nhiệm vụ phụ thuộc đã hoàn thành"}
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-2 leading-6">
              {spec.dependencies.map((d) => (
                <li key={d.taskId}>
                  {d.code} · {d.title} ·{" "}
                  {d.status === "done"
                    ? "Đã hoàn thành"
                    : "Chưa được xác nhận hoàn thành"}
                </li>
              ))}
            </ul>
          </div>
        )}
        <h3 className="mb-3 mt-6 text-sm font-bold">Đối chiếu trước khi nộp</h3>
        {spec.dod.length ? (
          <ol className="space-y-3">
            {spec.dod.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 text-sm leading-7 text-slate-600"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">
            Chưa có danh sách tiêu chí riêng. Đối chiếu phần yêu cầu phía trên.
          </p>
        )}
        <details className="mt-5 rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-blue-700">
            <FileText size={16} className="mr-2 inline" aria-hidden="true" />
            Tài liệu dự án
          </summary>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600">
            {spec.documentation || "Chưa có tài liệu bổ sung."}
          </p>
        </details>
      </StudentPanel>
    );
  return (
    <Panel title="Tiêu chí hoàn thành & tài liệu">
      <p className="mb-3 whitespace-pre-wrap text-sm">{spec.requirements}</p>
      <p className="text-xs text-slate-500">
        Vai trò: {roleLabel(spec.role)}
        {spec.estimatedHours ? ` · Ước lượng ${spec.estimatedHours} giờ` : ""}
        {spec.skillTags.length ? ` · ${spec.skillTags.join(", ")}` : ""}
      </p>
      {spec.expectedOutput && (
        <p className="mt-3 whitespace-pre-wrap text-sm">
          <strong>Đầu ra cần bàn giao: </strong>
          {spec.expectedOutput}
        </p>
      )}
      {(spec.blocked || spec.dependencies.length > 0) && (
        <div
          className={`mt-4 rounded-xl p-3 text-sm ${spec.blocked ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}
        >
          <h3 className="font-semibold">
            {spec.blocked
              ? "Đang chờ nhiệm vụ phụ thuộc"
              : "Nhiệm vụ phụ thuộc đã hoàn thành"}
          </h3>
          <ul className="mt-2 list-inside list-disc">
            {spec.dependencies.map((d) => (
              <li key={d.taskId}>
                {d.code} · {d.title} ·{" "}
                {d.status === "done"
                  ? "Đã hoàn thành"
                  : "Chưa được xác nhận hoàn thành"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="my-3 list-inside list-disc text-sm">
        {spec.dod.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-blue-600">
          Tài liệu dự án
        </summary>
        <p className="whitespace-pre-wrap text-sm">{spec.documentation}</p>
      </details>
    </Panel>
  );
}
