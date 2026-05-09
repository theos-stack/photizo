import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { FollowUpLogForm } from "@/components/forms/FollowUpLogForm";
import { RecordUpdateForm } from "@/components/admin/RecordUpdateForm";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CopyButton } from "@/components/admin/CopyButton";
import { requireAdmin } from "@/lib/server/auth";
import { getFollowUpLogs, getSalvationResponseById } from "@/lib/data";
import { salvationStatusOptions } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function SalvationResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const response = await getSalvationResponseById(id);
  const logs = await getFollowUpLogs("salvation_response", id);

  if (!response) {
    return null;
  }

  const message = `Hello ${response.full_name}, God bless you. Thank you for reaching out to PHOTIZO Network International. We received your salvation follow-up form and would love to pray with you and help you grow in your walk with Christ.`;

  return (
    <AdminLayout pathname="/admin/salvation-responses" title="Salvation Response Detail" email={user.email}>
      <Container className="grid gap-6 px-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold">{response.full_name}</h2>
                <p className="mt-2 text-sm text-[rgba(11,11,11,0.62)]">
                  Submitted on {formatDate(response.created_at)}
                </p>
              </div>
              <StatusBadge status={response.status} />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[rgba(11,11,11,0.74)]">
              <p>Email: {response.email || "Not provided"}</p>
              <p>WhatsApp: {response.whatsapp || "Not provided"}</p>
              <p>Country: {response.country || "Not provided"}</p>
              <p>City: {response.city || "Not provided"}</p>
              <p>Received Christ today: {response.received_christ_today ? "Yes" : "No"}</p>
              <p>Needs follow-up: {response.needs_follow_up ? "Yes" : "No"}</p>
              <p>Attends church: {response.attends_church ? "Yes" : "No"}</p>
              <p>Prayer request or message: {response.message || "No message supplied"}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <WhatsAppButton phone={response.whatsapp} message={message} />
              {response.email ? (
                <CopyButton value={response.email} label="Copy Email" />
              ) : null}
            </div>
          </div>
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <h3 className="font-display text-2xl font-bold">Follow-up timeline</h3>
            <div className="mt-5 space-y-4">
              {logs.length ? logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/35 p-4">
                  <p className="text-sm font-medium">{log.note}</p>
                  <p className="mt-2 text-xs text-[rgba(11,11,11,0.55)]">
                    {formatDate(log.created_at)} {log.next_action ? `• Next: ${log.next_action}` : ""}
                  </p>
                </div>
              )) : <p className="text-sm text-[rgba(11,11,11,0.6)]">No follow-up logs yet.</p>}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <RecordUpdateForm
            endpoint={`/api/admin/salvation-responses/${response.id}`}
            status={response.status}
            statusOptions={[...salvationStatusOptions]}
            assignedTo={response.assigned_to}
            nextFollowUpDate={response.next_follow_up_date}
          />
          <FollowUpLogForm recordId={response.id} recordType="salvation_response" />
        </div>
      </Container>
    </AdminLayout>
  );
}
