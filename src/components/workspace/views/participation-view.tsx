"use client";

/**
 * Chuyên cần — chọn phiên thực tập, xem thống kê sự cố
 * (đi trễ / vắng / lỡ nộp bài) và tính lại chuyên cần.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Clock, RefreshCw, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSessionParticipation,
  fetchSessions,
  refreshSessionParticipation,
} from "@/lib/api/academic";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const KIND_LABELS: Record<string, string> = {
  late: "Đi trễ",
  absent: "Vắng",
  missed_submission: "Lỡ nộp bài",
};

const SEVERITY_TONES: Record<string, string> = {
  low: "border-blue/40 bg-blue-mist text-blue",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  high: "border-rose-300 bg-rose-50 text-rose-600",
};

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export function ParticipationView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState("");

  const { data: sessions } = useQuery({
    queryKey: ["sessions", "participation-picker"],
    queryFn: ({ signal }) => fetchSessions({ page: 1 }, signal),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["session-participation", sessionId],
    queryFn: ({ signal }) => fetchSessionParticipation(sessionId, signal),
    enabled: !!sessionId,
  });

  const refresh = useMutation({
    mutationFn: () => refreshSessionParticipation(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["session-participation", sessionId] });
      toast({ title: "Đã tính lại chuyên cần ✦", description: "Số liệu mới nhất đã được cập nhật." });
    },
    onError: (e) => toast({ title: "Chưa tính lại được", description: errorMessage(e), variant: "destructive" }),
  });

  const incidents = data?.incidents ?? [];
  const unresolved = incidents.filter((i) => !i.resolvedAt).length;
  const byKind = (kind: string) => incidents.filter((i) => i.kind === kind).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chuyên cần"
        description="Theo dõi sự cố đi trễ, vắng mặt và lỡ nộp bài của sinh viên trong từng phiên thực tập."
      />

      <SectionCard title="Chọn phiên thực tập" description="Số liệu chuyên cần được tính riêng cho từng phiên.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger className={`${INPUT_CLS} w-full sm:w-[340px]`}>
              <SelectValue placeholder="— Chọn phiên —" />
            </SelectTrigger>
            <SelectContent>
              {(sessions?.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sessionId ? (
            <Button
              variant="outline"
              size="sm"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate()}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
              {refresh.isPending ? "Đang tính…" : "Tính lại chuyên cần"}
            </Button>
          ) : null}
        </div>
      </SectionCard>

      {!sessionId ? (
        <EmptyState
          title="Chưa chọn phiên thực tập"
          description="Hãy chọn một phiên ở trên để xem tình hình chuyên cần của sinh viên."
        />
      ) : isLoading ? (
        <LoadingState label="Đang tải chuyên cần…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Tổng sự cố" value={incidents.length} hint="Toàn bộ trong phiên" icon={ShieldAlert} tone="ink" />
            <StatCard label="Chưa xử lý" value={unresolved} hint="Cần liên hệ nhắc nhở" icon={Clock} tone={unresolved > 0 ? "rose" : "green"} />
            <StatCard label="Đi trễ" value={byKind("late")} hint="Vào muộn buổi học" icon={Clock} tone="amber" />
            <StatCard label="Vắng / lỡ nộp" value={byKind("absent") + byKind("missed_submission")} hint="Vắng mặt và lỡ hạn nộp" icon={CalendarClock} tone="blue" />
          </div>

          <SectionCard title="Danh sách sự cố" description="Mỗi thẻ là một sự cố — đã xử lý sẽ hiện mốc thời gian giải quyết.">
            {incidents.length === 0 ? (
              <EmptyState
                title="Không có sự cố nào"
                description="Tuyệt vời — sinh viên trong phiên này đều chuyên cần."
              />
            ) : (
              <ul className="space-y-3">
                {incidents.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-2xl border-2 border-ink/12 bg-paper-raised p-4 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-ink">{kindLabel(i.kind)}</span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            SEVERITY_TONES[i.severity] ?? "border-ink/25 bg-ink/5 text-ink-soft"
                          }`}
                        >
                          {i.severity}
                        </span>
                      </div>
                      {i.resolvedAt ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          Đã xử lý
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                          Chưa xử lý
                        </span>
                      )}
                    </div>
                    {i.description ? (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{i.description}</p>
                    ) : null}
                    <p className="mt-1.5 font-hand text-[14px] text-ink-faint">
                      {i.resolvedAt
                        ? `Đã xử lý lúc ${fmtDateTime(i.resolvedAt)}`
                        : "Chưa xử lý"}
                      {i.createdAt ? ` · ghi nhận ${fmtDateTime(i.createdAt)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
