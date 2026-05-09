export const siteConfig = {
  name: "PHOTIZO Network International",
  shortName: "PHOTIZO",
  tagline: "Enlightened by Truth. Raised for the Kingdom.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  description:
    "PHOTIZO Network International is committed to evangelizing men, raising disciples, and establishing the truth of God's kingdom in hearts across the world.",
  navItems: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/teachings", label: "Teachings" },
    { href: "/programs", label: "Programs" },
    { href: "/ask-a-question", label: "Ask a Question" },
    { href: "/contact", label: "Contact" },
  ],
  adminNav: [
    { href: "/admin/dashboard", label: "Overview" },
    { href: "/admin/programs", label: "Programs" },
    { href: "/admin/registrations", label: "Registrations" },
    { href: "/admin/salvation-responses", label: "Salvation Responses" },
    { href: "/admin/questions", label: "Biblical Questions" },
    { href: "/admin/contact-messages", label: "Contact Messages" },
    { href: "/admin/settings", label: "Settings" },
  ],
};
