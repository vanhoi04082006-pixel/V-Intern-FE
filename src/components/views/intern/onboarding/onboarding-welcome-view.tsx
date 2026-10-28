"use client";

import * as React from "react";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  Clock3,
  Hourglass,
  PlayCircle,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/client/router";
import {
  recruitmentApi,
  type InterviewSummary,
  type RecruitmentMe,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import {
  recruitmentStatusLabels,
  formatDateTime,
} from "@/lib/client/labels";
import {
  Empty,
  KeyValue,
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
  ViewFrame,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { InlineSpinner, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { OnboardingStepper, stepIndexOf } from "./stepper";

const interviewStatusCopy: Record<string, { label: string; tone: "teal" | "amber" | "zinc" | "emerald" | "rose" }> = {
  in_progress: { label: "Đang diễn ra", tone: "teal" },
  evaluating: { label: "Đang chấm", tone: "amber" },
  completed: { label: "Hoàn tất", tone: "emerald" },
  evaluation_failed: { label: "Hết hạn / lỗi chấm", tone: "rose" },
};

function InterviewStatusBadge({ status }: { status: string }) {
  const meta = interviewStatusCopy[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

function DecisionBadge({ decision }: { decision: "passed" | "failed" | null }) {
  if (!decision) return <span className="text-xs text-faint">—</span>;
  return decision === "passed" ? (
    <ToneBadge tone="emerald">Đạt</ToneBadge>
  ) : (
    <ToneBadge tone="rose">Chưa đạt</ToneBadge>
  );
}

function HistoryRow({ item }: { item: InterviewSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-panel-2 font-mono text-xs font-bold text-dim">
        #{item.attemptNumber}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadge role={item.roleCode} />
          <InterviewStatusBadge status={item.status} />
          <DecisionBadge decision={item.decision} />
        </div>
        <p className="mt-1 text-[11px] text-faint">
          Bắt đầu {formatDateTime(item.startedAt)}
          {item.submittedAt ? ` · Nộp bài ${formatDateTime(item.submittedAt)}` : ""}
        </p>
      </div>
      <div className="text-right">
        {item.overallScore !== null ? (
          <span className="font-mono text-sm font-bold text-ink">{item.overallScore}/100</span>
        ) : (
          <span className="text-xs text-faint">Chưa có điểm</span>
        )}
      </div>
    </div>
  );
}

/** Thân trang onboarding theo từng status — CTA + mô tả trạng thái. */
function StatusBody({ profile }: { profile: RecruitmentMe }) {
  const status = profile.status;

  if (status === "evaluation_pending") {
    return (
      <Panel className="relative overflow-hidden p-6">
        <div className="dot-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber/30 bg-amber/10 text-amber">
            <Hourglass className="size-5 icon animate-pulse-soft" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink">AI đang chấm bài phỏng vấn của bạn</h3>
            <p className="mt-1 text-xs leading-relaxed text-dim">
              Quá trình chấm diễn ra tự động và chỉ mất vài giây. Trang sẽ tự chuyển đến kết quả
              ngay khi có — bạn không cần làm gì thêm.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs text-dim">
            <InlineSpinner /> Đang chờ kết quả…
          </span>
        </div>
      </Panel>
    );
  }

  if (status === "passed") {
    return (
      <Panel className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <ToneBadge tone="brand">
              Đã trúng tuyển
              {profile.result ? ` · ${formatDateTime(profile.result.evaluatedAt)}` : ""}
            </ToneBadge>
            {profile.result ? (
              <ToneBadge tone="emerald">
                Tổng điểm {profile.result.overallScore}/100
              </ToneBadge>
            ) : null}
          </div>
          <h3 className="mt-3 text-base font-bold tracking-tight text-ink">
            Hồ sơ của bạn đang chờ giảng viên phân vào dự án
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-dim">
            Khi có phiên thực tập phù hợp với vai trò của bạn, giảng viên sẽ chọn bạn vào dự án và
            toàn bộ không gian làm việc sẽ tự mở khoá. Trong lúc chờ, bạn có thể xem lại kết quả
            phỏng vấn để chuẩn bị tinh thần.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
              onClick={() => navigate("/intern")}
            >
              <ArrowRight className="size-3.5 icon" /> Về tổng quan
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              onClick={() => navigate("/intern/onboarding/result")}
            >
              Xem kết quả chi tiết
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  // not_started | role_selected | interview_in_progress | failed
  const cta =
    status === "role_selected"
      ? { label: "Bắt đầu phỏng vấn AI", icon: PlayCircle, to: "/intern/onboarding/interview" }
      : status === "interview_in_progress"
        ? { label: "Tiếp tục buổi phỏng vấn", icon: PlayCircle, to: "/intern/onboarding/interview" }
        : status === "failed"
          ? { label: "Chọn vai trò để thi lại", icon: Target, to: "/intern/onboarding/role" }
          : { label: "Chọn vai trò", icon: Target, to: "/intern/onboarding/role" };

  const heading =
    status === "role_selected"
      ? "Bạn đã sẵn sàng — bắt đầu buổi phỏng vấn AI"
      : status === "interview_in_progress"
        ? "Buổi phỏng vấn vẫn đang mở — tiếp tục ngay"
        : status === "failed"
          ? "Không sao — lần sau sẽ tốt hơn"
          : "Bắt đầu hành trình thực tập tại V-Intern";

  const desc =
    status === "role_selected"
      ? "Buổi phỏng vấn gồm khoảng 7 câu hỏi về giới thiệu, kỹ thuật, tiếng Anh và giao tiếp, diễn ra như một cuộc trò chuyện. Đồng hồ đếm ngược 45 phút bắt đầu chạy ngay khi bạn vào."
      : status === "interview_in_progress"
        ? "Câu trả lời trước đó đã được lưu. Vào lại phòng phỏng vấn để tiếp tục từ câu bạn đang dở — đừng để đồng hồ hết giờ nhé."
        : status === "failed"
          ? `Bạn còn ${profile.attemptsRemaining} lần phỏng vấn nữa. Xem nhận xét ở trang kết quả để ôn đúng trọng tâm, rồi chọn lại vai trò và thử sức lần này.`
          : "Chọn vai trò bạn muốn ứng tuyển, rồi hoàn thành buổi phỏng vấn AI đầu vào. Vượt qua vòng này, bạn sẽ được xếp vào dự án thực tế cùng giảng viên hướng dẫn.";

  const CtaIcon = cta.icon;
  return (
    <Panel className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-transparent to-transparent" />
      <div className="relative">
        <h3 className="text-base font-bold tracking-tight text-ink">{heading}</h3>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-dim">{desc}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright active:scale-[0.98]"
            onClick={() => navigate(cta.to)}
          >
            <CtaIcon className="size-3.5 icon" /> {cta.label}
          </Button>
          {status === "failed" || (profile.result && status !== "role_selected") ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              onClick={() => navigate("/intern/onboarding/result")}
            >
              Xem kết quả gần nhất
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function OnboardingWelcomeView() {
  const profileRes = useResource(() => recruitmentApi.me());
  const historyRes = useResource(() => recruitmentApi.interviews({ pageSize: 5 }));
  const profile = profileRes.data;

  // Chờ chấm: poll nhẹ mỗi 3s đến khi có kết quả rồi chuyển trang.
  React.useEffect(() => {
    if (profile?.status !== "evaluation_pending") return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const next = await recruitmentApi.me();
        if (stopped) return;
        if (next.status !== "evaluation_pending") {
          clearInterval(timer);
          toast.success("Đã chấm xong bài phỏng vấn — xem kết quả ngay!");
          navigate("/intern/onboarding/result");
        }
      } catch {
        /* giữ nguyên trạng thái chờ, thử lại ở chu kỳ sau */
      }
    }, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [profile?.status]);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Vòng tuyển dụng"
        title="Hành trình trở thành thực tập sinh V-Intern"
        description="Chọn vai trò ứng tuyển, hoàn thành buổi phỏng vấn AI đầu vào và chờ được phân vào dự án thực tế. Toàn bộ hành trình chỉ diễn ra một lần mỗi lần thi."
      />

      {profileRes.loading ? (
        <LoadingBlock variant="detail" rows={4} />
      ) : profileRes.error ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-rose/10 text-rose">
            <Bot className="size-5 icon" />
          </span>
          <p className="text-sm font-semibold text-ink">Không tải được hồ sơ tuyển dụng</p>
          <p className="text-xs text-dim">
            {profileRes.error instanceof Error ? profileRes.error.message : "Vui lòng thử lại."}
          </p>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={profileRes.reload}>
            Thử lại
          </Button>
        </Panel>
      ) : profile ? (
        <div className="space-y-5">
          <OnboardingStepper current={stepIndexOf(profile.status)} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <StatusBody profile={profile} />

              <Panel>
                <PanelHeader
                  icon={<ClipboardList className="size-4 icon" />}
                  title="Lịch sử phỏng vấn"
                  description="Mọi buổi phỏng vấn AI đầu vào bạn đã thực hiện."
                  actions={
                    profile.attemptsRemaining > 0 ? (
                      <ToneBadge tone="teal">
                        Còn {profile.attemptsRemaining} lần thi
                      </ToneBadge>
                    ) : (
                      <ToneBadge tone="rose">Hết lượt thi</ToneBadge>
                    )
                  }
                />
                {historyRes.loading ? (
                  <div className="px-5 py-6">
                    <LoadingBlock rows={2} />
                  </div>
                ) : historyRes.error ? (
                  <div className="px-5 py-6 text-center text-xs text-dim">
                    Không tải được lịch sử.{" "}
                    <button
                      type="button"
                      className="font-semibold text-brand-bright underline-offset-2 hover:underline"
                      onClick={historyRes.reload}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : historyRes.data && historyRes.data.data.length > 0 ? (
                  <div className="divide-y divide-line">
                    {historyRes.data.data.map((item) => (
                      <HistoryRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={<Bot className="size-5 icon" />}
                    title="Chưa có buổi phỏng vấn nào"
                    description="Chọn vai trò ứng tuyển rồi hoàn thành buổi phỏng vấn AI đầu vào — lịch sử sẽ xuất hiện tại đây."
                    action={
                      <Button
                        size="sm"
                        className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
                        onClick={() => navigate("/intern/onboarding/role")}
                      >
                        Chọn vai trò ngay
                      </Button>
                    }
                  />
                )}
              </Panel>
            </div>

            <Panel className="h-fit p-5">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
                Hồ sơ của bạn
              </h3>
              <dl className="mt-4 space-y-4">
                <KeyValue label="Trạng thái">
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        profile.status === "passed"
                          ? "inline-block size-2 rounded-full bg-brand-bright"
                          : profile.status === "failed"
                            ? "inline-block size-2 rounded-full bg-rose"
                            : profile.status === "evaluation_pending"
                              ? "inline-block size-2 animate-pulse-soft rounded-full bg-amber"
                              : "inline-block size-2 rounded-full bg-teal"
                      }
                    />
                    {recruitmentStatusLabels[profile.status] ?? profile.status}
                  </span>
                </KeyValue>
                <KeyValue label="Vai trò ứng tuyển">
                  {profile.selectedRole ? (
                    <RoleBadge role={profile.selectedRole} />
                  ) : (
                    <span className="text-xs text-faint">Chưa chọn</span>
                  )}
                </KeyValue>
                <KeyValue label="Số lần đã phỏng vấn">
                  <span className="font-mono">{profile.attemptNumber}</span>
                </KeyValue>
                <KeyValue label="Số lần còn lại">
                  <span className="font-mono">{profile.attemptsRemaining}</span>
                </KeyValue>
                {profile.nextEligibleAt ? (
                  <KeyValue label="Đủ điều kiện thi lại từ">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5 icon text-faint" />
                      {formatDateTime(profile.nextEligibleAt)}
                    </span>
                  </KeyValue>
                ) : null}
              </dl>
              <p className="mt-5 rounded-xl border border-line bg-deep/40 p-3 text-[11px] leading-relaxed text-faint">
                Mỗi tài khoản có tối đa 3 lần phỏng vấn. Kết quả tốt nhất vẫn được giữ làm hồ sơ
                ứng tuyển cho giảng viên xem xét.
              </p>
            </Panel>
          </div>
        </div>
      ) : null}
    </ViewFrame>
  );
}
