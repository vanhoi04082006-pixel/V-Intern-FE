"use client";

/**
 * Hàng đợi email — theo dõi các email hệ thống đã/đang gửi và gửi lại
 * khi thất bại.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCommunications, resendCommunication, type CommunicationItem } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
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

export function AdminCommunicationsView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [resending, setResending] = useState<CommunicationItem | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-communications", page],
    queryFn: ({ signal }) => fetchCommunications(page, signal),
  });

  const resend = useMutation({
    mutationFn: (id: string) => resendCommunication(id),
    onSuccess: () => {
      toast({ title: "Đã đưa email vào hàng đợi gửi lại ✦" });
      void queryClient.invalidateQueries({ queryKey: ["admin-communications"] });
      setResending(null);
    },
    onError: (e) => toast({ title: "Gửi lại thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<CommunicationItem>[] = [
    {
      key: "recipient",
      header: "Người nhận",
      render: (c) => (
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Mail className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
          {c.recipient ?? "—"}
        </span>
      ),
    },
    { key: "subject", header: "Chủ đề", render: (c) => <span className="font-medium">{c.subject ?? "—"}</span> },
    { key: "status", header: "Trạng thái", render: (c) => <StatusBadge status={c.status} /> },
    { key: "createdAt", header: "Tạo lúc", render: (c) => <span className="text-[13px] text-ink-soft">{fmtDateTime(c.createdAt)}</span> },
    {
      key: "actions",
      header: "Hành động",
      className: "text-right",
      render: (c) => (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-blue/40 font-bold text-blue hover:bg-blue-mist"
          disabled={resend.isPending}
          onClick={() => setResending(c)}
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Gửi lại
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hàng đợi email"
        description="Các email hệ thống (mời truy cập, kết quả tuyển, thông báo…) và trạng thái gửi."
      />

      <SectionCard title="Danh sách email" description="Email gửi thất bại hoặc cần nhắc lại có thể gửi ngay tại đây.">
        {isLoading ? (
          <LoadingState label="Đang tải hàng đợi…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable
            columns={columns}
            rows={[]}
            rowKey={(c) => c.id}
            emptyTitle="Hàng đợi trống"
            emptyDescription="Chưa có email nào trong hàng đợi của hệ thống."
          />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(c) => c.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <AlertDialog open={!!resending} onOpenChange={(open) => !open && setResending(null)}>
        <AlertDialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <AlertDialogHeader>
            <AlertDialogTitle>Gửi lại email này?</AlertDialogTitle>
            <AlertDialogDescription>
              Email “{resending?.subject ?? "(không chủ đề)"}” gửi tới <span className="font-semibold">{resending?.recipient ?? "—"}</span> sẽ
              được đưa vào hàng đợi gửi lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl">Để sau</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-royal font-bold text-white hover:bg-blue-deep"
              disabled={resend.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (resending) resend.mutate(resending.id);
              }}
            >
              {resend.isPending ? "Đang gửi…" : "Gửi lại"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
