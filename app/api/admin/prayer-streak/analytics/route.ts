import { NextResponse, type NextRequest } from "next/server";
import { addCalendarDays, getCampaignDay, getTimeZoneDate, localDateTimeToIso } from "@/lib/prayer-campaign";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

type Enrollment = { id: string; member_id: string; enrolled_at: string; start_local_date: string; enrollment_timezone: string; status: string; total_completed_days: number; current_streak: number; longest_streak: number; missed_days: number; member_profiles: { display_name: string; email: string } | { display_name: string; email: string }[] | null };
type Checkin = { id: string; enrollment_id: string; local_date: string; journey_day: number; completed_at: string };

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const campaignId = request.nextUrl.searchParams.get("campaign");
  if (!campaignId || !/^[0-9a-f-]{36}$/i.test(campaignId)) return NextResponse.json({ error: "Choose a campaign." }, { status: 400 });
  const db = getServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  const { data: campaign, error: campaignError } = await db.from("prayer_challenges").select("id,title,duration_days,starts_at,campaign_timezone,daily_rollover").eq("id", campaignId).maybeSingle();
  if (campaignError || !campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const enrollments: Enrollment[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("prayer_enrollments").select("id,member_id,enrolled_at,start_local_date,enrollment_timezone,status,total_completed_days,current_streak,longest_streak,missed_days,member_profiles(display_name,email)").eq("challenge_id", campaignId).order("enrolled_at", { ascending: false }).range(offset, offset + 999);
    if (error) return NextResponse.json({ error: "Could not load campaign participants." }, { status: 500 });
    enrollments.push(...(data || []) as Enrollment[]);
    if (!data || data.length < 1000) break;
  }

  const checkins: Checkin[] = [];
  for (let offset = 0; offset < enrollments.length; offset += 200) {
    const ids = enrollments.slice(offset, offset + 200).map((item) => item.id);
    for (let page = 0; ; page += 1) {
      const { data, error } = await db.from("prayer_checkins").select("id,enrollment_id,local_date,journey_day,completed_at").in("enrollment_id", ids).order("local_date").range(page * 1000, page * 1000 + 999);
      if (error) return NextResponse.json({ error: "Could not load attendance records." }, { status: 500 });
      checkins.push(...(data || []) as Checkin[]);
      if (!data || data.length < 1000) break;
    }
  }

  const timezone = campaign.campaign_timezone || "Africa/Lagos";
  const rollover = String(campaign.daily_rollover || "00:00:00").slice(0, 5);
  const now = new Date();
  const today = getTimeZoneDate(now, timezone);
  const launchLocalDate = campaign.starts_at ? getTimeZoneDate(new Date(campaign.starts_at), timezone) : today;
  const activeDay = campaign.starts_at ? getCampaignDay(now, campaign.starts_at, timezone, rollover) : 0;
  const byEnrollment = new Map<string, Checkin[]>();
  for (const checkin of checkins) byEnrollment.set(checkin.enrollment_id, [...(byEnrollment.get(checkin.enrollment_id) || []), checkin]);
  const todayCheckins = checkins.filter((item) => item.local_date === today).length;
  const newToday = enrollments.filter((item) => getTimeZoneDate(new Date(item.enrolled_at), timezone) === today).length;
  const daily = Array.from({ length: campaign.duration_days }, (_, index) => {
    const day = index + 1;
    const date = addCalendarDays(launchLocalDate, index);
    const eligible = enrollments.filter((item) => item.start_local_date <= date).length;
    const completed = checkins.filter((item) => item.journey_day === day).length;
    let closesAt: Date;
    try { closesAt = new Date(localDateTimeToIso(`${addCalendarDays(date, 1)}T${rollover}`, timezone)); }
    catch { closesAt = new Date(Number.POSITIVE_INFINITY); }
    const closed = now >= closesAt;
    return { day, date, eligible, completed, missed: closed ? Math.max(0, eligible - completed) : 0, closed, completion_percent: eligible ? Math.round(completed / eligible * 1000) / 10 : 0 };
  });
  const participants = enrollments.map((enrollment) => {
    const memberCheckins = byEnrollment.get(enrollment.id) || [];
    const calendar = Array.from({ length: campaign.duration_days }, (_, index) => {
      const day = index + 1;
      const date = addCalendarDays(launchLocalDate, index);
      const complete = memberCheckins.some((item) => item.journey_day === day);
      const eligible = enrollment.start_local_date <= date;
      return { day, date, state: complete ? "completed" : !eligible ? "before_enrollment" : daily[index]?.closed ? "missed" : date === today ? "today" : "upcoming" };
    });
    const profile = Array.isArray(enrollment.member_profiles) ? enrollment.member_profiles[0] : enrollment.member_profiles;
    return { ...enrollment, profile, enrolled_local_date: getTimeZoneDate(new Date(enrollment.enrolled_at), timezone), checkins: memberCheckins.length, last_checkin: memberCheckins.at(-1)?.local_date || null, calendar };
  });
  const trend = daily.map(({ day, date, completed, eligible, completion_percent, missed }) => ({ day, date, completed, eligible, completion_percent, missed }));
  return NextResponse.json({
    campaign: { id: campaign.id, title: campaign.title, duration_days: campaign.duration_days, starts_at: campaign.starts_at, timezone, rollover, active_day: activeDay, today },
    summary: { total: enrollments.length, new_today: newToday, active: enrollments.filter((item) => item.status === "active").length, checked_in_today: todayCheckins, today_completion_percent: daily.find((item) => item.date === today)?.completion_percent || 0, missed_previous_day: daily.find((item) => item.date === addCalendarDays(today, -1))?.missed || 0, checkins: checkins.length, completed_journeys: enrollments.filter((item) => item.status === "completed").length },
    daily,
    trend,
    participants,
  });
}
