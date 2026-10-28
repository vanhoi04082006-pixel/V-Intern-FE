import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Info,
  type LucideIcon,
} from "lucide-react";
import { priorityLabels, statusLabels } from "@/lib/api/work";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

export function StudentHeading({
  title,
  description,
  action,
  artwork,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  artwork?: "learn" | "teach" | "project" | "connect" | "achievement";
}) {
  return (
    <WorkspacePageHeader
      title={title}
      description={description}
      action={action}
      artwork={artwork}
    />
  );
}

export function StudentLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`student-action${secondary ? " student-action-secondary" : ""}`}
    >
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );
}

export function StudentPanel({
  title,
  icon: Icon,
  children,
  action,
  description,
  className = "",
  bodyClassName,
  flush = false,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <section className={`student-panel ${className}`}>
      <header className="student-panel-header">
        <div className="student-panel-heading">
          <h2>
            {Icon && <Icon size={17} aria-hidden="true" />}
            {title}
          </h2>
          {description && (
            <p className="student-panel-description">{description}</p>
          )}
        </div>
        {action && <div className="student-panel-header-action">{action}</div>}
      </header>
      <div
        className={`student-panel-body${flush ? " student-panel-body-flush" : ""}${bodyClassName ? ` ${bodyClassName}` : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

export function StudentMetric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  progress,
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "rose" | "slate";
  progress?: number;
  trend?: string;
}) {
  return (
    <div className="student-metric" data-tone={tone}>
      <div className="student-metric-heading">
        <span className="student-metric-icon">
          <Icon size={18} aria-hidden="true" />
        </span>
        <p>{label}</p>
        {trend && (
          <span
            className="student-metric-trend"
            data-tone={tone === "green" ? "green" : "slate"}
          >
            {trend}
          </span>
        )}
      </div>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
      {typeof progress === "number" && (
        <div
          className="student-progress"
          data-tone={
            tone === "green" ? "green" : tone === "amber" ? "amber" : "blue"
          }
        >
          <progress
            aria-label={`${label}: ${Math.round(progress)}%`}
            value={Math.max(0, Math.min(100, progress))}
            max={100}
          />
        </div>
      )}
    </div>
  );
}

export function StudentProgress({
  value,
  label,
  tone = "blue",
}: {
  value: number;
  label: string;
  tone?: "blue" | "green" | "amber";
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="student-progress" data-tone={tone}>
      <div>
        <span>{label}</span>
        <strong>{safe}%</strong>
      </div>
      <progress aria-label={label} value={safe} max={100} />
    </div>
  );
}

export function StudentBadge({
  children,
  tone = "slate",
  outline = false,
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "rose" | "slate" | "sky";
  outline?: boolean;
}) {
  return (
    <span
      className={`student-badge${outline ? " student-badge-outline" : ""}`}
      data-tone={tone}
    >
      {children}
    </span>
  );
}

export function StudentChip({
  children,
  tone,
  icon: Icon,
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "rose" | "sky" | "slate";
  icon?: LucideIcon;
}) {
  return (
    <span className="student-chip" data-tone={tone}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StudentCallout({
  tone = "blue",
  title,
  children,
}: {
  tone?: "blue" | "green" | "amber" | "rose";
  title?: string;
  children: ReactNode;
}) {
  const Icon =
    tone === "amber" || tone === "rose"
      ? CircleAlert
      : tone === "green"
        ? CheckCircle2
        : Info;
  return (
    <div className="student-callout" data-tone={tone}>
      <Icon size={17} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function StudentEmpty({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="student-empty">
      <Icon size={36} aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StudentTimeline({
  items,
}: {
  items: { id: string; title: string; description?: string; time?: string }[];
}) {
  return (
    <ol className="student-timeline">
      {items.map((item, index) => (
        <li key={item.id}>
          <span className="student-timeline-marker" aria-hidden="true">
            {index + 1}
          </span>
          <div>
            <strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
            {item.time && <time>{item.time}</time>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StudentSkeleton({ className = "" }: { className?: string }) {
  return <div className={`student-skeleton ${className}`} aria-hidden="true" />;
}

export const studentStatus = (value: string) =>
  statusLabels[value as keyof typeof statusLabels] ?? value;
export const studentPriority = (value: string) =>
  priorityLabels[value as keyof typeof priorityLabels] ?? value;
export const studentDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa đặt thời hạn";
export const studentDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
export const studentToneForStatus = (
  value: string,
): "blue" | "green" | "amber" | "slate" => {
  if (value === "done") return "green";
  if (value === "review") return "amber";
  if (value === "doing") return "blue";
  return "slate";
};
export const studentToneForPriority = (
  value: string,
): "rose" | "amber" | "sky" | "slate" => {
  if (value === "critical" || value === "high") return "rose";
  if (value === "medium") return "amber";
  if (value === "low") return "sky";
  return "slate";
};
