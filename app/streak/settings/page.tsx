import { Container } from "@/components/Container";
import { MemberBar } from "@/components/streak/MemberBar";
import { PrayerSettingsForm } from "@/components/streak/PrayerSettingsForm";
import { requireMember } from "@/lib/server/member";
export default async function PrayerSettingsPage() {
  const {supabase,user,profile}=await requireMember("/streak/settings");
  const [{data:prefs},{data:consent}]=await Promise.all([supabase.from("prayer_notification_preferences").select("*").eq("member_id",user.id).maybeSingle(),supabase.from("member_communication_consents").select("ministry_announcements").eq("member_id",user.id).maybeSingle()]);
  const initial={display_name:profile?.display_name||"",timezone:profile?.timezone||"Africa/Lagos",notifications_enabled:profile?.notifications_enabled??true,push_enabled:prefs?.push_enabled??false,email_enabled:prefs?.email_enabled??true,reminder_09_enabled:prefs?.reminder_09_enabled??true,reminder_18_enabled:prefs?.reminder_18_enabled??true,reminder_21_enabled:prefs?.reminder_21_enabled??false,reminder_23_enabled:prefs?.reminder_23_enabled??false,ministry_announcements:consent?.ministry_announcements??false};
  return <><MemberBar email={user.email||"Member"}/><main className="py-6 sm:py-10"><Container className="max-w-3xl"><h1 className="mb-6 font-display text-4xl font-bold">Prayer and account settings</h1><PrayerSettingsForm initial={initial}/></Container></main></>;
}
