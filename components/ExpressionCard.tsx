import { cn } from "@/lib/utils";

type ExpressionCardProps = {
  index: string;
  title: string;
  description: string;
  className?: string;
};

export function ExpressionCard({
  index,
  title,
  description,
  className,
}: ExpressionCardProps) {
  return (
    <article
      className={cn(
        "interactive-card rounded-[30px] border border-[rgba(11,11,11,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,245,245,0.94))] p-7 shadow-soft",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[rgba(72,108,38,0.62)]">
        {index}
      </div>
      <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--black)]">
        {title}
      </h3>
      <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
    </article>
  );
}
