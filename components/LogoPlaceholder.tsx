import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoPlaceholderProps = {
  className?: string;
  stacked?: boolean;
  tone?: "dark" | "light";
};

export function LogoPlaceholder({
  className,
  stacked = false,
  tone = "dark",
}: LogoPlaceholderProps) {
  const isDark = tone === "dark";

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center transition-colors",
        stacked ? "flex-col items-start sm:flex-row sm:items-center sm:gap-2" : "",
        className,
      )}
      aria-label="PHOTIZO Network International"
    >
      <div
        className={cn(
          "leading-none",
          stacked ? "space-y-1" : "flex flex-wrap items-baseline gap-x-2 gap-y-1",
        )}
      >
        <div
          className={cn(
            "text-[15px] font-semibold tracking-[0.18em] sm:text-base",
            isDark ? "text-[var(--black)]" : "text-white",
          )}
        >
          PHOTIZO
        </div>
        <div
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.24em] sm:text-[11px]",
            isDark ? "text-[rgba(11,11,11,0.58)]" : "text-white/76",
          )}
        >
          Network International
        </div>
      </div>
    </Link>
  );
}
