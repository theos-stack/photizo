import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function PageHero({
  eyebrow,
  title,
  description,
  cta,
  secondaryCta,
}: PageHeroProps) {
  return (
    <section className="hero-glow relative overflow-hidden py-20 text-white sm:py-24">
      <Container className="relative">
        <div className="max-w-3xl animate-fade-up">
          {eyebrow ? (
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--gold)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
            {description}
          </p>
          {cta || secondaryCta ? (
            <div className="mt-8 flex flex-wrap gap-4">
              {cta ? (
                <Button href={cta.href} size="lg">
                  {cta.label}
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button href={secondaryCta.href} size="lg" variant="outline">
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
      <div className="pointer-events-none absolute inset-y-10 right-[8%] hidden w-72 rounded-full bg-[radial-gradient(circle,rgba(255,214,0,0.24),transparent_60%)] blur-3xl lg:block" />
    </section>
  );
}
