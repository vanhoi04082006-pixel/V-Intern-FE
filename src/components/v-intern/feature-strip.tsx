import { Award, Bot, Building2, UserSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; subtitle: string }[] = [
  {
    icon: UserSearch,
    title: "AI Interview",
    subtitle: "Tuyển dụng thông minh",
  },
  {
    icon: Building2,
    title: "Real Projects",
    subtitle: "Dự án từ doanh nghiệp",
  },
  {
    icon: Bot,
    title: "AI Mentor & Review",
    subtitle: "Hỗ trợ 24/7",
  },
  {
    icon: Award,
    title: "Certificate",
    subtitle: "Công nhận năng lực",
  },
];

export function FeatureStrip() {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-lg shadow-blue-900/5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-100">
      {FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="flex items-center gap-3.5 rounded-xl p-4 transition-colors hover:bg-blue-50/50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <feature.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">{feature.title}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {feature.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
