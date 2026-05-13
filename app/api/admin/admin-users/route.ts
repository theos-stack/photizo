import { NextResponse } from "next/server";

import { adminUserCreateSchema } from "@/lib/schemas";
import { verifySuperAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

function isDuplicateAuthUserError(message?: string) {
  const normalized = (message || "").toLowerCase();
  return (
    normalized.includes("already") &&
    (normalized.includes("registered") || normalized.includes("exists"))
  );
}

export async function POST(request: Request) {
  const auth = await verifySuperAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: "Only super admins can manage admin access." }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not fully configured yet. Add your server-side secret key and restart the app." },
      { status: 503 },
    );
  }

  const json = await request.json();
  const parsed = adminUserCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid admin user data." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password?.trim() || "";
  let createdAuthUser = false;

  if (password) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name || null,
      },
    });

    if (error && !isDuplicateAuthUserError(error.message)) {
      return NextResponse.json(
        { error: error.message || "Unable to create the authentication account for this admin." },
        { status: 500 },
      );
    }

    createdAuthUser = !error;
  }

  const { error: upsertError } = await supabase
    .from("admin_users")
    .upsert(
      {
        email,
        full_name: parsed.data.full_name || null,
        role: parsed.data.role,
      },
      { onConflict: "email" },
    );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message || "Unable to save this admin access record." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, createdAuthUser });
}
