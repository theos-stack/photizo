import { CalendarDays, Globe, MapPin } from "lucide-react";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ProgramRegistrationForm } from "@/components/forms/ProgramRegistrationForm";
import { SectionHeading } from "@/components/SectionHeading";
import type { Program } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  isProgramRegistrationOpen,
} from "@/lib/utils";

type ProgramDetailViewProps = {
  program: Program;
  previewMode?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function ProgramDetailView({
  program,
  previewMode = false,
  backHref = "/programs",
  backLabel = "Back to programs",
}: ProgramDetailViewProps) {
  const registrationOpen = isProgramRegistrationOpen(program);
  const canShowForm = previewMode || registrationOpen;
  const publicLink = `/programs/${program.slug}`;

  return (
    <>
      <section className="hero-glow py-20 text-white">
        <Container className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="overflow-hidden rounded-[36px] border border-white/14 bg-white/8 shadow-strong">
            {program.flyer_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={program.flyer_url}
                alt={program.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[360px] items-center justify-center px-10 text-center">
                <div>
                  <div className="text-xs uppercase tracking-[0.36em] text-[var(--gold)]">
                    PHOTIZO Program
                  </div>
                  <div className="mt-4 font-display text-4xl font-bold">
                    {program.title}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[var(--gold)]">
              {previewMode ? "Admin Preview" : "Program Details"}
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {program.title}
            </h1>
            <p className="mt-6 text-base leading-8 text-white/82">
              {program.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {previewMode ? (
                <Button type="button" disabled>
                  Draft and form preview
                </Button>
              ) : registrationOpen ? (
                <Button href="#registration">Register now</Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                  className="border-white/18 bg-white/10 text-white hover:bg-white/10"
                >
                  Registration closed
                </Button>
              )}
              <Button href={backHref} variant="outline">
                {backLabel}
              </Button>
              {previewMode && program.status === "published" ? (
                <Button href={publicLink} variant="outline">
                  Open live public page
                </Button>
              ) : null}
            </div>
            <div className="mt-8 grid gap-4 text-sm text-white/82">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-[var(--gold)]" />
                {formatDateTime(program.date, program.time)}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[var(--gold)]" />
                {program.location || "Venue will be announced"}
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-[var(--gold)]" />
                {program.online_link || "Online details will be shared if available"}
              </div>
              {program.registration_deadline ? (
                <div className="rounded-full border border-white/12 bg-white/8 px-4 py-3 text-xs uppercase tracking-[0.26em] text-white/76">
                  Registration deadline: {formatDate(program.registration_deadline)}
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
      <section id="registration" className="scroll-mt-24 py-20">
        <Container>
          <SectionHeading
            eyebrow={previewMode ? "Form Preview" : "Registration"}
            title={
              previewMode
                ? "This is the program registration experience"
                : registrationOpen
                  ? "Register for this program"
                  : "Registration is currently closed"
            }
            description={
              previewMode
                ? "Review the exact program page and form layout before the program goes live. Once you publish the program, this public registration page becomes active."
                : registrationOpen
                  ? "Complete the form below and PHOTIZO will receive your registration for this specific meeting."
                  : "This program is no longer receiving new registrations right now. You can still review the details above or check other PHOTIZO programs."
            }
          />
          <div className="mt-10">
            {canShowForm ? (
              <ProgramRegistrationForm
                programId={program.id}
                slug={program.slug}
                registrationForm={program.registration_form || []}
                previewMode={previewMode}
              />
            ) : (
              <div className="rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-8 shadow-soft">
                <p className="max-w-2xl text-base leading-8 text-[rgba(11,11,11,0.72)]">
                  Registration has closed for this program, or the program has already
                  moved into a non-registration stage. If you would like to stay in
                  touch for future meetings, you can register your interest from the
                  main programs page.
                </p>
                <div className="mt-6">
                  <Button href="/programs">View all programs</Button>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
