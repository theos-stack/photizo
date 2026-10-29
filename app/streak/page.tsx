import { PrayerStreakDashboard } from "@/components/streak/PrayerStreakDashboard";
import { MemberBar } from "@/components/streak/MemberBar";
import { Container } from "@/components/Container";
import { requireMember, getLocalDate } from "@/lib/server/member";

export default async function StreakDashboardPage({searchParams}:{searchParams:Promise<{challenge?:string}>}) {
  const { supabase, user, profile } = await requireMember();
  const params=await searchParams;
  const [{data:enrollments},{data:selectedChallenge}]=await Promise.all([supabase.from("prayer_enrollments").select("id,start_local_date,status,challenge_id,enrolled_at,enrollment_timezone,total_completed_days,current_streak,longest_streak,missed_days").eq("member_id",user.id).order("enrolled_at",{ascending:false}).limit(20),params.challenge?supabase.from("prayer_challenges").select("id,title,description,duration_days,minutes_per_day").eq("id",params.challenge).eq("status","published").maybeSingle():Promise.resolve({data:null})]);
  const enrollment=params.challenge?enrollments?.find(item=>item.challenge_id===params.challenge)||null:enrollments?.find(item=>item.status==="active")||enrollments?.[0]||null;
  const {data:enrollmentChallenge}=enrollment&&!selectedChallenge?await supabase.from("prayer_challenges").select("id,title,description,duration_days,minutes_per_day").eq("id",enrollment.challenge_id).maybeSingle():{data:null};
  const { data: defaultChallenge } = !selectedChallenge&&!enrollmentChallenge?await supabase.from("prayer_challenges").select("id,title,description,duration_days,minutes_per_day").eq("slug","30-day-prayer-streak").eq("status","published").maybeSingle():{data:null};
  const challenge=selectedChallenge||enrollmentChallenge||defaultChallenge;
  const [daysResult, checkinsResult, achievementsResult] = await Promise.all([
    challenge ? supabase.from("prayer_challenge_days").select("day_number,title,bible_reference,encouragement,prayer_points,completion_message").eq("challenge_id",challenge.id).order("day_number") : Promise.resolve({data:[],error:null}),
    enrollment ? supabase.from("prayer_checkins").select("local_date,journey_day").eq("enrollment_id",enrollment.id).order("local_date") : Promise.resolve({data:[],error:null}),
    enrollment ? supabase.from("prayer_achievements").select("milestone").eq("enrollment_id",enrollment.id).order("milestone") : Promise.resolve({data:[],error:null}),
  ]);
  const timeZone = enrollment?.enrollment_timezone || profile?.timezone || "Africa/Lagos";
  const today = getLocalDate(timeZone);
  return <><MemberBar email={user.email || "Member"} /><main className="py-6 sm:py-10"><Container><PrayerStreakDashboard profile={profile} challenge={challenge} enrollment={enrollment && challenge ? {...enrollment, prayer_challenges: challenge} : null} days={daysResult.data || []} checkins={checkinsResult.data || []} achievements={achievementsResult.data || []} today={today} /></Container></main></>;
}
