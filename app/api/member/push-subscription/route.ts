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
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthed();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to manage reminders." }, { status: 401 });
  const { endpoint } = await request.json().catch(() => ({ endpoint: "" }));
  if (typeof endpoint === "string" && endpoint) await supabase.from("prayer_push_subscriptions").delete().eq("member_id", user.id).eq("endpoint", endpoint);
  return NextResponse.json({ success: true });
}
