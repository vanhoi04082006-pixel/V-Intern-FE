"use client";
import Link from "next/link";
import { BarChart3, Layers, Activity, CheckCircle2, Clock } from "lucide-react";
import { Panel, Empty } from "./primitives";
const colors = [
  "#246bfe",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#64748b",
];
const icons = [Layers, Activity, CheckCircle2, Clock, BarChart3];
export function CollectionMetrics({
  values,
  note,
}: {
  values: [string, number][];
  note?: string;
}) {
  return (
    <div className="mb-5">
      <dl className="workspace-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {values.map(([label, value], i) => {
          const Icon = icons[i % icons.length];
          return (
            <div
              key={label}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <dt className="flex items-center gap-3 text-xs text-slate-500">
                <span
                  className="shrink-0 rounded-xl p-3"
                  style={{
                    color: colors[i % colors.length],
                    backgroundColor: colors[i % colors.length] + "12",
                  }}
                >
                  <Icon size={23} />
                </span>
                <span className="min-w-0">{label}</span>
              </dt>
              <dd className="mt-2 pl-[59px] text-2xl font-bold text-navy">
                {value.toLocaleString("vi-VN")}
              </dd>
            </div>
          );
        })}
      </dl>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
export function Distribution({
  title,
  values,
  note,
}: {
  title: string;
  values: [string, number][];
  note: string;
}) {
  const total = values.reduce((n, [, count]) => n + count, 0);
  const segments = values.map(([, count], i) => {
    const start = total
      ? (values.slice(0, i).reduce((n, [, value]) => n + value, 0) / total) *
        100
      : 0;
    const offset = start + (total ? (count / total) * 100 : 0);
    return `${colors[i % colors.length]} ${start}% ${offset}%`;
  });
  return (
    <Panel title={title}>
      {total ? (
        <>
          <div
            className="mx-auto mb-5 grid h-36 w-36 place-items-center rounded-full"
            role="img"
            aria-label={values
              .map(([label, count]) => `${label}: ${count}`)
              .join(", ")}
            style={{ background: `conic-gradient(${segments.join(",")})` }}
          >
            <div className="grid h-24 w-24 place-content-center rounded-full bg-white text-center">
              <strong className="text-2xl text-navy">{total}</strong>
              <span className="text-xs text-slate-500">bản ghi</span>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            {values.map(([label, count], i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="flex-1">{label}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Empty>Chưa có dữ liệu phân bố.</Empty>
      )}
      <p className="mt-4 text-xs text-slate-500">{note}</p>
    </Panel>
  );
}
export function CollectionAside({
  rows,
  title = "Phân bố trạng thái",
  links,
}: {
  rows: { status: string }[];
  title?: string;
  links: [string, string][];
}) {
  const counts = new Map<string, number>();
  rows.forEach((row) =>
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1),
  );
  return (
    <aside className="space-y-4">
      <Distribution
        title={title}
        values={[...counts]}
        note="Phân bố các bản ghi trên trang hiện tại; không phải toàn bộ hệ thống."
      />
      <Panel title="Thao tác nhanh">
        <nav className="space-y-2">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-lg border border-slate-100 p-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              {label} →
            </Link>
          ))}
        </nav>
      </Panel>
      <Panel title="Dữ liệu theo thời gian">
        <Empty>Chưa có dữ liệu lịch sử để hiển thị xu hướng.</Empty>
      </Panel>
    </aside>
  );
}
