import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-[rgba(72,108,38,0.12)] bg-white/88 p-6 backdrop-blur-xl lg:block">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,#486C26,#16310F)] p-6 text-white shadow-strong">
        <div className="font-display text-2xl font-extrabold tracking-[0.16em]">
          PHOTIZO
        </div>
        <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/72">
          Admin Dashboard
        </div>
      </div>
      <nav className="mt-8 space-y-2">
        {siteConfig.adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-2xl px-4 py-3 text-sm font-medium text-[rgba(11,11,11,0.66)] hover:bg-[var(--honeydew)] hover:text-[var(--dark-moss-green)]",
              pathname.startsWith(item.href) &&
                "bg-[var(--honeydew)] text-[var(--dark-moss-green)]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
