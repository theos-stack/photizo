"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/Button";
import { siteConfig } from "@/lib/site";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminTopbar({
  title,
  email,
}: {
  title: string;
  email?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(72,108,38,0.12)] bg-white/88 backdrop-blur-xl">
      <div className="flex min-h-18 items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[rgba(11,11,11,0.44)]">
            Ministry Operations
          </p>
          <h1 className="font-display text-2xl font-bold text-[var(--black)]">
            {title}
          </h1>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-full border border-[rgba(72,108,38,0.12)] px-4 py-2 text-sm text-[rgba(11,11,11,0.66)]">
            {email}
          </div>
          <Button type="button" variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
        <div className="relative lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(72,108,38,0.12)]"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <ChevronDown className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {open ? (
            <div className="absolute right-0 top-14 w-64 rounded-3xl border border-[rgba(72,108,38,0.12)] bg-white p-3 shadow-soft">
              <div className="px-3 py-2 text-sm text-[rgba(11,11,11,0.66)]">{email}</div>
              <div className="mt-1 space-y-1">
                {siteConfig.adminNav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl px-3 py-2 text-sm text-[rgba(11,11,11,0.72)] hover:bg-[var(--honeydew)]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <Button type="button" variant="ghost" onClick={signOut} className="mt-3 w-full">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
