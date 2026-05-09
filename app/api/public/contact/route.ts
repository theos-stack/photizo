import { NextResponse } from "next/server";

import { contactMessageSchema } from "@/lib/schemas";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = contactMessageSchema.safeParse(json);

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

  const { error } = await supabase.from("contact_messages").insert({
    ...parsed.data,
    email: parsed.data.email || null,
    whatsapp: parsed.data.whatsapp || null,
  });

  if (error) {
    return NextResponse.json(
      { error: "We could not save your message right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
