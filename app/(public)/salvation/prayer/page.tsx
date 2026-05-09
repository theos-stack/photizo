import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/public/PageHero";

export default function SalvationPrayerPage() {
  return (
    <>
      <PageHero
        eyebrow="Prayer of Faith"
        title="Receive Christ By Faith"
        description="If you believe the gospel, you can respond to God in faith. This prayer is not a religious formula. It is an expression of your faith in Jesus Christ."
      />
      <section className="py-20">
        <Container>
          <div className="rounded-[36px] border border-[rgba(72,108,38,0.12)] bg-white p-8 shadow-soft lg:p-10">
            <p className="font-display text-2xl font-bold text-[var(--black)]">
              Lord Jesus, I believe that You died for my sins and rose again
              for my salvation. I believe that through You, I receive
              forgiveness, eternal life, and peace with God. Today, I receive
              You by faith. Thank You for saving me. Amen.
            </p>
            <div className="mt-8">
              <Button href="/salvation/welcome" size="lg">
                I Have Received Christ
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
