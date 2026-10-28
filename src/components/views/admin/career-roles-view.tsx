"use client";

import * as React from "react";
import {
  Archive,
  Briefcase,
  History,
  Pencil,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  careerRoleApi,
  type CareerLevel,
  type CareerLanguage,
  type CareerRoleRecord,
  type CareerRoleRevision,
  type CareerRoleStatus,
  type SkillRequirement,
} from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { relativeTime } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
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
  Tr,
  useDebounced,
  useToastAction,
} from "./admin-shared";

const PAGE_SIZE = 10;

const statusMeta: Record<CareerRoleStatus, { label: string; tone: "amber" | "brand" | "zinc" }> = {
  draft: { label: "Bản nháp", tone: "amber" },
  published: { label: "Đã xuất bản", tone: "brand" },
  archived: { label: "Lưu trữ", tone: "zinc" },
};

const STATUS_OPTIONS = (["draft", "published", "archived"] as CareerRoleStatus[]).map((v) => ({
  value: v,
  label: statusMeta[v].label,
}));

const LEVEL_OPTIONS: { value: CareerLevel; label: string }[] = [
  { value: "intern", label: "Thực tập sinh" },
  { value: "junior", label: "Junior" },
];

const LANGUAGE_OPTIONS: { value: CareerLanguage; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
];

const CODE_PATTERN = /^[a-z][a-z0-9_]{1,31}$/;

function CareerRoleStatusBadge({ status }: { status: CareerRoleStatus }) {
  const meta = statusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

function SkillChips({ skills }: { skills: SkillRequirement[] }) {
  if (skills.length === 0) {
    return <span className="text-xs text-faint">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s) => (
        <span
          key={s.skill}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-deep/70 px-1.5 py-0.5 font-mono text-[10px] text-dim"
          title={s.mandatory ? "Bắt buộc" : "Không bắt buộc"}
        >
          {s.mandatory ? <span className="size-1 rounded-full bg-brand" aria-hidden /> : null}
          {s.skill} {s.weight}%
        </span>
      ))}
    </div>
  );
}

/* ============================ form dialog ============================ */

interface RoleFormState {
  code: string;
  name: string;
  description: string;
  level: CareerLevel;
  language: CareerLanguage;
  requiredSkills: { skill: string; weight: string; mandatory: boolean }[];
  optionalSkills: string[];
}

function emptyForm(): RoleFormState {
  return {
    code: "",
    name: "",
    description: "",
    level: "intern",
    language: "vi",
    requiredSkills: [{ skill: "", weight: "0", mandatory: true }],
    optionalSkills: [],
  };
}

function formOf(role: CareerRoleRecord): RoleFormState {
  return {
    code: role.code,
    name: role.name,
    description: role.description,
    level: role.level,
    language: role.language,
    requiredSkills: role.requiredSkills.length
      ? role.requiredSkills.map((s) => ({ skill: s.skill, weight: String(s.weight), mandatory: s.mandatory }))
      : [{ skill: "", weight: "0", mandatory: true }],
    optionalSkills: [...role.optionalSkills],
  };
}

function RoleFormDialog({
  open,
  onOpenChange,
  editing,
  reload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CareerRoleRecord | null;
  reload: () => void;
}) {
  const [form, setForm] = React.useState<RoleFormState>(emptyForm);
  const [chipsInput, setChipsInput] = React.useState("");
  const saveAction = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  React.useEffect(() => {
    if (open) {
      setForm(editing ? formOf(editing) : emptyForm());
      setChipsInput("");
    }
  }, [open, editing]);

  const totalWeight = form.requiredSkills.reduce(
    (sum, s) => sum + (Number(s.weight) || 0),
    0
  );

  const addSkill = () =>
    setForm((f) => ({
      ...f,
      requiredSkills: [...f.requiredSkills, { skill: "", weight: "0", mandatory: false }],
    }));

  const addOptionalChip = () => {
    const v = chipsInput.trim();
    if (!v) return;
    setForm((f) =>
      f.optionalSkills.includes(v)
        ? f
        : { ...f, optionalSkills: [...f.optionalSkills, v] }
    );
    setChipsInput("");
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên nghề.");
      return;
    }
    if (!editing && !CODE_PATTERN.test(form.code.trim())) {
      toast.error("Mã nghề phải khớp mẫu [a-z][a-z0-9_]{1,31} (vd: frontend, data_analyst).");
      return;
    }
    const skills = form.requiredSkills
      .map((s) => ({ skill: s.skill.trim(), weight: Number(s.weight) || 0, mandatory: s.mandatory }))
      .filter((s) => s.skill.length > 0);
    if (skills.length === 0) {
      toast.error("Cần ít nhất 1 kỹ năng bắt buộc.");
      return;
    }
    if (skills.some((s) => s.weight <= 0 || s.weight > 100)) {
      toast.error("Trọng số mỗi kỹ năng phải từ 1 đến 100.");
      return;
    }

    saveAction.run(async () => {
      try {
        if (editing) {
          await careerRoleApi.update(editing.code, {
            name: form.name.trim(),
            description: form.description.trim(),
            level: form.level,
            language: form.language,
            requiredSkills: skills,
            optionalSkills: form.optionalSkills,
            note: "Cập nhật từ màn Thư viện nghề",
            expectedVersion: editing.version,
          });
          toast.success(`Đã lưu thay đổi cho nghề "${form.name.trim()}".`);
        } else {
          const created = await careerRoleApi.create({
            code: form.code.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            level: form.level,
            language: form.language,
            requiredSkills: skills,
            optionalSkills: form.optionalSkills,
          });
          toast.success(`Đã tạo nghề "${created.name}" (bản nháp v1).`);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Đã có bản mới hơn của nghề này — đang tải lại bản mới nhất.");
          reload();
          onOpenChange(false);
          return;
        }
        throw err;
      }
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !saveAction.busy && onOpenChange(o)}
      title={editing ? `Sửa nghề "${editing.name}"` : "Thêm nghề mới"}
      description={
        editing
          ? `Mã nghề: ${editing.code} · phiên bản hiện tại v${editing.version}. Lưu sẽ tạo phiên bản mới.`
          : "Nghề mới khởi tạo ở trạng thái Bản nháp. Xuất bản khi tổng trọng số kỹ năng đúng 100%."
      }
      maxWidth="max-w-3xl"
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={saveAction.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={saveAction.busy}>
            {saveAction.busy ? <InlineSpinner className="size-4" /> : <Pencil className="size-4 icon" />}
            {saveAction.busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo nghề"}
          </BrandButton>
        </>
      }
    >
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Mã nghề"
            hint={editing ? "Không thể đổi mã sau khi tạo." : "Chỉ a-z, 0-9 và dấu gạch dưới (vd: frontend, qa_tester)."}
          >
            <FormInput
              value={editing ? editing.code : form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="frontend"
              className="font-mono"
              disabled={Boolean(editing)}
              autoComplete="off"
            />
          </Field>
          <Field label="Tên nghề">
            <FormInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Lập trình viên Frontend"
            />
          </Field>
          <Field label="Cấp bậc">
            <FormSelect
              value={form.level}
              onChange={(v) => setForm((f) => ({ ...f, level: v as CareerLevel }))}
              options={LEVEL_OPTIONS}
              ariaLabel="Chọn cấp bậc"
            />
          </Field>
          <Field label="Ngôn ngữ phỏng vấn">
            <FormSelect
              value={form.language}
              onChange={(v) => setForm((f) => ({ ...f, language: v as CareerLanguage }))}
              options={LANGUAGE_OPTIONS}
              ariaLabel="Chọn ngôn ngữ"
            />
          </Field>
        </div>
        <Field label="Mô tả">
          <FormTextarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Mô tả phạm vi công việc của nghề…"
          />
        </Field>

        {/* Kỹ năng bắt buộc */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-dim">Kỹ năng bắt buộc</span>
            <LineButton type="button" size="sm" onClick={addSkill}>
              <Plus className="size-3.5 icon" /> Thêm kỹ năng
            </LineButton>
          </div>
          <div className="space-y-2">
            {form.requiredSkills.map((row, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-deep/60 p-2.5">
                <FormInput
                  value={row.skill}
                  onChange={(e) =>
                    setForm((f) => {
                      const next = [...f.requiredSkills];
                      next[idx] = { ...next[idx], skill: e.target.value };
                      return { ...f, requiredSkills: next };
                    })
                  }
                  placeholder="Tên kỹ năng (vd: React)"
                  className="h-9 min-w-32 flex-1"
                  aria-label={`Kỹ năng ${idx + 1}`}
                />
                <div className="flex items-center gap-1.5">
                  <FormInput
                    type="number"
                    min={0}
                    max={100}
                    value={row.weight}
                    onChange={(e) =>
                      setForm((f) => {
                        const next = [...f.requiredSkills];
                        next[idx] = { ...next[idx], weight: e.target.value };
                        return { ...f, requiredSkills: next };
                      })
                    }
                    className="h-9 w-20 font-mono"
                    aria-label={`Trọng số kỹ năng ${idx + 1}`}
                  />
                  <span className="text-xs text-faint">%</span>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-dim">
                  <Checkbox
                    checked={row.mandatory}
                    onCheckedChange={(v) =>
                      setForm((f) => {
                        const next = [...f.requiredSkills];
                        next[idx] = { ...next[idx], mandatory: v === true };
                        return { ...f, requiredSkills: next };
                      })
                    }
                    aria-label="Kỹ năng bắt buộc"
                  />
                  Bắt buộc
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-rose"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      requiredSkills:
                        f.requiredSkills.length > 1
                          ? f.requiredSkills.filter((_, i) => i !== idx)
                          : [{ skill: "", weight: "0", mandatory: true }],
                    }))
                  }
                  aria-label="Xóa kỹ năng"
                >
                  <Trash2 className="size-3.5 icon" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`font-mono text-xs font-semibold ${
                totalWeight === 100 ? "text-emerald" : "text-amber"
              }`}
            >
              Tổng trọng số: {totalWeight}%
            </span>
            {totalWeight !== 100 ? (
              <span className="text-xs text-amber">Trọng số phải đúng 100% để xuất bản.</span>
            ) : (
              <span className="text-xs text-emerald">Đủ điều kiện xuất bản (100%).</span>
            )}
          </div>
        </div>

        {/* Kỹ năng tùy chọn */}
        <Field label="Kỹ năng tùy chọn" hint="Nhập tên kỹ năng rồi nhấn Enter để thêm.">
          <div className="space-y-2">
            {form.optionalSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {form.optionalSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-md border border-line bg-deep/70 px-2 py-0.5 font-mono text-[11px] text-dim"
                  >
                    {skill}
                    <button
                      type="button"
                      className="text-faint transition-colors hover:text-rose"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          optionalSkills: f.optionalSkills.filter((s) => s !== skill),
                        }))
                      }
                      aria-label={`Xóa ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <FormInput
              value={chipsInput}
              onChange={(e) => setChipsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOptionalChip();
                }
              }}
              placeholder="vd: GraphQL — Enter để thêm"
            />
          </div>
        </Field>
      </div>
    </AdminDialog>
  );
}

/* ============================ revisions dialog ============================ */

function RevisionsDialog({
  role,
  onOpenChange,
}: {
  role: CareerRoleRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = React.useState(1);
  const revisions = useResource(
    () => (role ? careerRoleApi.revisions(role.code, { page, pageSize: 5 }) : Promise.resolve(null)),
    [role?.code, page]
  );

  React.useEffect(() => {
    if (role) setPage(1);
  }, [role]);

  const rows = revisions.data?.data ?? [];

  return (
    <AdminDialog
      open={Boolean(role)}
      onOpenChange={onOpenChange}
      title={`Lịch sử phiên bản — ${role?.name ?? ""}`}
      description={`${role?.code ?? ""} · các snapshot chỉ để xem lại, không khôi phục trực tiếp.`}
      maxWidth="max-w-2xl"
      footer={
        <LineButton onClick={() => onOpenChange(false)}>Đóng</LineButton>
      }
    >
      {revisions.loading ? (
        <LoadingBlock rows={3} />
      ) : revisions.error ? (
        <ErrorBlock error={revisions.error} onRetry={revisions.reload} />
      ) : rows.length === 0 ? (
        <Empty icon={<History className="icon" />} title="Chưa có phiên bản nào" />
      ) : (
        <div className="space-y-2">
          {rows.map((rev: CareerRoleRevision) => (
            <div key={rev.id} className="rounded-xl border border-line bg-deep/60 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-bright">v{rev.version}</span>
                <ToneBadge tone={rev.snapshot.status === "published" ? "brand" : rev.snapshot.status === "archived" ? "zinc" : "amber"}>
                  {statusMeta[rev.snapshot.status]?.label ?? rev.snapshot.status}
                </ToneBadge>
                <span className="ml-auto text-[11px] text-faint">{relativeTime(rev.changedAt)}</span>
              </div>
              <p className="mt-1.5 text-[13px] text-ink">{rev.note}</p>
              <p className="mt-1 text-[11px] text-faint">
                {rev.changedBy} · {rev.snapshot.requiredSkills.length} kỹ năng bắt buộc ·{" "}
                {rev.snapshot.requiredSkills.reduce((s, r) => s + r.weight, 0)}% tổng trọng số
              </p>
            </div>
          ))}
          {revisions.data && revisions.data.meta.totalPages > 1 ? (
            <Pager
              page={revisions.data.meta.page}
              totalPages={revisions.data.meta.totalPages}
              total={revisions.data.meta.total}
              onChange={setPage}
            />
          ) : null}
        </div>
      )}
    </AdminDialog>
  );
}

/* ============================ main view ============================ */

export function AdminCareerRoles() {
  const [page, setPage] = React.useState(1);
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [status, setStatus] = React.useState("");

  const list = useResource(
    () => careerRoleApi.list({ page, pageSize: PAGE_SIZE, search: q || undefined, status: (status || undefined) as CareerRoleStatus | undefined }),
    [page, q, status]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  const resetPage = () => setPage(1);

  /* ----- dialog state ----- */
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CareerRoleRecord | null>(null);
  const [revisionsOf, setRevisionsOf] = React.useState<CareerRoleRecord | null>(null);
  const [archiving, setArchiving] = React.useState<CareerRoleRecord | null>(null);

  const lifecycleAction = useToastAction(() => list.reload());
  const archiveAction = useToastAction(() => {
    setArchiving(null);
    list.reload();
  });

  const handle409 = (err: unknown): boolean => {
    if (err instanceof ApiError && err.status === 409) {
      toast.error("Đã có bản mới hơn — đang tải lại bản mới nhất.");
      list.reload();
      return true;
    }
    return false;
  };

  const toggleAccepting = (role: CareerRoleRecord, accepting: boolean) => {
    lifecycleAction.run(async () => {
      try {
        await careerRoleApi.setAccepting(role.code, { accepting, expectedVersion: role.version });
        toast.success(`"${role.name}" ${accepting ? "bắt đầu nhận hồ sơ." : "tạm dừng nhận hồ sơ."}`);
      } catch (err) {
        if (handle409(err)) return;
        throw err;
      }
    });
  };

  const publish = (role: CareerRoleRecord) => {
    lifecycleAction.run(async () => {
      try {
        await careerRoleApi.publish(role.code, role.version);
        toast.success(`Đã xuất bản nghề "${role.name}" — ứng viên có thể chọn khi nộp hồ sơ.`);
      } catch (err) {
        if (handle409(err)) return;
        throw err;
      }
    });
  };

  const confirmArchive = () => {
    if (!archiving) return;
    archiveAction.run(async () => {
      try {
        await careerRoleApi.archive(archiving.code, archiving.version);
        toast.success(`Đã lưu trữ nghề "${archiving.name}".`);
      } catch (err) {
        if (handle409(err)) return;
        throw err;
      }
    });
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Thư viện nghề"
        description="Quản lý các nghề dùng cho phỏng vấn AI và cổng tuyển dụng công khai: kỹ năng bắt buộc, trọng số và trạng thái nhận hồ sơ."
        actions={
          <BrandButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4 icon" /> Thêm nghề
          </BrandButton>
        }
      />

      <FilterBar
        hasActive={Boolean(qInput || status)}
        onReset={() => {
          setQInput("");
          setStatus("");
          resetPage();
        }}
      >
        <SearchInput
          value={qInput}
          onChange={(v) => {
            setQInput(v);
            resetPage();
          }}
          placeholder="Tìm theo mã hoặc tên nghề…"
          className="w-full sm:w-64"
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
          className="w-44"
        />
        {meta ? (
          <span className="ml-auto font-mono text-xs text-faint">{meta.total} nghề</span>
        ) : null}
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={5} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<Briefcase className="icon" />}
            title="Chưa có nghề nào khớp bộ lọc"
            description="Thêm nghề mới hoặc đổi bộ lọc để xem danh sách."
            action={
              <BrandButton
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4 icon" /> Thêm nghề
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell minWidth={1080}>
          <THead>
            <tr>
              <Th>Nghề</Th>
              <Th>Cấp bậc</Th>
              <Th>Ngôn ngữ</Th>
              <Th>Kỹ năng bắt buộc</Th>
              <Th>Phiên bản</Th>
              <Th>Trạng thái</Th>
              <Th>Nhận hồ sơ</Th>
              <Th>Cập nhật</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((role) => (
              <Tr key={role.code}>
                <Td>
                  <p className="font-mono text-xs text-brand-bright">{role.code}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{role.name}</p>
                </Td>
                <Td>
                  <ToneBadge tone={role.level === "intern" ? "teal" : "violet"}>
                    {role.level === "intern" ? "Thực tập sinh" : "Junior"}
                  </ToneBadge>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-dim">
                    {role.language === "vi" ? "vi · Tiếng Việt" : "en · English"}
                  </span>
                </Td>
                <Td className="max-w-64">
                  <SkillChips skills={role.requiredSkills} />
                </Td>
                <Td>
                  <span className="font-mono text-xs text-dim">v{role.version}</span>
                </Td>
                <Td>
                  <CareerRoleStatusBadge status={role.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-2" title={role.status === "published" ? "Bật/tắt nhận hồ sơ ứng viên" : "Chỉ nghề đã xuất bản mới nhận hồ sơ"}>
                    <Switch
                      checked={role.acceptingApplications}
                      disabled={role.status !== "published" || lifecycleAction.busy}
                      onCheckedChange={(v) => toggleAccepting(role, v)}
                      aria-label={`Nhận hồ sơ cho ${role.name}`}
                    />
                    <span className="text-[11px] text-faint">
                      {role.acceptingApplications ? "Đang mở" : "Đóng"}
                    </span>
                  </div>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-dim">{relativeTime(role.updatedAt)}</span>
                </Td>
                <Td className="text-right">
                  <RowMenu
                    role={role}
                    onEdit={() => {
                      setEditing(role);
                      setFormOpen(true);
                    }}
                    onPublish={() => publish(role)}
                    onArchive={() => setArchiving(role)}
                    onRevisions={() => setRevisionsOf(role)}
                  />
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

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        reload={list.reload}
      />

      <RevisionsDialog role={revisionsOf} onOpenChange={(o) => !o && setRevisionsOf(null)} />

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(o) => !archiveAction.busy && !o && setArchiving(null)}
        title={archiving ? `Lưu trữ nghề "${archiving.name}"?` : ""}
        description="Nghề đã lưu trữ không xuất hiện ở cổng tuyển dụng và không thể chỉnh sửa. Cổng công khai sẽ ẩn nghề này với ứng viên."
        confirmLabel="Lưu trữ"
        destructive
        busy={archiveAction.busy}
        onConfirm={confirmArchive}
      />
    </ViewFrame>
  );
}

function RowMenu({
  role,
  onEdit,
  onPublish,
  onArchive,
  onRevisions,
}: {
  role: CareerRoleRecord;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onRevisions: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
          aria-label={`Thao tác với ${role.name}`}
        >
          <Pencil className="size-4 icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 border-line bg-panel-2">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4 icon" /> Sửa
        </DropdownMenuItem>
        <DropdownMenuItem disabled={role.status !== "draft"} onClick={onPublish}>
          <Rocket className="size-4 icon" /> Xuất bản
        </DropdownMenuItem>
        <DropdownMenuItem disabled={role.status === "archived"} onClick={onArchive}>
          <Archive className="size-4 icon" /> Lưu trữ
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem onClick={onRevisions}>
          <History className="size-4 icon" /> Lịch sử phiên bản
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
