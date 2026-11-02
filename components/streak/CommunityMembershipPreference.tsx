"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { communityJoinedKey } from "@/lib/invitation-coordinator";

export function CommunityMembershipPreference({ memberId, initialJoined }: { memberId: string; initialJoined: boolean }) {
  const [joined, setJoined] = useState(initialJoined);
  const [savedJoined, setSavedJoined] = useState(initialJoined);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/member/community-preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joined }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.persisted) {
        if (joined) window.localStorage.setItem(communityJoinedKey(memberId), "1");
        else window.localStorage.removeItem(communityJoinedKey(memberId));
        setSavedJoined(joined);
        setMessage("Your community preference is saved to your PHOTIZO account.");
      } else {
        setMessage(result.error || "Your account could not save this preference yet.");
      }
    } catch { setMessage("Could not reach PHOTIZO to save this preference."); }
    finally { setBusy(false); }
  }

  return <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-soft sm:p-8">
    <h2 className="font-display text-2xl font-bold">WhatsApp community</h2>
    <p className="mt-2 text-sm leading-6 text-black/60">This is your confirmation only; PHOTIZO does not verify WhatsApp group membership. You can change it at any time.</p>
    <label className="mt-4 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={joined} onChange={(event) => setJoined(event.target.checked)} className="mt-1" />I’ve joined the PHOTIZO WhatsApp community.</label>
    <Button type="button" onClick={() => void save()} disabled={busy || joined === savedJoined} className="mt-4">{busy ? "Saving…" : "Save community preference"}</Button>
    {message && <p role="status" className="mt-3 text-sm text-[var(--dark-moss-green)]">{message}</p>}
  </section>;
}
