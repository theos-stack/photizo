import "server-only";

import { redirect } from "next/navigation";

import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/shared";

function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAIL || "")
    .split(/[;,]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function hasAdminRecord(email: string, fallbackSupabase: Awaited<ReturnType<typeof getServerSupabaseClient>>) {
  const serviceSupabase = getServiceSupabaseClient();
  const client = serviceSupabase || fallbackSupabase;

  if (!client) {
    return false;
  }

  const { data: adminRecord } = await client
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  return adminRecord?.email?.toLowerCase() === email;
}

export async function requireAdmin() {
  if (!hasSupabaseEnv()) {
    redirect("/admin/login?setup=1");
  }

  const supabase = await getServerSupabaseClient();
  if (!supabase) {
    redirect("/admin/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  const normalizedEmail = user.email.toLowerCase();
  const configuredAdmins = getConfiguredAdminEmails();
  const isConfiguredAdmin = configuredAdmins.includes(normalizedEmail);
  const isDbAdmin = await hasAdminRecord(normalizedEmail, supabase);

  const isAdmin =
    isConfiguredAdmin || isDbAdmin;

  if (!isAdmin) {
    redirect("/admin/login?unauthorized=1");
  }

  return user;
}
