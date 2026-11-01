import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({ display_name: z.string().trim().min(2).max(100), timezone: z.string().min(1).max(100), notifications_enabled: z.boolean(), push_enabled: z.boolean(), email_enabled: z.boolean(), reminder_09_enabled: z.boolean(), reminder_18_enabled: z.boolean(), reminder_21_enabled: z.boolean(), reminder_23_enabled: z.boolean(), ministry_announcements: z.boolean() });

export async function PUT(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to update your settings." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid settings." }, { status: 400 });
  try { new Intl.DateTimeFormat("en", { timeZone: parsed.data.timezone }); } catch { return NextResponse.json({ error: "Choose a valid IANA time zone." }, { status: 400 }); }
  if (parsed.data.push_enabled) {
    const { count, error: subscriptionError } = await supabase.from("prayer_push_subscriptions").select("id", { count: "exact", head: true }).eq("member_id", user.id);
    if (subscriptionError) return NextResponse.json({ error: "Could not verify this device's push subscription." }, { status: 500 });
    if (!count) return NextResponse.json({ error: "Enable push on this device before saving push reminders." }, { status: 400 });
  }
  const { display_name, timezone, ministry_announcements, ...prefs } = parsed.data;
  const [profile, preferences, consent] = await Promise.all([
    supabase.from("member_profiles").update({ display_name, timezone, notifications_enabled: prefs.push_enabled || prefs.email_enabled, updated_at: new Date().toISOString() }).eq("id", user.id),
    supabase.from("prayer_notification_preferences").upsert({ member_id: user.id, ...prefs, updated_at: new Date().toISOString() }),
    supabase.from("member_communication_consents").upsert({ member_id: user.id, ministry_announcements, consented_at: ministry_announcements ? new Date().toISOString() : null, updated_at: new Date().toISOString() }),
  ]);
  const error = profile.error || preferences.error || consent.error;
  if (error) return NextResponse.json({ error: "Could not save your settings." }, { status: 500 });
  return NextResponse.json({ success: true, note: "Your current challenge keeps the time zone selected when you enrolled; this setting applies to future enrollments." });
}
