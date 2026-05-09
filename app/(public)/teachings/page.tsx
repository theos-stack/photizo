import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "Teachings",
  description:
    "Teachings, Bible studies, notes, and spiritual resources from PHOTIZO Network International are coming soon.",
};

const categories = [
  "Salvation",
  "Prayer",
  "Kingdom",
  "Doctrine",
  "Discipleship",
  "Christian Living",
  "Healing and Miracles",
  "The Life of Christ",
  "The Apostles’ Pattern",
];

export default function TeachingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Teachings"
        title="Teachings Coming Soon"
        description="Our teaching library is being prepared. Soon, you will be able to access teachings, notes, Bible studies, and spiritual resources designed to ground you in truth and strengthen your walk with God."
        cta={{ label: "Ask a Biblical Question", href: "/ask-a-question" }}
      />
      <section className="py-20">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category}
                className="rounded-[24px] border border-[rgba(72,108,38,0.12)] bg-white px-5 py-6 text-sm font-medium text-[var(--dark-moss-green)] shadow-soft"
              >
                {category}
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Button href="/ask-a-question">Ask a Biblical Question</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
