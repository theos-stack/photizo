import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoPlaceholderProps = {
  className?: string;
  stacked?: boolean;
  tone?: "dark" | "light";
};

export function LogoPlaceholder({
  className,
  stacked = true,
  tone = "dark",
}: LogoPlaceholderProps) {
  const isDark = tone === "dark";

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3 rounded-[22px] px-3 py-2.5 backdrop-blur-xl",
        isDark
          ? "border border-[rgba(11,11,11,0.08)] bg-white/76"
          : "border border-[rgba(255,255,255,0.14)] bg-white/6",
        stacked ? "flex-col items-start sm:flex-row sm:items-center" : "",
        className,
      )}
      aria-label="PHOTIZO Network International"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#FFD600,#EBFFF3)] text-base font-semibold tracking-[-0.03em] text-[var(--dark-moss-green)] shadow-[0_10px_24px_rgba(255,214,0,0.22)]">
        P
      </div>
      <div className="leading-none">
        <div
          className={cn(
            "text-lg font-semibold tracking-[0.18em] sm:text-xl",
            isDark ? "text-[var(--black)]" : "text-white",
          )}
        >
          PHOTIZO
        </div>
        <div
          className={cn(
            "mt-1 text-[10px] uppercase tracking-[0.3em] sm:text-xs",
            isDark ? "text-[rgba(11,11,11,0.52)]" : "text-white/72",
          )}
        >
          Network International
        </div>
      </div>
    </Link>
  );
}
