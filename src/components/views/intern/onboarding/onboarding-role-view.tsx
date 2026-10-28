"use client";

import * as React from "react";
import {
  ArrowRight,
  Bug,
  Check,
  ClipboardList,
  Code2,
  Layers,
  Server,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/client/router";
import {
  recruitmentApi,
  type RecruitmentRole,
} from "@/lib/client/api";
import { useAction } from "@/lib/client/use-resource";
import { roleLabels } from "@/lib/client/labels";
import {
  PageHeader,
  Panel,
  ViewFrame,
} from "@/components/shared/primitives";
import { LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "./stepper";
import { cn } from "@/lib/utils";

interface RoleMeta {
  code: RecruitmentRole;
  icon: LucideIcon;
  toneClasses: string;
  ringClasses: string;
  chipClasses: string;
  description: string;
  skills: string[];
}

const ROLE_META: RoleMeta[] = [
  {
    code: "frontend",
    icon: Code2,
    toneClasses: "border-teal/25 bg-teal/10 text-teal",
    ringClasses: "group-hover:border-teal/40",
    chipClasses: "border-teal/20 bg-teal/[0.08] text-teal",
    description: "Xây dựng giao diện mượt, đúng thiết kế và dễ dùng cho người dùng cuối.",
    skills: ["React", "TypeScript", "Tailwind CSS"],
  },
  {
    code: "backend",
    icon: Server,
    toneClasses: "border-amber/25 bg-amber/10 text-amber",
    ringClasses: "group-hover:border-amber/40",
    chipClasses: "border-amber/20 bg-amber/[0.08] text-amber",
    description: "Thiết kế API, mô hình dữ liệu và logic nghiệp vụ bền vững phía máy chủ.",
    skills: ["Node.js", "REST API", "PostgreSQL"],
  },
  {
    code: "fullstack",
    icon: Layers,
    toneClasses: "border-brand/30 bg-brand/10 text-brand-bright",
    ringClasses: "group-hover:border-brand/45",
    chipClasses: "border-brand/20 bg-brand/[0.08] text-brand-bright",
    description: "Vừa dựng giao diện vừa xây API, sở hữu sản phẩm từ đầu đến cuối.",
    skills: ["Next.js", "API Design", "Database"],
  },
  {
    code: "qa",
    icon: Bug,
    toneClasses: "border-violet/25 bg-violet/10 text-violet",
    ringClasses: "group-hover:border-violet/40",
    chipClasses: "border-violet/20 bg-violet/[0.08] text-violet",
    description: "Bảo vệ chất lượng sản phẩm bằng kế hoạch kiểm thử và tự động hóa.",
    skills: ["Test Plan", "Playwright", "Regression"],
  },
  {
    code: "business_analyst",
    icon: ClipboardList,
    toneClasses: "border-orange/25 bg-orange/10 text-orange",
    ringClasses: "group-hover:border-orange/40",
    chipClasses: "border-orange/20 bg-orange/[0.08] text-orange",
    description: "Làm cầu nối nghiệp vụ – kỹ thuật, chốt yêu cầu rõ ràng cho cả đội.",
    skills: ["User Story", "Yêu cầu", "Stakeholder"],
  },
];

function RoleCard({
  meta,
  selected,
  onSelect,
}: {
  meta: RoleMeta;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "card-surface group relative flex h-full flex-col p-5 text-left transition-all hover:bg-panel-2 active:scale-[0.98]",
        meta.ringClasses,
        selected
          ? "border-brand/70 bg-panel-2 shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_10px_36px_rgba(16,185,129,0.14)]"
          : "hover:border-line-strong"
      )}
    >
      {selected ? (
        <span className="absolute right-3.5 top-3.5 grid size-6 place-items-center rounded-full bg-brand text-on-brand">
          <Check className="size-3.5 icon" />
        </span>
      ) : null}
      <span className={cn("grid size-11 place-items-center rounded-xl border", meta.toneClasses)}>
        <Icon className="size-5 icon" />
      </span>
      <h3 className="mt-4 text-sm font-bold tracking-tight text-ink">
        {roleLabels[meta.code]}
      </h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-dim">{meta.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {meta.skills.map((s) => (
          <span
            key={s}
            className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.chipClasses)}
          >
            {s}
          </span>
        ))}
      </div>
    </button>
  );
}

export function OnboardingRoleView() {
  const [profileStatus, setProfileStatus] = React.useState<string | null>(null);
  const [preselected, setPreselected] = React.useState<RecruitmentRole | null>(null);
  const [selected, setSelected] = React.useState<RecruitmentRole | null>(null);
  const [loadError, setLoadError] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState(true);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    recruitmentApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setProfileStatus(me.status);
        if (me.selectedRole) {
          setPreselected(me.selectedRole as RecruitmentRole);
          setSelected(me.selectedRole as RecruitmentRole);
        }
        setLoading(false);
        // Đang có phiên phỏng vấn dở → thẳng vào phòng phỏng vấn
        if (me.currentInterviewSessionId) {
          toast.info("Bạn đang có buổi phỏng vấn chưa hoàn tất — tiếp tục nhé!");
          navigate("/intern/onboarding/interview");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const submit = useAction();

  function handleContinue() {
    if (!selected) return;
    submit.run(async () => {
      try {
        await recruitmentApi.selectRole(selected);
        toast.success(`Đã chọn vai trò ${roleLabels[selected]} — bắt đầu phỏng vấn thôi!`);
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 409) {
          // Đang có phiên phỏng vấn dở — backend chặn đổi vai trò, vào lại phòng chờ
          toast.info("Bạn đang có buổi phỏng vấn chưa hoàn tất — tiếp tục buổi cũ nhé!");
          navigate("/intern/onboarding/interview");
          return;
        }
        throw err;
      }
      navigate("/intern/onboarding/interview");
    });
  }

  if (loading) {
    return (
      <ViewFrame>
        <PageHeader
          eyebrow="Vòng tuyển dụng · Bước 2"
          title="Chọn vai trò bạn muốn ứng tuyển"
        />
        <LoadingBlock variant="cards" rows={5} />
      </ViewFrame>
    );
  }

  if (loadError) {
    return (
      <ViewFrame>
        <PageHeader
          eyebrow="Vòng tuyển dụng · Bước 2"
          title="Chọn vai trò bạn muốn ứng tuyển"
        />
        <Panel className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">Không tải được hồ sơ tuyển dụng</p>
          <p className="text-xs text-dim">
            {loadError instanceof Error ? loadError.message : "Vui lòng thử lại."}
          </p>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setReloadKey((k) => k + 1)}>
            Thử lại
          </Button>
        </Panel>
      </ViewFrame>
    );
  }

  const step = profileStatus === "not_started" ? 1 : 2;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Vòng tuyển dụng · Bước 2"
        title="Chọn vai trò bạn muốn ứng tuyển"
        description="Vai trò quyết định bộ câu hỏi phỏng vấn và dự án bạn sẽ tham gia. Chọn kỹ — bạn có thể đổi trước khi bắt đầu phỏng vấn."
      />

      <div className="space-y-5">
        <OnboardingStepper current={step} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ROLE_META.map((meta) => (
            <RoleCard
              key={meta.code}
              meta={meta}
              selected={selected === meta.code}
              onSelect={() => setSelected(meta.code)}
            />
          ))}
        </div>

        <Panel className="flex flex-col items-center justify-between gap-4 px-5 py-4 sm:flex-row">
          <p className="max-w-xl text-xs leading-relaxed text-dim">
            {selected ? (
              <>
                Vai trò đã chọn:{" "}
                <span className="font-semibold text-ink">{roleLabels[selected]}</span>
                {preselected === selected && profileStatus !== "not_started" ? (
                  <span className="text-faint"> — vai trò bạn đã chọn trước đó</span>
                ) : null}
                {" · Buổi phỏng vấn gồm khoảng 7 câu hỏi, tối đa 45 phút."}
              </>
            ) : (
              "Chọn một vai trò phía trên để tiếp tục. Bạn sẽ không thể đổi vai trò sau khi buổi phỏng vấn bắt đầu."
            )}
          </p>
          <Button
            className="w-full shrink-0 rounded-lg bg-brand px-5 text-on-brand hover:bg-brand-bright active:scale-[0.98] sm:w-auto"
            disabled={!selected || submit.busy}
            onClick={handleContinue}
          >
            {submit.busy ? "Đang lưu…" : selected ? `Tiếp tục với vai trò ${roleLabels[selected]}` : "Chọn một vai trò"}
            {!submit.busy && selected ? <ArrowRight className="size-4 icon" /> : null}
          </Button>
        </Panel>
      </div>
    </ViewFrame>
  );
}
