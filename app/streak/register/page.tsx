import { Container } from "@/components/Container";
import { MemberAuthForm } from "@/components/streak/MemberAuthForm";
export default async function MemberRegisterPage({searchParams}:{searchParams:Promise<{next?:string}>}) { const {next}=await searchParams;return <main className="min-h-[75vh] bg-[#fbfaf6] py-12 sm:py-20"><Container><MemberAuthForm mode="register" next={next||"/streak"} /></Container></main>; }
