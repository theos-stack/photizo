import { NextResponse } from "next/server";

import { programInterestSchema } from "@/lib/schemas";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = programInterestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid form submission." },
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

  const { error } = await supabase.from("program_registrations").insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email || null,
    whatsapp: parsed.data.whatsapp || null,
    country: parsed.data.country || null,
    city: parsed.data.city || null,
    how_did_you_hear: parsed.data.how_did_you_hear || null,
    message: parsed.data.message || parsed.data.program_of_interest || null,
    status: "new",
  });

  if (error) {
    return NextResponse.json(
      { error: "We could not save your registration interest right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
