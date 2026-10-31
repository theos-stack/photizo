import { ArrowUpRight, Lightbulb, Users } from "lucide-react";
import { connection } from "next/server";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { FeatureCard } from "@/components/FeatureCard";
import { ProgramCard } from "@/components/ProgramCard";
import { SectionHeading } from "@/components/SectionHeading";
import { HomeHero } from "@/components/public/HomeHero";
import { getPublishedPrograms } from "@/lib/data";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  await connection();
  const [programs, supabase] = await Promise.all([getPublishedPrograms(), getServerSupabaseClient()]);
  const { data: challenge } = await supabase?.from("prayer_challenges").select("id,title,duration_days,minutes_per_day").eq("slug", "30-day-prayer-streak").eq("status", "published").maybeSingle() || { data: null };
  const { data: firstGuide } = challenge ? await supabase!.from("prayer_challenge_days").select("title,bible_reference,encouragement").eq("challenge_id", challenge.id).eq("day_number", 1).maybeSingle() : { data: null };

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
                  John 8:32
                </div>
                <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--black)]">
                  And ye shall know the truth, and the truth shall make you
                  free.
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

      <section id="prayer-challenge" className="py-14 sm:py-20 lg:py-24">
        <Container>
          <div className="relative isolate overflow-hidden rounded-[34px] bg-[var(--evergreen)] px-6 py-8 text-white shadow-[0_34px_90px_rgba(24,59,43,0.2)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[420px] w-[420px] rounded-full border border-white/10 sm:h-[560px] sm:w-[560px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 -z-10 h-[260px] w-[260px] rounded-full border border-white/[0.08] sm:h-[360px] sm:w-[360px]" />
            <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d6c38a]">PHOTIZO 30-Day Prayer Challenge</p>
                <h2 className="mt-5 font-display text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem]">A Deeper Prayer Life Begins With One Day.</h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">Thirty days of intentional prayer, Scripture, reflection and spiritual growth. Join a community of believers developing consistency in prayer, one day at a time.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button href="/prayer-streak" size="lg" className="w-full bg-[#d6c38a] text-[#173326] shadow-none hover:bg-[#e2d5ac] sm:w-auto">Join the Prayer Challenge</Button>
                  <Button href="/prayer-streak#how-it-works" size="lg" variant="outline" className="w-full border-white/20 bg-white/[0.04] text-white hover:bg-white/10 sm:w-auto">Discover How It Works</Button>
                </div>
                <p className="mt-5 text-xs tracking-wide text-white/55">A personal practice, held with grace. No competition. No pressure to be perfect.</p>
              </div>
              <div className="relative mx-auto w-full max-w-[440px] lg:ml-auto">
                <div className="absolute -inset-4 rounded-[32px] bg-[#d6c38a]/10 blur-2xl" />
                <article className="relative rounded-[26px] border border-white/15 bg-[#fbfaf6] p-5 text-[#173326] shadow-[0_24px_65px_rgba(0,0,0,.22)] sm:p-7">
                  <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] pb-4">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-[var(--dark-moss-green)]">Your daily space</p><p className="mt-1 text-xs text-black/50">One quiet moment at a time</p></div>
                    <span className="rounded-full bg-[#e9eee6] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--evergreen)]">{challenge ? `${challenge.duration_days} days` : "A daily rhythm"}</span>
                  </div>
                  <div className="py-6">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45"><span className="h-px w-7 bg-[#c8ad6a]" />Daily Scripture</div>
                    <h3 className="mt-3 font-display text-3xl font-semibold leading-tight">{firstGuide?.title || "Scripture, prayer and reflection"}</h3>
                    {firstGuide?.bible_reference && <p className="mt-2 text-sm font-semibold text-[var(--dark-moss-green)]">{firstGuide.bible_reference}</p>}
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/60">{firstGuide?.encouragement || "A gentle guide helps you make room for an intentional conversation with God."}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/[0.08] pt-4 text-xs text-black/50"><span>{challenge?.minutes_per_day || 10} focused minutes</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--dark-moss-green)]" />Your pace, your journey</span></div>
                </article>
              </div>
            </div>
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
