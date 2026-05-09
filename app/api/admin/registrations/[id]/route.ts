import { NextResponse } from "next/server";

import { updateRecordSchema } from "@/lib/schemas";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = updateRecordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid update payload." },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  }

  const { error } = await supabase
    .from("program_registrations")
    .update({
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Unable to update registration." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
