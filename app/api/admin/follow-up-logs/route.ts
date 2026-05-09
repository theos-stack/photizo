import { NextResponse } from "next/server";

import { followUpLogSchema } from "@/lib/schemas";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok || !auth.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const json = await request.json();
  const parsed = followUpLogSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid follow-up log." },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("follow_up_logs").insert({
    ...parsed.data,
    next_action: parsed.data.next_action || null,
    next_follow_up_date: parsed.data.next_follow_up_date || null,
    created_by: auth.user.email,
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to save this follow-up log right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
