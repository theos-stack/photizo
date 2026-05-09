import { Button } from "@/components/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-[rgba(72,108,38,0.22)] bg-[var(--honeydew)]/40 p-10 text-center">
      <h3 className="font-display text-2xl font-bold text-[var(--black)]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[rgba(11,11,11,0.68)]">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Button href={actionHref}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
