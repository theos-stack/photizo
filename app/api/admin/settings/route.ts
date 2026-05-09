import { NextResponse } from "next/server";

import { siteSettingsSchema } from "@/lib/schemas";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const json = await request.json();
  const parsed = siteSettingsSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid settings payload." },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const payload = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const result = existing?.id
    ? await supabase.from("site_settings").update(payload).eq("id", existing.id)
    : await supabase.from("site_settings").insert(payload);

  if (result.error) {
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
