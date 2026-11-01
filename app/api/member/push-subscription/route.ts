import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { isTrustedPushEndpoint } from "@/lib/push-endpoint";

const schema = z.object({ endpoint: z.string().url().max(2048), keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }) });
async function getAuthed() {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  return { supabase, user };
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthed();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to enable reminders." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid subscription." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  if (!isTrustedPushEndpoint(endpoint)) return NextResponse.json({ error: "This push provider is not supported." }, { status: 400 });
  const { error } = await supabase.from("prayer_push_subscriptions").upsert({ member_id: user.id, endpoint, p256dh: keys.p256dh, auth_secret: keys.auth, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Could not save this device." }, { status: 500 });
  const { error: preferenceError } = await supabase.from("prayer_notification_preferences").upsert({ member_id: user.id, push_enabled: true, updated_at: new Date().toISOString() });
  if (preferenceError) return NextResponse.json({ error: "This device was registered, but reminder consent could not be saved." }, { status: 500 });
  return NextResponse.json({ success: true, push_enabled: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthed();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to manage reminders." }, { status: 401 });
  const { endpoint } = await request.json().catch(() => ({ endpoint: "" }));
  if (typeof endpoint === "string" && endpoint && !isTrustedPushEndpoint(endpoint)) return NextResponse.json({ error: "This push provider is not supported." }, { status: 400 });
  const targeted = typeof endpoint === "string" && Boolean(endpoint);
  let deleteQuery = supabase.from("prayer_push_subscriptions").delete().eq("member_id", user.id);
  if (targeted) deleteQuery = deleteQuery.eq("endpoint", endpoint);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) return NextResponse.json({ error: "Could not remove this device." }, { status: 500 });
  const { count, error: countError } = await supabase.from("prayer_push_subscriptions").select("id", { count: "exact", head: true }).eq("member_id", user.id);
  if (countError) return NextResponse.json({ error: "This device was removed, but remaining reminder devices could not be checked." }, { status: 500 });
  const { error: preferenceError } = await supabase.from("prayer_notification_preferences").upsert({ member_id: user.id, push_enabled: targeted ? Boolean(count) : false, updated_at: new Date().toISOString() });
  if (preferenceError) return NextResponse.json({ error: "The device was removed, but reminder preference could not be updated." }, { status: 500 });
  return NextResponse.json({ success: true, push_enabled: targeted ? Boolean(count) : false });
}
