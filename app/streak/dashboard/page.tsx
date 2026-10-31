import { PrayerStreakDashboard } from "@/components/streak/PrayerStreakDashboard";
import { CampaignSetupPending } from "@/components/streak/CampaignSetupPending";
import { MemberBar } from "@/components/streak/MemberBar";
import { Container } from "@/components/Container";
import { requireMember, getLocalDate } from "@/lib/server/member";

const CAMPAIGN_SLUG = "30-day-prayer-streak-2026";
const BASE_CHALLENGE_FIELDS = "id,title,description,duration_days,minutes_per_day";
const SCHEDULE_FIELDS = `${BASE_CHALLENGE_FIELDS},starts_at,campaign_timezone,allow_late_enrollment,daily_rollover`;

export default async function StreakDashboardPage({ searchParams }: { searchParams: Promise<{ challenge?: string }> }) {
  const { supabase, user, profile } = await requireMember("/streak/dashboard");
  const params = await searchParams;

  // Do not infer launch state from a local default. A saved production start and
  // the database clock RPC must both exist before challenge actions are enabled.
  const [scheduleProbe, clockProbe] = await Promise.all([
    supabase.from("prayer_challenges").select("id,status,starts_at,campaign_timezone,daily_rollover,allow_late_enrollment").eq("slug", CAMPAIGN_SLUG).maybeSingle(),
    supabase.rpc("prayer_campaign_server_now"),
  ]);
  const campaignReady = !scheduleProbe.error && scheduleProbe.data?.status === "published" && Boolean(scheduleProbe.data?.starts_at) && !clockProbe.error && typeof clockProbe.data === "string";

  if (!campaignReady) {
    const { data: challenge } = await supabase.from("prayer_challenges").select(BASE_CHALLENGE_FIELDS).eq("slug", CAMPAIGN_SLUG).maybeSingle();
    const { data: day } = challenge
      ? await supabase.from("prayer_challenge_days").select("day_number,title,bible_reference,encouragement,prayer_points").eq("challenge_id", challenge.id).eq("day_number", 1).maybeSingle()
      : { data: null };
    return <><MemberBar email={user.email || "Member"}/><main className="py-6 sm:py-10"><Container><CampaignSetupPending name={profile?.display_name} day={day || null}/></Container></main></>;
  }

  const challengeFields = SCHEDULE_FIELDS;
  const [{ data: enrollments }, { data: selectedChallenge }] = await Promise.all([
    supabase.from("prayer_enrollments").select("id,start_local_date,status,challenge_id,enrolled_at,enrollment_timezone,total_completed_days,current_streak,longest_streak,missed_days").eq("member_id", user.id).order("enrolled_at", { ascending: false }).limit(20),
    params.challenge === scheduleProbe.data?.id ? supabase.from("prayer_challenges").select(challengeFields).eq("id", params.challenge).eq("status", "published").maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const enrollment = params.challenge ? enrollments?.find((item) => item.challenge_id === params.challenge) || null : enrollments?.find((item) => item.status === "active") || enrollments?.[0] || null;
  const { data: enrollmentChallenge } = enrollment && !selectedChallenge
    ? await supabase.from("prayer_challenges").select(challengeFields).eq("id", enrollment.challenge_id).maybeSingle()
    : { data: null };
  const { data: defaultChallenge } = !selectedChallenge && !enrollmentChallenge
    ? await supabase.from("prayer_challenges").select(challengeFields).eq("slug", CAMPAIGN_SLUG).eq("status", "published").maybeSingle()
    : { data: null };
  const challenge = selectedChallenge || enrollmentChallenge || defaultChallenge;
  const [daysResult, checkinsResult, achievementsResult, musicResult] = await Promise.all([
    challenge ? supabase.from("prayer_challenge_days").select("day_number,title,bible_reference,encouragement,prayer_points,completion_message").eq("challenge_id", challenge.id).order("day_number") : Promise.resolve({ data: [], error: null }),
    enrollment ? supabase.from("prayer_checkins").select("local_date,journey_day").eq("enrollment_id", enrollment.id).order("local_date") : Promise.resolve({ data: [], error: null }),
    enrollment ? supabase.from("prayer_achievements").select("milestone").eq("enrollment_id", enrollment.id).order("milestone") : Promise.resolve({ data: [], error: null }),
    supabase.from("prayer_music_items").select("id,title,description,provider,provider_url,sort_order").eq("is_published", true).order("sort_order").limit(20),
  ]);
  const timeZone = challenge?.campaign_timezone || enrollment?.enrollment_timezone || profile?.timezone || "Africa/Lagos";
  const today = getLocalDate(timeZone);
  const serverNow = clockProbe.data as string;
  const campaignId = challenge?.id;
  return <><MemberBar email={user.email || "Member"}/><main className="py-6 sm:py-10"><Container><PrayerStreakDashboard profile={profile} challenge={challenge} enrollment={enrollment && challenge ? { ...enrollment, prayer_challenges: challenge } : null} days={daysResult.data || []} checkins={checkinsResult.data || []} achievements={achievementsResult.data || []} today={today} serverNow={serverNow} musicItems={musicResult.error ? [] : musicResult.data || []} joinHref={campaignId ? `/streak/join?campaign=${encodeURIComponent(campaignId)}` : "/streak/join"}/></Container></main></>;
}
