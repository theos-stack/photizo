import type { Metadata } from "next";
import { connection } from "next/server";

import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { ProgramCard } from "@/components/ProgramCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ProgramInterestForm } from "@/components/forms/ProgramInterestForm";
import { PageHero } from "@/components/public/PageHero";
import { getPublishedPrograms } from "@/lib/data";

export const metadata: Metadata = {
  title: "Programs and Conferences",
  description:
    "Explore PHOTIZO teachings, meetings, conferences, crusades, and training gatherings.",
};

export default async function ProgramsPage() {
  await connection();
  const programs = await getPublishedPrograms();

  return (
    <>
      <PageHero
        eyebrow="Programs"
        title="Programs, conferences, and meetings designed to build men in truth."
        description="Join PHOTIZO teachings, meetings, conferences, crusades, and training platforms designed to bring men into the light of God’s truth and raise them for kingdom purpose."
      />
      <section className="py-20">
        <Container>
          {programs.length ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Upcoming programs will be announced soon."
              description="Stay connected and register your interest to receive updates about upcoming meetings, teachings, conferences, and ministry gatherings."
            />
          )}
        </Container>
      </section>
      <section className="bg-[var(--cultured)] py-20">
        <Container>
          <SectionHeading
            eyebrow="Register Interest"
            title="Stay connected for upcoming ministry gatherings"
            description="Share your details below and PHOTIZO will keep you informed about future meetings, teachings, conferences, and programs."
          />
          <div className="mt-10">
            <ProgramInterestForm />
          </div>
        </Container>
      </section>
    </>
  );
}
