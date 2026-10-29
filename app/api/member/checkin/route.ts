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
  const { data, error } = await supabase.rpc("checkin_prayer", { p_enrollment_id: parsed.data.enrollment_id });
  if (error) return NextResponse.json({ error: error.message.includes("complete") ? "Your 30-day journey is complete." : "Your check-in could not be saved." }, { status: 400 });
  return NextResponse.json({ success: true, result: data });
}
