import { CampaignPrelaunchDashboard } from "@/components/streak/CampaignPrelaunchDashboard";
import { PrayerStreakDashboard } from "@/components/streak/PrayerStreakDashboard";
import { MemberBar } from "@/components/streak/MemberBar";
import { Container } from "@/components/Container";
import { requireMember } from "@/lib/server/member";
import { getCampaignDay, getTimeZoneDate } from "@/lib/prayer-campaign";

const CAMPAIGN_SLUG = "30-day-prayer-streak-2026";
const LEGACY_SLUG = "30-day-prayer-streak";
type Campaign = {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  minutes_per_day: number;
  status: string;
  starts_at?: string | null;
  campaign_timezone?: string | null;
  daily_rollover?: string | null;
};

export default async function StreakDashboardPage() {
  const { supabase, user, profile } = await requireMember("/streak/dashboard");
  const [scheduleProbe, clockProbe] = await Promise.all([
    supabase.from("prayer_challenges").select("id,status,starts_at,campaign_timezone,daily_rollover").eq("slug", CAMPAIGN_SLUG).maybeSingle(),
    supabase.rpc("prayer_campaign_server_now"),
  ]);
  const campaign = scheduleProbe.data as unknown as Campaign | null;
  const scheduleConfirmed = !scheduleProbe.error && campaign?.status === "published" && Boolean(campaign.starts_at) && !clockProbe.error && typeof clockProbe.data === "string";

  if (!scheduleConfirmed || !campaign?.starts_at || typeof clockProbe.data !== "string") {
    const { data: legacyRow } = await supabase.from("prayer_challenges").select("*").eq("slug", LEGACY_SLUG).maybeSingle();
    const legacyCampaign = legacyRow as unknown as Campaign | null;
    const { data: enrollment } = legacyCampaign
      ? await supabase.from("prayer_enrollments").select("id").eq("member_id", user.id).eq("challenge_id", legacyCampaign.id).maybeSingle()
      : { data: null };
    return <><MemberBar email={user.email || "Member"}/><CampaignPrelaunchDashboard startsAt={null} serverNow={null} timeZone="Africa/Lagos" challengeId={legacyCampaign?.id || ""} isEnrolled={Boolean(enrollment)} scheduleConfirmed={false}/></>;
  }

  const timeZone = campaign.campaign_timezone || "Africa/Lagos";
  const serverNow = clockProbe.data;
  const now = new Date(serverNow);
  const startsAt = new Date(campaign.starts_at);
  const campaignDay = getCampaignDay(now, campaign.starts_at, timeZone, campaign.daily_rollover || "00:00");
  const [{ data: enrollments }, { data: selectedCampaign }] = await Promise.all([
    supabase.from("prayer_enrollments").select("id,start_local_date,status,challenge_id,enrolled_at,enrollment_timezone,total_completed_days,current_streak,longest_streak,missed_days").eq("member_id", user.id).eq("challenge_id", campaign.id).limit(1),
    supabase.from("prayer_challenges").select("*").eq("id", campaign.id).eq("status", "published").maybeSingle(),
  ]);
  const enrollment = enrollments?.[0] || null;
  const activeCampaign = selectedCampaign as unknown as Campaign | null;

  if (now < startsAt) {
    return <><MemberBar email={user.email || "Member"}/><CampaignPrelaunchDashboard startsAt={campaign.starts_at} serverNow={serverNow} timeZone={timeZone} challengeId={campaign.id} isEnrolled={Boolean(enrollment)}/></>;
  }

  const challenge = activeCampaign || campaign;
  const [daysResult, checkinsResult, achievementsResult, musicResult] = await Promise.all([
    supabase.from("prayer_challenge_days").select("day_number,title,bible_reference,encouragement,prayer_points,completion_message").eq("challenge_id", campaign.id).order("day_number"),
    enrollment ? supabase.from("prayer_checkins").select("local_date,journey_day").eq("enrollment_id", enrollment.id).order("local_date") : Promise.resolve({ data: [], error: null }),
    enrollment ? supabase.from("prayer_achievements").select("milestone").eq("enrollment_id", enrollment.id).order("milestone") : Promise.resolve({ data: [], error: null }),
    supabase.from("prayer_music_items").select("id,title,description,provider,provider_url,sort_order").eq("is_published", true).order("sort_order").order("created_at"),
  ]);
  const today = getTimeZoneDate(now, timeZone);
  const musicItems = (musicResult.error ? [] : musicResult.data || []) as { id: string; title: string; description: string; provider: "spotify" | "youtube" | "audio"; provider_url: string; sort_order: number }[];
  return <><MemberBar email={user.email || "Member"}/><main className="py-6 sm:py-10"><Container><PrayerStreakDashboard profile={profile} challenge={challenge} enrollment={enrollment ? { ...enrollment, prayer_challenges: challenge } : null} days={daysResult.data || []} checkins={checkinsResult.data || []} achievements={achievementsResult.data || []} musicItems={musicItems} today={today} campaignDay={campaignDay}/></Container></main></>;
}
