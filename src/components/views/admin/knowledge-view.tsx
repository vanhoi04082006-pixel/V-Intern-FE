"use client";

import * as React from "react";
import {
  BrainCircuit,
  ClipboardCheck,
  FilePlus2,
  Info,
  ScanSearch,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { careerRoleApi } from "@/lib/client/api";
import {
  knowledgeApi,
  type KnowledgeAudience,
  type KnowledgeDocDetail,
  type KnowledgeImportDryRunResult,
  type KnowledgeKind,
  type KnowledgeStatus,
} from "@/lib/client/api-org";
import { useResource } from "@/lib/client/use-resource";
import { relativeTime } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  FormSelect,
  FormTextarea,
  LineButton,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  useDebounced,
  useToastAction,
} from "./admin-shared";
import {
  AdminKnowledgeEditor,
  KNOWLEDGE_AUDIENCE_OPTIONS,
  KNOWLEDGE_KIND_OPTIONS,
  KNOWLEDGE_PURPOSE_OPTIONS,
  KnowledgeKindBadge,
  knowledgeAudienceLabels,
  knowledgeStatusMeta,
} from "./knowledge-editor-view";

const PAGE_SIZE = 10;

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "draft", label: "Bản nháp" },
  { value: "published", label: "Đã xuất bản" },
  { value: "archived", label: "Lưu trữ" },
];

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;

/** Dòng bảng có thể bấm — mở trình soạn thảo tài liệu. */
function RowLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-t border-line transition-colors hover:bg-panel-2/60"
    >
      {children}
    </tr>
  );
}

/* ============================ dialog tạo tài liệu ============================ */

function CreateDocDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (code: string) => void;
}) {
  const [form, setForm] = React.useState({
    code: "",
    title: "",
    summary: "",
    kind: "qa" as KnowledgeKind,
    audience: "student_safe" as KnowledgeAudience,
    purpose: "interview_question",
    roleCode: "",
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        code: "",
        title: "",
        summary: "",
        kind: "qa",
        audience: "student_safe",
        purpose: "interview_question",
        roleCode: "",
      });
    }
  }, [open]);

  const submit = () => {
    if (!CODE_PATTERN.test(form.code.trim())) {
      toast.error("Mã tài liệu chỉ gồm a-z, 0-9 và gạch nối (3–64 ký tự).");
      return;
    }
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error("Tiêu đề và tóm tắt là bắt buộc.");
      return;
    }
    setBusy(true);
    knowledgeApi
      .create({
        code: form.code.trim(),
        title: form.title.trim(),
        summary: form.summary.trim(),
        kind: form.kind,
        audience: form.audience,
        purpose: form.purpose as KnowledgeDocDetail["purpose"],
        roleCode: form.roleCode.trim() || null,
      })
      .then((doc: KnowledgeDocDetail) => {
        toast.success(`Đã tạo bản nháp "${doc.title}" — tiếp tục soạn nội dung.`);
        onOpenChange(false);
        onCreated(doc.code);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không tạo được tài liệu"))
      .finally(() => setBusy(false));
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title="Soạn tài liệu mới"
      description="Tài liệu khởi tạo ở trạng thái Bản nháp — soạn nội dung và nguồn trước khi xuất bản cho Agent."
      maxWidth="max-w-2xl"
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={busy}>
            {busy ? <InlineSpinner className="size-4" /> : <FilePlus2 className="size-4 icon" />}
            {busy ? "Đang tạo…" : "Tạo bản nháp"}
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mã tài liệu" hint="Chỉ a-z, 0-9 và gạch nối (3–64 ký tự).">
            <FormInput
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="react-useeffect-qa"
              className="font-mono"
              autoComplete="off"
            />
          </Field>
          <Field label="Tiêu đề">
            <FormInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Bộ câu hỏi useEffect…"
            />
          </Field>
          <Field label="Loại tài liệu">
            <FormSelect
              value={form.kind}
              onChange={(v) => setForm((f) => ({ ...f, kind: v as KnowledgeKind }))}
              options={KNOWLEDGE_KIND_OPTIONS}
              ariaLabel="Chọn loại tài liệu"
            />
          </Field>
          <Field label="Đối tượng người đọc">
            <FormSelect
              value={form.audience}
              onChange={(v) => setForm((f) => ({ ...f, audience: v as KnowledgeAudience }))}
              options={KNOWLEDGE_AUDIENCE_OPTIONS}
              ariaLabel="Chọn đối tượng"
            />
          </Field>
          <Field label="Mục đích sử dụng">
            <FormSelect
              value={form.purpose}
              onChange={(v) => setForm((f) => ({ ...f, purpose: v }))}
              options={KNOWLEDGE_PURPOSE_OPTIONS}
              ariaLabel="Chọn mục đích"
            />
          </Field>
          <Field label="Vai trò liên quan" hint="Bỏ trống nếu áp dụng cho mọi vai trò.">
            <FormInput
              value={form.roleCode}
              onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value }))}
              placeholder="frontend"
              className="font-mono"
            />
          </Field>
        </div>
        <Field label="Tóm tắt">
          <FormTextarea
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            placeholder="Tóm tắt ngắn nội dung tài liệu…"
            className="min-h-20"
          />
        </Field>
      </div>
    </AdminDialog>
  );
}

/* ============================ dialog kiểm tra import ============================ */

function ImportCheckDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [raw, setRaw] = React.useState("");
  const [result, setResult] = React.useState<KnowledgeImportDryRunResult | null>(null);
  const action = useToastAction(() => undefined);

  React.useEffect(() => {
    if (open) {
      setRaw("");
      setResult(null);
    }
  }, [open]);

  const runCheck = () => {
    let items: unknown;
    try {
      items = JSON.parse(raw);
    } catch {
      toast.error("JSON không hợp lệ — kiểm tra lại cú pháp (mảng đối tượng).");
      return;
    }
    if (!Array.isArray(items)) {
      toast.error("Dữ liệu phải là một mảng JSON các dòng tài liệu.");
      return;
    }
    action.run(async () => {
      const res = await knowledgeApi.importDryRun(items as never);
      setResult(res);
      if (res.invalidCount === 0) {
        toast.success(`${res.validCount}/${res.total} dòng hợp lệ — sẵn sàng nhập.`);
      } else {
        toast.warning(`${res.invalidCount}/${res.total} dòng chưa hợp lệ — xem chi tiết bên dưới.`);
      }
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !action.busy && onOpenChange(o)}
      title="Kiểm tra import tài liệu"
      description="Dán mảng JSON các dòng tài liệu để kiểm tra hợp lệ trước khi nhập kho (dry-run, không ghi dữ liệu)."
      maxWidth="max-w-3xl"
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={action.busy}>
            Đóng
          </LineButton>
          <BrandButton onClick={runCheck} disabled={action.busy || !raw.trim()}>
            {action.busy ? <InlineSpinner className="size-4" /> : <ScanSearch className="size-4 icon" />}
            Kiểm tra
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Dữ liệu JSON"
          hint='Mỗi dòng: { "code", "title", "summary", "kind", "audience", "purpose", "roleCode"? }'
        >
          <FormTextarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`[\n  { "code": "css-flex-qa", "title": "Flexbox Q&A", "summary": "…", "kind": "qa", "audience": "student_safe", "purpose": "interview_question" }\n]`}
            className="min-h-40 font-mono text-xs"
          />
        </Field>

        {result ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToneBadge tone="brand">Tổng: {result.total}</ToneBadge>
              <ToneBadge tone="emerald">Hợp lệ: {result.validCount}</ToneBadge>
              <ToneBadge tone={result.invalidCount > 0 ? "rose" : "zinc"}>Lỗi: {result.invalidCount}</ToneBadge>
            </div>
            {result.valid.length > 0 ? (
              <div className="rounded-xl border border-line">
                <p className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald">
                  Dòng hợp lệ
                </p>
                <ul className="divide-y divide-line">
                  {result.valid.map((v) => (
                    <li key={v.row} className="flex items-center gap-2 px-3 py-2 text-xs">
                      <span className="font-mono text-faint">#{v.row}</span>
                      <span className="font-mono text-brand-bright">{v.code}</span>
                      <span className="min-w-0 flex-1 truncate text-dim">{v.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.invalid.length > 0 ? (
              <div className="rounded-xl border border-line">
                <p className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-rose">
                  Dòng chưa hợp lệ
                </p>
                <ul className="divide-y divide-line">
                  {result.invalid.map((v) => (
                    <li key={v.row} className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-faint">#{v.row}</span>
                        <span className="font-mono text-rose">{v.code ?? "(thiếu mã)"}</span>
                      </div>
                      <ul className="mt-1 space-y-0.5 pl-9">
                        {v.issues.map((issue) => (
                          <li key={issue} className="text-[11px] leading-relaxed text-dim">
                            · {issue}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminKnowledge() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [kind, setKind] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [roleCode, setRoleCode] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const roleOptionsRes = useResource(
    () => careerRoleApi.list({ page: 1, pageSize: 100 }),
    []
  );
  const roleFilterOptions = (roleOptionsRes.data?.data ?? []).map((r) => ({
    value: r.code,
    label: `${r.code} · ${r.name}`,
  }));

  const list = useResource(
    () =>
      knowledgeApi.list({
        page,
        pageSize: PAGE_SIZE,
        query: q || undefined,
        status: (status || undefined) as KnowledgeStatus | undefined,
        kind: (kind || undefined) as KnowledgeKind | undefined,
        audience: (audience || undefined) as KnowledgeAudience | undefined,
        roleCode: roleCode || undefined,
      }),
    [page, q, status, kind, audience, roleCode]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  const resetPage = () => setPage(1);

  /* Editor chiếm toàn bộ view — tự quản state nội bộ. */
  if (selected) {
    return <AdminKnowledgeEditor code={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Kho tri thức Agent"
        description="Thư viện tài liệu nuôi các tính năng AI: câu phỏng vấn, hướng dẫn, bài tập, rubric và kịch bản truyền thông."
        actions={
          <>
            <LineButton onClick={() => setImportOpen(true)}>
              <ScanSearch className="size-4 icon" /> Kiểm tra import
            </LineButton>
            <BrandButton onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="size-4 icon" /> Soạn tài liệu mới
            </BrandButton>
          </>
        }
      />

      {/* Tabs trạng thái */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-panel/60 p-1.5">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <button
              key={tab.value || "all"}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                resetPage();
              }}
              aria-pressed={active}
              className={`h-9 rounded-lg px-3.5 text-[13px] font-medium transition-all active:scale-[0.98] ${
                active
                  ? "bg-brand/12 text-brand-bright"
                  : "text-dim hover:bg-panel-2 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        {meta ? (
          <span className="ml-auto pr-2 font-mono text-xs text-faint">{meta.total} tài liệu</span>
        ) : null}
      </div>

      <FilterBar
        hasActive={Boolean(qInput || kind || audience || roleCode)}
        onReset={() => {
          setQInput("");
          setKind("");
          setAudience("");
          setRoleCode("");
          resetPage();
        }}
      >
        <SearchInput
          value={qInput}
          onChange={(v) => {
            setQInput(v);
            resetPage();
          }}
          placeholder="Tìm theo mã, tiêu đề…"
          className="w-full sm:w-60"
        />
        <FilterSelect
          value={kind}
          onChange={(v) => {
            setKind(v);
            resetPage();
          }}
          options={KNOWLEDGE_KIND_OPTIONS}
          placeholder="Loại"
          ariaLabel="Lọc theo loại tài liệu"
          className="w-40"
        />
        <FilterSelect
          value={audience}
          onChange={(v) => {
            setAudience(v);
            resetPage();
          }}
          options={KNOWLEDGE_AUDIENCE_OPTIONS}
          placeholder="Đối tượng"
          ariaLabel="Lọc theo đối tượng"
          className="w-44"
        />
        {roleFilterOptions.length > 0 ? (
          <FilterSelect
            value={roleCode}
            onChange={(v) => {
              setRoleCode(v);
              resetPage();
            }}
            options={roleFilterOptions}
            placeholder="Vai trò"
            ariaLabel="Lọc theo vai trò"
            className="w-52"
          />
        ) : null}
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<BrainCircuit className="icon" />}
            title="Chưa có tài liệu nào khớp bộ lọc"
            description="Soạn tài liệu mới hoặc thử bỏ bớt điều kiện lọc."
            action={
              <BrandButton onClick={() => setCreateOpen(true)}>
                <FilePlus2 className="size-4 icon" /> Soạn tài liệu mới
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell minWidth={960}>
          <THead>
            <tr>
              <Th>Mã</Th>
              <Th>Tiêu đề</Th>
              <Th>Loại</Th>
              <Th>Trạng thái</Th>
              <Th>Phiên bản</Th>
              <Th>Đối tượng</Th>
              <Th>Vai trò</Th>
              <Th>Cập nhật</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((doc) => (
              <RowLink key={doc.code} onClick={() => setSelected(doc.code)}>
                <Td>
                  <span className="font-mono text-xs text-brand-bright">{doc.code}</span>
                </Td>
                <Td>
                  <p className="max-w-72 truncate text-sm font-medium text-ink">{doc.title}</p>
                  <p className="max-w-72 truncate text-xs text-faint">{doc.summary}</p>
                </Td>
                <Td>
                  <KnowledgeKindBadge kind={doc.kind} />
                </Td>
                <Td>
                  <ToneBadge tone={knowledgeStatusMeta[doc.status]?.tone ?? "zinc"} dot>
                    {knowledgeStatusMeta[doc.status]?.label ?? doc.status}
                  </ToneBadge>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-dim">v{doc.version}</span>
                </Td>
                <Td>
                  <span className="text-xs text-dim">{knowledgeAudienceLabels[doc.audience]}</span>
                </Td>
                <Td>
                  {doc.roleCode ? (
                    <span className="font-mono text-xs text-dim">{doc.roleCode}</span>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-dim">{relativeTime(doc.updatedAt)}</span>
                </Td>
              </RowLink>
            ))}
          </TBody>
        </TableShell>
      )}

      {/* Click dòng → mở editor */}
      {rows.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
          <Info className="size-3.5 icon" /> Nhấp vào một dòng để mở trình soạn thảo tài liệu.
        </p>
      ) : null}

      {meta && rows.length > 0 ? (
        <div className="mt-4">
          <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        </div>
      ) : null}

      <CreateDocDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(code) => setSelected(code)}
      />
      <ImportCheckDialog open={importOpen} onOpenChange={setImportOpen} />

      <p className="mt-6 flex items-center gap-1.5 text-xs text-faint">
        <Search className="size-3.5 icon" />
        <ClipboardCheck className="size-3.5 icon" />
        Tài liệu xuất bản mới được Agent sử dụng; bản nháp chỉ hiển thị trong quản trị.
      </p>
    </ViewFrame>
  );
}
