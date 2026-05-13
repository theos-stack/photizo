import { NextResponse } from "next/server";

import { adminUserUpdateSchema } from "@/lib/schemas";
import { getConfiguredSuperAdminEmails } from "@/lib/server/admin-access";
import { verifySuperAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

function isProtectedBootstrapEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getConfiguredSuperAdminEmails().includes(email.toLowerCase());
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await verifySuperAdminRequest();
  if (!auth.ok || !auth.user?.email) {
    return NextResponse.json({ error: "Only super admins can manage admin access." }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not fully configured yet. Add your server-side secret key and restart the app." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = adminUserUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid admin update data." },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("admin_users")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (!existing?.email) {
    return NextResponse.json({ error: "Admin record not found." }, { status: 404 });
  }

  const normalizedExistingEmail = existing.email.toLowerCase();
  if (
    normalizedExistingEmail === auth.user.email.toLowerCase() ||
    isProtectedBootstrapEmail(normalizedExistingEmail)
  ) {
    return NextResponse.json(
      { error: "This admin role is protected and cannot be changed from the dashboard." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("admin_users")
    .update({
      full_name: parsed.data.full_name || null,
      role: parsed.data.role,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Unable to update this admin right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const auth = await verifySuperAdminRequest();
  if (!auth.ok || !auth.user?.email) {
    return NextResponse.json({ error: "Only super admins can manage admin access." }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not fully configured yet. Add your server-side secret key and restart the app." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const { data: existing } = await supabase
    .from("admin_users")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (!existing?.email) {
    return NextResponse.json({ error: "Admin record not found." }, { status: 404 });
  }

  const normalizedExistingEmail = existing.email.toLowerCase();
  if (
    normalizedExistingEmail === auth.user.email.toLowerCase() ||
    isProtectedBootstrapEmail(normalizedExistingEmail)
  ) {
    return NextResponse.json(
      { error: "This admin access is protected and cannot be removed from the dashboard." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Unable to remove this admin access right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
