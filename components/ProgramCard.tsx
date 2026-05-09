import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import type { Program } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  isProgramRegistrationOpen,
} from "@/lib/utils";

export function ProgramCard({ program }: { program: Program }) {
  const registrationOpen = isProgramRegistrationOpen(program);

  return (
    <article className="overflow-hidden rounded-[30px] border border-[rgba(72,108,38,0.12)] bg-white shadow-soft">
      <div className="relative h-56 bg-[linear-gradient(135deg,#486C26,#16310F)]">
        {program.flyer_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={program.flyer_url}
            alt={program.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-white/88">
            <div>
              <div className="text-xs uppercase tracking-[0.36em] text-[var(--gold)]">
                PHOTIZO Program
              </div>
              <div className="mt-4 font-display text-3xl font-bold">
                {program.title}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-[var(--black)]">
              {program.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[rgba(11,11,11,0.68)]">
              {program.description}
            </p>
          </div>
          <StatusBadge status={program.status} />
        </div>
        <div className="grid gap-3 text-sm text-[rgba(11,11,11,0.72)]">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-[var(--dark-moss-green)]" />
            {formatDateTime(program.date, program.time)}
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-[var(--dark-moss-green)]" />
            {program.location || program.online_link || "Venue to be announced"}
          </div>
          {program.registration_deadline ? (
            <div className="text-xs uppercase tracking-[0.24em] text-[rgba(72,108,38,0.72)]">
              Registration closes {formatDate(program.registration_deadline)}
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            href={`/programs/${program.slug}${registrationOpen ? "#registration" : ""}`}
            className="w-full"
          >
            {registrationOpen ? "Register Now" : "View Program"}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
          <Button href={`/programs/${program.slug}`} variant="ghost" className="w-full">
            Program Details
          </Button>
        </div>
      </div>
    </article>
  );
}
