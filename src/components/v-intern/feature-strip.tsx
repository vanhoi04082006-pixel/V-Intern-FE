"use client";

import {
  IconAward,
  IconBot,
  IconBuilding,
  IconUserSearch,
  type IconComponent,
} from "@/components/v-intern/icons";

const FEATURES: { icon: IconComponent; title: string; subtitle: string }[] = [
  {
    icon: IconUserSearch,
    title: "Phỏng vấn AI",
    subtitle: "Tuyển dụng thông minh",
  },
  {
    icon: IconBuilding,
    title: "Dự án thực tế",
    subtitle: "Dự án từ doanh nghiệp",
  },
  {
    icon: IconBot,
    title: "AI Mentor & Đánh giá",
    subtitle: "Hỗ trợ 24/7",
  },
  {
    icon: IconAward,
    title: "Chứng nhận",
    subtitle: "Công nhận năng lực",
  },
];

/**
 * Dải tính năng — 4 "thẻ mục lục" của cuốn sổ,
 * ngăn cách bằng nét đứt như đường gấp giấy.
 */
export function FeatureStrip() {
  return (
    <div className="sketch-card grid grid-cols-1 gap-0 overflow-hidden p-2 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature, index) => (
        <div
          key={feature.title}
          className={
            "group flex items-center gap-3.5 rounded-xl p-4 transition-colors hover:bg-blue-mist " +
            (index > 0 ? "border-t-2 border-dashed border-ink/15 sm:border-t-0 " : "") +
            (index % 2 === 1 ? "sm:border-l-2 " : "") +
            (index >= 2 ? "sm:border-t-2 sm:border-dashed lg:border-t-0 " : "") +
            (index > 0 ? "lg:border-l-2 lg:border-dashed" : "") +
            " border-ink/15"
          }
        >
          <span className="sticker sticker-wiggle h-12 w-12 shrink-0 text-blue transition-all group-hover:bg-royal group-hover:text-white">
            <feature.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink">{feature.title}</p>
            <p className="mt-0.5 truncate font-hand text-[15px] leading-tight text-ink-soft">
              {feature.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
