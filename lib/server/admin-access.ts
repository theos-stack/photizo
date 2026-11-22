import "server-only";

import { getServiceSupabaseClient, getServerSupabaseClient } from "@/lib/supabase/server";
import { findAdminRecord, resolveAdminRole } from "@/lib/admin-access-core";
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
  const clients = [serviceSupabase, fallbackClient].filter(
    (client, index, all): client is NonNullable<typeof client> =>
      Boolean(client) && all.indexOf(client) === index,
  );

  const record = await findAdminRecord<AdminUser>(
    clients.map((client) => async () => {
      const { data, error } = await client
        .from("admin_users")
        .select("id, email, full_name, role, created_at")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (error) {
        console.warn("[admin-access] admin_users lookup failed", {
          code: error.code,
        });
      }

      return { data: data as AdminUser | null, error };
    }),
  );

  return record ?? null;
}

export async function resolveAdminAccess(
  email: string,
  fallbackClient: AdminLookupClient,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const configuredSuperAdmins = getConfiguredSuperAdminEmails();
  const adminRecord = await getAdminRecordByEmail(normalizedEmail, fallbackClient);
  const isBootstrapSuperAdmin = configuredSuperAdmins.includes(normalizedEmail);
  const role: AdminRole | null = resolveAdminRole(adminRecord?.role, isBootstrapSuperAdmin);

  return {
    adminRecord,
    role,
    isAdmin: Boolean(role),
    isSuperAdmin: role === "super_admin",
    isBootstrapSuperAdmin,
  };
}

