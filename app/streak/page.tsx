import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock3 } from "lucide-react";
import { Container } from "@/components/Container";
import { PRAYER_CAMPAIGN_DEFAULT } from "@/lib/prayer-campaign";

export const metadata: Metadata = {
  title: "30 Days. A Life of Prayer. | PHOTIZO",
  description: "Show up daily. Pray intentionally. Build a consistent life of prayer with PHOTIZO Network International.",
  alternates: { canonical: "https://photizonetwork.com/streak" },
  openGraph: { url: "https://photizonetwork.com/streak", title: "30 Days. A Life of Prayer. | PHOTIZO", description: "Join the PHOTIZO 30-Day Prayer Streak." },
};

export default async function PublicPrayerStreakPage() {
  const accountHref = "/streak/register?next=%2Fmember";
  const startLabel = new Intl.DateTimeFormat("en-GB", { timeZone: PRAYER_CAMPAIGN_DEFAULT.timeZone, day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" }).format(new Date(PRAYER_CAMPAIGN_DEFAULT.startsAt));
  return <main className="min-h-screen overflow-hidden bg-[#f7f5ed] text-[#173326]">
    <section className="relative isolate flex min-h-[min(880px,100svh)] items-center overflow-hidden bg-[var(--evergreen)] py-12 text-white sm:py-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_12%,rgba(214,195,138,.19),transparent_35%),linear-gradient(145deg,transparent_45%,rgba(255,255,255,.035))]" />
      <Container className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#dfcf9c]">PHOTIZO Network International</p>
          <h1 className="mt-6 max-w-xl font-display text-[3.5rem] font-semibold leading-[.98] tracking-[-.045em] sm:text-7xl">30 Days.<br/><span className="text-[#dfcf9c]">A Life of Prayer.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/75 sm:text-lg">Show up daily. Pray intentionally. Build a consistent life of prayer.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={accountHref} className="inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#dfcf9c] px-7 py-3.5 text-sm font-semibold text-[#173326] transition hover:bg-[#eadfbd] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">Create your PHOTIZO account <ArrowRight className="h-4 w-4"/></Link>
            <Link href="/streak/login?next=%2Fmember" className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">Already a member? Sign in</Link>
            <a href="#how-it-works" className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">How It Works</a>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-xs text-white/60"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#dfcf9c]"/>{PRAYER_CAMPAIGN_DEFAULT.durationDays} days</span><span>Planned start: {startLabel}</span></div>
          <p className="mt-3 max-w-lg text-xs leading-5 text-white/55">The campaign schedule and enrollment are being prepared. Create or sign in to your PHOTIZO account now; the challenge calendar will open after launch setup is verified.</p>
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[30px] border border-white/20 bg-[#f7f5ed] p-5 text-[#173326] shadow-[0_30px_90px_rgba(0,0,0,.24)] sm:p-7">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#173326] text-[#dfcf9c]"><BookOpen className="h-5 w-5"/></div><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#63755f]">Your next step</p><p className="mt-1 font-display text-xl font-semibold">Make room to pray.</p></div></div>
            <div className="my-6 h-px bg-black/10"/>
            <div className="grid grid-cols-5 gap-2" aria-label="Thirty day journey preview">{Array.from({ length: 30 }, (_, index) => <div key={index} className={`grid aspect-square place-items-center rounded-xl border text-xs font-semibold ${index === 0 ? "border-[#c8b477] bg-[#dfcf9c] text-[#173326]" : "border-black/[.07] bg-white text-black/45"}`}>{String(index + 1).padStart(2, "0")}</div>)}</div>
            <p className="mt-5 flex items-center gap-2 text-xs text-black/55"><Check className="h-4 w-4 text-[#4e6c48]"/>A simple daily rhythm, held with grace.</p>
          </div>
        </div>
      </Container>
    </section>
    <section id="how-it-works" className="py-12 sm:py-16">
      <Container className="grid gap-5 sm:grid-cols-3">
        {["Join", "Pray", "Check In"].map((step, index) => <article key={step} className="flex items-start gap-4 border-t border-[#173326]/15 pt-4"><span className="font-display text-2xl text-[#a99057]">0{index + 1}</span><div><h2 className="font-display text-2xl font-semibold">{step}.</h2><p className="mt-1 text-sm leading-6 text-black/55">{["Use your PHOTIZO account to reserve your place.", "Take a quiet moment with the day’s prayer.", "Mark your day when you finish."][index]}</p></div></article>)}
      </Container>
    </section>
  </main>;
}
