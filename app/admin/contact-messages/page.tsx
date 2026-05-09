import { AdminLayout } from "@/components/AdminLayout";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { InlineStatusForm } from "@/components/admin/InlineStatusForm";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/server/auth";
import { getContactMessages } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const user = await requireAdmin();
  const filters = await searchParams;
  const messages = await getContactMessages(filters);

  return (
    <AdminLayout pathname="/admin/contact-messages" title="Contact Messages" email={user.email}>
      <Container className="space-y-6 px-0">
        <form className="grid gap-4 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          <input
            name="search"
            defaultValue={filters.search || ""}
            placeholder="Search name, email, or subject"
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
          </select>
          <Button type="submit">Filter</Button>
        </form>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "subject", label: "Subject" },
            { key: "message", label: "Message preview" },
            { key: "status", label: "Status" },
            { key: "date", label: "Date submitted" },
            { key: "actions", label: "Actions" },
          ]}
          data={messages}
          renderRow={(message) => (
            <tr key={message.id} className="border-t border-[rgba(72,108,38,0.08)]">
              <td className="px-5 py-4">
                <div className="font-medium text-[var(--black)]">{message.full_name}</div>
                <div className="text-sm text-[rgba(11,11,11,0.52)]">{message.email}</div>
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">{message.subject}</td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">{message.message.slice(0, 80)}...</td>
              <td className="px-5 py-4">
                <div className="space-y-2">
                  <StatusBadge status={message.status} />
                  <InlineStatusForm
                    endpoint={`/api/admin/contact-messages/${message.id}`}
                    currentStatus={message.status}
                    options={["new", "responded", "closed"]}
                  />
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">{formatDate(message.created_at)}</td>
              <td className="px-5 py-4">
                <ConfirmDeleteButton
                  endpoint={`/api/admin/contact-messages/${message.id}`}
                  label="Delete"
                  confirmMessage={`Delete the message from ${message.full_name}?`}
                />
              </td>
            </tr>
          )}
        />
      </Container>
    </AdminLayout>
  );
}
