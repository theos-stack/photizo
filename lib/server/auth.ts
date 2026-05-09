import "server-only";

import { redirect } from "next/navigation";

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

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  const isAdmin =
    adminRecord?.email?.toLowerCase() === user.email.toLowerCase() ||
    user.email.toLowerCase() === adminEmail;

  if (!isAdmin) {
    await supabase.auth.signOut();
    redirect("/admin/login?unauthorized=1");
  }

  return user;
}
