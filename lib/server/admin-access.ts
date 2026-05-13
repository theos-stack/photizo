import "server-only";

import { getServiceSupabaseClient, getServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminRole, AdminUser } from "@/lib/types";

type AdminLookupClient =
  | Awaited<ReturnType<typeof getServerSupabaseClient>>
  | ReturnType<typeof getServiceSupabaseClient>;

export function getConfiguredSuperAdminEmails() {
  return (process.env.ADMIN_EMAIL || "")
    .split(/[;,]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminRecordByEmail(
  email: string,
  fallbackClient: AdminLookupClient,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const serviceSupabase = getServiceSupabaseClient();
  const client = serviceSupabase || fallbackClient;

  if (!client) {
    return null;
  }

  const { data } = await client
    .from("admin_users")
    .select("id, email, full_name, role, created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  return (data as AdminUser | null) ?? null;
}

export async function resolveAdminAccess(
  email: string,
  fallbackClient: AdminLookupClient,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const configuredSuperAdmins = getConfiguredSuperAdminEmails();
  const adminRecord = await getAdminRecordByEmail(normalizedEmail, fallbackClient);
  const isBootstrapSuperAdmin = configuredSuperAdmins.includes(normalizedEmail);
  const dbRole =
    adminRecord?.role === "super_admin"
      ? "super_admin"
      : adminRecord?.role === "admin"
        ? "admin"
        : null;
  const role: AdminRole | null = isBootstrapSuperAdmin
    ? "super_admin"
    : dbRole;

  return {
    adminRecord,
    role,
    isAdmin: Boolean(role),
    isSuperAdmin: role === "super_admin",
    isBootstrapSuperAdmin,
  };
}

