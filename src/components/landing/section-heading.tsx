import { cn } from "@/lib/utils";
import { SquiggleUnderline } from "@/components/landing/doodles";

/** Tiêu đề section kiểu sổ tay: nhãn mono nhỏ + tiêu đề lớn + mô tả. */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = "center",
  dark = false,
}: {
  eyebrow: string;
  title: string;
  /** phần chữ được tô marker xanh */
  highlight?: string;
  subtitle?: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      <p
        className={cn(
          "inline-flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.22em]",
          dark ? "text-blue" : "text-blue",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-[2px] w-7 rounded-full",
            dark ? "bg-blue" : "bg-blue",
          )}
        />
        {eyebrow}
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-[2px] w-7 rounded-full",
            dark ? "bg-blue" : "bg-blue",
          )}
        />
      </p>

      <h2
        className={cn(
          "mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl",
          dark ? "text-ink" : "text-ink",
        )}
      >
        {title}{" "}
        {highlight ? <span className="marker">{highlight}</span> : null}
      </h2>

      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            dark ? "text-ink-soft" : "text-ink-soft",
          )}
        >
          {subtitle}
        </p>
      ) : null}

      <SquiggleUnderline
        className={cn(
          "mx-auto mt-5 text-blue",
          align === "center" ? "w-28" : "w-24",
        )}
      />
    </div>
  );
}
