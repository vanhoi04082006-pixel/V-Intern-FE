import { cn } from "@/lib/utils";
import { SquiggleUnderline } from "@/components/v-intern/doodles";

/** Tiêu đề section kiểu sổ tay: nhãn mono nhỏ + tiêu đề lớn + mô tả. */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = "center",
  className,
}: {
  /** nhãn nhỏ phía trên tiêu đề (mono, chữ hoa) */
  eyebrow?: string;
  title: string;
  /** phần chữ được tô marker xanh */
  highlight?: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-blue">
          <span
            aria-hidden="true"
            className="inline-block h-[2px] w-7 rounded-full bg-blue"
          />
          {eyebrow}
          <span
            aria-hidden="true"
            className="inline-block h-[2px] w-7 rounded-full bg-blue"
          />
        </p>
      ) : null}

      <h2 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-4xl">
        {title}
        {highlight ? (
          <>
            {" "}
            <span className="marker">{highlight}</span>
          </>
        ) : null}
      </h2>

      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {subtitle}
        </p>
      ) : null}

      <SquiggleUnderline
        className={cn(
          "mt-5 text-blue",
          align === "center" ? "mx-auto w-28" : "w-24"
        )}
      />
    </div>
  );
}
