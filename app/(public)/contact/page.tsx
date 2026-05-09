import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact PHOTIZO Network International",
  description:
    "Reach PHOTIZO Network International for ministry contact, enquiries, and follow-up.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Reach PHOTIZO Network International"
        description="Send a message, request prayer, or get in touch with the ministry team using the contact form and channels below."
      />
      <section className="py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-[var(--honeydew)]/48 p-8 shadow-soft">
            <SectionHeading title="Contact Channels" description="Placeholder details are included here and can be updated from the admin settings later." />
            <div className="mt-8 space-y-4 text-sm text-[rgba(11,11,11,0.72)]">
              <p>Email: {settings.email}</p>
              <p>WhatsApp: {settings.whatsapp}</p>
              <p>Instagram: {settings.instagram}</p>
              <p>Facebook: {settings.facebook}</p>
              <p>YouTube: {settings.youtube}</p>
              <p>Telegram: {settings.telegram}</p>
            </div>
          </div>
          <ContactForm />
        </Container>
      </section>
    </>
  );
}
