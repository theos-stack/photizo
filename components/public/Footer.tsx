import Link from "next/link";

import { Container } from "@/components/Container";
import { LogoPlaceholder } from "@/components/LogoPlaceholder";
import { getSiteSettings } from "@/lib/data";

type SocialIconProps = {
  className?: string;
};

function EmailIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 6.5h16v11H4z" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function InstagramIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.9v1.9H8v2.8h2.5v7h3Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.6 8.2a2.9 2.9 0 0 0-2-2C17.8 5.7 12 5.7 12 5.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2C2 10 2 12 2 12s0 2 .4 3.8a2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2c.4-1.8.4-3.8.4-3.8s0-2-.4-3.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z" />
    </svg>
  );
}

function TelegramIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.3 4.8c.3-.2.7.1.6.5l-3 14.2c-.1.5-.7.7-1.1.5l-4.5-3.3-2.4 2.3c-.3.3-.8.1-.8-.3v-3.3l8.7-8c.2-.2 0-.6-.3-.4L7.9 13.6l-4.6-1.4c-.5-.2-.6-.8-.1-1l18.1-6.4Z" />
    </svg>
  );
}

export async function Footer() {
  const settings = await getSiteSettings();
  const socialLinks = [
    { href: settings.email ? `mailto:${settings.email}` : "", label: "Email", icon: EmailIcon },
    { href: settings.instagram, label: "Instagram", icon: InstagramIcon },
    { href: settings.facebook, label: "Facebook", icon: FacebookIcon },
    { href: settings.youtube, label: "YouTube", icon: YoutubeIcon },
    { href: settings.telegram, label: "Telegram", icon: TelegramIcon },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-[rgba(11,11,11,0.08)] bg-[var(--black)] text-white">
      <Container className="flex flex-col gap-7 py-10 sm:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoPlaceholder tone="light" />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Link
              href="/contact"
              className="text-sm text-white/72 transition hover:text-white"
            >
              Contact
            </Link>
            <Link
              href="/admin/login"
              className="text-sm text-white/72 transition hover:text-white"
            >
              Admin Login
            </Link>
            {socialLinks.length ? (
              <div className="ml-0 flex items-center gap-2 sm:ml-2">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href || "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
      <Container className="border-t border-white/10 py-5 text-center text-xs text-white/54">
        © {new Date().getFullYear()} PHOTIZO Network International. All rights reserved.
      </Container>
    </footer>
  );
}
