"use client";

/**
 * Lập kế hoạch AI — sinh bản nháp sprint kế tiếp từ dữ liệu đồ án,
 * xem trước rồi duyệt để tạo sprint thật.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProjects, fetchSessions } from "@/lib/api/academic";
import { confirmSprintPlan, draftSprintPlan, type SprintPlanDraft } from "@/lib/api/insight";
import { errorMessage } from "@/lib/api/transport";
import {
  Chip,
  EmptyState,
  ListTable,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

export function AiPlanView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sprintCount, setSprintCount] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [draft, setDraft] = useState<SprintPlanDraft | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["projects", "ai-plan"],
    queryFn: ({ signal }) => fetchProjects({ page: 1 }, signal),
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", "ai-plan"],
    queryFn: ({ signal }) => fetchSessions({ page: 1 }, signal),
  });

  const generate = useMutation({
    mutationFn: () =>
      draftSprintPlan({
        projectId,
        sessionId,
        sprintCount: Math.min(8, Math.max(1, Number(sprintCount) || 3)),
        startDate: startDate || undefined,
      }),
    onSuccess: (result) => {
      setDraft(result);
      toast({ title: "Đã có bản nháp kế hoạch ✦", description: "Xem xét kỹ trước khi duyệt nhé." });
    },
    onError: (e) => toast({ title: "AI chưa dựng được kế hoạch", description: errorMessage(e), variant: "destructive" }),
  });

  const confirm = useMutation({
    mutationFn: () =>
      confirmSprintPlan({
        projectId,
        sessionId,
        draft,
        requestId: draft!.requestId,
        planId: draft!.planId || undefined,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["sprints"] });
      setDraft(null);
      toast({ title: "Đã tạo sprint từ kế hoạch AI ✦", description: `${result.created} sprint mới sẵn sàng.` });
    },
    onError: (e) => toast({ title: "Chưa duyệt được kế hoạch", description: errorMessage(e), variant: "destructive" }),
  });

  const totalTasks = draft?.sprints.reduce((sum, s) => sum + s.tasks.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lập kế hoạch AI"
        description="Nhờ AI đọc dữ liệu đồ án để dựng bản nháp các sprint kế tiếp — bạn duyệt rồi hệ thống mới tạo thật."
      />

      <SectionCard title="Thông tin đầu vào" description="Chọn đồ án, phiên thực tập và số sprint muốn lập.">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label>Đồ án</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className={`${INPUT_CLS} w-full`}>
                <SelectValue placeholder="Chọn đồ án" />
              </SelectTrigger>
              <SelectContent>
                {(projects?.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Phiên thực tập</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className={`${INPUT_CLS} w-full`}>
                <SelectValue placeholder="Chọn phiên" />
              </SelectTrigger>
              <SelectContent>
                {(sessions?.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="plan-count">Số sprint (1–8)</Label>
            <Input
              id="plan-count"
              type="number"
              min={1}
              max={8}
              value={sprintCount}
              onChange={(e) => setSprintCount(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="plan-start">Ngày bắt đầu</Label>
            <Input id="plan-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={generate.isPending || !projectId || !sessionId}
            onClick={() => generate.mutate()}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            {generate.isPending ? "AI đang suy nghĩ…" : "Tạo bản nháp AI"}
          </Button>
          <p className="font-hand text-[15px] text-ink-faint">
            AI sẽ dựa vào backlog, tốc độ làm việc của sinh viên và lịch phiên để đề xuất.
          </p>
        </div>
      </SectionCard>

      {generate.isPending ? <LoadingState label="AI đang đọc dữ liệu đồ án…" /> : null}

      {draft ? (
        <>
          {draft.warnings.length > 0 ? (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4">
              <p className="text-sm font-extrabold text-amber-700">Lưu ý trước khi duyệt</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-amber-700">
                {draft.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <SectionCard
            title="Bản nháp kế hoạch"
            description={`${draft.sprints.length} sprint · ${totalTasks} nhiệm vụ được đề xuất.`}
            actions={
              <Button
                size="sm"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate()}
                className="gap-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {confirm.isPending ? "Đang tạo…" : "Duyệt & tạo sprint"}
              </Button>
            }
          >
            {draft.sprints.length === 0 ? (
              <EmptyState title="Bản nháp trống" description="AI không đề xuất sprint nào — thử đổi số sprint hoặc ngày bắt đầu." />
            ) : (
              <div className="space-y-4">
                {draft.sprints.map((s, idx) => (
                  <article
                    key={idx}
                    className="rounded-2xl border-2 border-ink/12 bg-paper p-4 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
                        <Sparkles className="h-4 w-4 text-blue" aria-hidden="true" />
                        {idx + 1}. {s.name}
                      </p>
                      <Chip tone="blue">{s.tasks.length} nhiệm vụ</Chip>
                    </div>
                    {s.goal ? <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{s.goal}</p> : null}
                    <div className="mt-3">
                      <ListTable
                        rows={s.tasks}
                        rowKey={(t) => `${idx}-${t.title}-${t.storyPoints}-${t.priority}`}
                        emptyTitle="Sprint chưa có nhiệm vụ"
                        columns={[
                          { key: "title", header: "Nhiệm vụ", render: (t) => <span className="font-bold">{t.title}</span> },
                          { key: "sp", header: "⚡", render: (t) => `${t.storyPoints}` },
                          {
                            key: "priority",
                            header: "Ưu tiên",
                            render: (t) => <Chip>{PRIORITY_LABELS[t.priority] ?? t.priority}</Chip>,
                          },
                        ]}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
