import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase/server";

async function getUserClient() {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUserClient();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to view this preference." }, { status: 401 });
  const { data, error } = await supabase.from("member_profiles").select("whatsapp_community_joined_at").eq("id", user.id).maybeSingle();
  if (error?.code === "42703") return NextResponse.json({ joined: false, persisted: false });
  if (error) return NextResponse.json({ error: "Could not load the community preference." }, { status: 500 });
  return NextResponse.json({ joined: Boolean(data?.whatsapp_community_joined_at), persisted: true });
}

export async function PUT(request: Request) {
  const { supabase, user } = await getUserClient();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to save this preference." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid preference." }, { status: 400 }); }
  const parsed = z.object({ joined: z.boolean() }).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Choose whether you have joined the community." }, { status: 400 });
  const { data, error } = await supabase.from("member_profiles")
    .update({ whatsapp_community_joined_at: parsed.data.joined ? new Date().toISOString() : null })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error?.code === "42703") return NextResponse.json({ persisted: false, error: "Account-wide community preferences are not enabled yet." }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "Could not save the community preference." }, { status: 500 });
  return NextResponse.json({ success: true, persisted: true, joined: parsed.data.joined });
}
