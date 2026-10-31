"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Eye, EyeOff, HeartHandshake, LockKeyhole } from "lucide-react";

import { Button } from "@/components/Button";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSafeLocalRedirect } from "@/lib/local-redirect";

type Feedback = { kind: "error" | "success"; text: string };

function friendlyAuthError(error: { message: string; status?: number }) {
  if (error.status === 429) return "Too many attempts just now. Wait a moment, then try again.";
  if (/invalid login credentials/i.test(error.message)) return "That email and password combination was not recognized. Check them or reset your password.";
  if (/email not confirmed/i.test(error.message)) return "Please confirm your email from your inbox before signing in.";
  if (/password/i.test(error.message)) return "Please choose a password with at least 8 characters.";
  if (/network|fetch/i.test(error.message)) return "We could not reach the sign-in service. Check your connection and try again.";
  return "We could not complete that request. Please try again in a moment.";
}

export function MemberAuthForm({ mode, next = "/streak" }: { mode: "login" | "register" | "reset"; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const supabase = getBrowserSupabaseClient();
  const googleOAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
  const origin = typeof window === "undefined" ? "https://photizonetwork.com" : window.location.origin;
  const destination = getSafeLocalRedirect(next, origin);
  const nextQuery = encodeURIComponent(destination);
  const heading = mode === "register" ? "Create your prayer account" : mode === "reset" ? "Reset your password" : "Welcome back";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!supabase) { setFeedback({ kind: "error", text: "Member sign-in is temporarily unavailable. Please try again shortly." }); return; }
    setBusy(true);

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() }, emailRedirectTo: `${origin}/auth/callback?next=${nextQuery}` },
      });
      if (!error && data.session) { window.location.assign(destination); return; }
      if (error) setFeedback({ kind: "error", text: friendlyAuthError(error) });
      else setVerificationSent(true);
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/auth/callback?next=%2Fstreak%2Freset-password` });
      setFeedback(error
        ? { kind: "error", text: friendlyAuthError(error) }
        : { kind: "success", text: "If an account matches that email, a password reset link is on its way." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setFeedback({ kind: "error", text: friendlyAuthError(error) });
      else { router.replace(destination); router.refresh(); return; }
    }
    setBusy(false);
  }

  async function signInWithGoogle() {
    if (!supabase) { setFeedback({ kind: "error", text: "Member sign-in is temporarily unavailable." }); return; }
    setFeedback(null); setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=${nextQuery}` } });
    if (error) { setBusy(false); setFeedback({ kind: "error", text: friendlyAuthError(error) }); }
  }

  const inputClass = "mt-2 min-h-[50px] w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-[#19251d] outline-none transition placeholder:text-black/35 focus:border-[var(--evergreen)] focus:ring-2 focus:ring-[var(--evergreen)]/10";

  return (
    <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-black/[.07] bg-white shadow-[0_28px_90px_rgba(17,37,28,.09)] lg:grid-cols-[.88fr_1.12fr]">
      <aside className="relative isolate overflow-hidden bg-[var(--evergreen)] p-6 text-white sm:p-9 lg:flex lg:min-h-[590px] lg:flex-col lg:justify-between lg:p-11">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 -z-10 h-44 w-44 rounded-full border border-white/[.08]" />
        <Link href="/prayer-streak" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-[#d6c38a] hover:text-white"><BookOpen className="h-4 w-4"/> PHOTIZO Prayer Challenge</Link>
        <div className="mt-10 max-w-md lg:mt-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.23em] text-white/55">A daily return to what matters</p>
          <p className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-.025em] sm:text-5xl">Come as you are. Begin with today.</p>
          <p className="mt-4 text-sm leading-7 text-white/68">Your personal space for Scripture, guided prayer and a steady rhythm held with grace.</p>
          <div className="mt-7 space-y-3 text-sm text-white/75">
            <p className="flex items-center gap-3"><BookOpen className="h-4 w-4 shrink-0 text-[#d6c38a]"/>Daily Scripture and prayer focus</p>
            <p className="flex items-center gap-3"><HeartHandshake className="h-4 w-4 shrink-0 text-[#d6c38a]"/>A personal journey, at your own pace</p>
            <p className="flex items-center gap-3"><LockKeyhole className="h-4 w-4 shrink-0 text-[#d6c38a]"/>Private member progress</p>
          </div>
        </div>
        <p className="mt-8 hidden text-xs text-white/45 lg:block">“Draw near to God, and he will draw near to you.” · James 4:8</p>
      </aside>

      <div className="p-6 sm:p-9 lg:px-12 lg:py-11">
        {verificationSent ? (
          <div className="flex min-h-[420px] flex-col justify-center" role="status" aria-live="polite">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2e9] text-[var(--evergreen)]"><BookOpen className="h-5 w-5"/></div>
            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">One more step</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.025em] text-[#182a1e] sm:text-5xl">Check your inbox.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-black/60">If we can create an account for <span className="font-semibold text-black/75">{email.trim()}</span>, we’ll send a confirmation link. Open it to verify your email and continue to your prayer journey.</p>
            <p className="mt-4 text-xs leading-6 text-black/45">If you do not see it soon, check your spam folder. You can return here to sign in after confirming.</p>
            <Link href={`/streak/login?next=${nextQuery}`} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--evergreen)] hover:underline">Return to sign in <ArrowRight className="h-4 w-4"/></Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">Your prayer journey</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.03em] text-[#182a1e] sm:text-[2.8rem]">{heading}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-black/55">{mode === "register" ? "Create a private account to save your daily guides and progress." : mode === "reset" ? "Enter your email and we’ll send a secure link to choose a new password." : "Pick up where you left off, one day at a time."}</p>

            {mode !== "reset" && googleOAuthEnabled && <Button type="button" variant="ghost" className="mt-6 w-full border-black/10" disabled={busy} onClick={signInWithGoogle}>Continue with Google</Button>}
            {mode !== "reset" && googleOAuthEnabled && <div className="my-5 flex items-center gap-3 text-[10px] font-semibold tracking-[.16em] text-black/35"><span className="h-px flex-1 bg-black/10"/>OR WITH EMAIL<span className="h-px flex-1 bg-black/10"/></div>}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              {mode === "register" && <label className="block text-sm font-semibold text-[#29362d]">Display name<input required minLength={2} maxLength={100} autoComplete="name" className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we address you?" /></label>}
              <label className="block text-sm font-semibold text-[#29362d]">Email address<input required type="email" autoComplete="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
              {mode !== "reset" && <label className="block text-sm font-semibold text-[#29362d]">Password<div className="relative"><input required minLength={8} type={passwordVisible ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} className={`${inputClass} pr-12`} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} /><button type="button" aria-label={passwordVisible ? "Hide password" : "Show password"} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-black/45 hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-[var(--evergreen)]">{passwordVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button></div></label>}
              {mode === "login" && <div className="-mt-1 text-right"><Link href={`/streak/forgot-password?next=${nextQuery}`} className="text-xs font-semibold text-[var(--evergreen)] hover:underline">Forgot password?</Link></div>}
              <Button type="submit" disabled={busy} className="mt-2 min-h-[50px] w-full bg-[var(--evergreen)] text-white shadow-none hover:bg-[#214a35]">{busy ? "Please wait…" : mode === "register" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</Button>
            </form>
            {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite" className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${feedback.kind === "error" ? "bg-red-50 text-red-800" : "bg-[#edf2e9] text-[var(--evergreen)]"}`}>{feedback.text}</p>}
            <div className="mt-6 border-t border-black/[.08] pt-5 text-sm text-black/55">
              {mode === "register" ? <p>Already have an account? <Link className="font-semibold text-[var(--evergreen)] hover:underline" href={`/streak/login?next=${nextQuery}`}>Sign in</Link></p> : mode === "reset" ? <p>Remember your password? <Link className="font-semibold text-[var(--evergreen)] hover:underline" href={`/streak/login?next=${nextQuery}`}>Back to sign in</Link></p> : <p>New to the challenge? <Link className="font-semibold text-[var(--evergreen)] hover:underline" href={`/streak/register?next=${nextQuery}`}>Create your account</Link></p>}
            </div>
            {mode !== "reset" && <p className="mt-5 text-[11px] leading-5 text-black/40">By continuing, you agree to use your member account for your personal prayer journey. Account access is separate from PHOTIZO administration.</p>}
          </>
        )}
      </div>
    </section>
  );
}
