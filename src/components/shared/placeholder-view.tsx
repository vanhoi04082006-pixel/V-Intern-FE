"use client";

import { Construction } from "lucide-react";
import { ViewFrame } from "./view";
import { PageHeader } from "./primitives";

/** View tạm khi route chưa được xây — agent feature sẽ thay thế. */
export function PlaceholderView({ title }: { title: string }) {
  return (
    <ViewFrame>
      <PageHeader title={title} description="Phần này đang được hoàn thiện." />
      <div className="card-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
          <Construction className="size-5 icon" />
        </span>
        <p className="text-sm font-semibold text-ink">Đang xây dựng giao diện</p>
        <p className="max-w-sm text-xs text-dim">
          Tính năng này sẽ sớm xuất hiện. Cấu trúc dữ liệu và điều hướng đã sẵn sàng.
        </p>
      </div>
    </ViewFrame>
  );
}

/** Re-export view helpers cho tiện agent import chung một chỗ. */
export { ViewFrame } from "./view";
