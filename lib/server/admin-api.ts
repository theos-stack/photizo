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

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  const ok =
    adminRecord?.email?.toLowerCase() === user.email.toLowerCase() ||
    user.email.toLowerCase() === adminEmail;

  return { ok, user, supabase };
}
