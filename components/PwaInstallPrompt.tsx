"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasActivePrayerSession, shouldShowInstallPrompt } from "@/lib/pwa-install";

const DISMISSED_KEY = "photizo:pwa:dismissed-at";
const INSTALLED_KEY = "photizo:pwa:installed";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const ios = typeof navigator !== "undefined"
    && /iphone|ipad|ipod/i.test(navigator.userAgent)
    && !("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);
  const installEventRef = useRef<InstallPromptEvent | null>(null);

  const maybeShow = useCallback(() => {
    const installedDisplay = window.matchMedia("(display-mode: standalone)").matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (installedDisplay) window.localStorage.setItem(INSTALLED_KEY, "1");
    const engaged = window.localStorage.getItem("photizo:meaningful-engagement") === "1"
      || window.location.pathname === "/streak/dashboard";
    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
    const supported = ios || Boolean(installEventRef.current);
    const inPrayerSession = hasActivePrayerSession(window.localStorage);
    setShow(supported && !inPrayerSession && shouldShowInstallPrompt({
      engaged,
      installed: window.localStorage.getItem(INSTALLED_KEY) === "1",
      dismissedAt,
    }));
  }, [ios]);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const handler = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as InstallPromptEvent;
      installEventRef.current = promptEvent;
      setInstallEvent(promptEvent);
      maybeShow();
    };
    const installed = () => {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      installEventRef.current = null;
      setShow(false);
      setInstallEvent(null);
    };
    const reevaluate = () => maybeShow();
    const engaged = () => { window.localStorage.setItem("photizo:meaningful-engagement", "1"); maybeShow(); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("photizo:meaningful-engagement", engaged);
    window.addEventListener("photizo:prayer-timer-storage", reevaluate);
    window.addEventListener("focus", reevaluate);
    const timer = window.location.pathname === "/streak/dashboard" ? window.setTimeout(engaged, 2500) : undefined;
    maybeShow();
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("photizo:meaningful-engagement", engaged);
      window.removeEventListener("photizo:prayer-timer-storage", reevaluate);
      window.removeEventListener("focus", reevaluate);
      if (timer) window.clearTimeout(timer);
    };
  }, [maybeShow]);

  async function install() {
    if (installEvent) {
      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        installEventRef.current = null;
        setInstallEvent(null);
        if (choice?.outcome === "accepted") {
          window.localStorage.setItem(INSTALLED_KEY, "1");
          setShow(false);
        } else dismiss();
      } catch {
        installEventRef.current = null;
        setInstallEvent(null);
        dismiss();
      }
      return;
    }
    if (ios) setInstructionsOpen(true);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
  }

  if (!show) return null;
  return <aside className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-5" aria-live="polite">
    <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">Keep Your Prayer Journey Close</p><p className="mt-1 text-sm leading-6 text-black/60">Install PHOTIZO for quick access to your Prayer Streak, daily progress and prayer reminders.</p></div><button type="button" onClick={dismiss} className="px-2 text-lg" aria-label="Dismiss install invitation">×</button></div>
    <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => void install()} className="rounded-full bg-[var(--dark-moss-green)] px-5 py-2.5 text-sm font-semibold text-white">Install PHOTIZO</button><button type="button" onClick={dismiss} className="rounded-full px-4 py-2.5 text-sm font-medium text-black/60">Maybe Later</button></div>
    {ios && instructionsOpen && <p className="mt-3 rounded-xl bg-[#fbfaf6] p-3 text-sm leading-6">In your browser, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>. Installation does not enable notifications.</p>}
  </aside>;
}
