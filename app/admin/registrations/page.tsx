import Link from "next/link";

import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { DataTable } from "@/components/DataTable";
import { RegistrationsBulkActions } from "@/components/admin/RegistrationsBulkActions";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/server/auth";
import { getAdminPrograms, getProgramRegistrations } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; program?: string }>;
}) {
  const user = await requireAdmin();
  const filters = await searchParams;
  const [registrations, programs] = await Promise.all([
    getProgramRegistrations(filters),
    getAdminPrograms(),
  ]);
  const selectedProgram =
    programs.find((program) => program.id === filters.program) || null;

  return (
    <AdminLayout pathname="/admin/registrations" title="Program Registrations" email={user.email}>
      <Container className="space-y-6 px-0">
        <RegistrationsBulkActions
          registrations={registrations}
          selectedProgramName={selectedProgram?.title || null}
        />
        <form className="grid gap-4 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_220px_auto]">
          <input
            name="search"
            defaultValue={filters.search || ""}
            placeholder="Search name, email, or WhatsApp"
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          />
          <select
            name="program"
            defaultValue={filters.program || ""}
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          >
            <option value="">All programs</option>
            <option value="interest">Interest registrations</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="attended">Attended</option>
            <option value="did_not_attend">Did not attend</option>
            <option value="followed_up">Followed up</option>
          </select>
          <Button type="submit">Filter</Button>
        </form>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "program", label: "Program" },
            { key: "status", label: "Status" },
            { key: "date", label: "Date registered" },
            { key: "actions", label: "Actions" },
          ]}
          data={registrations}
          emptyTitle="No registrations match this view"
          emptyDescription="Try another filter, or publish a program so people can begin registering."
          renderRow={(registration) => (
            <tr key={registration.id} className="border-t border-[rgba(72,108,38,0.08)]">
              <td className="px-5 py-4">
                <div className="font-medium text-[var(--black)]">{registration.full_name}</div>
                <div className="text-sm text-[rgba(11,11,11,0.52)]">{registration.email}</div>
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">
                {registration.programs?.title || "Interest registration"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={registration.status} />
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">
                {formatDate(registration.created_at)}
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/admin/registrations/${registration.id}`}
                  className="text-sm font-semibold text-[var(--dark-moss-green)]"
                >
                  Open detail
                </Link>
              </td>
            </tr>
          )}
        />
      </Container>
    </AdminLayout>
  );
}
