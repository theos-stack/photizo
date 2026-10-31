"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "@/lib/prayer-campaign";

export function CampaignCountdown({ startsAt, serverNow, timeZone = "Africa/Lagos" }: { startsAt: string; serverNow: string; timeZone?: string }) {
  const serverNowMs = new Date(serverNow).getTime();
  const [now, setNow] = useState(serverNowMs);
  const target = new Date(startsAt).getTime();
  const remaining = Math.max(0, target - now);
  const parts = countdownParts(remaining);
  useEffect(() => {
    const mountedAt = performance.now();
    const timer = window.setInterval(() => setNow(serverNowMs + performance.now() - mountedAt), 1000);
    return () => window.clearInterval(timer);
  }, [serverNowMs]);
  useEffect(() => {
    if (remaining === 0) window.location.reload();
  }, [remaining]);
  const items = [["Days", parts.days], ["Hours", parts.hours], ["Minutes", parts.minutes], ["Seconds", parts.seconds]] as const;
  return <section aria-label="Campaign countdown" className="rounded-[28px] border border-[#d7c69b]/35 bg-white p-5 text-center shadow-[0_18px_55px_rgba(24,42,30,.07)] sm:p-7">
    <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">Your journey is confirmed</p>
    <h2 className="mt-2 font-display text-2xl font-semibold text-[#182a1e] sm:text-3xl">The journey begins soon.</h2>
    <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">{items.map(([label, value]) => <div key={label} className="rounded-2xl bg-[#f7f4eb] px-2 py-3 sm:py-4"><p className="font-display text-2xl font-semibold tabular-nums text-[#173326] sm:text-4xl">{String(value).padStart(2, "0")}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-[.14em] text-black/50 sm:text-[10px]">{label}</p></div>)}</div>
    <p className="mt-4 text-xs text-black/55">Starts November 1, 2026 at 9:00 AM {timeZone === "Africa/Lagos" ? "WAT" : timeZone}.</p>
  </section>;
}
