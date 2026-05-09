import { NextResponse } from "next/server";

import { salvationResponseSchema } from "@/lib/schemas";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = salvationResponseSchema.safeParse(json);

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

  const { error } = await supabase.from("salvation_responses").insert({
    ...parsed.data,
    email: parsed.data.email || null,
    whatsapp: parsed.data.whatsapp || null,
    country: parsed.data.country || null,
    city: parsed.data.city || null,
    message: parsed.data.message || null,
  });

  if (error) {
    return NextResponse.json(
      { error: "We could not save your response right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
