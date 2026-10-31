"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, Heart } from "lucide-react";
import { Button } from "@/components/Button";
import { countdownParts } from "@/lib/prayer-campaign";

function timeLabel(startsAt: string, timeZone: string) {
  const date = new Date(startsAt);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  return `${day} · ${time} ${timeZone === "Africa/Lagos" ? "WAT" : timeZone}`;
}

export function CampaignPrelaunchDashboard({
  startsAt,
  serverNow,
  timeZone,
  challengeId,
  isEnrolled,
  scheduleConfirmed = true,
}: {
  startsAt: string | null;
  serverNow: string | null;
  timeZone: string;
  challengeId: string;
  isEnrolled: boolean;
  scheduleConfirmed?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const initialNow = serverNow ? new Date(serverNow).getTime() : 0;
  const [now, setNow] = useState(initialNow);
  const target = startsAt ? new Date(startsAt).getTime() : 0;
  const remaining = scheduleConfirmed && target > 0 ? Math.max(0, target - now) : null;
  const parts = countdownParts(remaining || 0);

  useEffect(() => {
    if (!scheduleConfirmed || !startsAt || !serverNow) return;
    const mountedAt = performance.now();
    const timer = window.setInterval(() => {
      const nextNow = initialNow + performance.now() - mountedAt;
      setNow(nextNow);
      if (nextNow >= target) {
        window.clearInterval(timer);
        router.refresh();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [initialNow, router, scheduleConfirmed, serverNow, startsAt, target]);

  async function join() {
    if (!scheduleConfirmed) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/member/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Your place could not be saved yet. Please try again shortly.");
      } else {
        setMessage("Your place is saved. We’ll meet you here when the journey begins.");
        router.refresh();
      }
    } catch {
      setMessage("We could not save your place just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-[calc(100svh-64px)] bg-[#f7f5ed] px-4 py-6 text-[#173326] sm:px-6 sm:py-10">
    <section className="relative mx-auto flex min-h-[min(720px,calc(100svh-112px))] max-w-5xl flex-col justify-center overflow-hidden rounded-[32px] bg-[#173326] px-5 py-8 text-white shadow-[0_30px_100px_rgba(23,51,38,.19)] sm:px-10 sm:py-12 lg:px-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(223,207,156,.18),transparent_45%),linear-gradient(155deg,transparent_58%,rgba(255,255,255,.035))]" />
      <div className="relative mx-auto w-full max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#dfcf9c]">PHOTIZO Network International</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[.24em] text-white/55">The 30-Day Prayer Streak</p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">Something Beautiful Begins With Prayer.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Your 30-day journey of consistency, devotion and fellowship with God begins soon.</p>

        {remaining !== null ? <div className="mx-auto mt-8 max-w-2xl sm:mt-10" aria-label="Countdown to the prayer challenge">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">{[["Days", parts.days], ["Hours", parts.hours], ["Minutes", parts.minutes], ["Seconds", parts.seconds]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.055] px-1 py-3.5 sm:rounded-3xl sm:py-5"><p className="font-display text-3xl font-semibold tabular-nums text-[#f6edcf] sm:text-5xl lg:text-6xl">{String(value).padStart(2, "0")}</p><p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[.15em] text-white/50 sm:text-[10px] sm:tracking-[.22em]">{label}</p></div>)}</div>
          <p className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-medium text-white/70 sm:text-sm"><Clock3 className="h-4 w-4 text-[#dfcf9c]"/>{timeLabel(startsAt!, timeZone)}</p>
        </div> : <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[.05] px-5 py-4 text-sm text-white/70">We’re preparing your first day. Your prayer journey will open here as soon as the start time is confirmed.</div>}

        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
          {isEnrolled ? <p className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#dfcf9c]/40 bg-[#dfcf9c]/10 px-6 text-sm font-semibold text-[#f6edcf]"><Check className="h-4 w-4"/>Your place is saved</p> : <Button type="button" onClick={join} disabled={busy || !scheduleConfirmed} className="min-h-12 w-full bg-[#dfcf9c] px-7 text-sm font-semibold text-[#173326] shadow-none hover:bg-[#eee2bc] sm:w-auto">{busy ? "Saving your place…" : "Join the Prayer Streak"}<ArrowRight className="ml-2 h-4 w-4"/></Button>}
          <Link href="/member" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white/80 transition hover:bg-white/10"><Heart className="h-4 w-4"/>PHOTIZO Member Home</Link>
        </div>
        {message && <p role="status" className="mx-auto mt-3 max-w-xl text-sm text-[#f6edcf]">{message}</p>}

        <div className="mx-auto mt-8 max-w-xl border-t border-white/10 pt-5">
          <p className="font-display text-lg font-semibold text-[#f6edcf] sm:text-xl">30 days. One commitment. A deeper life of prayer.</p>
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/55 sm:gap-5 sm:text-xs"><span>Join</span><span aria-hidden="true" className="h-px w-7 bg-[#dfcf9c]/50 sm:w-12"/><span>Pray</span><span aria-hidden="true" className="h-px w-7 bg-[#dfcf9c]/50 sm:w-12"/><span>Check in</span></div>
        </div>
      </div>
    </section>
  </main>;
}
