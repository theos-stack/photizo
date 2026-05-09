import Link from "next/link";

import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/server/auth";
import { getSalvationResponses } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function SalvationResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const user = await requireAdmin();
  const filters = await searchParams;
  const responses = await getSalvationResponses(filters);

  return (
    <AdminLayout pathname="/admin/salvation-responses" title="Salvation Responses" email={user.email}>
      <Container className="space-y-6 px-0">
        <form className="grid gap-4 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          <input
            name="search"
            defaultValue={filters.search || ""}
            placeholder="Search name, email, or WhatsApp"
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="prayed_with">Prayed with</option>
            <option value="in_follow_up">In follow-up</option>
            <option value="joined_discipleship">Joined discipleship</option>
            <option value="planted_in_church">Planted in church</option>
            <option value="needs_attention">Needs attention</option>
            <option value="completed">Completed</option>
          </select>
          <Button type="submit">Filter</Button>
        </form>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "status", label: "Status" },
            { key: "assigned", label: "Assigned follow-up person" },
            { key: "date", label: "Date submitted" },
            { key: "actions", label: "Actions" },
          ]}
          data={responses}
          renderRow={(response) => (
            <tr key={response.id} className="border-t border-[rgba(72,108,38,0.08)]">
              <td className="px-5 py-4">
                <div className="font-medium text-[var(--black)]">{response.full_name}</div>
                <div className="text-sm text-[rgba(11,11,11,0.52)]">{response.email}</div>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={response.status} />
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">
                {response.assigned_to || "Unassigned"}
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">
                {formatDate(response.created_at)}
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/admin/salvation-responses/${response.id}`}
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
