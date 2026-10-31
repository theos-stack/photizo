"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/Button";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) { setError(true); setMessage("Use at least 8 characters for your new password."); return; }
    if (password !== confirm) { setError(true); setMessage("The passwords do not match yet."); return; }
    const client = getBrowserSupabaseClient();
    if (!client) { setError(true); setMessage("Password recovery is temporarily unavailable."); return; }
    setBusy(true);
    const { error: updateError } = await client.auth.updateUser({ password });
    setBusy(false);
    if (updateError) { setError(true); setMessage("This recovery link may have expired. Request a fresh password reset link and try again."); return; }
    setError(false); setMessage("Your password has been updated.");
    router.replace("/streak");
    router.refresh();
  }

  return <form onSubmit={submit} className="mt-7 space-y-5 rounded-[24px] border border-black/[.07] bg-white p-6 shadow-soft sm:p-8">
    <label className="block text-sm font-semibold text-[#29362d]">New password<div className="relative"><input required minLength={8} autoComplete="new-password" type={visible ? "text" : "password"} value={password} onChange={event=>setPassword(event.target.value)} className="mt-2 min-h-[50px] w-full rounded-xl border border-black/15 px-4 pr-12 outline-none focus:border-[var(--evergreen)] focus:ring-2 focus:ring-[var(--evergreen)]/10" placeholder="At least 8 characters"/><button type="button" onClick={()=>setVisible(value=>!value)} aria-label={visible?"Hide password":"Show password"} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-black/45 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[var(--evergreen)]">{visible?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
    <label className="block text-sm font-semibold text-[#29362d]">Confirm new password<input required minLength={8} autoComplete="new-password" type={visible ? "text" : "password"} value={confirm} onChange={event=>setConfirm(event.target.value)} className="mt-2 min-h-[50px] w-full rounded-xl border border-black/15 px-4 outline-none focus:border-[var(--evergreen)] focus:ring-2 focus:ring-[var(--evergreen)]/10" placeholder="Enter it once more"/></label>
    <Button disabled={busy} className="min-h-[50px] w-full bg-[var(--evergreen)] text-white shadow-none hover:bg-[#214a35]">{busy?"Updating…":"Update password"}</Button>
    {message&&<p role={error?"alert":"status"} aria-live="polite" className={`rounded-xl px-4 py-3 text-sm leading-6 ${error?"bg-red-50 text-red-800":"bg-[#edf2e9] text-[var(--evergreen)]"}`}>{message}</p>}
  </form>;
}
