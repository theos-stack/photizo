"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { hasActivePrayerSession, getInstallPlatform, isPrayerStreakPath, type InstallPlatform, shouldShowInstallPrompt } from "@/lib/pwa-install";
import { getActiveInvitation, INSTALL_DISMISSED_SESSION_KEY, INSTALL_SHOWN_SESSION_KEY, INVITATION_ACTIVE_EVENT, INVITATION_ACTIVE_KEY } from "@/lib/invitation-coordinator";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type NavigatorWithStandalone = Navigator & { standalone?: boolean };
const CELEBRATION_KEY = "photizo:achievement:open";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as NavigatorWithStandalone).standalone);
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [platform, setPlatform] = useState<InstallPlatform>("unsupported");
  const [show, setShow] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const installEventRef = useRef<InstallPromptEvent | null>(null);
  const scheduleRef = useRef<number | null>(null);
  const showRef = useRef(false);
  const initializedRef = useRef(false);
  useEffect(() => { showRef.current = show; }, [show]);

  const shouldShowNow = useCallback((manual = false) => {
    const standalone = isStandalone();
    const detected = getInstallPlatform(navigator.userAgent, standalone);
    setPlatform(detected);
    if (standalone) return false;
    const activePrayer = hasActivePrayerSession(window.localStorage);
    const celebrating = window.sessionStorage.getItem(CELEBRATION_KEY) === "1";
    if (activePrayer || celebrating) return false;
    const activeInvitation = getActiveInvitation(window.sessionStorage);
    if (activeInvitation && activeInvitation !== "install") return false;
    if (manual) return detected !== "unsupported";
    return shouldShowInstallPrompt({
      eligiblePath: isPrayerStreakPath(pathname),
      platform: detected,
      installed: false,
      dismissedThisSession: window.sessionStorage.getItem(INSTALL_DISMISSED_SESSION_KEY) === "1",
      alreadyShownThisSession: window.sessionStorage.getItem(INSTALL_SHOWN_SESSION_KEY) === "1",
      invitationActive: activeInvitation !== null,
      prayerActive: activePrayer,
      celebrationActive: celebrating,
    });
  }, [pathname]);

  const release = useCallback(() => {
    setShow(false);
    setInstructionsOpen(false);
    showRef.current = false;
    if (window.sessionStorage.getItem(INVITATION_ACTIVE_KEY) === "install") {
      window.sessionStorage.removeItem(INVITATION_ACTIVE_KEY);
      window.dispatchEvent(new CustomEvent(INVITATION_ACTIVE_EVENT, { detail: { kind: null } }));
    }
  }, []);

  const open = useCallback((manual = false) => {
    if (!shouldShowNow(manual)) return;
    if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
    scheduleRef.current = window.setTimeout(() => {
      scheduleRef.current = null;
      if (!shouldShowNow(manual)) return;
      window.sessionStorage.setItem(INSTALL_SHOWN_SESSION_KEY, "1");
      window.sessionStorage.setItem(INVITATION_ACTIVE_KEY, "install");
      window.dispatchEvent(new CustomEvent(INVITATION_ACTIVE_EVENT, { detail: { kind: "install" } }));
      setShow(true);
    }, manual ? 0 : 900);
  }, [shouldShowNow]);

  useEffect(() => {
    // A page reload closes a stale in-page invitation; internal navigation preserves the active one.
    if (!initializedRef.current) {
      if (window.sessionStorage.getItem(INVITATION_ACTIVE_KEY) === "install") window.sessionStorage.removeItem(INVITATION_ACTIVE_KEY);
      initializedRef.current = true;
    }
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);

    const handler = (event: Event) => {
      event.preventDefault();
      installEventRef.current = event as InstallPromptEvent;
      open();
    };
    const installed = () => {
      installEventRef.current = null;
      setShow(false);
      setInstructionsOpen(false);
      release();
    };
    const manualOpen = () => open(true);
    const refresh = () => {
      if (isStandalone()) { installed(); return; }
      if (showRef.current && !shouldShowNow(true)) release();
      else if (!showRef.current) open();
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("photizo:install-app-request", manualOpen);
    window.addEventListener("photizo:prayer-timer-storage", refresh);
    window.addEventListener("photizo:achievement-visibility", refresh);
    window.addEventListener(INVITATION_ACTIVE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    const initialOpen = window.setTimeout(() => open(), 0);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("photizo:install-app-request", manualOpen);
      window.removeEventListener("photizo:prayer-timer-storage", refresh);
      window.removeEventListener("photizo:achievement-visibility", refresh);
      window.removeEventListener(INVITATION_ACTIVE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.clearTimeout(initialOpen);
      if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
    };
  }, [open, release, shouldShowNow]);

  async function install() {
    const promptEvent = installEventRef.current;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        installEventRef.current = null;
        if (choice.outcome === "accepted") {
          window.sessionStorage.setItem("photizo:install:accepted-this-session", "1");
          release();
        } else dismiss();
      } catch { setInstructionsOpen(true); }
      return;
    }
    setInstructionsOpen(true);
  }

  function dismiss() {
    window.sessionStorage.setItem(INSTALL_DISMISSED_SESSION_KEY, "1");
    release();
  }

  if (!show) return null;
  const ios = platform === "ios";
  const android = platform === "android";
  return <>
    <aside className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-lg rounded-[24px] border border-[#dfcf9c]/50 bg-[#fbfaf6] p-5 text-[#173326] shadow-[0_20px_65px_rgba(16,35,25,.24)] sm:inset-x-auto sm:right-5 sm:bottom-5" aria-labelledby="pwa-install-title" aria-describedby="pwa-install-copy">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#9c8246]">PHOTIZO Prayer Streak</p><h2 id="pwa-install-title" className="mt-2 font-display text-xl font-semibold">Your Prayer Journey, One Tap Away.</h2><p id="pwa-install-copy" className="mt-2 max-w-md text-sm leading-6 text-black/65">Install PHOTIZO Prayer Streak on your home screen. Open your prayer dashboard faster, stay connected to your progress and make daily prayer easier to keep up with.</p></div><button type="button" onClick={dismiss} className="rounded-full p-2 text-black/45 hover:bg-black/5" aria-label="Close install invitation">×</button></div>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void install()} className="min-h-11 rounded-full bg-[#173326] px-5 text-sm font-semibold text-white transition hover:bg-[#214a35]">Install PHOTIZO</button><button type="button" onClick={dismiss} className="min-h-11 rounded-full px-4 text-sm font-semibold text-black/55 hover:bg-black/5">Not Now</button></div>
    </aside>
    {instructionsOpen && <div className="fixed inset-0 z-[90] grid place-items-end bg-black/45 p-3 sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInstructionsOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="install-guide-title" className="w-full max-w-md rounded-[28px] border border-[#dfcf9c]/50 bg-[#fbfaf6] p-6 text-[#173326] shadow-2xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#9c8246]">Add PHOTIZO to your home screen</p>
        <h2 id="install-guide-title" className="mt-2 font-display text-2xl font-semibold">Keep your prayer journey close.</h2>
        {ios ? <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-black/70"><li>Open this page in Safari or your iPhone browser.</li><li>Tap the browser’s Share button.</li><li>Choose <strong>Add to Home Screen</strong>, then confirm.</li></ol> : android ? <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-black/70"><li>Open the browser menu (⋮).</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm the browser’s installation prompt.</li></ol> : <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-black/70"><li>Open your browser menu.</li><li>Choose <strong>Install PHOTIZO</strong> or <strong>Install page as app</strong>, if available.</li><li>Confirm the browser’s installation prompt.</li></ol>}
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs leading-5 text-black/55">This adds the Prayer Streak shortcut. It does not enable reminders or notifications.</p>
        <button type="button" onClick={() => { setInstructionsOpen(false); dismiss(); }} className="mt-5 min-h-11 w-full rounded-full bg-[#173326] px-5 text-sm font-semibold text-white">Got it</button>
      </section>
    </div>}
  </>;
}
