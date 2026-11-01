"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function MemberBar({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const active = (path: string) => path === "/streak" ? pathname.startsWith("/streak") && pathname !== "/streak/settings" : pathname === path || pathname.startsWith(`${path}/`);
  const linkClass = (path: string) => `rounded-lg px-2 py-2 font-medium transition ${active(path) ? "bg-[var(--warm-ivory)] text-[var(--evergreen)]" : "text-black/70 hover:bg-black/5"}`;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButtonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function signOut() {
    const client = getBrowserSupabaseClient();
    await client?.auth.signOut();
    router.push("/streak/login?next=%2Fmember");
    router.refresh();
  }

  function closeMenu() { setMenuOpen(false); }
  const links = [
    { href: "/member", label: "Member Home" },
    { href: "/streak", label: "Prayer Challenge" },
    { href: "/streak/settings", label: "Settings" },
  ];

  return <header ref={rootRef} className="relative z-40 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3">
      <Link href="/member" onClick={closeMenu} className="font-semibold text-[var(--dark-moss-green)]">PHOTIZO · Member Space</Link>
      <nav aria-label="Member navigation" className="hidden items-center gap-3 text-sm sm:gap-5 md:flex">
        {links.map((link) => <Link key={link.href} href={link.href} className="font-medium">{link.label}</Link>)}
        <span className="hidden text-black/55 md:inline">{email}</span>
        <button type="button" onClick={signOut} className="font-semibold text-[var(--dark-moss-green)]">Sign out</button>
      </nav>
      <button ref={menuButtonRef} type="button" aria-label={menuOpen ? "Close member menu" : "Open member menu"} aria-expanded={menuOpen} aria-controls="member-mobile-menu" onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/10 text-[var(--evergreen)] transition hover:bg-[var(--warm-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evergreen)] md:hidden">
        {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
    <div className={`grid w-full basis-full transition-[grid-template-rows,opacity] duration-200 ease-out md:hidden ${menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}>
      <nav id="member-mobile-menu" aria-label="Mobile member navigation" aria-hidden={!menuOpen} inert={!menuOpen} className="min-h-0 overflow-hidden">
        <div className="space-y-1 border-t border-black/10 pb-2 pt-3">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={closeMenu} className={`block min-h-11 ${linkClass(link.href)}`} aria-current={active(link.href) ? "page" : undefined}>{link.label}</Link>)}
          <p className="truncate px-2 pt-2 text-xs text-black/45">{email}</p>
          <button type="button" onClick={() => { closeMenu(); void signOut(); }} className="min-h-11 w-full rounded-lg px-2 text-left text-sm font-semibold text-[var(--dark-moss-green)] transition hover:bg-black/5">Sign Out</button>
        </div>
      </nav>
    </div>
  </header>;
}
