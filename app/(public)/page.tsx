import { ArrowUpRight, Lightbulb, Users } from "lucide-react";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { FeatureCard } from "@/components/FeatureCard";
import { ProgramCard } from "@/components/ProgramCard";
import { SectionHeading } from "@/components/SectionHeading";
import { HomeHero } from "@/components/public/HomeHero";
import { getPublishedPrograms } from "@/lib/data";

export default async function HomePage() {
  const programs = await getPublishedPrograms();

  return (
    <>
      <HomeHero />

      <section className="relative -mt-10 pb-10">
        <Container>
          <div className="surface-card rounded-[36px] p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <SectionHeading
                  eyebrow="The Gospel"
                  title="Do You Know What Christ Has Done For You?"
                  description="Jesus Christ died for your sins, was buried, and rose again so that you may receive forgiveness, eternal life, and reconciliation with God. Salvation is not received by human effort, religion, or personal goodness. It is received by faith in Jesus Christ."
                />
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
                  If you believe that Jesus died for you and rose again, you
                  can receive Him today.
                </p>
              </div>
              <div className="flex items-center justify-start lg:justify-end">
                <Button href="/salvation" size="lg">
                  I Believe. I Want To Receive Christ
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <SectionHeading
              eyebrow="What Is PHOTIZO?"
              title="PHOTIZO means to enlighten. To be enlightened is to be delivered."
              description="PHOTIZO Network International is committed to evangelizing men and raising disciples, to the end that the truth is established in hearts across the world. We are committed to teaching the biblical worldview of God's truth unto salvation, healings, miracles, and everything we have learned from Christ and the Apostles."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="interactive-card rounded-[30px] border border-[rgba(11,11,11,0.08)] bg-white p-7 shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--dark-moss-green)]">
                  Light
                </div>
                <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--black)]">
                  Truth that brings salvation, healing, and establishment.
                </p>
              </div>
              <div className="interactive-card rounded-[30px] border border-[rgba(11,11,11,0.08)] bg-[linear-gradient(180deg,rgba(235,255,243,0.72),rgba(255,255,255,0.98))] p-7 shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--dark-moss-green)]">
                  Mission
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                  A ministry platform built for evangelism, discipleship,
                  biblical teaching, and spiritual follow-up.
                </p>
                <div className="mt-6">
                  <Button href="/about" variant="secondary">
                    Learn More About PHOTIZO
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-sheen py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <FeatureCard
              title="Our Vision"
              description="To see God's kingdom established in the earth as it is in heaven. To teach and raise a kingdom of priests."
              icon={<Lightbulb className="h-6 w-6" />}
            />
            <FeatureCard
              title="Our Mission"
              description="To evangelize men, disciple them, and raise them to do the same, to the end that God's kingdom is established in the earth. Maranatha."
              icon={<Users className="h-6 w-6" />}
            />
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Programs"
              title="Meetings, Programs and Conferences"
              description="Join PHOTIZO teachings, meetings, conferences, crusades, and training platforms designed to bring men into the light of God's truth and raise them for kingdom purpose."
            />
            <Button href="/programs" variant="secondary">
              View Programs
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-10">
            {programs.length ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {programs.slice(0, 3).map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Upcoming programs will be announced soon."
                description="Register your interest to receive updates about upcoming teachings, conferences, crusades, and ministry gatherings."
                actionLabel="View Programs"
                actionHref="/programs"
              />
            )}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid gap-8 rounded-[36px] border border-[rgba(11,11,11,0.08)] bg-white p-8 shadow-soft lg:grid-cols-[1fr_0.7fr] lg:p-10">
          <div>
            <SectionHeading
              eyebrow="Biblical Clarity"
              title="Have a Biblical Question?"
              description="Whether your question is about salvation, doctrine, prayer, spiritual growth, Christian living, or the Scriptures, you can send it to us. Our team will review your question and respond with biblical clarity."
            />
          </div>
          <div className="flex items-center justify-start lg:justify-end">
            <Button href="/ask-a-question" size="lg">
              Ask Your Question
            </Button>
          </div>
        </Container>
      </section>

      <section className="hero-glow py-20 text-white">
        <Container className="text-center">
          <SectionHeading
            align="center"
            eyebrow="Final Call"
            title="Be Enlightened. Be Established. Be Sent."
            description="PHOTIZO exists to see men saved, taught, discipled, and raised for the establishment of God's kingdom in the earth."
            className="mx-auto [&_*]:text-white [&_p]:text-white/78 [&_p:first-child]:text-[var(--gold)]"
          />
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button href="/programs" size="lg">
              Join a Meeting
            </Button>
            <Button href="/salvation" size="lg" variant="outline">
              I Just Got Saved
            </Button>
            <Button href="/contact" size="lg" variant="ghost">
              Contact Us
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
