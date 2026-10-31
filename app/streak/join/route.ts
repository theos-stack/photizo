import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  const requestedCampaign = request.nextUrl.searchParams.get("campaign");
  const campaignQuery = requestedCampaign && /^[0-9a-f-]{36}$/i.test(requestedCampaign) ? `?campaign=${encodeURIComponent(requestedCampaign)}` : "";
  if (!supabase || !user) {
    return NextResponse.redirect(new URL(`/streak/login?next=${encodeURIComponent(`/streak/join${campaignQuery}`)}`, request.url));
  }
  const challenge = await supabase.from("prayer_challenges").select("id,starts_at").eq("slug", "30-day-prayer-streak-2026").eq("status", "published").maybeSingle();
  const { data: serverNow, error: clockError } = await supabase.rpc("prayer_campaign_server_now");
  if (challenge.error || !challenge.data?.starts_at || clockError || typeof serverNow !== "string") {
    return NextResponse.redirect(new URL("/streak?notice=setup", request.url));
  }
  if (requestedCampaign && requestedCampaign !== challenge.data.id) {
    return NextResponse.redirect(new URL("/streak?notice=setup", request.url));
  }
  const { error } = await supabase.rpc("enroll_prayer_member", { p_challenge_id: challenge.data.id });
  if (error) return NextResponse.redirect(new URL(`/streak?notice=${encodeURIComponent(error.message.includes("Late enrollment") ? "closed" : "setup")}`, request.url));
  return NextResponse.redirect(new URL(`/streak/dashboard?challenge=${encodeURIComponent(challenge.data.id)}`, request.url));
}
