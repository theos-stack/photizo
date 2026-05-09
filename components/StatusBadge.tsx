import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const statusMap: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-200 text-slate-700",
  closed: "bg-amber-100 text-amber-800",
  draft: "bg-zinc-200 text-zinc-700",
  new: "bg-sky-100 text-sky-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  attended: "bg-[var(--honeydew)] text-[var(--dark-moss-green)]",
  did_not_attend: "bg-rose-100 text-rose-700",
  followed_up: "bg-violet-100 text-violet-800",
  contacted: "bg-sky-100 text-sky-800",
  prayed_with: "bg-emerald-100 text-emerald-800",
  in_follow_up: "bg-amber-100 text-amber-800",
  joined_discipleship: "bg-[var(--honeydew)] text-[var(--dark-moss-green)]",
  planted_in_church: "bg-lime-100 text-lime-800",
  needs_attention: "bg-rose-100 text-rose-700",
  in_review: "bg-amber-100 text-amber-800",
  answered: "bg-emerald-100 text-emerald-800",
  needs_pastoral_attention: "bg-rose-100 text-rose-700",
  converted_to_teaching: "bg-violet-100 text-violet-800",
  archived: "bg-zinc-200 text-zinc-700",
  responded: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        statusMap[normalized] || "bg-zinc-200 text-zinc-700",
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
