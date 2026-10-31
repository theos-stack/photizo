"use client";

import { useEffect, useState } from "react";

export function PrayerTimer({ minutes = 10 }: { minutes?: number }) {
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);
  const complete = seconds === 0;
  return <div className="rounded-3xl border border-[rgba(72,108,38,0.12)] bg-[#fbfaf6] p-5 sm:p-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[var(--dark-moss-green)]">Quiet time</p><p className="mt-1 text-sm text-black/60">A gentle guide, not a measure of prayer.</p></div><div aria-live="polite" className="font-display text-3xl font-bold tabular-nums">{String(Math.floor(seconds / 60)).padStart(2,"0")}:{String(seconds % 60).padStart(2,"0")}</div></div>
    <div className="mt-4 flex gap-3"><button type="button" className="rounded-full bg-[var(--dark-moss-green)] px-5 py-3 text-sm font-semibold text-white" onClick={() => setRunning(!running)}>{complete ? "Completed" : running ? "Pause" : seconds === minutes*60 ? "Start timer" : "Resume"}</button><button type="button" className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold" onClick={() => { setRunning(false); setSeconds(minutes*60); }}>Reset</button></div>
  </div>;
}
