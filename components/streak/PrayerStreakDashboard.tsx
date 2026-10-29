"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { PrayerTimer } from "@/components/streak/PrayerTimer";
import { journeyMetrics } from "@/lib/prayer-streak-core";
import { ShareMilestone } from "@/components/streak/ShareMilestone";

type Challenge = { id: string; title: string; description: string; duration_days: number; minutes_per_day: number };
type Day = { day_number: number; title: string; bible_reference: string; encouragement: string; prayer_points: string[]; completion_message: string };
type Enrollment = { id: string; start_local_date: string; status: string; challenge_id: string; current_streak?:number;longest_streak?:number;missed_days?:number;prayer_challenges: Challenge };
type Checkin = { local_date: string; journey_day: number };

export function PrayerStreakDashboard({ profile, challenge, enrollment, days, checkins, achievements, today }: { profile: { display_name?: string; timezone?: string } | null; challenge: Challenge | null; enrollment: Enrollment | null; days: Day[]; checkins: Checkin[]; achievements: { milestone: number }[]; today: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const completeDays = new Set(checkins.map((item) => item.journey_day));
  const metrics = enrollment ? journeyMetrics(enrollment.start_local_date, checkins.map((item) => item.local_date), today) : null;
  const currentDay = metrics?.currentDay || 1;
  const todayDone = checkins.some((item) => item.local_date === today);
  const day = days.find((item) => item.day_number === currentDay) || (currentDay > 30 ? days.find((item) => item.day_number === 30) : days[0]);
  const total = metrics?.totalCompleted || 0;
  const streak = metrics?.currentStreak || 0;
  const longestStreak = metrics?.longestStreak || 0;
  const missedDays = metrics?.missedDays || 0;
  const journeyComplete = enrollment?.status === "completed" || Boolean(metrics?.completed);

  async function enroll() {
    if (!challenge) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/member/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challenge_id: challenge.id }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) setMessage(payload.error || "Could not join the challenge."); else router.refresh();
  }
  async function checkin() {
    if (!enrollment) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/member/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollment_id: enrollment.id }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) setMessage(payload.error || "Could not save your check-in."); else { setMessage(day?.completion_message || "Your prayer check-in is saved."); router.refresh(); }
  }

  if (!enrollment) return <section className="mx-auto max-w-3xl rounded-[32px] bg-white p-7 shadow-soft sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--dark-moss-green)]">Your next step</p><h1 className="mt-3 font-display text-4xl font-bold">{profile?.display_name ? `Welcome, ${profile.display_name}` : "Welcome to your prayer journey"}</h1><p className="mt-4 leading-7 text-black/65">{challenge?.description || "Join a published prayer challenge and begin a steady, personal rhythm."}</p><Button className="mt-7" disabled={!challenge || busy} onClick={enroll}>{busy ? "Joining…" : "Join the 30-day challenge"}</Button>{message && <p role="status" className="mt-4 text-sm text-red-700">{message}</p>}</section>;

  return <div className="space-y-7">
    <section className="rounded-[32px] bg-[#fbfaf6] p-6 sm:p-9"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--dark-moss-green)]">Your prayer journey</p><h1 className="mt-3 font-display text-4xl font-bold">{profile?.display_name ? `Welcome, ${profile.display_name}` : "Welcome back"}</h1><p className="mt-2 text-sm text-black/60">{journeyComplete ? "Journey complete" : `Day ${currentDay} of 30 · Keep moving at your own pace`}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white px-5 py-4 text-center shadow-soft"><p className="text-xs uppercase tracking-widest text-black/50">Current streak</p><p className="mt-1 font-display text-4xl font-bold text-[var(--dark-moss-green)]">{streak}<span className="ml-1 text-base">days</span></p></div><div className="rounded-2xl bg-white px-5 py-4 text-center shadow-soft"><p className="text-xs uppercase tracking-widest text-black/50">Longest streak</p><p className="mt-1 font-display text-4xl font-bold text-[var(--dark-moss-green)]">{Math.max(longestStreak,enrollment.longest_streak||0)}<span className="ml-1 text-base">days</span></p></div></div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-[var(--dark-moss-green)] transition-all" style={{ width: `${Math.min(100, (total/30)*100)}%` }} /></div><div className="mt-2 text-right text-xs text-black/50">{total} of 30 completed days · {missedDays} missed days</div></section>
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-soft sm:p-8"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.23em] text-[var(--dark-moss-green)]">Today’s prayer guide</p><h2 className="mt-2 font-display text-3xl font-bold">{day?.title || `Day ${currentDay}`}</h2></div><span className="h-fit rounded-full bg-[#f4eddf] px-4 py-2 text-xs font-semibold">{day?.bible_reference}</span></div><p className="mt-4 leading-7 text-black/65">{day?.encouragement}</p><ul className="mt-5 space-y-3">{(day?.prayer_points || []).map((point) => <li key={point} className="flex gap-3 text-sm leading-6"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />{point}</li>)}</ul><div className="mt-6"><PrayerTimer minutes={10} /></div><Button className="mt-5 w-full sm:w-auto" disabled={busy || todayDone || journeyComplete} onClick={checkin}>{busy ? "Saving…" : todayDone ? "Prayer marked complete" : journeyComplete ? "Journey complete" : "Mark prayer complete"}</Button>{message && <p role="status" className="mt-4 text-sm text-[var(--dark-moss-green)]">{message}</p>}<p className="mt-3 text-xs leading-5 text-black/50">Check-in is your personal declaration that you completed prayer. The timer helps you focus; it does not verify prayer.</p></section>
      <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">30-day calendar</h2><Link className="text-sm font-semibold text-[var(--dark-moss-green)]" href="/streak/history">History</Link></div><div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6">{Array.from({length:30},(_,i)=>i+1).map((n)=><div key={n} title={`Day ${n}${completeDays.has(n)?", completed":""}`} className={`flex aspect-square items-center justify-center rounded-xl text-sm font-semibold ${completeDays.has(n)?"bg-[var(--dark-moss-green)] text-white":n===currentDay?"border-2 border-[var(--gold)] bg-[#fffaf0]":"bg-[#f5f4ef] text-black/50"}`}>{n}</div>)}</div><h3 className="mt-7 font-display text-xl font-bold">Milestones</h3><div className="mt-3 flex flex-wrap gap-2">{[3,7,14,21,30].map((n)=><span key={n} className={`rounded-full px-3 py-2 text-xs ${achievements.some((a)=>a.milestone===n)?"bg-[#f4eddf] text-[#70451e]":"bg-black/5 text-black/45"}`}>{n} days {achievements.some((a)=>a.milestone===n)?"✓":"·"}</span>)}</div>{achievements.length>0&&<ShareMilestone day={Math.max(...achievements.map(a=>a.milestone))}/>}<Link href="/streak/notifications" className="mt-6 inline-block text-sm font-semibold text-[var(--dark-moss-green)]">Notification history →</Link><br/><Link href="/streak/settings" className="mt-2 inline-block text-sm font-semibold text-[var(--dark-moss-green)]">Reminder and account settings →</Link></section>
    </div>
  </div>;
}
