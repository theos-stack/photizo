import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { RecordUpdateForm } from "@/components/admin/RecordUpdateForm";
import { FollowUpLogForm } from "@/components/forms/FollowUpLogForm";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getFollowUpLogs, getProgramRegistrationById } from "@/lib/data";
import { requireAdmin } from "@/lib/server/auth";
import { registrationStatusOptions } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const registration = await getProgramRegistrationById(id);
  const logs = await getFollowUpLogs("program_registration", id);

  if (!registration) {
    return null;
  }

  const message = `Hello ${registration.full_name}, God bless you. Thank you for registering for ${registration.programs?.title || "our PHOTIZO program"}. We have received your registration and will keep you updated.`;
  const registrationFormFields = registration.programs?.registration_form || [];

  return (
    <AdminLayout
      pathname="/admin/registrations"
      title="Registration Detail"
      email={user.email}
    >
      <Container className="grid gap-6 px-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold">
                  {registration.full_name}
                </h2>
                <p className="mt-2 text-sm text-[rgba(11,11,11,0.62)]">
                  Registered on {formatDate(registration.created_at)}
                </p>
              </div>
              <StatusBadge status={registration.status} />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[rgba(11,11,11,0.74)]">
              <p>Email: {registration.email || "Not provided"}</p>
              <p>WhatsApp: {registration.whatsapp || "Not provided"}</p>
              <p>Country: {registration.country || "Not provided"}</p>
              <p>City: {registration.city || "Not provided"}</p>
              <p>Program: {registration.programs?.title || "Interest registration"}</p>
              <p>Message: {registration.message || "No message supplied"}</p>
            </div>
            {registration.custom_answers &&
            Object.keys(registration.custom_answers).length ? (
              <div className="mt-6 rounded-[24px] border border-[rgba(72,108,38,0.1)] bg-[var(--cultured)]/55 p-5">
                <h3 className="font-display text-2xl font-bold text-[var(--black)]">
                  Custom form answers
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-[rgba(11,11,11,0.74)]">
                  {Object.entries(registration.custom_answers).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-[rgba(72,108,38,0.08)] bg-white px-4 py-3"
                    >
                      <div className="text-xs uppercase tracking-[0.22em] text-[rgba(11,11,11,0.48)]">
                        {registrationFormFields.find((field) => field.key === key)?.label ||
                          key.replace(/-/g, " ")}
                      </div>
                      <div className="mt-2 text-sm font-medium text-[var(--black)]">
                        {value || "No response"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-6">
              <WhatsAppButton phone={registration.whatsapp} message={message} />
            </div>
          </div>
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <h3 className="font-display text-2xl font-bold">Follow-up timeline</h3>
            <div className="mt-5 space-y-4">
              {logs.length ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/35 p-4"
                  >
                    <p className="text-sm font-medium">{log.note}</p>
                    <p className="mt-2 text-xs text-[rgba(11,11,11,0.55)]">
                      {formatDate(log.created_at)}
                      {log.next_action ? ` • Next: ${log.next_action}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgba(11,11,11,0.6)]">
                  No follow-up logs yet.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <RecordUpdateForm
            endpoint={`/api/admin/registrations/${registration.id}`}
            status={registration.status}
            statusOptions={[...registrationStatusOptions]}
          />
          <FollowUpLogForm
            recordId={registration.id}
            recordType="program_registration"
          />
        </div>
      </Container>
    </AdminLayout>
  );
}
