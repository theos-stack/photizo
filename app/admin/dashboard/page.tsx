import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/server/auth";
import { getAdminStats, getRegistrationInsights } from "@/lib/data";
import { formatDate, formatStatusLabel } from "@/lib/utils";

const labels = [
  ["Total salvation responses", "salvationResponses"],
  ["Total biblical questions", "biblicalQuestions"],
  ["Total program registrations", "programRegistrations"],
  ["Total contact messages", "contactMessages"],
  ["Total active programs", "activePrograms"],
  ["Pending follow-ups", "pendingFollowUps"],
  ["Answered questions", "answeredQuestions"],
  ["Completed follow-ups", "completedFollowUps"],
] as const;

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [stats, registrationInsights] = await Promise.all([
    getAdminStats(),
    getRegistrationInsights(),
  ]);

  return (
    <AdminLayout pathname="/admin/dashboard" title="Dashboard Overview" email={user.email}>
      <Container className="px-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {labels.map(([label, key]) => (
            <div
              key={label}
              className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft"
            >
              <div className="text-xs uppercase tracking-[0.28em] text-[rgba(11,11,11,0.46)]">
                {label}
              </div>
              <div className="mt-4 font-display text-4xl font-extrabold text-[var(--black)]">
                {stats[key]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <div className="text-sm font-semibold text-[var(--black)]">Engagement Snapshot</div>
            <div className="mt-6 space-y-4">
              {[
                ["Salvation", stats.salvationResponses],
                ["Questions", stats.biblicalQuestions],
                ["Registrations", stats.programRegistrations],
                ["Contacts", stats.contactMessages],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-[rgba(11,11,11,0.7)]">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--cultured)]">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#486C26,#FFD600)]"
                      style={{ width: `${Math.min(Number(value) * 12, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-[var(--honeydew)]/45 p-6 shadow-soft">
            <div className="text-sm font-semibold text-[var(--black)]">Operational Notes</div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[rgba(11,11,11,0.72)]">
              <li>Use Programs to publish new meetings and registration pages.</li>
              <li>Use Salvation Responses to track follow-up and discipleship progress.</li>
              <li>Use Biblical Questions for review, response notes, and teaching conversions.</li>
              <li>Use Settings to update public contact channels shown on the site.</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--black)]">
                  Registration Analytics
                </div>
                <p className="mt-2 text-sm leading-7 text-[rgba(11,11,11,0.66)]">
                  Contact coverage and status distribution across all program registrations.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/45 p-5">
                <div className="text-xs uppercase tracking-[0.26em] text-[rgba(72,108,38,0.68)]">
                  Unique Email Contacts
                </div>
                <div className="mt-3 font-display text-4xl font-bold text-[var(--black)]">
                  {registrationInsights.uniqueEmailContacts}
                </div>
              </div>
              <div className="rounded-[24px] border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/45 p-5">
                <div className="text-xs uppercase tracking-[0.26em] text-[rgba(72,108,38,0.68)]">
                  Unique WhatsApp Contacts
                </div>
                <div className="mt-3 font-display text-4xl font-bold text-[var(--black)]">
                  {registrationInsights.uniqueWhatsappContacts}
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {registrationInsights.statusBreakdown.length ? (
                registrationInsights.statusBreakdown.map(({ status, count }) => (
                  <div key={status}>
                    <div className="mb-2 flex items-center justify-between text-sm text-[rgba(11,11,11,0.7)]">
                      <span>{formatStatusLabel(status)}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--cultured)]">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#486C26,#FFD600)]"
                        style={{
                          width: `${Math.min(
                            (count / Math.max(registrationInsights.totalRegistrations, 1)) *
                              100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgba(11,11,11,0.6)]">
                  No registration activity yet.
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-6">
            <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
              <div className="text-sm font-semibold text-[var(--black)]">
                Top Programs by Registration
              </div>
              <div className="mt-5 space-y-4">
                {registrationInsights.topPrograms.length ? (
                  registrationInsights.topPrograms.map((program) => (
                    <div
                      key={program.title}
                      className="flex items-center justify-between rounded-2xl border border-[rgba(72,108,38,0.08)] bg-[var(--cultured)]/55 px-4 py-3"
                    >
                      <div className="font-medium text-[var(--black)]">{program.title}</div>
                      <div className="text-sm text-[rgba(11,11,11,0.58)]">
                        {program.count} registrations
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[rgba(11,11,11,0.6)]">
                    No registrations yet.
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft">
              <div className="text-sm font-semibold text-[var(--black)]">
                Recent Registrants
              </div>
              <div className="mt-5 space-y-4">
                {registrationInsights.recentRegistrations.length ? (
                  registrationInsights.recentRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="rounded-2xl border border-[rgba(72,108,38,0.08)] bg-[var(--cultured)]/55 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-[var(--black)]">
                            {registration.full_name}
                          </div>
                          <div className="text-sm text-[rgba(11,11,11,0.56)]">
                            {registration.email || "No email provided"}
                          </div>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.22em] text-[rgba(11,11,11,0.5)]">
                          {formatDate(registration.created_at)}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-[rgba(11,11,11,0.66)]">
                        {registration.programs?.title || "Interest registration"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[rgba(11,11,11,0.6)]">
                    Recent program registrants will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </AdminLayout>
  );
}
