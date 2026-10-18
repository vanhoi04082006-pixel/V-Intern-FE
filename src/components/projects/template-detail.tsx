"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { PageTitle, Panel, buttonClass, inputClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { Can } from "@/components/auth/can";
import { useResource } from "@/lib/api/use-resource";
import { BlueprintArchitecture, BlueprintTask } from './blueprint-architecture';
import {
  getTemplate,
  parseRoleDetail,
  startTemplateSession,
  type TemplateDetail as TemplateDetailData,
} from "@/lib/api/templates";

function strArr(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((i): i is string => typeof i === "string") : [];
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel title={title}>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </Panel>
  );
}
function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-xs text-slate-400">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Template Detail (M2): full blueprint from the real definition + sessions
 * started from this template + Khởi tạo phiên thực tập.
 */
export function TemplateDetail({
  id,
  get = getTemplate,
  start = startTemplateSession,
}: {
  id: string;
  get?: typeof getTemplate;
  start?: typeof startTemplateSession;
}) {
  const data = useResource(useCallback((signal: AbortSignal) => get(id, signal), [get, id]));
  const action = useAction();
  const [sessionName, setSessionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [started, setStarted] = useState<{ sessionId: string; projectId: string; deduped: boolean } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function submitStart(templateId: string) {
    if (!sessionName.trim() || !startDate || !endDate) {
      setFormError("Nhập tên phiên và thời gian.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    setFormError(null);
    let created: { sessionId: string; projectId: string; deduped: boolean } | null = null;
    const ok = await action.run(async () => {
      created = await start(templateId, { name: sessionName.trim(), startDate, endDate, requestId });
    });
    if (ok && created) {
      const done: { sessionId: string; projectId: string; deduped: boolean } = created;
      setStarted({ sessionId: done.sessionId, projectId: done.projectId, deduped: done.deduped });
    }
  }

  if (data.loading) return <p role="status" className="p-4 text-sm text-slate-500">Đang tải project mẫu...</p>;
  if (data.error || !data.data) return <ErrorState error={data.error} onRetry={data.reload} />;
  const t: TemplateDetailData = data.data;
  const def = t.definition;
  const roleDetails = Array.isArray(def.roleDetails) ? def.roleDetails.map(parseRoleDetail) : [];
  const roleCodes = roleDetails.length > 0 ? roleDetails.map((r) => r.code) : strArr(def.roles);
  const objectives = typeof def.objectives === "object" && def.objectives !== null ? (def.objectives as Record<string, unknown>) : {};
  const acceptance = typeof def.acceptance === "object" && def.acceptance !== null ? (def.acceptance as Record<string, unknown>) : {};
  const outputs = typeof def.expectedOutputs === "object" && def.expectedOutputs !== null ? (def.expectedOutputs as Record<string, unknown>) : {};
  const sprints = Array.isArray(def.sprints) ? (def.sprints as Record<string, unknown>[]) : [];

  return (
    <div className="space-y-4">
      <PageTitle
        title={t.name}
        subtitle={`${t.code} · phiên bản ${t.version} · ${t.difficulty}${t.status === "archived" ? " · ĐÃ LƯU TRỮ" : ""}`}
        action={<Link className="text-xs font-semibold text-blue-600 hover:underline" href="/instructor/projects">← Thư viện</Link>}
      />
      <Section title="Tổng quan">
        <p className="text-xs text-slate-500">Nhóm: {t.category ?? "—"} · Công nghệ: {(t.techStack ?? []).join(", ") || "—"}</p>
        <p>{typeof def.description === "string" ? def.description : ""}</p>
        <p className="text-xs text-slate-500">{typeof def.estimatedDurationDays === 'number' ? `Thời lượng: ${def.estimatedDurationDays} ngày · ` : ''}Đội hình gợi ý: {typeof def.recommendedTeamSize === 'number' ? def.recommendedTeamSize : t.teamSize} người{typeof def.slug === 'string' ? ` · ${def.slug}` : ''}</p>
      </Section>
      <Section title="Mục tiêu">
        {typeof objectives.business === "string" && <p><strong>Kinh doanh:</strong> {objectives.business}</p>}
        <p><strong>Học tập:</strong></p>
        <BulletList items={strArr(objectives.learning)} empty="Chưa ghi mục tiêu học tập." />
        <p><strong>Sản phẩm:</strong></p>
        <BulletList items={strArr(objectives.product)} empty="Chưa ghi mục tiêu sản phẩm." />
        <p><strong>Trong phạm vi:</strong></p>
        <BulletList items={strArr(def.scopeIn)} empty="—" />
        <p><strong>Ngoài phạm vi:</strong></p>
        <BulletList items={strArr(def.scopeOut)} empty="—" />
      </Section>
      <Section title="Yêu cầu">
        <p><strong>Chức năng:</strong></p>
        <BulletList items={strArr(def.functionalRequirements)} empty="—" />
        <p><strong>Phi chức năng:</strong></p>
        <BulletList items={strArr(def.nonFunctionalRequirements)} empty="—" />
      </Section>
      <Section title={`Đội hình yêu cầu (${roleCodes.length} roles)`}>
        {roleDetails.length > 0 ? (
          <ul className="space-y-2">
            {roleDetails.map((r) => (
              <li key={r.code} className="rounded border border-slate-100 p-2">
                <p className="font-semibold">{r.title ?? r.code} <span className="font-mono text-xs text-slate-400">{r.code}</span></p>
                <p className="text-xs text-slate-500">
                  Số lượng: {r.countMin ?? 1}–{r.countMax ?? r.countMin ?? 1}
                  {r.level ? ` · Trình độ: ${r.level}` : ""}
                </p>
                {r.requiredSkills.length > 0 && <p className="text-xs">Kỹ năng bắt buộc: {r.requiredSkills.join(", ")}</p>}
                {r.recommendedSkills.length > 0 && <p className="text-xs text-slate-500">Nên có: {r.recommendedSkills.join(", ")}</p>}
                {r.responsibilities.length > 0 && <BulletList items={r.responsibilities} empty="" />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">Roles: {roleCodes.join(", ") || "—"}</p>
        )}
      </Section>
      <Section title={`Blueprint triển khai (${sprints.length} phases)`}>
        <ul className="space-y-2">
          {sprints.map((s, i) => (
            <li key={String(s.name ?? i)} className="rounded border border-slate-100 p-2">
              <p className="font-semibold">{i + 1}. {String(s.name ?? "")}</p>
              {typeof s.goal === "string" && <p className="text-xs text-slate-500">{s.goal}</p>}
              <p className="text-xs text-slate-400">{Array.isArray(s.tasks) ? s.tasks.length : 0} work packages · {typeof s.durationDays === "number" ? `${s.durationDays} ngày` : ""}</p>
              {Array.isArray(s.tasks) && <div className="mt-3 space-y-2">{s.tasks.map((task, index) => <BlueprintTask key={index} value={task} />)}</div>}
            </li>
          ))}
        </ul>
      </Section>
      <BlueprintArchitecture definition={def} />
      <Section title="Kết quả mong đợi & tiêu chí chấp nhận">
        <p><strong>Deliverables:</strong></p>
        <BulletList items={strArr(outputs.deliverables)} empty="—" />
        <p><strong>Tài liệu & bằng chứng:</strong></p>
        <BulletList items={strArr(outputs.artifacts)} empty="—" />
        <p><strong>Definition of Done:</strong></p>
        <BulletList items={strArr(acceptance.definitionOfDone)} empty="—" />
        <p><strong>Quality gates:</strong></p>
        <BulletList items={strArr(acceptance.qualityGates)} empty="—" />
      </Section>
      <Section title={`Phiên đã khởi tạo (${t.runs.length})`}>
        {t.runs.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có phiên nào từ mẫu này.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {t.runs.map((r) => (
              <li key={r.id}>
                <Link className="font-semibold text-blue-600 hover:underline" href={`/instructor/sessions/${r.sessionId}`}>
                  Phiên {r.sessionId.slice(0, 8)}
                </Link>
                <span className="text-xs text-slate-400"> · template v{r.templateVersion}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Can perm={["projects.manage", "sessions.manage", "tasks.manage"]}><Panel title="Khởi tạo phiên thực tập">
        {t.status === "archived" ? (
          <p role="status" className="text-sm text-slate-500">Mẫu đã lưu trữ — không thể khởi tạo phiên mới.</p>
        ) : started ? (
          <div role="status" className="space-y-2 text-sm">
            <p className="font-semibold text-emerald-700">
              {started.deduped ? "Phiên đã tồn tại (không tạo trùng)." : "Đã tạo phiên thực tập."}
            </p>
            <p>
              <Link className="font-semibold text-blue-600 hover:underline" href={`/instructor/sessions/${started.sessionId}/setup?project=${started.projectId}`}>
                Mở Session Setup →
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm">Tên phiên
              <input aria-label="Tên phiên" className={`${inputClass} mt-1`} value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="VD: ECOM K48 T11/2026" />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-sm">Bắt đầu
                <input aria-label="Ngày bắt đầu" type="date" className={`${inputClass} mt-1`} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="block text-sm">Kết thúc
                <input aria-label="Ngày kết thúc" type="date" className={`${inputClass} mt-1`} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </div>
            {Boolean(formError) && <p role="alert" className="text-sm text-rose-600">{formError}</p>}
            {Boolean(action.error) && <ErrorState error={action.error} />}
            <div className="flex gap-2">
              <button className={buttonClass} disabled={action.busy} onClick={() => void submitStart(t.id)}>
                {action.busy ? "Đang tạo..." : "Khởi tạo phiên thực tập"}
              </button>
              <button
                type="button"
                className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500"
                onClick={() => { setRequestId(crypto.randomUUID()); setStarted(null); }}
              >
                Tạo request mới
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Chống tạo trùng: mỗi lần bấm dùng một mã yêu cầu ổn định; bấm lại không tạo phiên thứ hai.</p>
          </div>
        )}
      </Panel></Can>
    </div>
  );
}
