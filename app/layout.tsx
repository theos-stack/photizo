import type { Metadata } from "next";
import "./globals.css";

import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/icons/photizo-mark.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default:
      "PHOTIZO Network International | Enlightened by Truth. Raised for the Kingdom.",
    template: "%s | PHOTIZO Network International",
  },
  description:
    "PHOTIZO Network International is committed to evangelizing men, raising disciples, and establishing the truth of God's kingdom in hearts across the world.",
  applicationName: "PHOTIZO Network International",
  appleWebApp: { title: "PHOTIZO Prayer Streak" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PHOTIZO Network International",
    title:
      "PHOTIZO Network International | Enlightened by Truth. Raised for the Kingdom.",
    description:
      "PHOTIZO Network International is committed to evangelizing men, raising disciples, and establishing the truth of God's kingdom in hearts across the world.",
    url: siteConfig.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "PHOTIZO Network International | Enlightened by Truth. Raised for the Kingdom.",
    description:
      "PHOTIZO Network International is committed to evangelizing men, raising disciples, and establishing the truth of God's kingdom in hearts across the world.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
    >
      <body className="min-h-full bg-white text-[var(--black)]">{children}</body>
    </html>
  );
}
