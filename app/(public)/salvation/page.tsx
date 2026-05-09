import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "Receive Christ",
  description:
    "A guided salvation journey for anyone who wants to respond to the gospel through faith in Jesus Christ.",
};

export default function SalvationPage() {
  return (
    <>
      <PageHero
        eyebrow="Salvation"
        title="Jesus Christ Died For You"
        description="God loves you, and His desire is that you are saved, restored, and brought into fellowship with Him."
      />
      <section className="py-20">
        <Container className="grid gap-8 rounded-[36px] border border-[rgba(72,108,38,0.12)] bg-white p-8 shadow-soft lg:grid-cols-[1fr_0.78fr] lg:p-10">
          <div className="space-y-5 text-base leading-8 text-[rgba(11,11,11,0.74)]">
            <p>
              The Bible teaches that all men have sinned and need salvation.
              But God, in His love, sent Jesus Christ to die for our sins.
            </p>
            <p>
              Jesus died, was buried, and rose again. Through Him, forgiveness
              of sins and eternal life are available to everyone who believes.
            </p>
            <p>
              You do not receive salvation by your works. You receive it by
              believing in Jesus Christ.
            </p>
            <p className="font-semibold text-[var(--black)]">
              Do you believe that Jesus Christ died for you and rose again for
              your salvation?
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <Button href="/salvation/prayer" size="lg">
              Yes, I Believe
            </Button>
            <Button href="/ask-a-question" size="lg" variant="ghost">
              I Want To Know More
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
