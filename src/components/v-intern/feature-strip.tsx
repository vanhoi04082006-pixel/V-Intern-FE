import { Award, Bot, Building2, UserSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; subtitle: string }[] = [
  {
    icon: UserSearch,
    title: "Phỏng vấn AI",
    subtitle: "Tuyển dụng thông minh",
  },
  {
    icon: Building2,
    title: "Dự án thực tế",
    subtitle: "Dự án từ doanh nghiệp",
  },
  {
    icon: Bot,
    title: "AI Mentor & Đánh giá",
    subtitle: "Hỗ trợ 24/7",
  },
  {
    icon: Award,
    title: "Chứng nhận",
    subtitle: "Công nhận năng lực",
  },
];

export function FeatureStrip() {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border/80 bg-card p-3 shadow-lg shadow-blue-900/5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border">
      {FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="flex items-center gap-3.5 rounded-xl p-4 transition-colors hover:bg-accent/60"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-brand">
            <feature.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">{feature.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {feature.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
