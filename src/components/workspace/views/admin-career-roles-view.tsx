"use client";

/**
 * Vai trò nghề — quản lý catalogue vai trò tuyển dụng (mã, cấp bậc,
 * ngôn ngữ, kỹ năng yêu cầu) và lưu trữ khi hết thời hạn.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { archiveCareerRole, createCareerRole, fetchAdminCareerRoles, type AdminCareerRole } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import {
  Chip,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const LEVEL_LABELS: Record<string, string> = { intern: "Thực tập sinh", junior: "Junior" };
const LANG_LABELS: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh" };

export function AdminCareerRolesView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [archiving, setArchiving] = useState<AdminCareerRole | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-career-roles", search, status, page],
    queryFn: ({ signal }) =>
      fetchAdminCareerRoles(
        { search: search || undefined, status: status === "all" ? undefined : status, page },
        signal,
      ),
  });

  const archive = useMutation({
    mutationFn: (role: AdminCareerRole) => archiveCareerRole(role.code, role.version),
    onSuccess: () => {
      toast({ title: "Đã lưu trữ vai trò nghề" });
      void queryClient.invalidateQueries({ queryKey: ["admin-career-roles"] });
      setArchiving(null);
    },
    onError: (e) => toast({ title: "Lưu trữ thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<AdminCareerRole>[] = [
    {
      key: "code",
      header: "Mã",
      render: (r) => <span className="font-mono text-[12px] font-bold text-blue">{r.code}</span>,
    },
    { key: "name", header: "Tên", render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: "level", header: "Cấp bậc", render: (r) => <Chip>{LEVEL_LABELS[r.level] ?? r.level}</Chip> },
    { key: "language", header: "Ngôn ngữ", render: (r) => <span className="text-[13px]">{LANG_LABELS[r.language] ?? r.language}</span> },
    { key: "status", header: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "accepting",
      header: "Đang nhận HS",
      render: (r) => (r.acceptingApplications ? <Chip tone="green">Đang nhận</Chip> : <Chip>Đóng</Chip>),
    },
    {
      key: "actions",
      header: "Hành động",
      className: "text-right",
      render: (r) =>
        r.status !== "archived" ? (
          <Button
            variant="outline"
            size="sm"
            className="border-rose-300 font-bold text-rose-600 hover:bg-rose-50"
            onClick={() => setArchiving(r)}
          >
            Lưu trữ
          </Button>
        ) : (
          <span className="text-[12px] text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vai trò nghề"
        description="Catalogue vai trò tuyển dụng — cấp bậc, ngôn ngữ phỏng vấn, kỹ năng yêu cầu."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Tạo vai trò nghề
          </Button>
        }
      />

      <SectionCard title="Danh sách vai trò nghề">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Tìm theo mã hoặc tên…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={inputCls}
            aria-label="Tìm vai trò nghề"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[210px]`} aria-label="Lọc trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải vai trò nghề…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyTitle="Không tìm thấy vai trò nghề" emptyDescription="Tạo vai trò nghề mới để ứng viên chọn khi đăng ký." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(r) => r.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateCareerRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-career-roles"] });
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!archiving} onOpenChange={(open) => !open && setArchiving(null)}>
        <AlertDialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <AlertDialogHeader>
            <AlertDialogTitle>Lưu trữ vai trò “{archiving?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai trò <span className="font-mono">{archiving?.code}</span> (phiên bản {archiving?.version}) sẽ ngừng hiển thị với ứng viên. Bạn có thể tạo phiên bản mới nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl">Để sau</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
              disabled={archive.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (archiving) archive.mutate(archiving);
              }}
            >
              {archive.isPending ? "Đang lưu trữ…" : "Lưu trữ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ───────────────────────── Tạo vai trò nghề ───────────────────────── */

function CreateCareerRoleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("intern");
  const [language, setLanguage] = useState("vi");
  const [skills, setSkills] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createCareerRole({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        level,
        language,
        requiredSkills:
          skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo vai trò nghề ✦" });
      setCode("");
      setName("");
      setDescription("");
      setLevel("intern");
      setLanguage("vi");
      setSkills("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo vai trò thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const valid = code.trim().length > 0 && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo vai trò nghề mới</DialogTitle>
          <DialogDescription>Vai trò mới ở trạng thái bản nháp — xuất bản khi sẵn sàng nhận hồ sơ.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="role-code">Mã vai trò</Label>
              <Input id="role-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="vd: fe-intern" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role-name">Tên vai trò</Label>
              <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="vd: Frontend Intern" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="role-description">Mô tả</Label>
            <Textarea id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px] rounded-xl border-2 border-ink/20 bg-raised px-4 py-2 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25" placeholder="Mô tả ngắn về vai trò này…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Cấp bậc</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className={triggerCls} aria-label="Cấp bậc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intern">Thực tập sinh</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Ngôn ngữ phỏng vấn</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className={triggerCls} aria-label="Ngôn ngữ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">Tiếng Anh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="role-skills">Kỹ năng yêu cầu</Label>
            <Input id="role-skills" value={skills} onChange={(e) => setSkills(e.target.value)} className={inputCls} placeholder="Cách nhau bởi dấu phẩy — vd: React, TypeScript, CSS" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={!valid || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo vai trò"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
