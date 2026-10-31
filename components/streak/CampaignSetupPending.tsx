import Link from "next/link";
import { BookOpen, LockKeyhole } from "lucide-react";
import { PrayerTimer } from "@/components/streak/PrayerTimer";

type Day = { day_number: number; title: string; bible_reference: string; encouragement: string; prayer_points: string[] };

export function CampaignSetupPending({ name, day }: { name?: string; day: Day | null }) {
  return <div className="mx-auto max-w-4xl space-y-5">
    <section className="rounded-[28px] bg-[#fbfaf6] p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[.23em] text-[var(--dark-moss-green)]">PHOTIZO Prayer Streak</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-[#182a1e]">{name ? `Welcome, ${name}.` : "Welcome to your prayer journey."}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">Your PHOTIZO account is ready. The challenge calendar, enrollment, and attendance will open once the campaign schedule is installed and verified.</p>
      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10" aria-label="Thirty day prayer challenge preview">{Array.from({ length: 30 }, (_, index) => <div key={index} title={`Day ${index + 1} · opens with the campaign`} className="grid aspect-square min-h-10 place-items-center rounded-xl border border-black/[.07] bg-white text-xs text-black/40"><LockKeyhole className="h-3.5 w-3.5"/><span className="sr-only">Day {index + 1} upcoming</span></div>)}</div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm"><Link href="/streak" className="font-semibold text-[var(--dark-moss-green)]">Challenge details</Link><Link href="/member" className="font-semibold text-[var(--dark-moss-green)]">PHOTIZO member home</Link></div>
    </section>

    {day && <section className="rounded-[28px] border border-black/[.06] bg-white p-5 shadow-soft sm:p-7">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4eddf] text-[var(--dark-moss-green)]"><BookOpen className="h-5 w-5"/></span><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/45">Prayer guide preview</p><h2 className="font-display text-xl font-semibold text-[#182a1e]">{day.title}</h2></div></div>
      <p className="mt-3 text-sm font-semibold text-[var(--dark-moss-green)]">{day.bible_reference}</p><p className="mt-2 text-sm leading-6 text-black/60">{day.encouragement}</p>
      {day.prayer_points.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/60">{day.prayer_points.map((point) => <li key={point}>{point}</li>)}</ul>}
    </section>}

    <PrayerTimer minutes={10}/>
  </div>;
}
