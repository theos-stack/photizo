export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm text-[rgba(11,11,11,0.7)]">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)]" />
      {label}
    </div>
  );
}
