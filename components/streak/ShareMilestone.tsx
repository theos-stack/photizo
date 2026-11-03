"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Share2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ACHIEVEMENT_VESSEL_PATH, prayerAchievementMessage, renderPrayerAchievementPng, type AchievementFormat } from "@/lib/prayer-achievements";

type Stage = "celebrate" | "filling" | "share";

export function ShareMilestone({ day, streak, completedDays, displayName, initiallyOpen = false, onContinue }: { day: number; streak: number; completedDays: number; displayName: string; initiallyOpen?: boolean; onContinue?: () => void }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [stage, setStage] = useState<Stage>(initiallyOpen ? "celebrate" : "share");
  const [format, setFormat] = useState<AchievementFormat>("portrait");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const memberName = displayName.trim();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const encouragement = prayerAchievementMessage(day, completedDays);

  useEffect(() => {
    if (open) window.sessionStorage.setItem("photizo:achievement:open", "1");
    else window.sessionStorage.removeItem("photizo:achievement:open");
    window.dispatchEvent(new CustomEvent("photizo:achievement-visibility", { detail: { open } }));
    return () => {
      if (open) {
        window.sessionStorage.removeItem("photizo:achievement:open");
        window.dispatchEvent(new CustomEvent("photizo:achievement-visibility", { detail: { open: false } }));
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let current = true;
    let url = "";
    renderPrayerAchievementPng({ name: displayName, day, streak, completedDays, format })
      .then((blob) => {
        if (!current) return;
        url = URL.createObjectURL(blob);
        setImageUrl(url);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not prepare your share image."));
    return () => { current = false; if (url) URL.revokeObjectURL(url); };
  }, [completedDays, day, displayName, format, open, streak]);

  useEffect(() => {
    if (!open || stage === "share") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setStage(stage === "celebrate" ? "filling" : "share"), reducedMotion ? 250 : stage === "celebrate" ? 800 : 1000);
    return () => window.clearTimeout(timer);
  }, [open, stage]);

  const close = useCallback(() => {
    setOpen(false);
    onContinue?.();
  }, [onContinue]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])");
      if (!controls?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [close, open]);

  const caption = `I completed Day ${day} of the PHOTIZO 30-Day Prayer Streak! 🙏\n\nOne day at a time, I’m building a more intentional life of prayer.\n\nJoin the journey:\nhttps://photizonetwork.com/streak`;

  async function createBlob() {
    return renderPrayerAchievementPng({ name: displayName, day, streak, completedDays, format });
  }

  async function download() {
    setBusy(true); setMessage("");
    try {
      const blob = await createBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `photizo-prayer-day-${String(day).padStart(2, "0")}-${format === "portrait" ? "story" : "square"}.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setMessage("Your high-resolution PHOTIZO image is downloaded and ready to share.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The image could not be downloaded."); }
    finally { setBusy(false); }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setMessage("Your caption is copied. Paste it into WhatsApp or Instagram.");
    } catch {
      setMessage("Caption copying is unavailable in this browser. You can still download the image and share it.");
    }
  }

  async function share() {
    setBusy(true); setMessage("");
    try {
      const blob = await createBlob();
      const file = new File([blob], `photizo-prayer-day-${String(day).padStart(2, "0")}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `PHOTIZO Prayer Streak · Day ${day}`, text: caption });
        setMessage("Your image and caption are ready to share.");
      } else if (navigator.share) {
        await navigator.share({ title: `PHOTIZO Prayer Streak · Day ${day}`, text: caption });
        setMessage("Your caption was shared. Download the PNG to attach the artwork.");
      } else {
        await download();
        try { await navigator.clipboard.writeText(caption); setMessage("Image downloaded and caption copied. Share them together wherever you like."); } catch { setMessage("Image downloaded. Caption copying is unavailable in this browser."); }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setMessage("Sharing was cancelled. Your image is still here whenever you are ready.");
      else setMessage(error instanceof Error ? error.message : "Sharing is unavailable. Try downloading the image.");
    } finally { setBusy(false); }
  }

  if (!open) return <button ref={triggerRef} type="button" onClick={() => { setMessage(""); setImageUrl(""); setStage("share"); setOpen(true); }} className="rounded-full border border-[var(--dark-moss-green)] px-4 py-2 text-xs font-semibold text-[var(--dark-moss-green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]">View Day {day} achievement</button>;

  return <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#30251f]/55 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="achievement-title" className="relative my-3 max-h-[96svh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-[#c7a16c]/35 bg-[#fcf8f1] shadow-[0_28px_90px_rgba(48,37,31,.24)] focus:outline-none">
      <button ref={closeButtonRef} type="button" aria-label="Close achievement" onClick={close} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-[#30251f]/10 bg-white/90 text-[#30251f]/70 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a87535]"><X className="h-4 w-4" aria-hidden="true" /></button>
      {stage !== "share" ? <div className="relative grid min-h-[620px] items-center justify-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_44%,rgba(199,161,108,.22),transparent_52%),linear-gradient(145deg,#0d291e,#174331_60%,#0d291e)] px-5 py-14 text-center text-[#fffdf9] sm:min-h-[700px] sm:py-16">
        <div className="absolute inset-x-8 top-8 h-px bg-[#d3b177]/55" aria-hidden="true" />
        {stage === "celebrate" ? <div className="relative z-[1] max-w-2xl motion-safe:animate-[fadeUp_.55s_cubic-bezier(.2,.8,.2,1)_both]">
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#e4c68e]/70 bg-[#d8bc87] text-[#103426] shadow-[0_0_0_9px_rgba(211,177,119,.1),0_12px_38px_rgba(0,0,0,.22)] motion-safe:animate-[fadeUp_.55s_cubic-bezier(.2,.8,.2,1)_both]">
            <span className="absolute inset-[-8px] rounded-full border border-[#e4c68e]/35 motion-safe:animate-[pulse_1.8s_ease-out_infinite] motion-reduce:animate-none" aria-hidden="true" />
            <Check className="h-11 w-11 motion-safe:animate-[fadeUp_.45s_ease-out_.12s_both]" strokeWidth={2.4} aria-hidden="true" />
          </div>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.3em] text-[#e4c68e]">PHOTIZO · A MOMENT TO CELEBRATE</p>
          <h2 id="achievement-title" className="mt-5 font-display text-4xl font-semibold tracking-[-.03em] text-[#fffdf9] sm:text-6xl">Yes! You showed up.</h2>
          <p className="mt-4 text-base text-[#f4ead8] sm:text-xl">Day {day} Prayer Streak Completed</p>
          <p className="mt-3 text-sm text-white/65">One faithful moment, one day at a time.</p>
        </div> : <div className="relative z-[1] flex flex-col items-center motion-safe:animate-[fadeUp_.45s_ease-out_both]">
          <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#e4c68e]">YOUR PRAYER JOURNEY</p>
          <ProgressVessel completedDays={completedDays} animate />
          <p className="mt-5 font-display text-2xl font-semibold text-[#fffdf9]">{completedDays} of 30 days completed</p>
          <p className="mt-2 text-xs uppercase tracking-[.15em] text-white/65">{streak} consecutive {streak === 1 ? "day" : "days"} · a separate measure</p>
          <p className="mt-5 max-w-xl font-display text-lg text-[#f4ead8] sm:text-2xl">{encouragement}</p>
        </div>}
        <p className="relative z-[1] mt-9 text-[10px] font-medium uppercase tracking-[.2em] text-white/55">One day at a time · A life of prayer</p>
      </div> : <div className="grid gap-0 lg:grid-cols-[.85fr_1.15fr]">
        <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_44%,rgba(243,230,222,.62),transparent_54%),linear-gradient(155deg,#fffdf9,#f8f1e8_70%,#fcf8f1)] px-6 py-8 text-[#30251f] sm:px-9 sm:py-10">
          <div className="absolute inset-x-8 top-8 h-px bg-[#c7a16c]/40" aria-hidden="true" />
          <div className="relative z-[1] flex h-full flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#745c4d]">PHOTIZO NETWORK INTERNATIONAL</p>
            <h3 className="mt-7 font-display text-3xl font-semibold text-[#30251f]">Prayer Streak</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[.18em] text-[#a87535]">Day {String(day).padStart(2, "0")} complete</p>
            {memberName && <><p className="mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#745c4d]">Celebrating</p><p className="mt-1 max-w-sm break-words font-display text-2xl font-medium text-[#30251f]">{memberName}</p></>}
            <div className="mt-7"><ProgressVessel completedDays={completedDays} /></div>
            <p className="mt-4 font-display text-xl font-semibold">{completedDays} of 30 days completed</p>
            <p className="mt-1 text-[10px] uppercase tracking-[.13em] text-[#745c4d]">{streak} consecutive {streak === 1 ? "day" : "days"}</p>
            <p className="mt-5 max-w-sm font-display text-lg text-[#745c4d]">{encouragement}</p>
            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.2em] text-[#745c4d]">Join the 30-Day Prayer Streak</p>
            <p className="mt-1 text-xs text-[#30251f]">photizonetwork.com/streak</p>
          </div>
        </div>
        <div className="flex min-h-[620px] flex-col p-5 sm:p-8 lg:p-9">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">A keepsake from your journey</p>
          <h2 id="achievement-title" className="mt-2 font-display text-3xl font-semibold text-[#193326] sm:text-4xl">Day {day} · Prayer Streak Completed</h2>
          <p className="mt-2 text-sm text-black/55">{memberName ? `${memberName} · ` : ""}{completedDays} of 30 completed · {streak} consecutive {streak === 1 ? "day" : "days"}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-semibold text-black/60">Share format<select value={format} onChange={(event) => { setImageUrl(""); setFormat(event.target.value as AchievementFormat); }} className="ml-2 min-h-10 rounded-xl border border-black/15 bg-white px-3 text-sm text-[#173326]"><option value="portrait">Story · 1080 × 1920</option><option value="square">Square · 1080 × 1080</option></select></label>
            <span className="rounded-full bg-[#efe8d5] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#705d30]">{day === 30 ? "Journey complete" : `Day ${String(day).padStart(2, "0")} / 30`}</span>
          </div>
          <div className="mt-4 flex min-h-48 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#dfd4b8] bg-[#e7e2d6] p-3 sm:min-h-64">
            {imageUrl ? <Image src={imageUrl} unoptimized width={1080} height={format === "portrait" ? 1920 : 1080} alt={`PHOTIZO Day ${day} prayer streak artwork, showing ${completedDays} completed days`} className={`${format === "portrait" ? "max-h-[42svh]" : "max-h-[42svh]"} max-w-full rounded-lg object-contain shadow-[0_12px_35px_rgba(12,31,21,.2)]`} /> : <p className="py-16 text-sm text-black/50">Preparing your high-resolution image…</p>}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy || !imageUrl} onClick={() => void share()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--evergreen)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,51,38,.18)] transition hover:bg-[#214a35] disabled:opacity-50"><Share2 className="h-4 w-4" aria-hidden="true" />Share My Prayer Streak</button>
            <button type="button" disabled={busy || !imageUrl} onClick={() => void download()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--dark-moss-green)] px-4 text-sm font-semibold text-[var(--dark-moss-green)] transition hover:bg-[#edf2e9] disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />Download Image</button>
            <button type="button" onClick={() => void copyCaption()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm font-semibold text-black/65 transition hover:bg-black/5"><Copy className="h-4 w-4" aria-hidden="true" />Copy caption</button>
            <Link href="/streak/dashboard" onClick={() => { setOpen(false); onContinue?.(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-black/60 transition hover:bg-black/5">Continue<ExternalLink className="h-3.5 w-3.5 rotate-45" aria-hidden="true" /></Link>
          </div>
          {message && <p role="status" aria-live="polite" className="mt-3 min-h-5 text-center text-xs leading-5 text-[var(--dark-moss-green)]">{message}</p>}
          <p className="mt-2 text-center text-[10px] leading-4 text-black/40">The vessel counts completed days. Your consecutive streak is shown separately.</p>
        </div>
      </div>}
      {stage !== "share" && <div className="sr-only" role="status" aria-live="polite">{stage === "celebrate" ? `Day ${day} prayer check-in confirmed.` : `${completedDays} of 30 prayer days completed. ${encouragement}`}</div>}
    </section>
  </div>;
}

function ProgressVessel({ completedDays, animate = false }: { completedDays: number; animate?: boolean }) {
  const rawId = useId();
  const clipId = `prayer-vessel-${rawId.replaceAll(":", "")}`;
  const [displayDays, setDisplayDays] = useState(animate ? Math.max(0, completedDays - 1) : completedDays);
  useEffect(() => {
    if (!animate) return;
    const frame = window.requestAnimationFrame(() => setDisplayDays(completedDays));
    return () => window.cancelAnimationFrame(frame);
  }, [animate, completedDays]);
  const ratio = Math.max(0, Math.min(1, displayDays / 30));
  const fillBottom = 302;
  const fillHeight = 284 * ratio;
  const fillY = fillBottom - fillHeight;
  const full = ratio === 1;
  return <svg role="img" aria-label={`${completedDays} of 30 prayer days in the progress vessel${full ? ", journey complete" : ""}`} viewBox="0 0 220 310" className={`${animate ? "h-72 w-56" : "h-56 w-44"} overflow-visible ${full ? "drop-shadow-[0_0_14px_rgba(199,161,108,.28)]" : ""}`}>
    <defs>
      <linearGradient id={`${clipId}-glass`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fffdf9" stopOpacity=".8"/><stop offset=".44" stopColor="#fffdf9" stopOpacity=".22"/><stop offset="1" stopColor="#c7a16c" stopOpacity=".16"/></linearGradient>
      <linearGradient id={`${clipId}-liquid`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#dfc18e"/><stop offset=".2" stopColor="#c7a16c"/><stop offset="1" stopColor="#b4874f"/></linearGradient>
      <clipPath id={clipId}><path d={ACHIEVEMENT_VESSEL_PATH}/></clipPath>
      <filter id={`${clipId}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="110" cy="286" rx="72" ry="7" fill="#745c4d" opacity=".1" />
    <path d={ACHIEVEMENT_VESSEL_PATH} fill={`url(#${clipId}-glass)`} stroke="#a87535" strokeOpacity=".72" strokeWidth="1.8" />
    <g clipPath={`url(#${clipId})`}>
      <rect x="20" y={fillY} width="180" height={fillHeight} fill={`url(#${clipId}-liquid)`} className={animate ? "motion-safe:transition-[y,height] motion-safe:duration-1000 motion-safe:ease-out motion-reduce:transition-none" : ""} />
      {completedDays > 0 && <path d={`M34 ${fillY} Q110 ${fillY - 3} 186 ${fillY}`} fill="none" stroke="#fffdf9" strokeWidth="1.5" opacity=".84" filter={full ? `url(#${clipId}-glow)` : undefined} className={animate ? "motion-safe:transition-[d] motion-safe:duration-1000 motion-reduce:transition-none" : ""} />}
      <path d="M39 134c-9 30-9 91 0 122" fill="none" stroke="#fffdf9" strokeOpacity=".52" strokeWidth="3" />
    </g>
    <path d={ACHIEVEMENT_VESSEL_PATH} fill="none" stroke="#a87535" strokeOpacity=".64" strokeWidth="1.8" />
    <path d="M80 18h60M82 29h56M38 247q72 17 144 0" fill="none" stroke="#fffdf9" strokeOpacity=".78" strokeWidth="2" />
    <path d="M81 14h58M84 9h52" fill="none" stroke="#a87535" strokeOpacity=".74" strokeWidth="1.6" strokeLinecap="round" />
    {full && <g fill="#a87535"><circle cx="36" cy="91" r="1.6"/><circle cx="185" cy="91" r="1.8"/><circle cx="24" cy="186" r="1.5"/><circle cx="196" cy="194" r="1.6"/></g>}
    <text x="110" y="250" textAnchor="middle" fill="#30251f" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600" letterSpacing=".5">{completedDays} / 30</text>
  </svg>;
}
