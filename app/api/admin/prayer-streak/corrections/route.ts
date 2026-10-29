import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({ enrollment_id: z.string().uuid(), local_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().trim().min(10).max(1000) });
export async function POST(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok || !auth.user?.email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid correction." }, { status: 400 });
  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  const { data, error } = await supabase.rpc("admin_correct_prayer_checkin", { p_enrollment_id:parsed.data.enrollment_id,p_local_date:parsed.data.local_date,p_note:parsed.data.note,p_actor_email:auth.user.email });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A check-in already exists for that journey day." : error.message || "Could not apply the correction." }, { status: 400 });
  return NextResponse.json({ success:true,journey_day:data });
}
