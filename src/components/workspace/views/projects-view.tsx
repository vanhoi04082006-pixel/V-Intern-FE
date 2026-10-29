"use client";

/**
 * Đồ án — danh sách + lọc theo lĩnh vực/độ khó, tạo đồ án mới, chi tiết
 * (mô tả, công nghệ, thành viên).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createProject,
  fetchProject,
  fetchProjectFilterOptions,
  fetchProjectMembers,
  fetchProjects,
  type ProjectSummary,
} from "@/lib/api/academic";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate } from "@/lib/api/client";
import {
  Chip,
  EmptyState,
  ErrorState,
  KeyVal,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  expert: "Thách thức",
};

export function difficultyLabel(d: string | null): string {
  if (!d) return "—";
  return DIFFICULTY_LABELS[d] ?? d;
}

export function ProjectsView() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects", q, status, difficulty, page],
    queryFn: ({ signal }) =>
      fetchProjects(
        {
          q: q.trim() || undefined,
          status: status === "all" ? undefined : status,
          difficulty: difficulty === "all" ? undefined : difficulty,
          page,
        },
        signal,
      ),
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["project-filter-options"],
    queryFn: ({ signal }) => fetchProjectFilterOptions(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đồ án"
        description="Kho đồ án thực tập — mô tả, công nghệ, độ khó và đội hình thực hiện."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo đồ án
          </Button>
        }
      />

      <SectionCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm đồ án…"
              className={`${INPUT_CLS} pl-10`}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${INPUT_CLS} w-full`}>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={difficulty}
            onValueChange={(v) => {
              setDifficulty(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${INPUT_CLS} w-full`}>
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi độ khó</SelectItem>
              {(filterOptions?.difficulties ?? ["easy", "medium", "hard"]).map((d) => (
                <SelectItem key={d} value={d}>
                  {difficultyLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách đồ án…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có đồ án nào"
              description="Tạo đồ án để sinh viên nhận và bắt đầu thực tập thực chiến."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(p) => p.id}
                onRowClick={(p) => setSelectedId(p.id)}
                emptyTitle="Không tìm thấy đồ án phù hợp"
                emptyDescription="Thử đổi bộ lọc hoặc từ khoá."
                columns={[
                  { key: "code", header: "Mã", render: (p) => <span className="font-mono text-[12px] font-bold text-ink-soft">{p.code}</span> },
                  { key: "name", header: "Tên", render: (p) => <span className="font-bold">{p.name}</span> },
                  { key: "domain", header: "Lĩnh vực", render: (p) => p.domainCategory ?? "—" },
                  {
                    key: "difficulty",
                    header: "Độ khó",
                    render: (p) =>
                      p.difficulty ? (
                        <Chip tone={p.difficulty === "hard" || p.difficulty === "expert" ? "ink" : "blue"}>{difficultyLabel(p.difficulty)}</Chip>
                      ) : (
                        "—"
                      ),
                  },
                  { key: "status", header: "Trạng thái", render: (p) => <StatusBadge status={p.status} /> },
                  { key: "mentor", header: "Mentor", render: (p) => p.mentorName ?? "—" },
                  {
                    key: "members",
                    header: "SV",
                    render: (p) => (
                      <span className={p.capacity && p.memberCount >= p.capacity ? "font-bold text-amber-600" : ""}>
                        {p.memberCount}
                        {p.capacity ? `/${p.capacity}` : ""}
                      </span>
                    ),
                  },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} domainCategories={filterOptions?.domainCategories ?? []} />
      <ProjectDetailDialog projectId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ───────────────────────── Tạo đồ án ───────────────────────── */

function CreateProjectDialog({
  open,
  onClose,
  domainCategories,
}: {
  open: boolean;
  onClose: () => void;
  domainCategories: string[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainCategory, setDomainCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [technologies, setTechnologies] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createProject({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        domainCategory: domainCategory || undefined,
        difficulty: difficulty || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        technologies: technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Đã tạo đồ án ✦", description: name });
      setCode("");
      setName("");
      setDescription("");
      setDomainCategory("");
      setDifficulty("");
      setCapacity("");
      setStartDate("");
      setEndDate("");
      setTechnologies("");
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được đồ án", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đồ án mới</DialogTitle>
          <DialogDescription>Mô tả đủ rõ để AI gợi ý nhiệm vụ và sinh viên hiểu phạm vi công việc.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="project-code">Mã đồ án</Label>
              <Input id="project-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: PRJ-ECOM" className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-name">Tên đồ án</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Website thương mại" className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="project-desc">Mô tả</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục tiêu, sản phẩm đầu ra, yêu cầu đặc biệt…"
              className="min-h-[90px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Lĩnh vực</Label>
              <Select value={domainCategory} onValueChange={setDomainCategory}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue placeholder="Chọn lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  {(domainCategories.length > 0 ? domainCategories : ["web", "mobile", "ai", "data", "embedded", "other"]).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Độ khó</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="project-capacity">Sức chứa (số sinh viên tối đa)</Label>
            <Input id="project-capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="VD: 4" className={INPUT_CLS} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="project-start">Ngày bắt đầu</Label>
              <Input id="project-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-end">Ngày kết thúc</Label>
              <Input id="project-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="project-tech">Công nghệ (cách nhau bằng dấu phẩy)</Label>
            <Input id="project-tech" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="VD: Next.js, PostgreSQL, Docker" className={INPUT_CLS} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={create.isPending || !code.trim() || !name.trim()} onClick={() => create.mutate()}>
            {create.isPending ? "Đang tạo…" : "Tạo đồ án"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Chi tiết đồ án ───────────────────────── */

function ProjectDetailDialog({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
  const open = !!projectId;

  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: ({ signal }) => fetchProject(projectId!, signal),
    enabled: open,
  });

  const { data: members } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: ({ signal }) => fetchProjectMembers(projectId!, signal),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {project?.name ?? "Chi tiết đồ án"}
            {project ? <StatusBadge status={project.status} /> : null}
          </DialogTitle>
          <DialogDescription>Mã đồ án: {project?.code ?? "…"}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState label="Đang tải chi tiết đồ án…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !project ? null : (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4 sm:grid-cols-2">
              <KeyVal label="Lĩnh vực">{project.domainCategory ?? "—"}</KeyVal>
              <KeyVal label="Độ khó">{difficultyLabel(project.difficulty)}</KeyVal>
              <KeyVal label="Mentor">{project.mentorName ?? "—"}</KeyVal>
              <KeyVal label="Đội hình">
                {project.memberCount}
                {project.capacity ? `/${project.capacity}` : ""} sinh viên
              </KeyVal>
              <KeyVal label="Bắt đầu">{fmtDate(project.startDate)}</KeyVal>
              <KeyVal label="Kết thúc">{fmtDate(project.endDate)}</KeyVal>
            </div>

            {project.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((t) => (
                  <Chip key={t} tone="blue">
                    {t}
                  </Chip>
                ))}
              </div>
            ) : null}

            {project.description ? (
              <p className="whitespace-pre-line rounded-2xl border-2 border-ink/10 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
                {project.description}
              </p>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-extrabold text-ink">Thành viên ({members?.length ?? 0})</p>
              {!members || members.length === 0 ? (
                <p className="font-hand text-[15px] text-ink-faint">Chưa có sinh viên nào nhận đồ án này.</p>
              ) : (
                <ul className="divide-y-2 divide-dashed divide-ink/10 rounded-xl border-2 border-ink/12 bg-paper">
                  {members.map((m) => (
                    <li key={m.userId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{m.displayName}</p>
                        <p className="truncate text-[12px] text-ink-faint">{m.email}</p>
                      </div>
                      {m.roleName ? <Chip tone="blue">{m.roleName}</Chip> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
