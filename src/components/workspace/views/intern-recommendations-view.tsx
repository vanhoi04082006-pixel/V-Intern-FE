"use client";

/**
 * Gợi ý AI — đề xuất cá nhân hoá dựa trên tiến độ thực tập, kèm làm mới.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Compass,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchMyRecommendations, refreshMyRecommendations } from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";

const SUGGESTION_ICONS = [Lightbulb, BookOpen, Target, Zap, Compass, Timer, Users, Sparkles];

export function InternRecommendationsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-recommendations"],
    queryFn: ({ signal }) => fetchMyRecommendations(signal),
    retry: false,
  });

  const refresh = useMutation({
    mutationFn: () => refreshMyRecommendations(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["intern-recommendations"] });
      toast({ title: "Đã làm mới gợi ý ✦", description: "Đọc thử xem AI nhắc gì nhé!" });
    },
    onError: (e) =>
      toast({ title: "Chưa làm mới được gợi ý", description: errorMessage(e), variant: "destructive" }),
  });

  const refreshButton = (
    <Button
      className="h-12 gap-2 rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
      disabled={refresh.isPending}
      onClick={() => refresh.mutate()}
    >
      {refresh.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      )}
      Làm mới gợi ý
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gợi ý AI"
        description="AI đọc tiến độ thực tập của bạn rồi đề xuất những việc đáng làm tiếp theo."
        actions={
          data ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              {refresh.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Làm mới
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Đang tải gợi ý…" />
      ) : error ? (
        <div className="space-y-4">
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          <div className="flex justify-center">{refreshButton}</div>
        </div>
      ) : !data ? (
        <EmptyState
          title="Chưa có gợi ý nào"
          description="AI chưa ghi nhận đủ dữ liệu hoặc bạn chưa từng tạo gợi ý. Bấm “Làm mới gợi ý” để AI phân tích tiến độ của bạn nhé!"
          action={refreshButton}
        />
      ) : (
        <>
          <SectionCard
            title="Gợi ý dành riêng cho bạn"
            description={`AI phân tích lúc ${fmtDateTime(data.generatedAt)}.`}
          >
            <div className="space-y-5">
              {data.focusAreas.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
                    Trọng tâm cần chú ý
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.focusAreas.map((area) => (
                      <Chip key={area} tone="blue">
                        {area}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}

              {data.suggestions.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
                    Việc nên làm tiếp theo
                  </p>
                  <ol className="space-y-3">
                    {data.suggestions.map((suggestion, i) => {
                      const Icon = SUGGESTION_ICONS[i % SUGGESTION_ICONS.length];
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-3 rounded-2xl border-2 border-ink/10 bg-paper p-4"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-blue/30 bg-blue-mist font-extrabold text-blue">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <Icon className="mb-1 h-4 w-4 text-blue" aria-hidden="true" />
                            <p className="text-sm font-medium leading-relaxed text-ink">{suggestion}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}

              {data.encouragement ? (
                <blockquote className="rounded-2xl border-2 border-dashed border-blue/40 bg-blue-mist/50 p-4 text-center font-hand text-[17px] leading-relaxed text-ink">
                  “{data.encouragement}”
                </blockquote>
              ) : null}
            </div>
          </SectionCard>

          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            gợi ý chỉ là la bàn — đôi khi chính mình mới biết điều gì phù hợp nhất ✦
          </p>
        </>
      )}
    </div>
  );
}
