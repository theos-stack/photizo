"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
export function MemberBar({ email }: { email: string }) {
  const router = useRouter();
  async function signOut() { const client = getBrowserSupabaseClient(); await client?.auth.signOut(); router.push("/streak/login"); router.refresh(); }
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3"><Link href="/streak" className="font-semibold text-[var(--dark-moss-green)]">PHOTIZO · Prayer Streak</Link><div className="flex items-center gap-4 text-sm"><span className="hidden text-black/55 sm:inline">{email}</span><Link href="/streak/settings" className="font-medium">Settings</Link><button onClick={signOut} className="font-medium text-[var(--dark-moss-green)]">Sign out</button></div></div>;
}
