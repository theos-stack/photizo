import Link from "next/link";

import { Container } from "@/components/Container";
import { LogoPlaceholder } from "@/components/LogoPlaceholder";
import { getSiteSettings } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-[rgba(11,11,11,0.08)] bg-[var(--black)] text-white">
      <Container className="grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <LogoPlaceholder tone="light" className="bg-white/5" />
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/72">
            PHOTIZO Network International is a digital home for evangelism,
            teachings, discipleship, biblical clarity, and kingdom formation.
          </p>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold tracking-[-0.03em]">
            Navigate
          </h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/72">
            {siteConfig.navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link href="/admin/login" className="hover:text-white">
              Admin Login
            </Link>
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold tracking-[-0.03em]">
            Connect
          </h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/72">
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <a href="#">{settings.whatsapp}</a>
            <a href={settings.instagram || "#"} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={settings.facebook || "#"} target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href={settings.youtube || "#"} target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href={settings.telegram || "#"} target="_blank" rel="noreferrer">
              Telegram
            </a>
          </div>
        </div>
      </Container>
      <Container className="border-t border-white/10 py-5 text-xs text-white/54">
        © {new Date().getFullYear()} PHOTIZO Network International. All rights
        reserved.
      </Container>
    </footer>
  );
}
