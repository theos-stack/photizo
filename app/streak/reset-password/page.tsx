import Link from "next/link";
import { Container } from "@/components/Container";
import { MemberBar } from "@/components/streak/MemberBar";
import { ResetPasswordForm } from "@/components/streak/ResetPasswordForm";
import { requireMember } from "@/lib/server/member";

export default async function ResetPasswordPage() {
  const { user } = await requireMember();
  return <><MemberBar email={user.email || "Member"}/><main className="min-h-[80vh] bg-[var(--warm-ivory)] py-12 sm:py-20"><Container className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[var(--dark-moss-green)]">Account security</p><h1 className="mt-3 font-display text-4xl font-semibold text-[#182a1e] sm:text-5xl">Choose a new password.</h1><p className="mt-3 max-w-xl text-sm leading-7 text-black/60">Set a new password for your PHOTIZO member account. Once it is saved, you’ll return to your prayer dashboard.</p><ResetPasswordForm/><Link href="/streak" className="mt-5 inline-block text-sm font-semibold text-[var(--evergreen)] hover:underline">Return to my prayer dashboard</Link></Container></main></>;
}
