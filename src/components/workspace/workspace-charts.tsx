"use client";

import { useId, useState } from "react";
import Link from "next/link";

export type DistributionItem = {
  label: string;
  value: number;
  tone: "neutral" | "primary" | "warning" | "success";
};

/** Current snapshot only. The legend is also the keyboard-accessible data equivalent. */
export function TaskDistribution({ items, label = "Phân bố nhiệm vụ" }: {
  items: DistributionItem[];
  label?: string;
}) {
  const id = useId();
  const [selection, setSelection] = useState<string | null>(null);
  const values = items.map((item) => ({ ...item, value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0 }));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const selected = values.find((item) => item.label === selection);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  // Derive each offset without mutating state during render.
  const segments = values.map((item, index) => ({
    ...item,
    length: total ? (item.value / total) * circumference : 0,
    offset: total ? values.slice(0, index).reduce((sum, previous) => sum + previous.value, 0) / total * circumference : 0,
  }));
  return (
    <figure className="workspace-chart" aria-labelledby={id}>
      <figcaption id={id}>{label}<span>Dữ liệu trong phạm vi hiện tại</span></figcaption>
      <div className="workspace-donut-layout">
        <div className="workspace-donut" aria-hidden="true">
          <svg viewBox="0 0 160 160" fill="none">
            <circle cx="80" cy="80" r={radius} stroke="var(--ws-line)" strokeWidth="15" />
            {segments.filter((item) => item.value > 0).map((item) => (
              <circle key={item.label} className="workspace-donut-segment" data-tone={item.tone}
                data-dimmed={selected && selected.label !== item.label ? "true" : undefined}
                cx="80" cy="80" r={radius} strokeWidth={selected?.label === item.label ? 19 : 15}
                strokeDasharray={`${item.length} ${circumference}`} strokeDashoffset={-item.offset}
                transform="rotate(-90 80 80)" />
            ))}
          </svg>
          <div className="workspace-donut-center"><strong>{selected?.value ?? total}</strong><span>{selected?.label ?? "nhiệm vụ"}</span></div>
        </div>
        <div className="workspace-chart-data">
          <ul className="workspace-chart-legend">
            {values.map((item) => <li key={item.label}>
              <button type="button" aria-pressed={selected?.label === item.label} onClick={() => setSelection(selected?.label === item.label ? null : item.label)}>
                <i data-tone={item.tone} aria-hidden="true" /><span>{item.label}</span><strong>{item.value}</strong><small>{total ? Math.round(item.value / total * 100) : 0}%</small>
              </button>
            </li>)}
          </ul>
          <p className="workspace-chart-selection" aria-live="polite" aria-atomic="true">
            {selected ? `${selected.label}: ${selected.value} / ${total} nhiệm vụ. Chọn lại để xem tổng.` : total ? `${total} nhiệm vụ trong phạm vi đang hiển thị. Chọn trạng thái để xem tỷ trọng.` : "Chưa có nhiệm vụ trong phạm vi này."}
          </p>
        </div>
      </div>
    </figure>
  );
}

/** An honest comparison: missing rates remain missing rather than becoming zero. */
export function RateComparison({ items, label, unit = "%" }: {
  items: { label: string; value: number | null | undefined }[];
  label: string;
  unit?: "%" | "điểm";
}) {
  return <figure className="workspace-rate-chart" aria-label={label}>
    <figcaption>{label}<span>{unit === "%" ? "Tỷ lệ hiện tại · thang 0–100%" : "Điểm theo tiêu chí · thang 0–100"}</span></figcaption>
    <div className="workspace-rate-axis" aria-hidden="true"><span>0{unit === "%" ? "%" : ""}</span><span>50{unit === "%" ? "%" : ""}</span><span>100{unit === "%" ? "%" : ""}</span></div>
    <ul>{items.map((item) => {
      const value = typeof item.value === "number" && Number.isFinite(item.value) ? Math.min(100, Math.max(0, item.value)) : null;
      return <li key={item.label}><div><span>{item.label}</span><strong>{value === null ? "Chưa đo được" : `${value}${unit === "%" ? "%" : " điểm"}`}</strong></div>
        <div className="workspace-rate-track" aria-hidden="true" data-missing={value === null ? "true" : undefined}>{value !== null && <span style={{ width: `${value}%` }} />}</div>
      </li>;
    })}</ul>
  </figure>;
}

export function SessionProgressComparison({ items }: {
  items: { id: string; name: string; done: number; total: number }[];
}) {
  return <section className="workspace-session-comparison" aria-label="Tiến độ từng phiên đang hiển thị">
    <header><h2>Tiến độ từng phiên</h2><p>Nhiệm vụ đã hoàn thành / tổng được giao</p></header>
    {items.length ? <ul>{items.map((item) => <li key={item.id}>
      <Link href={`/instructor/sessions/${encodeURIComponent(item.id)}`}>{item.name}</Link>
      <span>{item.done} / {item.total}</span>
      <div className="workspace-rate-track" aria-hidden="true"><span style={{ width: `${item.total ? Math.min(100, Math.max(0, item.done / item.total * 100)) : 0}%` }} /></div>
    </li>)}</ul> : <p>Chưa có phiên phù hợp với bộ lọc.</p>}
  </section>;
}
