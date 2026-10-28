"use client";

import * as React from "react";
import { FolderKanban, MoreHorizontal, Pencil, Plus, Presentation } from "lucide-react";
import { toast } from "sonner";
import { templateApi, type TemplateSummary } from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import {
  Empty,
  PageHeader,
  Pager,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  templateDifficultyMeta,
  templateStatusMeta,
  THead,
  Th,
  toastConflict,
  Tr,
  useDebounced,
} from "./admin-shared";

const PAGE_SIZE = 10;

const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"].map((v) => ({
  value: v,
  label: templateDifficultyMeta[v]?.label ?? v,
}));
const STATUS_OPTIONS = ["active", "draft", "archived"].map((v) => ({
  value: v,
  label: templateStatusMeta[v]?.label ?? v,
}));

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const meta = templateDifficultyMeta[difficulty] ?? { label: difficulty, tone: "zinc" as const };
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}

function StatusBadge({ status }: { status: string }) {
  const meta = templateStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

export function AdminTemplatesView() {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebounced(searchInput);
  const [status, setStatus] = React.useState("");

  const list = useResource(
    () => templateApi.list({ page, pageSize: PAGE_SIZE, search, status }),
    [page, search, status]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const resetPage = () => setPage(1);

  /* Số phiên đã chạy: lấy từ detail từng template trên trang hiện tại. */
  const [runsMap, setRunsMap] = React.useState<Record<string, number>>({});
  React.useEffect(() => {
    if (!rows.length) return;
    let cancelled = false;
    Promise.all(
      rows.map((t) =>
        templateApi
          .detail(t.id)
          .then((d) => [t.id, d.runs?.length ?? 0] as const)
          .catch(() => [t.id, 0] as const)
      )
    ).then((pairs) => {
      if (!cancelled) setRunsMap(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  /* ---------- tạo / sửa ---------- */
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TemplateSummary | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    code: "",
    category: "",
    difficulty: "intermediate",
    description: "",
    status: "draft",
  });
  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", category: "", difficulty: "intermediate", description: "", status: "draft" });
    setDialogOpen(true);
  };

  const openEdit = (template: TemplateSummary) => {
    setEditing(template);
    setForm({
      name: template.name,
      code: template.code,
      category: template.category,
      difficulty: template.difficulty,
      description: template.description,
      status: template.status,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Tên mẫu dự án không được để trống.");
      return;
    }
    setSaving(true);
    const closeDialog = () => {
      setDialogOpen(false);
      setEditing(null);
      list.reload();
    };
    try {
      if (editing) {
        const updated = await templateApi.update(editing.id, {
          name: form.name.trim(),
          category: form.category.trim() || undefined,
          difficulty: form.difficulty as TemplateSummary["difficulty"],
          status: form.status as TemplateSummary["status"],
          description: form.description.trim(),
          expectedVersion: editing.version,
        });
        toast.success(`Đã cập nhật ${updated.name} (v${updated.version}).`);
      } else {
        const created = await templateApi.create({
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          category: form.category.trim() || "Web App",
          difficulty: form.difficulty as TemplateSummary["difficulty"],
          status: form.status as TemplateSummary["status"],
          description: form.description.trim(),
        });
        toast.success(`Đã tạo mẫu dự án ${created.code}.`);
      }
      closeDialog();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toastConflict(list.reload);
        closeDialog();
      } else {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Dự án mẫu"
        description="Kho blueprint dùng để khởi tạo phiên thực tập mới — form quản trị đơn giản hóa theo tài liệu API."
        actions={
          <BrandButton onClick={openCreate}>
            <Plus className="size-4 icon" /> Tạo mẫu dự án
          </BrandButton>
        }
      />

      <FilterBar
        hasActive={Boolean(searchInput || status)}
        onReset={() => {
          setSearchInput("");
          setStatus("");
          resetPage();
        }}
      >
        <SearchInput
          value={searchInput}
          onChange={(v) => {
            setSearchInput(v);
            resetPage();
          }}
          placeholder="Tìm theo tên, mã, mô tả…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          options={STATUS_OPTIONS}
          placeholder="Trạng thái"
          ariaLabel="Lọc theo trạng thái"
          className="w-40"
        />
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={4} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<FolderKanban className="icon" />}
            title="Chưa có mẫu dự án nào"
            description="Tạo mẫu đầu tiên để giảng viên có thể khởi tạo phiên thực tập nhanh chóng."
            action={
              <BrandButton onClick={openCreate}>
                <Plus className="size-4 icon" /> Tạo mẫu dự án
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell minWidth={920}>
          <THead>
            <tr>
              <Th>Mẫu dự án</Th>
              <Th>Mã</Th>
              <Th>Danh mục</Th>
              <Th>Độ khó</Th>
              <Th>Phiên bản</Th>
              <Th>Trạng thái</Th>
              <Th>Số phiên chạy</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((template) => (
              <Tr key={template.id}>
                <Td className="max-w-[300px]">
                  <p className="truncate text-sm font-medium text-ink">{template.name}</p>
                  <p className="truncate text-xs text-faint" title={template.description}>
                    {template.description || "Chưa có mô tả"}
                  </p>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-dim">{template.code}</span>
                </Td>
                <Td>
                  <span className="text-sm text-dim">{template.category}</span>
                </Td>
                <Td>
                  <DifficultyBadge difficulty={template.difficulty} />
                </Td>
                <Td>
                  <span className="font-mono text-xs text-dim">v{template.version}</span>
                </Td>
                <Td>
                  <StatusBadge status={template.status} />
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 font-mono text-sm text-dim">
                    <Presentation className="size-3.5 icon text-faint" />
                    {runsMap[template.id] ?? "…"}
                  </span>
                </Td>
                <Td className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                        aria-label={`Thao tác với ${template.name}`}
                      >
                        <MoreHorizontal className="size-4 icon" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-line bg-panel-2">
                      <DropdownMenuItem onClick={() => openEdit(template)}>
                        <Pencil className="size-4 icon" /> Sửa thông tin
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

      {/* Dialog tạo / sửa mẫu dự án */}
      <AdminDialog
        open={dialogOpen}
        onOpenChange={(open) => !saving && setDialogOpen(open)}
        title={editing ? "Sửa mẫu dự án" : "Tạo mẫu dự án mới"}
        description={
          editing
            ? `${editing.code} · phiên bản v${editing.version} — lưu sẽ tăng phiên bản.`
            : "Form đơn giản hóa: blueprint mặc định sẽ được tạo kèm theo tên dự án."
        }
        footer={
          <>
            <LineButton onClick={() => setDialogOpen(false)} disabled={saving}>
              Hủy
            </LineButton>
            <BrandButton onClick={submit} disabled={saving}>
              {saving ? <InlineSpinner className="size-4" /> : <Pencil className="size-4 icon" />}
              {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo mẫu"}
            </BrandButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên mẫu dự án">
            <FormInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: Sàn thương mại điện tử"
            />
          </Field>
          {editing ? (
            <Field label="Mã mẫu" hint="Mã không đổi sau khi tạo.">
              <FormInput value={form.code} disabled className="font-mono" />
            </Field>
          ) : (
            <Field label="Mã mẫu" hint="Bỏ trống để tự sinh từ tên (định dạng TPL-XXX).">
              <FormInput
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="TPL-ECOM"
                className="font-mono"
              />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Danh mục">
              <FormInput
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Web App"
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
            <Field label="Trạng thái">
              <FormSelect
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={STATUS_OPTIONS}
                ariaLabel="Chọn trạng thái"
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <FormTextarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về dự án mẫu, công nghệ và mục tiêu học tập…"
              rows={4}
            />
          </Field>
        </div>
      </AdminDialog>
    </ViewFrame>
  );
}
