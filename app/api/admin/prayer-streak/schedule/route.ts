import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { localDateTimeToIso } from "@/lib/prayer-campaign";

const schema = z.object({
  challenge_id: z.string().uuid(),
  starts_at_local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  campaign_timezone: z.string().trim().min(1).max(100),
  allow_late_enrollment: z.boolean(),
  daily_rollover: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export async function PUT(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid campaign schedule." }, { status: 400 });
  const db = getServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  let startsAt: string;
  try { startsAt = localDateTimeToIso(parsed.data.starts_at_local, parsed.data.campaign_timezone); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Choose a valid local date and time." }, { status: 400 }); }
  const { error } = await db.rpc("admin_set_prayer_schedule", {
    p_challenge_id: parsed.data.challenge_id,
    p_starts_at: startsAt,
    p_timezone: parsed.data.campaign_timezone,
    p_allow_late_enrollment: parsed.data.allow_late_enrollment,
    p_daily_rollover: `${parsed.data.daily_rollover}:00`,
    p_actor_email: auth.user?.email || "",
  });
  if (error) return NextResponse.json({ error: /locked after enrollment|campaign start/i.test(error.message) ? "This schedule is locked to protect existing participant records." : "Could not save the campaign schedule." }, { status: 409 });
  return NextResponse.json({ success: true, starts_at: startsAt });
}
