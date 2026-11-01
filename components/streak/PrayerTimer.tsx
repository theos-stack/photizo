"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { completePrayerTimer, getPrayerTimerSnapshot, parsePrayerTimerState, pausePrayerTimer, remainingPrayerTime, savePrayerTimerSnapshot, startPrayerTimer, subscribePrayerTimer, type PrayerTimerState } from "@/lib/prayer-timer";

export function PrayerTimer({ minutes = 10, persistenceKey = "photizo:prayer-timer" }: { minutes?: number; persistenceKey?: string }) {
  const durationMs = Math.max(1, minutes) * 60_000;
  const timerSnapshot = useSyncExternalStore((callback) => subscribePrayerTimer(persistenceKey, callback), () => getPrayerTimerSnapshot(persistenceKey), () => null);
  const timer = parsePrayerTimerState(timerSnapshot, minutes);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(initialUpdate);
  }, []);

  useEffect(() => {
    if (timer.status !== "running") return;
    const reconcile = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (remainingPrayerTime(timer, currentTime) <= 0) {
        const completed = completePrayerTimer(timer);
        savePrayerTimerSnapshot(persistenceKey, completed);
      }
    };
    const interval = window.setInterval(reconcile, 1000);
    document.addEventListener("visibilitychange", reconcile);
    window.addEventListener("pageshow", reconcile);
    window.addEventListener("focus", reconcile);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", reconcile);
      window.removeEventListener("pageshow", reconcile);
      window.removeEventListener("focus", reconcile);
    };
  }, [persistenceKey, timer]);

  const active = timer;
  const remainingMs = now ? remainingPrayerTime(timer, now) : durationMs;
  const seconds = Math.ceil(remainingMs / 1000);
  const complete = active.status === "complete" || (active.status === "running" && seconds === 0);

  function save(next: PrayerTimerState) {
    setNow(Date.now());
    savePrayerTimerSnapshot(persistenceKey, next);
  }

  function toggle() {
    if (complete) return;
    save(active.status === "running" ? pausePrayerTimer(active, Date.now()) : startPrayerTimer(active, Date.now()));
  }

  function reset() {
    setNow(Date.now());
    savePrayerTimerSnapshot(persistenceKey, null);
  }

  return <div className="rounded-3xl border border-[rgba(72,108,38,0.12)] bg-[#fbfaf6] p-5 sm:p-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[var(--dark-moss-green)]">Quiet time</p><p className="mt-1 text-sm text-black/60">A gentle guide, not a measure of prayer.</p></div><div aria-live="polite" className="font-display text-3xl font-bold tabular-nums">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div></div>
    <div className="mt-4 flex gap-3"><button type="button" className="rounded-full bg-[var(--dark-moss-green)] px-5 py-3 text-sm font-semibold text-white" disabled={complete} onClick={toggle}>{complete ? "Completed" : active.status === "running" ? "Pause" : seconds === minutes * 60 ? "Start timer" : "Resume"}</button><button type="button" className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold" onClick={reset}>Reset</button></div>
    <p className="mt-3 text-xs leading-5 text-black/45">The timer keeps its place when you leave this page. Your browser may pause background updates; the display catches up when you return.</p>
  </div>;
}
