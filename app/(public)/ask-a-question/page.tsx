import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { AskQuestionForm } from "@/components/forms/AskQuestionForm";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "Ask a Biblical Question",
  description:
    "Send your biblical questions to PHOTIZO Network International and receive biblical clarity.",
};

export default function AskQuestionPage() {
  return (
    <>
      <PageHero
        eyebrow="Ask a Question"
        title="Have a biblical question?"
        description="Whether your question is about salvation, doctrine, prayer, spiritual growth, Christian living, or the Scriptures, you can send it to us. Our team will review your question and respond with biblical clarity."
      />
      <section className="py-20">
        <Container>
          <SectionHeading
            title="Send your question"
            description="Every submission is reviewed carefully. You can request a private response or permit the question to become a future teaching."
          />
          <div className="mt-10">
            <AskQuestionForm />
          </div>
        </Container>
      </section>
    </>
  );
}
