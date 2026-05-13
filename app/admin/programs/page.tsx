import Link from "next/link";
import { Eye } from "lucide-react";

import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { InlineStatusForm } from "@/components/admin/InlineStatusForm";
import { DataTable } from "@/components/DataTable";
import { CopyButton } from "@/components/admin/CopyButton";
import { ProgramForm } from "@/components/forms/ProgramForm";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/server/auth";
import { getAdminPrograms, getProgramRegistrations } from "@/lib/data";
import {
  formatDate,
  isProgramRegistrationOpen,
} from "@/lib/utils";
import { programStatusOptions } from "@/lib/types";

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const user = await requireAdmin();
  const [programs, registrations] = await Promise.all([
    getAdminPrograms(),
    getProgramRegistrations(),
  ]);
  const { program: selectedId } = await searchParams;
  const selectedProgram = programs.find((item) => item.id === selectedId) || null;
  const registrationCountByProgram = registrations.reduce<Record<string, number>>(
    (accumulator, registration) => {
      if (registration.program_id) {
        accumulator[registration.program_id] =
          (accumulator[registration.program_id] || 0) + 1;
      }

      return accumulator;
    },
    {},
  );

  return (
    <AdminLayout pathname="/admin/programs" title="Program CMS" email={user.email}>
      <Container className="space-y-6 px-0">
        <ProgramForm
          key={selectedProgram?.id || "new-program"}
          program={selectedProgram}
        />
        <DataTable
          columns={[
            { key: "title", label: "Program" },
            { key: "date", label: "Date" },
            { key: "registrations", label: "Registrations" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          data={programs}
          emptyTitle="No programs yet"
          emptyDescription="Create your first PHOTIZO program above."
          renderRow={(program) => (
            <tr key={program.id} className="border-t border-[rgba(72,108,38,0.08)]">
              <td className="px-5 py-4">
                <div className="font-medium text-[var(--black)]">{program.title}</div>
                <div className="text-sm text-[rgba(11,11,11,0.52)]">{program.slug}</div>
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.7)]">
                {formatDate(program.date)}
              </td>
              <td className="px-5 py-4">
                <div className="font-medium text-[var(--black)]">
                  {registrationCountByProgram[program.id] || 0}
                </div>
                <div className="text-xs uppercase tracking-[0.22em] text-[rgba(11,11,11,0.48)]">
                  {isProgramRegistrationOpen(program) ? "Open" : "Closed"}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="space-y-3">
                  <StatusBadge status={program.status} />
                  <InlineStatusForm
                    endpoint={`/api/admin/programs/${program.id}`}
                    currentStatus={program.status}
                    options={[...programStatusOptions]}
                  />
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button href={`/admin/programs?program=${program.id}`} variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button
                    href={`/admin/programs/preview?program=${program.id}`}
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    href={
                      program.status === "published"
                        ? `/programs/${program.slug}`
                        : `/admin/programs/preview?program=${program.id}#registration`
                    }
                    variant="ghost"
                    size="sm"
                  >
                    {program.status === "published" ? "Live Form" : "Form Preview"}
                  </Button>
                  <Link
                    href={`/admin/registrations?program=${program.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[rgba(72,108,38,0.14)] px-4 text-sm font-semibold"
                  >
                    View Registrations
                  </Link>
                  <CopyButton
                    path={
                      program.status === "published"
                        ? `/programs/${program.slug}`
                        : `/admin/programs/preview?program=${program.id}#registration`
                    }
                    label={
                      program.status === "published"
                        ? "Copy Register Link"
                        : "Copy Preview Link"
                    }
                  />
                  <ConfirmDeleteButton
                    endpoint={`/api/admin/programs/${program.id}`}
                    label="Delete"
                    confirmMessage={`Delete "${program.title}" from PHOTIZO? This will also remove linked registrations.`}
                  />
                </div>
              </td>
            </tr>
          )}
        />
      </Container>
    </AdminLayout>
  );
}
