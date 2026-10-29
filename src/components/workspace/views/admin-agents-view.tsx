"use client";

/**
 * AI Agents — chạy agent tri thức: đặt câu hỏi (tuỳ chọn gắn vai trò nghề),
 * theo dõi tiến trình mỗi 2 giây, huỷ/tiếp tục, xem kết quả.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Play, RotateCcw, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  cancelKnowledgeRun,
  createKnowledgeRun,
  fetchAdminCareerRoles,
  fetchKnowledgeRun,
  resumeKnowledgeRun,
  type AgentRun,
} from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  SectionCard,
  StatusBadge,
  PageHeader,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const textareaCls =
  "min-h-[110px] rounded-xl border-2 border-ink/20 bg-raised px-4 py-2.5 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 30;

/** Run trong phiên này + số lần đã thăm dò. */
interface LocalRun extends AgentRun {
  polls: number;
}

function isPending(run: LocalRun): boolean {
  return run.status === "queued" || run.status === "running";
}

export function AdminAgentsView() {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [roleCode, setRoleCode] = useState("none");
  const [runs, setRuns] = useState<LocalRun[]>([]);

  const { data: roles } = useQuery({
    queryKey: ["admin-career-roles", "agent-options"],
    queryFn: ({ signal }) => fetchAdminCareerRoles({}, signal),
  });

  const start = useMutation({
    mutationFn: () => createKnowledgeRun(question.trim(), roleCode === "none" ? undefined : roleCode),
    onSuccess: (run) => {
      setRuns((prev) => [{ ...run, polls: 0 }, ...prev]);
      toast({ title: "Đã gửi câu hỏi cho agent ✦", description: "Đang theo dõi tiến trình…" });
      setQuestion("");
    },
    onError: (e) => toast({ title: "Chạy agent thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  /* Thăm dò tiến trình các run đang chạy mỗi 2 giây, tối đa ~30 lần. */
  useEffect(() => {
    const pending = runs.filter((r) => isPending(r) && r.polls < MAX_POLLS);
    if (pending.length === 0) return;
    const timer = setTimeout(() => {
      void Promise.all(pending.map((r) => fetchKnowledgeRun(r.id)))
        .then((results) => {
          setRuns((prev) =>
            prev.map((p) => {
              const fresh = results.find((x) => x.id === p.id);
              return fresh ? { ...fresh, polls: p.polls + 1 } : { ...p, polls: p.polls + 1 };
            }),
          );
        })
        .catch((e) => {
          toast({ title: "Không lấy được tiến trình agent", description: errorMessage(e), variant: "destructive" });
          setRuns((prev) => prev.map((p) => (pending.some((x) => x.id === p.id) ? { ...p, polls: p.polls + 1 } : p)));
        });
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [runs, toast]);

  const patchRun = (id: string, patch: Partial<LocalRun>) => {
    setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const cancel = useMutation({
    mutationFn: (id: string) => cancelKnowledgeRun(id),
    onSuccess: (_d, id) => {
      patchRun(id, { status: "cancelled" });
      toast({ title: "Đã huỷ agent" });
    },
    onError: (e) => toast({ title: "Huỷ agent thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const resume = useMutation({
    mutationFn: (id: string) => resumeKnowledgeRun(id),
    onSuccess: (_d, id) => {
      patchRun(id, { status: "queued", polls: 0 });
      toast({ title: "Đã yêu cầu chạy lại agent ✦" });
    },
    onError: (e) => toast({ title: "Chạy lại agent thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const latest = runs[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agents"
        description="Chạy agent tổng hợp tri thức — đặt câu hỏi, hệ thống tự thu thập và trả lời dựa trên kho tri thức."
      />

      <SectionCard title="Đặt câu hỏi cho agent" description="Câu hỏi càng rõ ngữ cảnh, kết quả càng chuẩn.">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="agent-question">Câu hỏi</Label>
            <Textarea
              id="agent-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={textareaCls}
              placeholder="vd: Tóm tắt quy trình review pull request cho thực tập sinh frontend…"
            />
          </div>
          <div className="grid gap-1.5 sm:max-w-md">
            <Label>Gắn vai trò nghề (tuỳ chọn)</Label>
            <Select value={roleCode} onValueChange={setRoleCode}>
              <SelectTrigger className={triggerCls} aria-label="Chọn vai trò nghề">
                <SelectValue placeholder="Không gắn vai trò…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không gắn vai trò</SelectItem>
                {(roles?.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {r.name} ({r.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
              disabled={question.trim().length < 5 || start.isPending}
              onClick={() => start.mutate()}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {start.isPending ? "Đang gửi…" : "Chạy agent"}
            </Button>
          </div>
        </div>
      </SectionCard>

      {latest ? (
        <SectionCard
          title="Kết quả mới nhất"
          description={`Câu hỏi: ${latest.question.length > 100 ? `${latest.question.slice(0, 100)}…` : latest.question}`}
          actions={<StatusBadge status={latest.status} />}
        >
          {isPending(latest) ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-blue/40 bg-blue-mist/40 px-4 py-5">
              <Bot className="h-5 w-5 animate-pulse text-blue" aria-hidden="true" />
              <p className="text-sm font-bold text-blue">
                Agent đang xử lý… đã thăm dò {latest.polls}/{MAX_POLLS} lần
              </p>
            </div>
          ) : latest.status === "completed" ? (
            <div className="whitespace-pre-wrap rounded-xl border-2 border-emerald-400/40 bg-emerald-50/40 p-4 text-sm leading-relaxed text-ink">
              {latest.result?.trim() || "Agent đã hoàn tất nhưng không trả về nội dung."}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50/60 p-4 text-sm text-rose-600">
              Run {latest.status} — bạn có thể thử chạy lại.
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Lịch sử chạy trong phiên này" description="Các agent đã chạy kể từ khi bạn mở trang này.">
        {runs.length === 0 ? (
          <EmptyState
            title="Chưa chạy agent nào"
            description="Đặt câu hỏi ở trên và bấm “Chạy agent” — tiến trình và kết quả sẽ hiện tại đây."
          />
        ) : (
          <ul className="space-y-3">
            {runs.map((run) => (
              <li key={run.id} className="rounded-2xl border-2 border-ink/10 bg-paper-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-ink">{run.question}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-faint">
                      {run.id} · tạo lúc {fmtDateTime(run.createdAt)} · {run.polls} lần thăm dò
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={run.status} />
                    {isPending(run) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-rose-300 font-bold text-rose-600 hover:bg-rose-50"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(run.id)}
                      >
                        <Square className="h-3.5 w-3.5" aria-hidden="true" />
                        Huỷ
                      </Button>
                    ) : run.status !== "completed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-blue/40 font-bold text-blue hover:bg-blue-mist"
                        disabled={resume.isPending}
                        onClick={() => resume.mutate(run.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Chạy lại
                      </Button>
                    ) : null}
                  </div>
                </div>
                {run.result ? (
                  <p className="mt-2.5 line-clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                    {run.result}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
