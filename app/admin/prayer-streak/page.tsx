import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { PrayerStreakAdmin } from "@/components/admin/PrayerStreakAdmin";
import { PrayerMusicAdmin } from "@/components/admin/PrayerMusicAdmin";
import { PrayerNotificationTemplates } from "@/components/admin/PrayerNotificationTemplates";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { formatLocalDateTime } from "@/lib/prayer-campaign";

const PAGE_SIZE = 100;
type CampaignRow = { id: string; title: string; description: string; status: string; slug: string; duration_days: number; starts_at?: string | null; campaign_timezone?: string | null; allow_late_enrollment?: boolean; daily_rollover?: string };

export default async function AdminPrayerStreakPage({ searchParams }: { searchParams: Promise<{ campaign?: string; page?: string }> }) {
  const user = await requireAdmin();
  const db = getServiceSupabaseClient();
  if (!db) return <AdminLayout pathname="/admin/prayer-streak" title="Prayer Streak" email={user.email}><Container><p className="rounded-2xl bg-white p-6">Server database credentials are required to manage prayer streaks.</p></Container></AdminLayout>;

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const start = (page - 1) * PAGE_SIZE;
  const scheduleSchemaProbe = await db.from("prayer_challenges").select("starts_at").limit(1);
  const campaignSchemaReady = !scheduleSchemaProbe.error;
  const [campaignsRes, templatesRes, enrollmentPage, activeCount, streakCount, completedCount, checkinCount, emailCount, pushCount, consentCount] = await Promise.all([
    db.from("prayer_challenges").select("*").order("created_at", { ascending: false }),
    db.from("prayer_notification_templates").select("template_key,subject,body").order("template_key"),
    db.from("prayer_enrollments").select("id,member_id,enrolled_at,start_local_date,enrollment_timezone,status,total_completed_days,current_streak,longest_streak,missed_days,member_profiles(display_name,email)", { count: "exact" }).order("enrolled_at", { ascending: false }).range(start, start + PAGE_SIZE - 1),
    db.from("prayer_enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("prayer_enrollments").select("id", { count: "exact", head: true }).eq("status", "active").gt("current_streak", 0),
    db.from("prayer_enrollments").select("id", { count: "exact", head: true }).eq("status", "completed"),
    db.from("prayer_checkins").select("id", { count: "exact", head: true }),
    db.from("prayer_notification_preferences").select("member_id", { count: "exact", head: true }).eq("email_enabled", true),
    db.from("prayer_notification_preferences").select("member_id", { count: "exact", head: true }).eq("push_enabled", true),
    db.from("member_communication_consents").select("member_id", { count: "exact", head: true }).eq("ministry_announcements", true),
  ]);
  const failure = campaignsRes.error || templatesRes.error || enrollmentPage.error || activeCount.error || streakCount.error || completedCount.error || checkinCount.error || emailCount.error || pushCount.error || consentCount.error;
  if (failure) throw new Error("Could not load prayer streak administration data.");

  const campaigns = (campaignsRes.data || []) as unknown as CampaignRow[];
  const challenge = campaigns.find((item) => item.id === params.campaign)
    || campaigns.find((item) => item.slug === "30-day-prayer-streak-2026")
    || campaigns[0]
    || null;
  const scheduleLocal = challenge?.starts_at ? formatLocalDateTime(challenge.starts_at, challenge.campaign_timezone || "Africa/Lagos") : "2026-11-01T09:00";
  const [daysRes, checkins, musicRes] = await Promise.all([
    challenge
      ? db.from("prayer_challenge_days").select("day_number,title,bible_reference,encouragement,prayer_points,completion_message").eq("challenge_id", challenge.id).order("day_number")
      : Promise.resolve({ data: [], error: null }),
    (async () => {
      const enrollmentIds = (enrollmentPage.data || []).map((row) => row.id);
      if (!enrollmentIds.length) return [];
      const rows: { id: string; enrollment_id: string; local_date: string }[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await db.from("prayer_checkins").select("id,enrollment_id,local_date")
          .in("enrollment_id", enrollmentIds).order("local_date", { ascending: false }).range(offset, offset + 999);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      return rows;
    })(),
    db.from("prayer_music_items").select("id,title,description,provider,provider_url,sort_order,is_published").order("sort_order").order("created_at"),
  ]);
  if (daysRes.error) throw new Error("Could not load the selected campaign guides.");

  const byEnrollment = new Map<string, { count: number; last: string | null }>();
  for (const checkin of checkins) {
    const old = byEnrollment.get(checkin.enrollment_id) || { count: 0, last: null };
    old.count++;
    if (!old.last || checkin.local_date > old.last) old.last = checkin.local_date;
    byEnrollment.set(checkin.enrollment_id, old);
  }
  const participants = (enrollmentPage.data || []).map((row) => {
    const stats = byEnrollment.get(row.id) || { count: 0, last: null };
    const profile = Array.isArray(row.member_profiles) ? row.member_profiles[0] : row.member_profiles;
    return { ...row, profile, checkins: stats.count, last_checkin: stats.last };
  });
  const summary = {
    participant_total: enrollmentPage.count || 0,
    participant_page: page,
    participant_pages: Math.max(1, Math.ceil((enrollmentPage.count || 0) / PAGE_SIZE)),
    active: activeCount.count || 0,
    active_streaks: streakCount.count || 0,
    completed: completedCount.count || 0,
    checkins: checkinCount.count || 0,
    email_reminders: emailCount.count || 0,
    push_reminders: pushCount.count || 0,
    announcements: consentCount.count || 0,
  };

  return <AdminLayout pathname="/admin/prayer-streak" title="Prayer Streak Management" email={user.email}>
    <Container className="px-0">
      <PrayerStreakAdmin challenge={challenge} scheduleLocal={scheduleLocal} campaigns={campaigns} days={daysRes.data || []} participants={participants} summary={summary} campaignSchemaReady={campaignSchemaReady} campaignScheduleSaved={Boolean(challenge?.starts_at)} />
      {campaignSchemaReady ? <div className="mt-6"><PrayerMusicAdmin initial={musicRes.error ? [] : musicRes.data || []} /></div> : <p className="mt-5 rounded-2xl bg-[#f4eddf] p-4 text-sm text-black/65">Campaign scheduling, extended reporting, and music publishing will appear after the campaign migration is installed.</p>}
      <PrayerNotificationTemplates initial={(templatesRes.data || []) as { template_key: "welcome" | "reminder" | "milestone"; subject: string; body: string }[]} />
    </Container>
  </AdminLayout>;
}
