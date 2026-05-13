import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { SalvationFollowUpForm } from "@/components/forms/SalvationFollowUpForm";
import { PageHero } from "@/components/public/PageHero";

export default function SalvationWelcomePage() {
  return (
    <>
      <PageHero
        eyebrow="Welcome"
        title="Welcome Into The New Life In Christ"
        description="If you believed the gospel and received Christ by faith, you have taken the most important step of your life. You are now called to grow in the knowledge of God, be planted in a Bible-believing church, learn the Scriptures, and walk with other believers."
      />
      <section className="py-20">
        <Container>
          <SectionHeading
            title="Let PHOTIZO follow up with you"
            description="PHOTIZO would love to follow up with you, pray with you, and help you grow in your new life in Christ."
          />
          <div className="mt-10">
            <SalvationFollowUpForm />
          </div>
        </Container>
      </section>
    </>
  );
}
