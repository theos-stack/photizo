"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LogoPlaceholder } from "@/components/LogoPlaceholder";
import { siteConfig } from "@/lib/site";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
  const navItems = [...siteConfig.navItems, { href: "/streak", label: "Prayer Challenge" }];

export function Header({ memberEmail }: { memberEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === pathname;

  async function signOut() {
    await getBrowserSupabaseClient()?.auth.signOut();
    setOpenForPath(null);
    router.push("/");
    router.refresh();
  }

  const accountLinks = memberEmail ? (
    <>
      <Link href="/member" className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--evergreen)] hover:bg-[var(--honeydew)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]">Member space</Link>
      <Link href="/streak/settings" className="rounded-full px-3 py-2 text-sm text-black/65 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]">Account</Link>
      <button type="button" onClick={signOut} className="rounded-full px-3 py-2 text-sm text-black/65 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]">Sign out</button>
    </>
  ) : (
    <>
      <Link href="/streak/login" className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--evergreen)] hover:bg-[var(--honeydew)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]">Sign in</Link>
      <Button href="/streak" size="sm">Join Challenge</Button>
      <Link href="/salvation" className="hidden rounded-full px-2 py-2 text-xs font-semibold text-black/55 hover:text-[var(--evergreen)] 2xl:inline">I Just Got Saved</Link>
    </>
  );

  return (
    <motion.header
      initial={{ opacity: 1, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease }}
      className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-2xl"
    >
      <Container className="flex min-h-16 items-center justify-between gap-3 sm:min-h-[76px] sm:gap-4">
        <LogoPlaceholder tone="dark" className="shrink min-w-0" />

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 xl:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href === "/prayer-streak" && pathname.startsWith("/streak"));
            const prayer = item.href === "/prayer-streak";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium text-black/60 hover:bg-black/[0.045] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]",
                  prayer && "font-semibold text-[var(--evergreen)]",
                  active && "bg-[var(--evergreen)] text-white hover:bg-[var(--evergreen)] hover:text-white",
                )}
              >{item.label}</Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 xl:flex">{accountLinks}</div>

        <button
          type="button"
          onClick={() => setOpenForPath(open ? null : pathname)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[var(--evergreen)] transition hover:bg-[var(--honeydew)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)] xl:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-controls="mobile-navigation"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open && (
        <motion.div
          id="mobile-navigation"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease }}
          className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-black/[0.06] bg-[#fffefa] shadow-[0_18px_36px_rgba(17,37,28,0.12)] xl:hidden"
        >
          <Container className="flex flex-col gap-1 py-4 sm:py-5">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href === "/prayer-streak" && pathname.startsWith("/streak"));
                return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("rounded-xl px-4 py-3 text-sm font-medium text-black/70 hover:bg-black/[0.045] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)]", active && "bg-[var(--honeydew)] font-semibold text-[var(--evergreen)]")} onClick={() => setOpenForPath(null)}>{item.label}</Link>;
              })}
            </nav>
            <div className="mt-3 flex flex-col items-stretch gap-2 border-t border-black/[0.08] pt-4">
              {memberEmail ? (
                <>
                  <p className="px-4 text-xs text-black/50">Signed in as {memberEmail}</p>
                  <Link href="/member" onClick={() => setOpenForPath(null)} className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--evergreen)] hover:bg-[var(--honeydew)]">Member home</Link>
                  <Link href="/streak/settings" onClick={() => setOpenForPath(null)} className="rounded-xl px-4 py-3 text-sm font-medium text-black/70 hover:bg-black/[0.045]">Account settings</Link>
                  <button type="button" onClick={signOut} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[var(--evergreen)] hover:bg-[var(--honeydew)]">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/streak/login" onClick={() => setOpenForPath(null)} className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--evergreen)] hover:bg-[var(--honeydew)]">Sign in</Link>
                  <Button href="/streak" className="w-full" onClick={() => setOpenForPath(null)}>Join Challenge</Button>
                  <Link href="/salvation" onClick={() => setOpenForPath(null)} className="rounded-xl px-4 py-3 text-center text-sm text-black/55 hover:bg-black/[0.045]">I Just Got Saved</Link>
                </>
              )}
            </div>
          </Container>
        </motion.div>
      )}
    </motion.header>
  );
}
