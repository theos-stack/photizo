import type { Metadata } from "next";
import { BookOpen, HeartHandshake, Radio, Users } from "lucide-react";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ExpressionCard } from "@/components/ExpressionCard";
import { FeatureCard } from "@/components/FeatureCard";
import { SectionHeading } from "@/components/SectionHeading";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "About PHOTIZO Network International",
  description:
    "Learn the meaning, vision, mission, expressions, and present ministry focus of PHOTIZO Network International.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About PHOTIZO"
        title="A ministry committed to truth, light, and kingdom formation."
        description="PHOTIZO means to enlighten. To be enlightened is to be delivered. PHOTIZO Network International is a ministry committed to evangelizing men and raising disciples, to the end that the truth is established in hearts across the world."
        cta={{ label: "Join a Meeting", href: "/programs" }}
        secondaryCta={{
          label: "Ask a Biblical Question",
          href: "/ask-a-question",
        }}
      />

      <section className="py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <SectionHeading
            eyebrow="Meaning"
            title="What Is PHOTIZO?"
            description="We are committed to teaching the biblical worldview of God's truth unto salvation, healings, miracles, and everything we have learned from Christ and the Apostles."
          />
          <div className="surface-card space-y-6 rounded-[32px] p-8">
            <p className="text-base leading-8 text-[var(--muted-foreground)]">
              PHOTIZO means to enlighten. To be enlightened is to be delivered.
              PHOTIZO Network International is a ministry committed to
              evangelizing men and raising disciples, to the end that the truth
              is established in hearts across the world.
            </p>
            <p className="text-base leading-8 text-[var(--muted-foreground)]">
              We are committed to teaching the biblical worldview of God&apos;s truth
              unto salvation, healings, miracles, and everything we have learned
              from Christ and the Apostles.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--cultured)] py-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <FeatureCard
            title="Vision"
            description="To see God's kingdom established in the earth as it is in heaven. To teach and raise a kingdom of priests."
          />
          <FeatureCard
            title="Mission"
            description="To evangelize men, disciple them, and raise them to do the same, to the end that God's kingdom is established in the earth. Maranatha."
          />
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading
            eyebrow="Current Focus"
            title="What PHOTIZO is focused on right now"
            description="At this stage, PHOTIZO is focused on establishing a strong spiritual foundation through evangelism, intentional discipleship, frequent teachings, and consistent spiritual formation."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              title="Evangelism"
              description="Reaching men with the gospel of Christ."
              icon={<Radio className="h-6 w-6" />}
            />
            <FeatureCard
              title="Teachings"
              description="Establishing believers in sound doctrine and biblical truth."
              icon={<BookOpen className="h-6 w-6" />}
            />
            <FeatureCard
              title="Follow-Up"
              description="Helping new believers become rooted and strengthened in faith."
              icon={<HeartHandshake className="h-6 w-6" />}
            />
            <FeatureCard
              title="Discipleship"
              description="Raising men who can also raise others."
              icon={<Users className="h-6 w-6" />}
            />
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading
            eyebrow="Expressions"
            title="How PHOTIZO finds expression"
            description="These ministry expressions shape how PHOTIZO carries truth into communities, discipleship pipelines, and long-term kingdom structures."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <ExpressionCard
              index="01"
              title="Crusades"
              description="Large-scale gatherings focused on salvation, revival, healing, miracles, and encounters with God."
            />
            <ExpressionCard
              index="02"
              title="Foundation, Outreaches & Charity"
              description="The practical expression of God's love through service, giving, community impact, support systems, and structures that sustain long-term kingdom work."
            />
            <ExpressionCard
              index="03"
              title="School & Bible School"
              description="Training platforms for educational, mental, practical, biblical, and doctrinal development."
            />
            <ExpressionCard
              index="04"
              title="Discipleship"
              description="Intentional mentoring, teaching, follow-up, and spiritual formation for raising mature believers who can also disciple others."
            />
          </div>
        </Container>
      </section>

      <section className="section-sheen py-20">
        <Container className="grid gap-8 rounded-[36px] border border-[rgba(11,11,11,0.08)] bg-white p-8 shadow-soft lg:grid-cols-[1fr_0.9fr] lg:p-10">
          <SectionHeading
            eyebrow="Immediate Mission"
            title="The present ministry focus is foundation."
            description="At this stage, PHOTIZO is focused on establishing its foundation through evangelism, intentional discipleship, frequent and consistent teachings. These serve as the primary channels for building people, strengthening believers, and laying a solid spiritual foundation."
          />
          <div className="flex items-center justify-start lg:justify-end">
            <Button href="/programs" size="lg">
              Explore Programs
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
