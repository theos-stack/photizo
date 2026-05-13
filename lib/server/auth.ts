import "server-only";

import { redirect } from "next/navigation";

import { resolveAdminAccess } from "@/lib/server/admin-access";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/shared";

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

  const access = await resolveAdminAccess(user.email, supabase);

  if (!access.isAdmin) {
    redirect("/admin/login?unauthorized=1");
  }

  return {
    ...user,
    role: access.role,
    isSuperAdmin: access.isSuperAdmin,
    isBootstrapSuperAdmin: access.isBootstrapSuperAdmin,
  };
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();

  if (!user.isSuperAdmin) {
    redirect("/admin/settings?forbidden=1");
  }

  return user;
}
