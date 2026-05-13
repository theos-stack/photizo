import { resolveAdminAccess } from "@/lib/server/admin-access";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function verifyAdminRequest() {
  const supabase = await getServerSupabaseClient();

  if (!supabase) {
    return { ok: false as const, user: null, supabase: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false as const, user: null, supabase };
  }

  const access = await resolveAdminAccess(user.email, supabase);

  return {
    ok: access.isAdmin,
    user,
    supabase,
    role: access.role,
    isSuperAdmin: access.isSuperAdmin,
    isBootstrapSuperAdmin: access.isBootstrapSuperAdmin,
  };
}

export async function verifySuperAdminRequest() {
  const auth = await verifyAdminRequest();

  if (!auth.ok || !auth.isSuperAdmin) {
    return { ...auth, ok: false as const };
  }

  return auth;
}
