import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A document/workspace section; elevation is reserved for independent objects. */
export function SessionSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("session-section min-w-0 border-t border-border py-6", className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-section font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 max-w-prose text-small text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
