import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

import { siteConfig } from "@/lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default:
      "PHOTIZO Network International | Enlightened by Truth. Raised for the Kingdom.",
    template: "%s | PHOTIZO Network International",
  },
  description:
    "PHOTIZO Network International is committed to evangelizing men, raising disciples, and establishing the truth of God's kingdom in hearts across the world.",
  applicationName: "PHOTIZO Network International",
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
      className={`${manrope.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-white text-[var(--black)]">{children}</body>
    </html>
  );
}
