"use client";

import * as React from "react";
import { ListChecks, MoreHorizontal, Pencil, Plus, Ban } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type QuestionBankItem } from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { roleLabels } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  Panel,
  PanelHeader,
  ToneBadge,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  AdminDialog,
  BrandButton,
  difficultyMeta,
  Field,
  FormInput,
  FormSelect,
  FormTextarea,
  LineButton,
  phaseMeta,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  toastConflict,
  useDebounced,
  useToastAction,
} from "./admin-shared";

const PAGE_SIZE = 8;

const ROLES = ["frontend", "backend", "fullstack", "qa", "business_analyst"];
const PHASES = ["introduction", "technical", "english", "communication"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const ROLE_OPTIONS = ROLES.map((v) => ({ value: v, label: roleLabels[v] ?? v }));
const PHASE_OPTIONS = PHASES.map((v) => ({ value: v, label: phaseMeta[v].label }));
const DIFFICULTY_OPTIONS = DIFFICULTIES.map((v) => ({ value: v, label: difficultyMeta[v].label }));

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function PhaseChip({ phase }: { phase: string }) {
  const meta = phaseMeta[phase] ?? { label: phase, tone: "zinc" as const };
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const meta = difficultyMeta[difficulty] ?? { label: difficulty, tone: "zinc" as const };
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}

/** Ô coverage: nền brand đậm dần theo số lượng. */
function CoverageCell({ count }: { count: number }) {
  if (!count) {
    return (
      <span className="grid h-9 place-items-center rounded-lg border border-line bg-panel-2/50 text-xs text-faint">
        —
      </span>
    );
  }
  const alpha = Math.min(0.1 + count * 0.14, 0.62);
  return (
    <span
      className="grid h-9 place-items-center rounded-lg border border-brand/25 font-mono text-xs font-semibold text-ink"
      style={{ backgroundColor: `rgba(16,185,129,${alpha})` }}
    >
      {count}
    </span>
  );
}

export function AdminQuestionsView() {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebounced(searchInput);
  const [role, setRole] = React.useState("");
  const [phase, setPhase] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");

  const list = useResource(
    () => adminApi.questionBank({ page, pageSize: PAGE_SIZE, role, phase, difficulty, search }),
    [page, role, phase, difficulty, search]
  );
  const coverage = useResource(() => adminApi.questionCoverage(), []);

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const resetPage = () => setPage(1);
  const hasActiveFilters = Boolean(searchInput || role || phase || difficulty);

  const coverageMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of coverage.data?.data ?? []) {
      map.set(`${cell.roleCode}|${cell.phase}`, cell.count);
    }
    return map;
  }, [coverage.data]);

  /* ---------- tạo / sửa câu hỏi ---------- */
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<QuestionBankItem | null>(null);
  const [form, setForm] = React.useState({
    roleCode: "frontend",
    phase: "introduction",
    difficulty: "medium",
    prompt: "",
    expectedConcepts: "",
  });

  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ roleCode: "frontend", phase: "introduction", difficulty: "medium", prompt: "", expectedConcepts: "" });
    setDialogOpen(true);
  };

  const openEdit = (question: QuestionBankItem) => {
    setEditing(question);
    setForm({
      roleCode: question.roleCode,
      phase: question.phase,
      difficulty: question.difficulty,
      prompt: question.prompt,
      expectedConcepts: question.expectedConcepts.join(", "),
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    const concepts = form.expectedConcepts
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!form.prompt.trim()) {
      toast.error("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (concepts.length === 0) {
      toast.error("Cần ít nhất 1 khái niệm mong đợi (cách nhau bởi dấu phẩy).");
      return;
    }
    setSaving(true);
    const closeDialog = () => {
      setDialogOpen(false);
      setEditing(null);
      list.reload();
      coverage.reload();
    };
    try {
      if (editing) {
        const updated = await adminApi.updateQuestion(editing.id, {
          roleCode: form.roleCode,
          phase: form.phase as QuestionBankItem["phase"],
          difficulty: form.difficulty as QuestionBankItem["difficulty"],
          prompt: form.prompt.trim(),
          expectedConcepts: concepts,
          version: editing.version,
        });
        toast.success(`Đã cập nhật câu hỏi (v${updated.version}).`);
      } else {
        await adminApi.createQuestion({
          roleCode: form.roleCode,
          phase: form.phase,
          difficulty: form.difficulty,
          prompt: form.prompt.trim(),
          expectedConcepts: concepts,
        });
        toast.success("Đã thêm câu hỏi mới vào ngân hàng.");
      }
      closeDialog();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Xung đột phiên bản: toast + tải lại danh sách
        toastConflict(() => {
          list.reload();
          coverage.reload();
        });
        closeDialog();
      } else {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------- retire ---------- */
  const [retireTarget, setRetireTarget] = React.useState<QuestionBankItem | null>(null);
  const retireAction = useToastAction(() => {
    setRetireTarget(null);
    list.reload();
    coverage.reload();
  });

  const confirmRetire = () => {
    if (!retireTarget) return;
    const target = retireTarget;
    retireAction.run(async () => {
      await adminApi.retireQuestion(target.id, target.version);
      toast.success("Câu hỏi đã được ngừng sử dụng (isActive = false).");
    });
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Ngân hàng câu hỏi"
        description="Kho câu hỏi cho buổi phỏng vấn AI đầu vào — theo vai trò, giai đoạn và độ khó."
        actions={
          <BrandButton onClick={openCreate}>
            <Plus className="size-4 icon" /> Thêm câu hỏi
          </BrandButton>
        }
      />

      {/* Ma trận độ phủ */}
      <Panel className="mb-6">
        <PanelHeader
          title="Độ phủ câu hỏi"
          description="Số câu hỏi đang hoạt động theo vai trò × giai đoạn phỏng vấn"
          icon={<ListChecks className="icon" />}
        />
        {coverage.loading ? (
          <div className="p-5">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-panel-2" />
              ))}
            </div>
          </div>
        ) : coverage.error ? null : (
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[560px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="w-36 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                    Vai trò
                  </th>
                  {PHASES.map((p) => (
                    <th key={p} className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                      {phaseMeta[p].label}
                    </th>
                  ))}
                  <th className="w-14 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                    Tổng
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => {
                  const total = PHASES.reduce((sum, p) => sum + (coverageMap.get(`${r}|${p}`) ?? 0), 0);
                  return (
                    <tr key={r}>
                      <td className="pr-2 text-sm text-ink">{roleLabels[r] ?? r}</td>
                      {PHASES.map((p) => (
                        <td key={p} className="text-center">
                          <CoverageCell count={coverageMap.get(`${r}|${p}`) ?? 0} />
                        </td>
                      ))}
                      <td className="text-center font-mono text-sm font-semibold text-brand-bright">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <FilterBar
        hasActive={hasActiveFilters}
        onReset={() => {
          setSearchInput("");
          setRole("");
          setPhase("");
          setDifficulty("");
          resetPage();
        }}
      >
        <SearchInput
          value={searchInput}
          onChange={(v) => {
            setSearchInput(v);
            resetPage();
          }}
          placeholder="Tìm trong nội dung câu hỏi…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={role}
          onChange={(v) => {
            setRole(v);
            resetPage();
          }}
          options={ROLE_OPTIONS}
          placeholder="Vai trò"
          ariaLabel="Lọc theo vai trò"
          className="w-44"
        />
        <FilterSelect
          value={phase}
          onChange={(v) => {
            setPhase(v);
            resetPage();
          }}
          options={PHASE_OPTIONS}
          placeholder="Giai đoạn"
          ariaLabel="Lọc theo giai đoạn"
          className="w-40"
        />
        <FilterSelect
          value={difficulty}
          onChange={(v) => {
            setDifficulty(v);
            resetPage();
          }}
          options={DIFFICULTY_OPTIONS}
          placeholder="Độ khó"
          ariaLabel="Lọc theo độ khó"
          className="w-36"
        />
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<ListChecks className="icon" />}
            title="Không có câu hỏi khớp bộ lọc"
            description="Điều chỉnh vai trò, giai đoạn, độ khó — hoặc thêm câu hỏi mới."
            action={
              <BrandButton onClick={openCreate}>
                <Plus className="size-4 icon" /> Thêm câu hỏi
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell minWidth={900}>
          <THead>
            <tr>
              <Th>Câu hỏi</Th>
              <Th>Vai trò</Th>
              <Th>Giai đoạn</Th>
              <Th>Độ khó</Th>
              <Th>Đang dùng</Th>
              <Th>Phiên bản</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((question) => (
              <Tr key={question.id}>
                <Td className="max-w-[380px]">
                  <p className="truncate text-sm text-ink" title={question.prompt}>
                    {truncate(question.prompt)}
                  </p>
                  <p className="truncate text-xs text-faint">
                    {question.expectedConcepts.length} khái niệm mong đợi
                  </p>
                </Td>
                <Td>
                  <RoleBadge role={question.roleCode} />
                </Td>
                <Td>
                  <PhaseChip phase={question.phase} />
                </Td>
                <Td>
                  <DifficultyBadge difficulty={question.difficulty} />
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-2" title={question.isActive ? "Đang được sử dụng" : "Đã ngừng sử dụng"}>
                    <Switch checked={question.isActive} disabled aria-label="Trạng thái sử dụng" />
                    <span className="text-xs text-faint">{question.isActive ? "Bật" : "Tắt"}</span>
                  </span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-dim">v{question.version}</span>
                </Td>
                <Td className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                        aria-label="Thao tác với câu hỏi"
                      >
                        <MoreHorizontal className="size-4 icon" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-line bg-panel-2">
                      <DropdownMenuItem onClick={() => openEdit(question)}>
                        <Pencil className="size-4 icon" /> Sửa câu hỏi
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={!question.isActive}
                        onClick={() => setRetireTarget(question)}
                      >
                        <Ban className="size-4 icon" /> Ngừng sử dụng
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Td>
              </Tr>
            ))}
          </TBody>
        </TableShell>
      )}

      {meta && rows.length > 0 ? (
        <div className="mt-4">
          <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        </div>
      ) : null}

      {/* Dialog tạo / sửa câu hỏi */}
      <AdminDialog
        open={dialogOpen}
        onOpenChange={(open) => !saving && setDialogOpen(open)}
        title={editing ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
        description={
          editing
            ? `Câu hỏi ${editing.id} · phiên bản v${editing.version} — lưu sẽ tăng phiên bản.`
            : "Câu hỏi mới sẽ được dùng ngay cho các buổi phỏng vấn AI tiếp theo."
        }
        maxWidth="max-w-xl"
        footer={
          <>
            <LineButton onClick={() => setDialogOpen(false)} disabled={saving}>
              Hủy
            </LineButton>
            <BrandButton onClick={submit} disabled={saving}>
              {saving ? <InlineSpinner className="size-4" /> : <Pencil className="size-4 icon" />}
              {saving ? "Đang lưu…" : editing ? "Lưu câu hỏi" : "Thêm câu hỏi"}
            </BrandButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Vai trò">
              <FormSelect
                value={form.roleCode}
                onChange={(v) => setForm((f) => ({ ...f, roleCode: v }))}
                options={ROLE_OPTIONS}
                ariaLabel="Chọn vai trò"
              />
            </Field>
            <Field label="Giai đoạn">
              <FormSelect
                value={form.phase}
                onChange={(v) => setForm((f) => ({ ...f, phase: v }))}
                options={PHASE_OPTIONS}
                ariaLabel="Chọn giai đoạn"
              />
            </Field>
            <Field label="Độ khó">
              <FormSelect
                value={form.difficulty}
                onChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}
                options={DIFFICULTY_OPTIONS}
                ariaLabel="Chọn độ khó"
              />
            </Field>
          </div>
          <Field label="Nội dung câu hỏi">
            <FormTextarea
              value={form.prompt}
              onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
              placeholder="Ví dụ: Giải thích sự khác biệt giữa state và props trong React…"
              rows={4}
            />
          </Field>
          <Field label="Khái niệm mong đợi" hint="Nhập cách nhau bởi dấu phẩy — dùng để AI chấm điểm câu trả lời.">
            <FormInput
              value={form.expectedConcepts}
              onChange={(e) => setForm((f) => ({ ...f, expectedConcepts: e.target.value }))}
              placeholder="component, render, tái sử dụng, hook"
            />
          </Field>
        </div>
      </AdminDialog>

      {/* Xác nhận ngừng sử dụng */}
      <ConfirmDialog
        open={Boolean(retireTarget)}
        onOpenChange={(open) => !retireAction.busy && !open && setRetireTarget(null)}
        title="Ngừng sử dụng câu hỏi này?"
        description={
          retireTarget
            ? `“${truncate(retireTarget.prompt, 90)}” · phiên bản v${retireTarget.version}`
            : undefined
        }
        confirmLabel="Ngừng sử dụng"
        destructive
        busy={retireAction.busy}
        onConfirm={confirmRetire}
      >
        <p className="text-xs leading-relaxed text-dim">
          Câu hỏi sẽ chuyển sang <span className="font-mono">isActive = false</span> và không còn xuất hiện trong
          các buổi phỏng vấn mới. Bạn vẫn xem được nó trong danh sách.
        </p>
      </ConfirmDialog>
    </ViewFrame>
  );
}
