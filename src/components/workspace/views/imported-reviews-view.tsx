"use client";

/**
 * Review PR đã nhập — danh sách review Pull Request do mentor nhập,
 * xem và hiệu chỉnh điểm / trạng thái / phản hồi.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, PencilLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchImportedReviews, updateImportedReview, type ImportedReview } from "@/lib/api/evaluation";
import { errorMessage } from "@/lib/api/transport";
import {
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
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

const STATUS_OPTIONS = [
  { value: "passed", label: "Đạt" },
  { value: "needs_review", label: "Cần xem lại" },
  { value: "failed", label: "Không đạt" },
];

function truncate(text: string | null, max = 80): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function ImportedReviewsView() {
  const [selected, setSelected] = useState<ImportedReview | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["imported-reviews"],
    queryFn: ({ signal }) => fetchImportedReviews(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review PR"
        description="Kết quả review Pull Request do mentor nhập từ ngoài — kiểm tra và hiệu chỉnh trước khi tính vào đánh giá."
      />

      <SectionCard>
        {isLoading ? (
          <LoadingState label="Đang tải danh sách review…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="Chưa có review nào"
            description="Review PR được nhập từ mentor sẽ xuất hiện tại đây."
          />
        ) : (
          <ListTable
            rows={data.data}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            emptyTitle="Chưa có review nào"
            columns={[
              { key: "intern", header: "Sinh viên", render: (r) => <span className="font-bold">{r.internName ?? "—"}</span> },
              {
                key: "repo",
                header: "Repository",
                render: (r) =>
                  r.repositoryUrl ? (
                    <a
                      href={r.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 font-bold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
                    >
                      {r.repositoryUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "score",
                header: "Điểm",
                render: (r) => (r.score != null ? <span className="font-bold text-blue">{r.score.toFixed(1)}</span> : "—"),
              },
              { key: "status", header: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
              { key: "feedback", header: "Phản hồi", render: (r) => <span className="text-ink-soft">{truncate(r.feedback)}</span> },
            ]}
          />
        )}
      </SectionCard>

      <EditReviewDialog review={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function EditReviewDialog({ review, onClose }: { review: ImportedReview | null; onClose: () => void }) {
  const open = !!review;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [score, setScore] = useState("");
  const [status, setStatus] = useState("passed");
  const [feedback, setFeedback] = useState("");

  // Đồng bộ form mỗi lần mở review khác.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (review && review.id !== loadedId) {
    setLoadedId(review.id);
    setScore(review.score != null ? String(review.score) : "");
    setStatus(STATUS_OPTIONS.some((s) => s.value === review.status) ? review.status : "needs_review");
    setFeedback(review.feedback ?? "");
  }

  const update = useMutation({
    mutationFn: () =>
      updateImportedReview(review!.id, {
        score: score.trim() === "" ? undefined : Number(score),
        status,
        feedback: feedback.trim() || undefined,
        version: review!.version,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["imported-reviews"] });
      toast({ title: "Đã cập nhật review ✦" });
      onClose();
    },
    onError: (e) => toast({ title: "Chưa cập nhật được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-5 w-5 text-blue" aria-hidden="true" />
            Hiệu chỉnh review
          </DialogTitle>
          <DialogDescription>
            {review ? `Sinh viên ${review.internName ?? "—"} · ${truncate(review.repositoryUrl, 60)}` : "…"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="review-score">Điểm (0–10)</Label>
              <Input
                id="review-score"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="VD: 7.5"
                className={INPUT_CLS}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="review-feedback">Phản hồi</Label>
            <Textarea
              id="review-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Nhận xét của mentor về Pull Request…"
              className="min-h-[100px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
          </div>
          <input type="hidden" value={review?.version ?? 1} readOnly />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={update.isPending} onClick={() => update.mutate()}>
            {update.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
