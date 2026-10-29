import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ error: "Sign in before joining the challenge." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = z.object({ challenge_id: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid challenge." }, { status: 400 });
  const { data, error } = await supabase.rpc("enroll_prayer_member", { p_challenge_id: parsed.data.challenge_id });
  if (error) return NextResponse.json({ error: "This challenge is not available to join right now." }, { status: 400 });
  return NextResponse.json({ success: true, enrollment: data });
}
