"use client";

/**
 * Đồ án của tôi — thông tin đồ án được phân công + gói học tập kèm theo.
 */

import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, FolderKanban, Layers } from "lucide-react";
import { fetchLearningPackage, fetchMyProject } from "@/lib/api/intern";
import { errorMessage, ApiError } from "@/lib/api/transport";
import {
  Chip,
  EmptyState,
  ErrorState,
  KeyVal,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Dễ",
  basic: "Cơ bản",
  medium: "Trung bình",
  intermediate: "Trung bình",
  hard: "Khó",
  advanced: "Nâng cao",
};

export function InternProjectView() {
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-project"],
    queryFn: ({ signal }) => fetchMyProject(signal),
  });

  const {
    data: learningPackage,
    isLoading: loadingPackage,
    error: packageError,
  } = useQuery({
    queryKey: ["learning-package", project?.projectId],
    queryFn: ({ signal }) => fetchLearningPackage(project!.projectId, signal),
    enabled: !!project?.projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đồ án của tôi" description="Thông tin đồ án và lộ trình học tập của bạn." />
        <LoadingState label="Đang tải đồ án…" />
      </div>
    );
  }

  if (error) {
    if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 403)) {
      return (
        <div className="space-y-6">
          <PageHeader title="Đồ án của tôi" description="Thông tin đồ án và lộ trình học tập của bạn." />
          <EmptyState
            title="Chưa có phân công đồ án"
            description="Bạn chưa được phân công vào đồ án nào. Hoàn thành phỏng vấn đầu vào rồi chờ mentor sắp xếp nhé!"
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <PageHeader title="Đồ án của tôi" description="Thông tin đồ án và lộ trình học tập của bạn." />
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đồ án của tôi" description="Thông tin đồ án và lộ trình học tập của bạn." />
        <EmptyState
          title="Chưa có phân công đồ án"
          description="Bạn chưa được phân công vào đồ án nào. Hoàn thành phỏng vấn đầu vào rồi chờ mentor sắp xếp nhé!"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đồ án của tôi"
        description="Đồ án bạn đang thực tập cùng công nghệ cần nắm và gói học tập kèm theo."
      />

      <SectionCard title={project.name} description={`Mã đồ án: ${project.code}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            {project.domainCategory ? <Chip tone="blue">{project.domainCategory}</Chip> : null}
            {project.difficulty ? (
              <Chip tone="green">{DIFFICULTY_LABELS[project.difficulty] ?? project.difficulty}</Chip>
            ) : null}
          </div>

          {project.description ? (
            <p className="text-sm leading-relaxed text-ink-soft">{project.description}</p>
          ) : null}

          <KeyVal label="Công nghệ">
            <span className="flex flex-wrap gap-1.5">
              {project.technologies.length === 0 ? (
                <span className="text-ink-faint">Chưa ghi nhận</span>
              ) : (
                project.technologies.map((tech) => (
                  <Chip key={tech} tone="blue">
                    {tech}
                  </Chip>
                ))
              )}
            </span>
          </KeyVal>

          <p className="font-hand text-[15px] text-ink-faint">
            đọc kỹ mô tả, tự lên lịch học từng phần nhé — chia nhỏ ra sẽ dễ hơn nhiều ✦
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Gói học tập"
        description="Lộ trình gợi ý để bạn chinh phục đồ án này — tick dần từng mục nhé."
        actions={
          learningPackage ? (
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink-soft">
              <Layers className="h-3.5 w-3.5 text-blue" aria-hidden="true" />
              {learningPackage.sections.length} phần
            </span>
          ) : undefined
        }
      >
        {loadingPackage ? (
          <LoadingState label="Đang tải gói học tập…" />
        ) : packageError ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-paper px-6 py-8 text-center">
            <BookOpen className="mx-auto h-7 w-7 text-ink-faint" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-ink">Chưa tải được gói học tập</p>
            <p className="mt-1 text-[13px] text-ink-soft">{errorMessage(packageError)}</p>
          </div>
        ) : !learningPackage || learningPackage.sections.length === 0 ? (
          <EmptyState
            title="Chưa có gói học tập"
            description="Gói học tập cho đồ án này sẽ được bổ sung sớm. Trong lúc chờ, bạn có thể tự tìm hiểu các công nghệ ở trên nhé!"
          />
        ) : (
          <div className="space-y-5">
            {learningPackage.sections.map((section, i) => (
              <div key={i} className="rounded-2xl border-2 border-ink/10 bg-paper p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
                  <FolderKanban className="h-4 w-4 shrink-0 text-blue" aria-hidden="true" />
                  {section.heading}
                </p>
                {section.items.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
