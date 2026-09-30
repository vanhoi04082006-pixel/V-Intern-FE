import { cn } from "@/lib/utils";

/**
 * Wordmark "V - Intern" theo ảnh thương hiệu tham chiếu:
 * - "V" màu xanh dương sáng #2060F0
 * - "- Intern" màu navy đậm #182850
 * Bản `inverse` dùng trên nền tối (footer, dashboard mockup):
 * chữ trắng, "V" xanh sáng hơn để đủ tương phản.
 */
export function Logo({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline text-2xl font-extrabold leading-none tracking-tight",
        className
      )}
    >
      <span className="sr-only">V-Intern</span>
      <span
        aria-hidden="true"
        className={inverse ? "text-[#4D8DFF]" : "text-[#2060F0]"}
      >
        V
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mx-[0.2em]",
          inverse ? "text-white/70" : "text-[#182850]"
        )}
      >
        -
      </span>
      <span
        aria-hidden="true"
        className={inverse ? "text-white" : "text-[#182850]"}
      >
        Intern
      </span>
    </span>
  );
}
