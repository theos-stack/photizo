"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, UsersRound, X } from "lucide-react";
import { Button } from "@/components/Button";
import { hasActivePrayerSession } from "@/lib/pwa-install";
import { communityConfirmOpenKey, communityDismissedKey, communityJoinedKey, getActiveInvitation, INVITATION_ACTIVE_EVENT, INVITATION_ACTIVE_KEY } from "@/lib/invitation-coordinator";
import { PHOTIZO_WHATSAPP_INVITE } from "@/lib/community-invitations";

const CELEBRATION_KEY = "photizo:achievement:open";
type Step = "invite" | "confirm";

export function PrayerCommunityInvite({ memberId, eligible = true }: { memberId: string; eligible?: boolean }) {
  const [step, setStep] = useState<Step | null>(null);
  const [joined, setJoined] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmedLocally, setConfirmedLocally] = useState(false);
  const [showLocalConfirmation, setShowLocalConfirmation] = useState(false);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef<Step | null>(null);
  useEffect(() => { stepRef.current = step; }, [step]);

  const release = useCallback(() => {
    setStep(null);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const wasActive = window.sessionStorage.getItem(INVITATION_ACTIVE_KEY) === "community";
    if (wasActive) {
      window.sessionStorage.removeItem(INVITATION_ACTIVE_KEY);
      window.dispatchEvent(new CustomEvent(INVITATION_ACTIVE_EVENT, { detail: { kind: null } }));
    }
  }, []);

  const syncPrompt = useCallback((schedule = true) => {
    if (!eligible || !memberId) { release(); return; }
    const activePrayer = hasActivePrayerSession(window.localStorage);
    const celebrating = window.sessionStorage.getItem(CELEBRATION_KEY) === "1";
    const activeInvitation = getActiveInvitation(window.sessionStorage);
    const canShow = !joined
      && window.localStorage.getItem(communityJoinedKey(memberId)) !== "1"
      && window.sessionStorage.getItem(communityDismissedKey(memberId)) !== "1"
      && !activePrayer
      && !celebrating
      && (!activeInvitation || activeInvitation === "community");
    if (!canShow) { release(); return; }
    if (!schedule || stepRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const latestInvitation = getActiveInvitation(window.sessionStorage);
      if (hasActivePrayerSession(window.localStorage) || window.sessionStorage.getItem(CELEBRATION_KEY) === "1" || (latestInvitation && latestInvitation !== "community")) return;
      window.sessionStorage.setItem(INVITATION_ACTIVE_KEY, "community");
      window.dispatchEvent(new CustomEvent(INVITATION_ACTIVE_EVENT, { detail: { kind: "community" } }));
      setStep("invite");
    }, 1200);
  }, [eligible, joined, memberId, release]);

  useEffect(() => {
    let current = true;
    async function loadPreference() {
      try {
        const response = await fetch("/api/member/community-preference", { cache: "no-store" });
        const result = await response.json();
        if (!current) return;
        const isJoined = result.joined === true || window.localStorage.getItem(communityJoinedKey(memberId)) === "1";
        setJoined(isJoined);
        if (isJoined) release(); else syncPrompt();
      } catch {
        if (current) {
          setJoined(window.localStorage.getItem(communityJoinedKey(memberId)) === "1");
          syncPrompt();
        }
      }
    }
    void loadPreference();
    const refresh = () => syncPrompt();
    window.addEventListener("photizo:prayer-timer-storage", refresh);
    window.addEventListener("photizo:achievement-visibility", refresh);
    window.addEventListener(INVITATION_ACTIVE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("photizo:prayer-timer-storage", refresh);
      window.removeEventListener("photizo:achievement-visibility", refresh);
      window.removeEventListener(INVITATION_ACTIVE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [memberId, release, syncPrompt]);

  function dismiss() {
    window.sessionStorage.setItem(communityDismissedKey(memberId), "1");
    window.sessionStorage.removeItem(communityConfirmOpenKey(memberId));
    release();
  }

  function openWhatsApp() {
    window.open(PHOTIZO_WHATSAPP_INVITE, "_blank", "noopener,noreferrer");
    window.sessionStorage.setItem(communityConfirmOpenKey(memberId), "1");
    setStep("confirm");
  }

  async function confirmJoined() {
    setSaving(true);
    try {
      const response = await fetch("/api/member/community-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joined: true }),
      });
      const result = await response.json().catch(() => ({}));
      window.localStorage.setItem(communityJoinedKey(memberId), "1");
      setJoined(true);
      setConfirmedLocally(result.persisted !== true || !response.ok);
      setShowLocalConfirmation(result.persisted !== true || !response.ok);
      release();
    } catch {
      window.localStorage.setItem(communityJoinedKey(memberId), "1");
      setJoined(true);
      setConfirmedLocally(true);
      setShowLocalConfirmation(true);
      release();
    } finally { setSaving(false); }
  }

  if (!step) return joined && confirmedLocally && showLocalConfirmation ? <div className="fixed bottom-4 left-4 right-4 z-[85] mx-auto max-w-md rounded-2xl border border-[#dfcf9c]/55 bg-[#fbfaf6] p-4 text-sm leading-6 text-[#173326] shadow-xl" role="status">Your confirmation is saved on this device. Account-wide sync is unavailable until the community preference update is installed. <button type="button" onClick={() => setShowLocalConfirmation(false)} className="ml-2 font-semibold underline">Dismiss</button></div> : null;

  return <div className="fixed inset-0 z-[80] grid place-items-end bg-black/45 p-3 sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="community-invite-title" aria-describedby="community-invite-copy" className="w-full max-w-md rounded-[28px] border border-[#dfcf9c]/55 bg-[#fbfaf6] p-6 text-[#173326] shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#e9efe6] text-[var(--dark-moss-green)]"><UsersRound className="h-5 w-5" aria-hidden="true" /></div><button type="button" onClick={dismiss} aria-label="Close WhatsApp community invitation" className="rounded-full p-2 text-black/50 hover:bg-black/5"><X className="h-5 w-5" aria-hidden="true" /></button></div>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.24em] text-[#9c8246]">PHOTIZO Network International</p>
      <h2 id="community-invite-title" className="mt-2 font-display text-3xl font-semibold">{step === "invite" ? "Don’t Walk This Journey Alone." : "Have you joined our community?"}</h2>
      <p id="community-invite-copy" className="mt-3 text-sm leading-6 text-black/65">{step === "invite" ? "Prayer grows stronger with encouragement. Join other believers on the PHOTIZO Prayer Streak, share your journey and stay connected throughout the 30 days." : "If you joined the PHOTIZO WhatsApp community, let us know. We don’t verify group membership; this is your personal confirmation."}</p>
      {step === "invite" && <p className="mt-3 rounded-xl bg-white px-4 py-3 text-xs leading-5 text-black/55">WhatsApp group participation may make your phone number visible to other members. Joining is optional.</p>}
      {step === "invite" ? <><Button type="button" onClick={openWhatsApp} className="mt-5 min-h-12 w-full bg-[var(--evergreen)] text-white shadow-none hover:bg-[#214a35]">Join WhatsApp Community <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button><button type="button" onClick={dismiss} className="mt-3 min-h-10 w-full text-sm font-medium text-black/55 hover:text-black">Maybe Later</button></> : <><Button type="button" disabled={saving} onClick={() => void confirmJoined()} className="mt-5 min-h-12 w-full bg-[var(--evergreen)] text-white shadow-none hover:bg-[#214a35]">{saving ? "Saving…" : "Yes, I’ve Joined"}</Button><button type="button" onClick={dismiss} className="mt-3 min-h-10 w-full text-sm font-medium text-black/55 hover:text-black">Not Yet</button></>}
    </section>
  </div>;
}
