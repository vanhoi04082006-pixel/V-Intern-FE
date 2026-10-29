import { cn } from "@/lib/utils";

/**
 * Wordmark "V-Intern" — nét mực trên giấy.
 * "V" xanh dương đậm, gạch nối và "Intern" màu mực đen.
 * Bản `inverse` dùng trên nền tối (footer, thẻ đen).
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
        "inline-flex select-none items-baseline text-[26px] font-extrabold leading-none tracking-tight",
        className,
      )}
    >
      <span className="sr-only">V-Intern</span>
      <span aria-hidden="true" className="relative text-blue">
        V
        {/* nét gạch chân vẽ tay dưới chữ V */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 6"
          className="absolute -bottom-[5px] left-0 h-[6px] w-full text-blue"
          preserveAspectRatio="none"
        >
          <path
            d="M1.5 4.2 Q 7 1.2, 12.5 3.4 T 22.5 3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        aria-hidden="true"
        className={cn("mx-[0.16em]", inverse ? "text-chalk/60" : "text-ink/40")}
      >
        -
      </span>
      <span aria-hidden="true" className={inverse ? "text-chalk" : "text-ink"}>
        Intern
      </span>
    </span>
  );
}
