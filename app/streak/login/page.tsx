import Link from "next/link";
import { Container } from "@/components/Container";
import { MemberAuthForm } from "@/components/streak/MemberAuthForm";

export default async function MemberLoginPage({ searchParams }: { searchParams: Promise<{ error?: string;next?:string }> }) {
  const params = await searchParams;
  return <main className="min-h-[75vh] bg-[#fbfaf6] py-12 sm:py-20"><Container><MemberAuthForm mode="login" next={params.next||"/streak"}/>{params.error === "oauth" && <p className="mx-auto mt-4 max-w-lg text-sm text-red-700">Google sign-in did not complete. Check the redirect URL settings and try again.</p>}<p className="mx-auto mt-5 max-w-lg text-center text-xs leading-6 text-black/55">Member accounts are separate from PHOTIZO administrator access. <Link className="underline" href="/admin/login">Administrator sign-in</Link></p></Container></main>;
}
