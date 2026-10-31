import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to record your prayer." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = z.object({ enrollment_id: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid journey." }, { status: 400 });
  const { data: enrollment, error: enrollmentError } = await supabase.from("prayer_enrollments")
    .select("id,member_id,prayer_challenges!inner(slug,starts_at)")
    .eq("id", parsed.data.enrollment_id)
    .eq("member_id", user.id)
    .eq("prayer_challenges.slug", "30-day-prayer-streak-2026")
    .maybeSingle();
  const { data: serverNow, error: clockError } = await supabase.rpc("prayer_campaign_server_now");
  const challenge = enrollment?.prayer_challenges;
  const campaign = Array.isArray(challenge) ? challenge[0] : challenge;
  if (enrollmentError || !enrollment || clockError || typeof serverNow !== "string" || !campaign?.starts_at) {
    return NextResponse.json({ error: "Challenge check-ins are unavailable until the production campaign schedule is installed and verified." }, { status: 503 });
  }
  if (new Date(serverNow).getTime() < new Date(campaign.starts_at).getTime()) {
    return NextResponse.json({ error: "The campaign has not started yet. Your check-in is not recorded." }, { status: 409 });
  }
  const { data, error } = await supabase.rpc("checkin_prayer", { p_enrollment_id: parsed.data.enrollment_id });
  if (error) return NextResponse.json({ error: error.message.includes("complete") ? "Your 30-day journey is complete." : "Your check-in could not be saved." }, { status: 400 });
  return NextResponse.json({ success: true, result: data });
}
