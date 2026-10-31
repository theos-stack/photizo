import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { MemberAuthForm } from "@/components/streak/MemberAuthForm";
import { getSafeLocalRedirect } from "@/lib/local-redirect";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function MemberLoginPage({ searchParams }: { searchParams: Promise<{ error?: string;next?:string }> }) {
  const params = await searchParams;
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
  if (user && !params.error) redirect(getSafeLocalRedirect(params.next, "https://photizonetwork.com", "/member"));
  const initialError = params.error === "cancelled"
    ? "Sign-in was cancelled. You can try again whenever you are ready."
    : params.error === "verification"
      ? "That confirmation link may have expired or already been used. Try signing in, or create an account to request a fresh link."
      : params.error === "callback" || params.error === "oauth"
        ? "We could not complete sign-in. Please try again or request a fresh password reset link."
        : null;
  return <main className="min-h-[75vh] bg-[#fbfaf6] py-12 sm:py-20"><Container><MemberAuthForm mode="login" next={params.next||"/member"} initialError={initialError}/></Container></main>;
}
