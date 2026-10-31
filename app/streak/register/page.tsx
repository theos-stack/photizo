import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { MemberAuthForm } from "@/components/streak/MemberAuthForm";
import { getSafeLocalRedirect } from "@/lib/local-redirect";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function MemberRegisterPage({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}) {
  const params=await searchParams;
  const next=params.next||"/member";
  const supabase=await getServerSupabaseClient();
  const {data:{user}}=await supabase?.auth.getUser()??{data:{user:null}};
  if(user) redirect(getSafeLocalRedirect(next,"https://photizonetwork.com","/member"));
  const initialError=params.error==="verification"?"That confirmation link may have expired or already been used. Sign in if you have confirmed already, or create an account to request a fresh link.":null;
  return <main className="min-h-[75vh] bg-[#fbfaf6] py-12 sm:py-20"><Container><MemberAuthForm mode="register" next={next} initialError={initialError} /></Container></main>;
}
