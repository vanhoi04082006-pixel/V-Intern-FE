"use client";

/**
 * Chia sẻ truy cập — xin phép xem phiên thực tập của giảng viên khác,
 * theo dõi trạng thái và thu hồi quyền đã được duyệt.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Share2, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { decideAccess, fetchMyAccessRequests, requestAccess } from "@/lib/api/academic";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function SharingView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ownerEmail, setOwnerEmail] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-access-requests"],
    queryFn: ({ signal }) => fetchMyAccessRequests(signal),
  });

  const request = useMutation({
    mutationFn: () => requestAccess({ ownerEmail: ownerEmail.trim(), reason: reason.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-access-requests"] });
      setOwnerEmail("");
      setReason("");
      toast({ title: "Đã gửi yêu cầu ✦", description: "Chờ chủ phiên phê duyệt nhé." });
    },
    onError: (e) => toast({ title: "Chưa gửi được yêu cầu", description: errorMessage(e), variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => decideAccess(id, "revoke"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-access-requests"] });
      toast({ title: "Đã thu hồi quyền truy cập" });
    },
    onError: (e) => toast({ title: "Chưa thu hồi được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chia sẻ truy cập"
        description="Xin quyền xem phiên thực tập của giảng viên khác để đồng hành chấm bài và theo dõi tiến độ."
      />

      <SectionCard title="Gửi yêu cầu truy cập" description="Nhập email giảng viên chủ phiên và lý do ngắn gọn.">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="share-owner">Email giảng viên chủ phiên</Label>
            <Input
              id="share-owner"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="VD: giaovien@truong.edu.vn"
              className={INPUT_CLS}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="share-reason">Lý do</Label>
            <Textarea
              id="share-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Cần xem tiến độ sinh viên để hỗ trợ chấm giữa kỳ…"
              className="min-h-[80px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
          </div>
          <div>
            <Button disabled={request.isPending || !ownerEmail.trim() || !reason.trim()} onClick={() => request.mutate()} className="gap-2">
              <Send className="h-4 w-4" aria-hidden="true" />
              {request.isPending ? "Đang gửi…" : "Gửi yêu cầu"}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Yêu cầu của tôi" description="Trạng thái các yêu cầu xin truy cập phiên thực tập.">
        {isLoading ? (
          <LoadingState label="Đang tải danh sách yêu cầu…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu nào"
            description="Những yêu cầu xin truy cập bạn đã gửi sẽ nằm tại đây."
          />
        ) : (
          <ul className="space-y-3">
            {data.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border-2 border-ink/12 bg-paper-raised p-4 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
                      <Share2 className="h-4 w-4 text-blue" aria-hidden="true" />
                      {r.ownerEmail}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{fmtDateTime(r.createdAt)}</p>
                    {r.reason ? (
                      <p className="mt-1.5 whitespace-pre-line rounded-xl border-2 border-dashed border-ink/12 bg-paper p-3 text-[13px] leading-relaxed text-ink-soft">
                        {r.reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={r.status} />
                    {r.status === "approved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(r.id)}
                        className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
                      >
                        <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Thu hồi
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
