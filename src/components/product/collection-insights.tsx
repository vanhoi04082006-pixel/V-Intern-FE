"use client";
import Link from "next/link";
import { Empty } from "./primitives";
import {
  IconArrowUpRight,
} from "@/components/v-intern/icons";

const colors = ["var(--primary)", "var(--success)", "var(--warning)", "var(--destructive)", "var(--muted-foreground)", "var(--foreground)"];

export function CollectionMetrics({ values, note }: { values: [string, number][]; note?: string }) {
  return <div className="collection-summary"><dl className="collection-stat-strip">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString("vi-VN")}</dd></div>)}</dl>{note && <p className="mt-3 text-caption text-muted-foreground">{note}</p>}</div>;
}

export function Distribution({ title, values, note }: { title: string; values: [string, number][]; note: string }) {
  const total = values.reduce((n, [, count]) => n + count, 0);
  return <section className="collection-aside-section" aria-label={title}>
    <h2 className="text-subsection font-semibold text-foreground">{title}</h2>
    {total ? <><div className="collection-distribution-track" role="img" aria-label={values.map(([label, count]) => `${label}: ${count}`).join(", ")}>{values.map(([label, count], i) => <span key={label} style={{ flexGrow: count, backgroundColor: colors[i % colors.length] }} />)}</div><ul className="space-y-3 text-small">{values.map(([label, count], i) => <li key={label} className="flex min-w-0 items-center gap-3"><span aria-hidden className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} /><span className="min-w-0 flex-1 break-words text-muted-foreground">{label}</span><strong className="tabular-nums text-foreground">{count}</strong></li>)}</ul><p className="mt-4 text-caption text-muted-foreground">{total.toLocaleString("vi-VN")} bản ghi trong phân bố</p></> : <Empty>Chưa có dữ liệu phân bố.</Empty>}
    <p className="mt-3 text-caption leading-relaxed text-muted-foreground">{note}</p>
  </section>;
}

export function CollectionAside({ rows, title = "Phân bố trạng thái", links }: { rows: { status: string }[]; title?: string; links: [string, string][] }) {
  const counts = new Map<string, number>();
  rows.forEach(row => counts.set(row.status, (counts.get(row.status) ?? 0) + 1));
  return <aside className="collection-aside">
    <Distribution title={title} values={[...counts]} note="Phân bố các bản ghi trên trang hiện tại; không phải toàn bộ hệ thống." />
    <section className="collection-aside-section"><h2 className="text-subsection font-semibold text-foreground">Thao tác nhanh</h2><nav className="mt-3 divide-y divide-border">{links.map(([href, label]) => <Link key={href} href={href} className="flex min-h-11 items-center justify-between gap-3 py-3 text-small font-medium text-primary hover:underline">{label}<IconArrowUpRight size={15} aria-hidden /></Link>)}</nav></section>
    <details className="collection-aside-section text-small"><summary className="min-h-11 cursor-pointer py-3 font-medium text-muted-foreground">Dữ liệu theo thời gian</summary><p className="pb-3 text-caption leading-relaxed text-muted-foreground">Chưa có dữ liệu lịch sử để hiển thị xu hướng.</p></details>
  </aside>;
}
