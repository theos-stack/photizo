import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  icon,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "interactive-card rounded-[30px] border border-[rgba(11,11,11,0.08)] bg-white p-7 shadow-soft",
        className,
      )}
    >
      {icon ? (
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--cultured)] text-[var(--dark-moss-green)]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-[var(--black)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
    </article>
  );
}
