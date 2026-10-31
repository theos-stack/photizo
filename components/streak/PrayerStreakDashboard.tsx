"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";
import { PrayerTimer } from "@/components/streak/PrayerTimer";
import type { PrayerMusicItem } from "@/components/streak/PrayerMusicPanel";
import { CampaignCountdown } from "@/components/streak/CampaignCountdown";
import { ShareMilestone } from "@/components/streak/ShareMilestone";
import { journeyMetrics } from "@/lib/prayer-streak-core";
import { calendarDifference, getCampaignDay, getTimeZoneDate } from "@/lib/prayer-campaign";

type Challenge = { id: string; title: string; description: string; duration_days: number; minutes_per_day: number; starts_at?: string | null; campaign_timezone?: string | null; daily_rollover?: string | null };
type Day = { day_number: number; title: string; bible_reference: string; encouragement: string; prayer_points: string[]; completion_message: string };
type Enrollment = { id: string; start_local_date: string; status: string; challenge_id: string; enrollment_timezone?: string | null; current_streak?: number; longest_streak?: number; missed_days?: number; prayer_challenges: Challenge };
type Checkin = { local_date: string; journey_day: number };

export function PrayerStreakDashboard({ profile, challenge, enrollment, days, checkins, achievements, today, serverNow, musicItems = [], joinHref = "/streak/join" }: { profile: { display_name?: string; timezone?: string } | null; challenge: Challenge | null; enrollment: Enrollment | null; days: Day[]; checkins: Checkin[]; achievements: { milestone: number }[]; today: string; serverNow: string; musicItems?: PrayerMusicItem[]; joinHref?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const serverNowMs = new Date(serverNow).getTime();
  const [now, setNow] = useState(serverNowMs);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const timeZone = challenge?.campaign_timezone || enrollment?.enrollment_timezone || profile?.timezone || "Africa/Lagos";
  const duration = challenge?.duration_days || 30;
  const startsAt = challenge?.starts_at || null;
  useEffect(() => {
    const mountedAt = performance.now();
    const timer = window.setInterval(() => setNow(serverNowMs + performance.now() - mountedAt), 30_000);
    return () => window.clearInterval(timer);
  }, [serverNowMs]);
  const liveToday = now ? getTimeZoneDate(new Date(now), timeZone) : today;
  const campaignDay = startsAt ? getCampaignDay(new Date(now), startsAt, timeZone, challenge?.daily_rollover || "00:00") : 0;
  const currentDay = startsAt ? campaignDay || 1 : enrollment ? Math.max(1, calendarDifference(enrollment.start_local_date, liveToday) + 1) : 1;
  const checkinDates = checkins.map((item) => item.local_date);
  const metrics = enrollment ? journeyMetrics(enrollment.start_local_date, checkinDates, liveToday, duration) : null;
  const completeDays = useMemo(() => new Set(checkins.map((item) => item.journey_day)), [checkins]);
  const eligibleStartDay = enrollment && startsAt
    ? Math.max(1, calendarDifference(getTimeZoneDate(new Date(startsAt), timeZone), enrollment.start_local_date) + 1)
    : 1;
  const dayNumber = Math.min(duration, currentDay);
  const day = days.find((item) => item.day_number === (selectedDay || dayNumber)) || null;
  const todayDone = checkins.some((item) => item.local_date === liveToday);
  const journeyComplete = enrollment?.status === "completed" || (startsAt ? currentDay > duration : Boolean(metrics?.completed));
  const total = metrics?.totalCompleted || checkins.length;
  const streak = metrics?.currentStreak || 0;
  const longestStreak = Math.max(metrics?.longestStreak || 0, enrollment?.longest_streak || 0);
  const missedDays = metrics?.missedDays || 0;
  const campaignNotStarted = Boolean(startsAt && now < new Date(startsAt).getTime());
  const checkinOpen = Boolean(enrollment && !campaignNotStarted && currentDay >= 1 && currentDay <= duration && !todayDone && !journeyComplete && currentDay >= eligibleStartDay);

  async function checkin() {
    if (!enrollment || !checkinOpen) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/member/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollment_id: enrollment.id }) });
      const payload = await response.json();
      if (!response.ok) setMessage(payload.error || "Could not save your check-in.");
      else { setMessage(day?.completion_message || "Your prayer check-in is saved. May peace go with you into the day."); router.refresh(); }
    } catch { setMessage("We could not save that check-in. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  if (!enrollment) return <section className="mx-auto max-w-2xl rounded-[30px] border border-black/[.07] bg-white p-6 shadow-[0_25px_75px_rgba(17,37,28,.08)] sm:p-10">
    <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">PHOTIZO Prayer Streak</p>
    <h1 className="mt-3 font-display text-4xl font-semibold text-[#182a1e]">{profile?.display_name ? `Welcome, ${profile.display_name}.` : "Welcome to your prayer journey."}</h1>
    <p className="mt-3 text-sm leading-7 text-black/60">Your PHOTIZO account is ready. Join the challenge when you’re ready to take part.</p>
    <Button href={joinHref} className="mt-6 min-h-12 bg-[var(--evergreen)] text-white shadow-none hover:bg-[#214a35]">Join the Prayer Streak</Button>
  </section>;

  return <div className="mx-auto max-w-5xl space-y-5">
    <header className="rounded-[28px] bg-[#fbfaf6] p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[.23em] text-[var(--dark-moss-green)]">Prayer Streak · Your private journey</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-3xl font-semibold text-[#182a1e] sm:text-4xl">{profile?.display_name ? `Welcome, ${profile.display_name}.` : "Welcome to your journey."}</h1><p className="mt-1 text-sm text-black/55">{campaignNotStarted ? "Your place is confirmed. Your calendar opens with the campaign." : journeyComplete ? "Thirty days, completed with intention." : `Day ${dayNumber} of ${duration} · ${total} completed`}</p></div><div className="flex gap-2"><span className="rounded-full bg-white px-3 py-2 text-xs text-black/60">{streak} day streak</span><Link href="/streak/history" className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--dark-moss-green)]">History</Link></div></div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-[var(--dark-moss-green)] transition-all" style={{ width: `${Math.min(100, (total / duration) * 100)}%` }} /></div>
    </header>

    {campaignNotStarted && startsAt && <CampaignCountdown startsAt={startsAt} serverNow={serverNow} timeZone={timeZone} />}

    <section className="rounded-[30px] border border-black/[.06] bg-white p-5 shadow-soft sm:p-7" aria-labelledby="streak-calendar-heading">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--dark-moss-green)]">Show up, one day at a time</p><h2 id="streak-calendar-heading" className="mt-1 font-display text-2xl font-semibold text-[#182a1e] sm:text-3xl">Your {duration}-day calendar</h2></div><p className="text-xs text-black/50">{total} of {duration} days complete · {missedDays} missed after joining</p></div>
      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">{Array.from({ length: duration }, (_, index) => index + 1).map((number) => {
        const completed = completeDays.has(number);
        const beforeEnrollment = number < eligibleStartDay;
        const missed = !campaignNotStarted && !completed && !beforeEnrollment && number < currentDay;
        const current = !campaignNotStarted && number === currentDay && number <= duration;
        const clickable = current && !todayDone && !journeyComplete;
        const state = completed ? "completed" : beforeEnrollment ? "before enrollment" : missed ? "missed" : current ? "today" : "upcoming";
        return <button key={number} type="button" disabled={!clickable} onClick={() => setSelectedDay(number)} aria-label={`Day ${number}, ${state}`} title={`Day ${number} · ${state}`} className={`relative grid aspect-square min-h-11 place-items-center rounded-xl border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)] ${completed ? "border-[var(--evergreen)] bg-[var(--evergreen)] text-white" : current ? "border-[#b29a60] bg-[#fff9e9] text-[#614b1e] shadow-[0_0_0_2px_rgba(178,154,96,.18)]" : missed ? "border-[#e6decd] bg-[#eee8d8] text-[#766849]" : beforeEnrollment ? "border-dashed border-black/10 bg-white text-black/30" : "border-black/[.06] bg-[#f7f6f2] text-black/40"} ${clickable ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default"}`}>{completed ? <Check className="h-4 w-4"/> : beforeEnrollment ? <span className="text-[9px]">·</span> : number}</button>;
      })}</div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-black/50"><span>Completed</span><span>Today</span><span>Missed</span><span>Before joining</span><span>Upcoming</span></div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[1fr_.72fr]">
      <article className="rounded-[30px] bg-[var(--evergreen)] p-5 text-white shadow-soft sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[.23em] text-[#dfcf9c]">{campaignNotStarted ? "We begin together" : todayDone ? "Prayer complete for today" : "Today’s prayer"}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">{campaignNotStarted ? "Your first day is waiting." : day?.title || `Day ${dayNumber}`}</h2>
        {!campaignNotStarted && day && <><p className="mt-2 text-sm text-white/70">{day.bible_reference}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{day.encouragement}</p><details className="mt-4 rounded-2xl border border-white/15 bg-white/[.05] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#dfcf9c]">Open prayer focus</summary><ul className="mt-3 space-y-2 text-sm text-white/75">{day.prayer_points.map((point) => <li key={point}>· {point}</li>)}</ul></details></>}
        {campaignNotStarted ? <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/65"><LockKeyhole className="h-4 w-4"/>Prayer and check-in unlock at the campaign start.</p> : <>
          <div className="mt-5"><PrayerTimer minutes={challenge?.minutes_per_day || 10} musicItems={musicItems} /></div>
          <Button className="mt-4 min-h-12 bg-[#dfcf9c] text-[#173326] shadow-none hover:bg-[#eadfbd]" disabled={busy || !checkinOpen} onClick={checkin}>{busy ? "Saving…" : todayDone ? "Today’s prayer is complete" : journeyComplete ? "Journey complete" : !checkinOpen ? "Check-in unavailable" : "Complete Today’s Prayer"}</Button>
          {message && <p role="status" aria-live="polite" className="mt-3 rounded-xl bg-white/10 px-4 py-3 text-sm">{message}</p>}
        </>}
      </article>
      <aside className="flex flex-col justify-between rounded-[30px] border border-black/[.06] bg-white p-5 sm:p-7"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--dark-moss-green)]">Your rhythm</p><p className="mt-3 font-display text-4xl font-semibold text-[#182a1e]">{streak}<span className="ml-2 text-base font-medium text-black/45">day streak</span></p><p className="mt-2 text-sm text-black/55">Longest: {longestStreak} days · {total} completed in all</p><div className="mt-5 flex flex-wrap gap-2">{[3, 7, 14, 21, 30].filter((milestone) => milestone <= duration).map((milestone) => <span key={milestone} className={`rounded-full px-3 py-2 text-xs ${achievements.some((item) => item.milestone === milestone) ? "bg-[#f4eddf] text-[#70451e]" : "bg-black/5 text-black/40"}`}>{milestone} days {achievements.some((item) => item.milestone === milestone) ? "✓" : "·"}</span>)}</div>{achievements.length > 0 && <div className="mt-4"><ShareMilestone day={Math.max(...achievements.map((item) => item.milestone))}/></div>}</div><div className="mt-5 border-t border-black/[.07] pt-4"><Link href="/streak/settings" className="text-sm font-semibold text-[var(--dark-moss-green)]">Account and reminders →</Link></div></aside>
    </section>
  </div>;
}
