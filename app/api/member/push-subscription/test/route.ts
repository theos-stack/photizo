import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const userClient = await getServerSupabaseClient();
  const { data: { user } } = await userClient?.auth.getUser() ?? { data: { user: null } };
  if (!userClient || !user) return NextResponse.json({ error: "Sign in to test prayer reminders." }, { status: 401 });
  const { data: preferences, error: preferenceError } = await userClient.from("prayer_notification_preferences").select("push_enabled").eq("member_id", user.id).maybeSingle();
  if (preferenceError) return NextResponse.json({ error: "Could not verify your reminder preference." }, { status: 500 });
  if (!preferences?.push_enabled) return NextResponse.json({ error: "Enable push reminders and save your preference before sending a test." }, { status: 400 });
  const service = getServiceSupabaseClient();
  if (!service) return NextResponse.json({ error: "Prayer reminders are not configured on the server." }, { status: 503 });
  const { data, error } = await service.functions.invoke("prayer-reminders", { body: { action: "send-test", member_id: user.id } });
  if (error || !data?.success) {
    const status = data?.configured === false ? 503 : 502;
    return NextResponse.json({ error: data?.message || "The reminder service could not deliver a test to this device." }, { status });
  }
  return NextResponse.json({ success: true, message: "The push provider accepted a test reminder for this device. Check the notification tray; delivery can take a short moment." });
}
