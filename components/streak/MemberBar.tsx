"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
export function MemberBar({ email }: { email: string }) {
  const router = useRouter();
  async function signOut() { const client = getBrowserSupabaseClient(); await client?.auth.signOut(); router.push("/streak/login?next=%2Fmember"); router.refresh(); }
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3"><Link href="/member" className="font-semibold text-[var(--dark-moss-green)]">PHOTIZO · Member Space</Link><nav aria-label="Member navigation" className="flex items-center gap-3 text-sm sm:gap-5"><Link href="/member" className="font-medium">Member home</Link><Link href="/prayer-streak" className="font-medium">Prayer Challenge</Link><Link href="/streak/settings" className="font-medium">Settings</Link><span className="hidden text-black/55 md:inline">{email}</span><button onClick={signOut} className="font-semibold text-[var(--dark-moss-green)]">Sign out</button></nav></div>;
}
