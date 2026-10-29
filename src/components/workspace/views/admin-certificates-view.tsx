"use client";

/**
 * Chứng nhận — danh sách đã cấp (tải PDF, thu hồi), cấp mới,
 * và tra cứu công khai theo mã.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Download, Search, ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  downloadCertificatePdf,
  fetchCertificates,
  issueCertificate,
  revokeCertificate,
  verifyCertificate,
  type CertificateItem,
  type VerifyResult,
} from "@/lib/api/finance";
import { fetchProjects } from "@/lib/api/academic";
import { fetchUsers } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { saveBlob, fmtDateTime } from "@/lib/api/client";
import {
  ErrorState,
  KeyVal,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AdminCertificatesView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chứng nhận"
        description="Cấp, thu hồi và xác minh chứng nhận hoàn thành đồ án của sinh viên."
      />
      <Tabs defaultValue="list">
        <TabsList className="h-11 rounded-xl border-2 border-ink/15 bg-paper p-1">
          <TabsTrigger value="list" className="rounded-lg px-4 font-bold">Danh sách</TabsTrigger>
          <TabsTrigger value="issue" className="rounded-lg px-4 font-bold">Cấp chứng nhận</TabsTrigger>
          <TabsTrigger value="verify" className="rounded-lg px-4 font-bold">Tra cứu công khai</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <CertificateListPanel />
        </TabsContent>
        <TabsContent value="issue" className="mt-4">
          <IssueCertificatePanel />
        </TabsContent>
        <TabsContent value="verify" className="mt-4">
          <VerifyPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────── Danh sách ───────────────────────── */

function CertificateListPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [revoking, setRevoking] = useState<CertificateItem | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-certificates", status, page],
    queryFn: ({ signal }) => fetchCertificates({ status: status === "all" ? undefined : status, page }, signal),
  });

  const download = useMutation({
    mutationFn: (cert: CertificateItem) => downloadCertificatePdf(cert.id),
    onSuccess: (blob, cert) => {
      saveBlob(blob, `chung-nhan-${cert.certificateNumber || cert.id}.pdf`);
      toast({ title: "Đang tải PDF xuống ✦" });
    },
    onError: (e) => toast({ title: "Tải PDF thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: (cert: CertificateItem) => revokeCertificate(cert.id, revokeReason.trim()),
    onSuccess: () => {
      toast({ title: "Đã thu hồi chứng nhận" });
      void queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      setRevoking(null);
      setRevokeReason("");
    },
    onError: (e) => toast({ title: "Thu hồi thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<CertificateItem>[] = [
    {
      key: "number",
      header: "Số hiệu",
      render: (c) => <span className="font-mono text-[12px] font-bold text-blue">{c.certificateNumber || "—"}</span>,
    },
    { key: "holder", header: "Người nhận", render: (c) => <span className="font-semibold text-ink">{c.holderName}</span> },
    { key: "project", header: "Đồ án", render: (c) => <span className="text-[13px] text-ink-soft">{c.projectName ?? "—"}</span> },
    { key: "status", header: "Trạng thái", render: (c) => <StatusBadge status={c.status} /> },
    { key: "issuedAt", header: "Cấp lúc", render: (c) => <span className="text-[13px] text-ink-soft">{fmtDateTime(c.issuedAt)}</span> },
    {
      key: "actions",
      header: "Hành động",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-blue/40 font-bold text-blue hover:bg-blue-mist"
            disabled={download.isPending}
            onClick={() => download.mutate(c)}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </Button>
          {c.status === "issued" ? (
            <Button
              variant="outline"
              size="sm"
              className="border-rose-300 font-bold text-rose-600 hover:bg-rose-50"
              onClick={() => {
                setRevokeReason("");
                setRevoking(c);
              }}
            >
              Thu hồi
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionCard title="Chứng nhận đã cấp">
        <div className="mb-4">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[220px]`} aria-label="Lọc trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="issued">Đã cấp</SelectItem>
              <SelectItem value="revoked">Đã thu hồi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <LoadingState label="Đang tải chứng nhận…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(c) => c.id} emptyTitle="Chưa có chứng nhận nào" emptyDescription="Chuyển sang tab “Cấp chứng nhận” để cấp cái đầu tiên." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(c) => c.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <Dialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Thu hồi chứng nhận</DialogTitle>
            <DialogDescription>
              Chứng nhận số <span className="font-mono text-ink">{revoking?.certificateNumber}</span> của{" "}
              {revoking?.holderName} sẽ bị đánh dấu không còn hiệu lực.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="revoke-reason">Lý do thu hồi</Label>
            <Textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="min-h-[80px] rounded-xl border-2 border-ink/20 bg-raised px-4 py-2 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
              placeholder="vd: Phát hiện vi phạm quy định đồ án…"
            />
          </div>
          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 border-2 border-rose-300 font-bold text-rose-600 hover:bg-rose-50"
                  disabled={revokeReason.trim().length < 3}
                >
                  Tiếp tục thu hồi…
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận thu hồi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này sẽ ghi vĩnh viễn vào hồ sơ. Lý do: “{revokeReason.trim()}”.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-xl">Để sau</AlertDialogCancel>
                  <AlertDialogAction
                    className="h-11 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
                    disabled={revoke.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      if (revoking) revoke.mutate(revoking);
                    }}
                  >
                    {revoke.isPending ? "Đang xử lý…" : "Xác nhận thu hồi"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => setRevoking(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───────────────────────── Cấp chứng nhận ───────────────────────── */

function IssueCertificatePanel() {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [roleCode, setRoleCode] = useState("");

  const { data: users } = useQuery({
    queryKey: ["admin-users", "certificates"],
    queryFn: ({ signal }) => fetchUsers({}, signal),
  });

  const { data: projects } = useQuery({
    queryKey: ["admin-projects", "certificates"],
    queryFn: ({ signal }) => fetchProjects({}, signal),
  });

  const issue = useMutation({
    mutationFn: () =>
      issueCertificate({
        userId,
        projectId,
        roleCode: roleCode.trim() || undefined,
      }),
    onSuccess: (cert) => {
      toast({
        title: "Đã cấp chứng nhận ✦",
        description: `Số hiệu: ${cert.certificateNumber || "—"}`,
      });
      setUserId("");
      setProjectId("");
      setRoleCode("");
    },
    onError: (e) => toast({ title: "Cấp chứng nhận thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <SectionCard title="Cấp chứng nhận mới" description="Chọn người nhận và đồ án hoàn thành để cấp chứng nhận.">
      <div className="grid max-w-2xl gap-4">
        <div className="grid gap-1.5">
          <Label>Người nhận</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className={triggerCls} aria-label="Chọn người nhận">
              <SelectValue placeholder="Chọn người dùng…" />
            </SelectTrigger>
            <SelectContent>
              {(users?.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.displayName} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Đồ án</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className={triggerCls} aria-label="Chọn đồ án">
              <SelectValue placeholder="Chọn đồ án…" />
            </SelectTrigger>
            <SelectContent>
              {(projects?.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cert-role">Vai trò trong đồ án (tuỳ chọn)</Label>
          <Input id="cert-role" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className={inputCls} placeholder="vd: frontend-developer" />
        </div>
        <div>
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={!userId || !projectId || issue.isPending}
            onClick={() => issue.mutate()}
          >
            <Award className="h-4 w-4" aria-hidden="true" />
            {issue.isPending ? "Đang cấp…" : "Cấp chứng nhận"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

/* ───────────────────────── Tra cứu công khai ───────────────────────── */

function VerifyPanel() {
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["verify-certificate", query],
    queryFn: ({ signal }) => verifyCertificate(query, signal),
    enabled: query.length > 0,
  });

  const result: VerifyResult | null = data ?? null;

  return (
    <SectionCard title="Tra cứu công khai" description="Nhập mã/số hiệu chứng nhận để kiểm tra tính hợp lệ — giống hệt trang tra cứu công khai.">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(code.trim());
        }}
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={inputCls}
          placeholder="Nhập số hiệu chứng nhận…"
          aria-label="Mã chứng nhận"
        />
        <Button
          type="submit"
          className="h-11 shrink-0 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
          disabled={code.trim().length === 0 || isLoading}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Đang tra cứu…" : "Tra cứu"}
        </Button>
      </form>

      {error ? (
        <div className="mt-4">
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        </div>
      ) : null}

      {query && !isLoading && !error && result ? (
        result.valid ? (
          <div className="mt-4 rounded-2xl border-2 border-emerald-400/50 bg-emerald-50/70 p-5">
            <p className="flex items-center gap-2 text-base font-extrabold text-emerald-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Chứng nhận hợp lệ
            </p>
            <div className="mt-3 space-y-1.5">
              <KeyVal label="Người nhận">{result.holderName ?? "—"}</KeyVal>
              <KeyVal label="Đồ án">{result.projectName ?? "—"}</KeyVal>
              <KeyVal label="Vai trò">{result.role ?? "—"}</KeyVal>
              <KeyVal label="Cấp lúc">{fmtDateTime(result.issuedAt ?? null)}</KeyVal>
              <KeyVal label="Trạng thái">
                <StatusBadge status={result.status ?? "issued"} />
              </KeyVal>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-5">
            <p className="flex items-center gap-2 text-base font-extrabold text-rose-600">
              <ShieldX className="h-5 w-5" aria-hidden="true" />
              Chứng nhận không hợp lệ
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-rose-600">
              {result.status === "revoked"
                ? `Chứng nhận đã bị thu hồi${result.revokedAt ? ` lúc ${fmtDateTime(result.revokedAt)}` : ""}.`
                : "Không tìm thấy chứng nhận hợp lệ với mã này."}
            </p>
          </div>
        )
      ) : null}

      {query && !isLoading && !error && !result ? (
        <div className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-5">
          <p className="flex items-center gap-2 text-base font-extrabold text-rose-600">
            <ShieldX className="h-5 w-5" aria-hidden="true" />
            Không tìm thấy chứng nhận
          </p>
        </div>
      ) : null}
    </SectionCard>
  );
}
