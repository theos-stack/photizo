import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/supabase/server";

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

  const normalizedEmail = user.email.toLowerCase();
  const configuredAdmins = getConfiguredAdminEmails();
  const isConfiguredAdmin = configuredAdmins.includes(normalizedEmail);
  const isDbAdmin = await hasAdminRecord(normalizedEmail, supabase);

  const ok =
    isConfiguredAdmin || isDbAdmin;

  return { ok, user, supabase };
}
