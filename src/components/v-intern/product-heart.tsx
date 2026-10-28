"use client";

import Image from "next/image";
import { KanbanSquare } from "lucide-react";
import { FadeIn } from "@/components/v-intern/reveal";

const STATS = ["Sprint 2 tuần", "Story point", "Pull request", "Đánh giá đồng nghiệp"];

/**
 * Trái tim sản phẩm: thẻ feature toàn khung với ảnh minh hoạ vòng đời
 * sprint làm nền, lớp phủ gradient đảm bảo độ tương phản cho khối chữ.
 */
export function ProductHeart() {
  return (
    <section
      id="product-heart"
      className="bg-canvas py-20 scroll-mt-20"
      aria-label="Trái tim sản phẩm"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <FadeIn>
          <div className="relative h-[440px] overflow-hidden rounded-3xl shadow-2xl shadow-navy/10 ring-1 ring-border sm:h-[480px] lg:h-[520px] xl:h-[560px]">
            <Image
              src="/images/landing/sprint-lifecycle.png"
              alt="Minh hoạ vòng đời sprint trên V-Intern: bảng Kanban các cột nhiệm vụ theo tuần, pull request và biểu đồ tiến độ trên nền tối"
              fill
              sizes="(min-width: 1024px) 100vw, 100vw"
              className="object-cover"
            />
            {/* Lớp phủ gradient giúp khối chữ dưới đáy luôn đọc được */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-canvas/95 via-canvas/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand ring-1 ring-brand/30">
                <KanbanSquare className="h-3.5 w-3.5" aria-hidden="true" />
                Trái tim sản phẩm
              </span>
              {/* dark: giữ màu tiêu đề theo token đảo theme — text-navy
                  gần đen khi .dark nên bù bằng foreground để luôn đọc được */}
              <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight text-navy dark:text-foreground sm:text-2xl">
                Sản phẩm mô phỏng toàn diện
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Sprint 2 tuần, story point, pull request, đánh giá đồng nghiệp
                — cả một vòng đời sản phẩm phần mềm được tái hiện trọn vẹn.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {STATS.map((stat) => (
                  <li
                    key={stat}
                    className="rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border backdrop-blur"
                  >
                    {stat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
