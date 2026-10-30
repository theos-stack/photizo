import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({ timezone: z.string().trim().min(1).max(100) });

export async function PUT(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (!supabase || !user) return NextResponse.json({ error: "Sign in before setting your time zone." }, { status: 401 });

  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid time zone." }, { status: 400 });
  try { new Intl.DateTimeFormat("en", { timeZone: parsed.data.timezone }); } catch { return NextResponse.json({ error: "Choose a valid IANA time zone." }, { status: 400 }); }

  const { error } = await supabase.from("member_profiles").update({ timezone: parsed.data.timezone, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save your time zone." }, { status: 500 });
  return NextResponse.json({ success: true });
}
