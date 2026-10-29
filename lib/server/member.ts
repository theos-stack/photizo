import "server-only";

import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function requireMember() {
  const supabase = await getServerSupabaseClient();
  if (!supabase) redirect("/streak/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/streak/login?next=%2Fstreak");
  const { data: profile } = await supabase.from("member_profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}

export function getLocalDate(timezone: string, date = new Date()) {
  const parts=new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value=(type:string)=>parts.find(part=>part.type===type)?.value||"00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
