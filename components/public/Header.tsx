"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LogoPlaceholder } from "@/components/LogoPlaceholder";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 1, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease }}
      className="sticky top-0 z-50 border-b border-[rgba(11,11,11,0.06)] bg-[rgba(255,255,255,0.7)] backdrop-blur-2xl"
    >
      <Container className="flex min-h-20 items-center justify-between gap-4">
        <LogoPlaceholder tone="dark" />

        <nav className="hidden items-center gap-1 rounded-full border border-[rgba(11,11,11,0.06)] bg-white/72 px-2 py-1 lg:flex">
          {siteConfig.navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-[rgba(11,11,11,0.56)] hover:bg-[var(--cultured)] hover:text-[var(--black)]",
                  active &&
                    "bg-[var(--dark-moss-green)] text-white shadow-[0_10px_24px_rgba(72,108,38,0.18)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/salvation" size="sm">
            I Just Got Saved
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(11,11,11,0.08)] bg-white/78 text-[var(--black)] lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open ? (
        <motion.div
          initial={{ opacity: 1, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="border-t border-[rgba(11,11,11,0.06)] bg-[rgba(255,255,255,0.94)] lg:hidden"
        >
          <Container className="flex flex-col gap-2 py-4">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-[rgba(11,11,11,0.72)] hover:bg-[var(--cultured)] hover:text-[var(--black)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button href="/salvation" className="mt-2 w-full">
              I Just Got Saved
            </Button>
          </Container>
        </motion.div>
      ) : null}
    </motion.header>
  );
}
