import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { FollowUpLogForm } from "@/components/forms/FollowUpLogForm";
import { RecordUpdateForm } from "@/components/admin/RecordUpdateForm";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { requireAdmin } from "@/lib/server/auth";
import { getBiblicalQuestionById, getFollowUpLogs } from "@/lib/data";
import { questionStatusOptions } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const question = await getBiblicalQuestionById(id);
  const logs = await getFollowUpLogs("biblical_question", id);

  if (!question) {
    return null;
  }

  const message = `Hello ${question.full_name}, God bless you. Thank you for sending your biblical question to PHOTIZO Network International. Our team has received it and will respond with biblical clarity.`;

  return (
    <AdminLayout pathname="/admin/questions" title="Biblical Question Detail" email={user.email}>
      <Container className="grid gap-6 px-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold">{question.full_name}</h2>
                <p className="mt-2 text-sm text-[rgba(11,11,11,0.62)]">
                  Submitted on {formatDate(question.created_at)}
                </p>
              </div>
              <StatusBadge status={question.status} />
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[rgba(11,11,11,0.74)]">
              <p>Email: {question.email || "Not provided"}</p>
              <p>WhatsApp: {question.whatsapp || "Not provided"}</p>
              <p>Category: {question.category || "Not specified"}</p>
              <p>Private response: {question.wants_private_response ? "Yes" : "No"}</p>
              <p>Public teaching permission: {question.allow_public_answer ? "Yes" : "No"}</p>
              <p>Question: {question.question}</p>
            </div>
            <div className="mt-6">
              <WhatsAppButton phone={question.whatsapp} message={message} />
            </div>
          </div>
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <h3 className="font-display text-2xl font-bold">Internal activity</h3>
            <div className="mt-5 space-y-4">
              {logs.length ? logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/35 p-4">
                  <p className="text-sm font-medium">{log.note}</p>
                  <p className="mt-2 text-xs text-[rgba(11,11,11,0.55)]">
                    {formatDate(log.created_at)} {log.next_action ? `• Next: ${log.next_action}` : ""}
                  </p>
                </div>
              )) : <p className="text-sm text-[rgba(11,11,11,0.6)]">No internal notes yet.</p>}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <RecordUpdateForm
            endpoint={`/api/admin/questions/${question.id}`}
            status={question.status}
            statusOptions={[...questionStatusOptions]}
            assignedTo={question.assigned_to}
            internalNotes={question.internal_notes}
            responseNotes={question.response_notes}
          />
          <FollowUpLogForm recordId={question.id} recordType="biblical_question" />
        </div>
      </Container>
    </AdminLayout>
  );
}
