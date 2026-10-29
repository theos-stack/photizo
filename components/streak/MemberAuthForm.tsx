"use client";

import Link from "next/link";
import { useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSafeLocalRedirect } from "@/lib/local-redirect";
import { Button } from "@/components/Button";

export function MemberAuthForm({ mode, next = "/streak" }: { mode: "login" | "register" | "reset"; next?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = getBrowserSupabaseClient();
  const googleOAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
  const destination=getSafeLocalRedirect(next,typeof window==="undefined"?"https://photizo.invalid":window.location.origin);
  const nextQuery=encodeURIComponent(destination);
  const heading = mode === "register" ? "Create your member account" : mode === "reset" ? "Reset your password" : "Welcome back";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (!supabase) { setMessage("Member sign-in is not configured yet. Please try again later."); return; }
    setBusy(true);
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextQuery}` } });
      if(!error&&data.session){window.location.assign(destination);return;}
      setMessage(error ? error.message : "Account created. Check your email to verify your address, then sign in.");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=%2Fstreak%2Fsettings` });
      setMessage(error ? error.message : "If an account matches that email, a reset link is on its way.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else window.location.assign(destination);
    }
    setBusy(false);
  }

  async function google() {
    if (!supabase) { setMessage("Member sign-in is not configured yet."); return; }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${nextQuery}` } });
    if (error) setMessage(error.message);
  }

  return <div className="mx-auto w-full max-w-lg rounded-[30px] border border-[rgba(72,108,38,0.14)] bg-white p-6 shadow-soft sm:p-9">
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--dark-moss-green)]">PHOTIZO Member</p>
    <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">{heading}</h1>
    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Your prayer journey is personal. Your member account is separate from ministry administrator access.</p>
    {mode !== "reset" && googleOAuthEnabled && <Button type="button" variant="secondary" className="mt-6 w-full" onClick={google}>Continue with Google</Button>}
    {mode !== "reset" && googleOAuthEnabled && <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]"><span className="h-px flex-1 bg-black/10" />OR WITH EMAIL<span className="h-px flex-1 bg-black/10" /></div>}
    <form className="space-y-4" onSubmit={submit}>
      {mode === "register" && <label className="block text-sm font-medium">Display name<input required minLength={2} maxLength={100} autoComplete="name" className="mt-2 min-h-12 w-full rounded-2xl border border-black/15 px-4" value={name} onChange={(e) => setName(e.target.value)} /></label>}
      <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" className="mt-2 min-h-12 w-full rounded-2xl border border-black/15 px-4" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {mode !== "reset" && <label className="block text-sm font-medium">Password<input required minLength={8} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} className="mt-2 min-h-12 w-full rounded-2xl border border-black/15 px-4" value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "register" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</Button>
    </form>
    {message && <p role="status" className="mt-4 rounded-xl bg-[var(--honeydew)] p-3 text-sm leading-6">{message}</p>}
    <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-[var(--dark-moss-green)]">
      {mode === "register" ? <Link href={`/streak/login?next=${nextQuery}`}>Already a member? Sign in</Link> : mode === "reset" ? <Link href={`/streak/login?next=${nextQuery}`}>Back to sign in</Link> : <><Link href={`/streak/register?next=${nextQuery}`}>Create an account</Link><Link href={`/streak/forgot-password?next=${nextQuery}`}>Forgot password?</Link></>}
    </div>
  </div>;
}
