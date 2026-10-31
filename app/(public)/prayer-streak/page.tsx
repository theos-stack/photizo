import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, CalendarDays, Check, Clock3, Heart, LockKeyhole, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "30-Day Prayer Streak Challenge",
  description: "Build a steady rhythm of prayer with daily Scripture, guided prayer, reflection and a personal progress journey.",
  alternates: { canonical: "/prayer-streak" },
  openGraph: { url: "/prayer-streak", title: "30-Day Prayer Streak Challenge | PHOTIZO", description: "Thirty days of Scripture, focused prayer, reflection and a gentle daily check-in." },
};

const steps = [
  { n: "01", title: "Create your account", copy: "Your personal space keeps your daily guides and progress together." },
  { n: "02", title: "Choose your local time", copy: "Your challenge day follows the time zone you select when you begin." },
  { n: "03", title: "Make room to pray", copy: "Read the daily Scripture, follow the prayer focus and use the timer if it helps." },
  { n: "04", title: "Mark your day", copy: "Check in when you have finished. If you miss a day, you can continue without losing the days you completed." },
];

const features = [
  { icon: BookOpen, title: "Scripture for today", copy: "A daily Bible reference keeps each moment rooted in the Word." },
  { icon: Heart, title: "A clear prayer focus", copy: "Guided points help you begin and make space for your own words." },
  { icon: Clock3, title: "An optional timer", copy: "Set aside a few quiet minutes without turning prayer into a performance." },
  { icon: CalendarDays, title: "Your personal history", copy: "Return to your completed days, current rhythm and journey milestones." },
];

export default async function PrayerStreakPage() {
  const supabase = await getServerSupabaseClient();
  const { data: campaign } = await supabase?.from("prayer_challenges").select("id,title,description,duration_days,minutes_per_day").eq("slug", "30-day-prayer-streak").eq("status", "published").maybeSingle() || { data: null };
  const { data: dayOne } = campaign ? await supabase!.from("prayer_challenge_days").select("title,bible_reference,encouragement,prayer_points").eq("challenge_id", campaign.id).eq("day_number", 1).maybeSingle() : { data: null };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--evergreen)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_84%_18%,rgba(214,195,138,.18),transparent_32%),linear-gradient(135deg,transparent_40%,rgba(255,255,255,.035))]" />
        <Container className="grid min-h-[610px] gap-12 py-14 sm:py-20 lg:min-h-[660px] lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d6c38a]">PHOTIZO · {campaign?.duration_days || 30}-Day Prayer Challenge</p>
            <h1 className="mt-6 font-display text-[3.15rem] font-semibold leading-[.98] tracking-[-.045em] sm:text-7xl">A Deeper Prayer Life Begins With One Day.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/75 sm:text-lg">Thirty days of intentional prayer, Scripture, reflection and spiritual growth. Build a steady practice one honest moment at a time.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/streak/register" size="lg" className="w-full bg-[#d6c38a] text-[#173326] shadow-none hover:bg-[#e2d5ac] sm:w-auto">Join the Prayer Challenge <ArrowRight className="h-4 w-4" /></Button>
              <Link href="/streak/login" className="rounded-full px-5 py-3 text-center text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6c38a]">Returning member? Sign in</Link>
            </div>
            <a href="#how-it-works" className="mt-9 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white/55 hover:text-white/85">See how your journey works <ArrowDown className="h-3.5 w-3.5" /></a>
            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-xs text-white/55"><span>{campaign?.duration_days || 30} days</span><span>·</span><span>{campaign?.minutes_per_day || 10} minutes a day</span><span>·</span><span>Personal and private</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px] lg:ml-auto">
            <div className="absolute -inset-5 rounded-[34px] bg-[#d6c38a]/10 blur-2xl" />
            <article className="relative overflow-hidden rounded-[28px] border border-white/20 bg-[#fbfaf6] p-5 text-[#172c20] shadow-[0_28px_80px_rgba(0,0,0,.25)] sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-black/[.08] pb-4">
                <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--dark-moss-green)]">A look inside your day</p><p className="mt-1 text-xs text-black/45">A calm place to return to</p></div>
                <span className="rounded-full bg-[#e9eee6] px-3 py-1.5 text-[10px] font-semibold text-[var(--evergreen)]">DAY 01</span>
              </div>
              <div className="py-6">
                <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[.19em] text-black/45">Daily Scripture</span><span className="rounded-full bg-[#eee8d8] px-3 py-1.5 text-[10px] font-semibold text-[#655638]">{dayOne?.bible_reference || "Your selected guide"}</span></div>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-[2.1rem]">{dayOne?.title || "A moment to begin"}</h2>
                <p className="mt-3 text-sm leading-6 text-black/60">{dayOne?.encouragement || "Each day brings a Scripture reference, an encouraging reflection and a prayer focus."}</p>
                <div className="mt-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(20,40,27,.055)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[var(--dark-moss-green)]">Prayer focus</p>
                  <p className="mt-2 text-sm leading-6 text-black/65">{dayOne?.prayer_points?.[0] || "Read slowly, be present, and begin with the words you have."}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-black/[.08] pt-4 text-xs text-black/50"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[var(--dark-moss-green)]" />Optional prayer timer</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Personal check-in</span></div>
            </article>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--warm-ivory)] py-16 sm:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-16">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[var(--dark-moss-green)]">The purpose</p><h2 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight tracking-[-.025em] text-[#182a1e] sm:text-5xl">Make room for a daily conversation with God.</h2></div>
          <div className="space-y-4 text-base leading-8 text-black/65"><p>Consistency grows through small, faithful choices. This challenge gives you a gentle structure for opening Scripture, bringing your attention to prayer and reflecting on the day.</p><p>There is no score to chase and no perfect record required. Your journey is personal; the challenge simply helps you come back, day by day.</p></div>
        </Container>
      </section>

      <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[var(--dark-moss-green)]">How it works</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-.025em] text-[#182a1e] sm:text-5xl">A simple rhythm. Your own pace.</h2><p className="mt-4 text-sm leading-7 text-black/60">Your challenge begins on your enrollment date in the time zone you choose.</p></div>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step) => <li key={step.n} className="rounded-2xl border border-black/[.07] bg-white p-5 sm:p-6"><span className="font-display text-2xl font-semibold text-[#ac955b]">{step.n}</span><h3 className="mt-5 font-display text-2xl font-semibold text-[#182a1e]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-black/60">{step.copy}</p></li>)}</ol>
        </Container>
      </section>

      <section className="border-y border-black/[.05] bg-[#f8f7f2] py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[var(--dark-moss-green)]">What you receive</p><h2 className="mt-4 max-w-lg font-display text-4xl font-semibold leading-tight tracking-[-.025em] text-[#182a1e] sm:text-5xl">Everything you need to return tomorrow.</h2></div><p className="max-w-xl text-sm leading-7 text-black/60">Each member sees their current daily guide and a personal record of the days they have completed.</p></div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-2xl bg-white p-5 shadow-[0_12px_30px_rgba(20,40,27,.045)] sm:p-6"><Icon className="h-5 w-5 text-[var(--dark-moss-green)]" strokeWidth={1.7}/><h3 className="mt-5 font-display text-xl font-semibold text-[#182a1e]">{title}</h3><p className="mt-2 text-sm leading-6 text-black/60">{copy}</p></article>)}</div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[var(--dark-moss-green)]">A steady practice</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-.025em] text-[#182a1e] sm:text-5xl">Prayer is a relationship, not a performance.</h2><p className="mt-5 text-sm leading-7 text-black/60">A missed day ends a consecutive streak, but it does not erase completed days or prevent you from continuing. You can return to the guide and keep going.</p><div className="mt-7 flex items-center gap-3 rounded-2xl border border-black/[.07] bg-[var(--warm-ivory)] p-4"><LockKeyhole className="h-5 w-5 shrink-0 text-[var(--dark-moss-green)]"/><p className="text-xs leading-5 text-black/60">Your check-ins are personal and visible to you and authorized PHOTIZO administrators.</p></div></div>
          <div className="rounded-[28px] bg-[var(--evergreen)] p-5 text-white sm:p-7"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#d6c38a]"><Sparkles className="h-4 w-4"/>Your daily return</div><div className="mt-6 grid grid-cols-5 gap-2">{Array.from({length:30},(_,index)=>index+1).map((day)=> <div key={day} className={`grid aspect-square place-items-center rounded-lg border text-xs font-medium ${day===1?"border-[#d6c38a] bg-[#d6c38a] text-[#173326]":"border-white/15 bg-white/[.04] text-white/55"}`}>{day.toString().padStart(2,"0")}</div>)}</div><p className="mt-5 text-xs leading-5 text-white/55">Your dashboard calendar fills with your own check-ins as you continue. This illustration does not represent another member’s progress.</p></div>
        </Container>
      </section>

      <section className="bg-[var(--warm-ivory)] py-16 sm:py-20" aria-labelledby="challenge-faq">
        <Container className="max-w-4xl"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[var(--dark-moss-green)]">Questions</p><h2 id="challenge-faq" className="mt-4 font-display text-4xl font-semibold text-[#182a1e] sm:text-5xl">A few things to know.</h2><div className="mt-8 divide-y divide-black/10 border-y border-black/10">{[
          ["Do I need an account to begin?", "Yes. Your account keeps your daily guides, selected time zone and personal progress together. Email confirmation may be required before your first sign-in."],
          ["What if I miss a day?", "A missed day breaks your current consecutive streak, but your completed days remain in your history. You can return and continue the journey."],
          ["When does my 30-day journey start?", "It starts on the local calendar date you enroll, using the time zone you choose before beginning."],
          ["Can anyone else see my prayer check-ins?", "Your personal check-ins are not public. They are available to you and authorized PHOTIZO administrators for challenge support."],
          ["Does the timer track or verify my prayer?", "No. The timer is optional and only helps you set aside focused time. A check-in is your personal declaration that you prayed."],
        ].map(([question,answer])=><details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#182a1e] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evergreen)]">{question}<span aria-hidden="true" className="font-normal text-[var(--dark-moss-green)] transition-transform group-open:rotate-45">+</span></summary><p className="max-w-3xl pt-3 text-sm leading-7 text-black/60">{answer}</p></details>)}</div></Container>
      </section>

      <section className="bg-[var(--evergreen)] py-16 text-white sm:py-20 lg:py-24">
        <Container className="text-center"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d6c38a]">Begin with today</p><h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[-.03em] sm:text-6xl">There is room to begin again.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">Take one step toward a more intentional rhythm of prayer. Begin at your own pace.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button href="/streak/register" size="lg" className="bg-[#d6c38a] text-[#173326] shadow-none hover:bg-[#e2d5ac]">Join the Prayer Challenge <ArrowRight className="h-4 w-4"/></Button><Link href="/streak/login" className="rounded-full px-5 py-3.5 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">Already a member? Sign in</Link></div></Container>
      </section>
    </>
  );
}
