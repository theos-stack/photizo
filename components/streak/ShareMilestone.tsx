"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { renderPrayerAchievementPng, type AchievementFormat } from "@/lib/prayer-achievements";

export function ShareMilestone({ day, streak, displayName, initiallyOpen = false, onContinue }: { day: number; streak: number; displayName: string; initiallyOpen?: boolean; onContinue?: () => void }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [format, setFormat] = useState<AchievementFormat>("portrait");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(initiallyOpen);

  useEffect(() => {
    if (!open) return;
    let current = true;
    let url = "";
    renderPrayerAchievementPng({ name: displayName, day, streak, format })
      .then((blob) => {
        if (!current) return;
        url = URL.createObjectURL(blob);
        setImageUrl(url);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not prepare the achievement image."))
      .finally(() => { if (current) setBusy(false); });
    return () => { current = false; if (url) URL.revokeObjectURL(url); };
  }, [day, displayName, format, open, streak]);

  const close = useCallback(() => {
    setOpen(false);
    onContinue?.();
  }, [onContinue]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  async function createBlob() {
    return renderPrayerAchievementPng({ name: displayName, day, streak, format });
  }

  async function download() {
    setBusy(true); setMessage("");
    try {
      const blob = await createBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `photizo-prayer-day-${day}-${format}.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Your PHOTIZO achievement PNG has been downloaded.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The image could not be downloaded."); }
    finally { setBusy(false); }
  }

  async function share() {
    setBusy(true); setMessage("");
    try {
      const blob = await createBlob();
      const file = new File([blob], `photizo-prayer-day-${day}-${format}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `PHOTIZO Prayer Streak · Day ${day}`, text: "One day at a time. Growing in prayer." });
        setMessage("Your achievement is ready to share.");
      } else if (navigator.share) {
        await navigator.share({ title: `PHOTIZO Prayer Streak · Day ${day}`, text: "One day at a time. Growing in prayer.", url: "https://photizonetwork.com/streak" });
        setMessage("The challenge link was shared. Download the PNG to share the image itself.");
      } else {
        await download();
        try { await navigator.clipboard?.writeText("https://photizonetwork.com/streak"); } catch { /* Download remains available. */ }
        setMessage("The PNG was downloaded. You can attach it to a post or message.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setMessage("Sharing was cancelled.");
      else {
        try { await download(); setMessage("Sharing is unavailable here, so the PNG was downloaded instead."); }
        catch { setMessage(error instanceof Error ? error.message : "Sharing is unavailable. Try downloading the PNG."); }
      }
    } finally { setBusy(false); }
  }

  if (!open) return <button type="button" onClick={() => { setMessage(""); setBusy(true); setOpen(true); }} className="rounded-full border border-[var(--dark-moss-green)] px-4 py-2 text-xs font-semibold text-[var(--dark-moss-green)]">View Day {day} achievement</button>;

  return <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#102016]/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="achievement-title" className="my-4 max-h-[95svh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#dfcf9c]/40 bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">PHOTIZO Network International</p><h2 id="achievement-title" className="mt-2 font-display text-3xl font-bold">Day {day} prayer achievement</h2><p className="mt-2 text-sm text-black/60">{displayName} · {streak} consecutive day{streak === 1 ? "" : "s"}</p></div><button type="button" aria-label="Close achievement" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/5 text-xl">×</button></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><label className="text-sm font-medium">Image shape<select value={format} onChange={(event) => { setBusy(true); setImageUrl(""); setFormat(event.target.value as AchievementFormat); }} className="ml-2 min-h-10 rounded-lg border border-black/15 bg-white px-3"><option value="portrait">Portrait</option><option value="square">Square</option></select></label><span className="text-xs text-black/45">A personal celebration—not a verified public record</span></div>
      <div className="mt-4 flex max-h-[48svh] justify-center overflow-hidden rounded-2xl bg-[#f4f2e9] p-3">{imageUrl ? <Image src={imageUrl} unoptimized width={1080} height={format === "portrait" ? 1350 : 1080} alt={`PHOTIZO Day ${day} prayer streak achievement for ${displayName}`} className={`${format === "portrait" ? "max-h-[44svh]" : "max-h-[40svh]"} max-w-full rounded-lg object-contain`} /> : <p className="self-center py-20 text-sm text-black/55">{busy ? "Preparing your PNG…" : "Image preview unavailable."}</p>}</div>
      <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => void share()} className="min-h-11 rounded-full bg-[var(--evergreen)] px-5 text-sm font-semibold text-white disabled:opacity-50">Share</button><button type="button" disabled={busy} onClick={() => void download()} className="min-h-11 rounded-full border border-[var(--dark-moss-green)] px-5 text-sm font-semibold text-[var(--dark-moss-green)] disabled:opacity-50">Download PNG</button><Link href="/streak/dashboard" onClick={() => { setOpen(false); onContinue?.(); }} className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-black/60 hover:bg-black/5">Continue</Link></div>
      {message && <p role="status" className="mt-3 text-sm text-[var(--dark-moss-green)]">{message}</p>}
    </section>
  </div>;
}
