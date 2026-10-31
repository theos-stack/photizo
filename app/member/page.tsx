import Link from "next/link";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { MemberBar } from "@/components/streak/MemberBar";
import { ProgramCard } from "@/components/ProgramCard";
import { requireMember } from "@/lib/server/member";
import { getPublishedPrograms } from "@/lib/data";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export default async function MemberHomePage() {
  const { supabase, user, profile } = await requireMember("/member");
  const [{ data: enrollments }, programs] = await Promise.all([
    supabase
      .from("prayer_enrollments")
      .select("id,challenge_id,status,enrolled_at")
      .eq("member_id", user.id)
      .order("enrolled_at", { ascending: false })
      .limit(20),
    getPublishedPrograms(),
  ]);

  const service = getServiceSupabaseClient();
  const { data: registrations } = service && user.email
    ? await service
        .from("program_registrations")
        .select("id,status,created_at,programs(title,slug)")
        .ilike("email", user.email)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const hasPrayerJourney = Boolean(enrollments?.length);
  const displayName = profile?.display_name?.trim() || user.user_metadata?.display_name || user.user_metadata?.full_name || "there";

  return (
    <>
      <MemberBar email={user.email || "Member"} />
      <main className="min-h-screen bg-[var(--warm-ivory)] py-8 sm:py-12">
        <Container>
          <section className="rounded-[30px] bg-[var(--evergreen)] p-6 text-white shadow-soft sm:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#d6c38a]">PHOTIZO Network International</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Welcome, {displayName}.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">Your personal member space for ministry programmes and spiritual growth.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/programs" className="bg-[#d6c38a] text-[#173326] shadow-none hover:bg-[#e2d5ac]">Explore programmes</Button>
              <Button href={hasPrayerJourney ? "/streak/dashboard" : "/streak"} variant="ghost" className="border-white/25 text-white hover:bg-white/10">{hasPrayerJourney ? "Open my prayer dashboard" : "Explore the Prayer Challenge"}</Button>
            </div>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">Take part</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#182a1e]">Available programmes</h2>
              </div>
              <Link href="/programs" className="text-sm font-semibold text-[var(--dark-moss-green)] hover:underline">View all programmes</Link>
            </div>
            {programs.length ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">{programs.map((program) => <ProgramCard key={program.id} program={program} />)}</div>
            ) : (
              <div className="mt-5"><EmptyState title="No programmes are open right now." description="Visit the programmes page for the latest ministry gatherings and announcements." /></div>
            )}
          </section>

          <section className="mt-10 rounded-[26px] border border-black/[.07] bg-white p-6 shadow-soft sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">Your activity</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#182a1e]">Programme enquiries</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Interest forms submitted with this verified email appear here. For registration updates, contact PHOTIZO using the programme details.</p>
            {registrations?.length ? (
              <ul className="mt-5 divide-y divide-black/10">
                {registrations.map((item) => {
                  const program = Array.isArray(item.programs) ? item.programs[0] : item.programs;
                  return <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><span className="font-semibold text-[#182a1e]">{program?.title || "General programme enquiry"}</span><span className="rounded-full bg-[#f4eddf] px-3 py-1 text-xs capitalize text-[#655638]">{item.status.replaceAll("_", " ")}</span></li>;
                })}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl bg-[#fbfaf6] p-4 text-sm text-black/55">No programme enquiries are linked to this email yet.</p>
            )}
          </section>

          <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-black/[.07] bg-white p-6 shadow-soft sm:p-8">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">Your account</p><h2 className="mt-2 font-display text-2xl font-semibold text-[#182a1e]">Member settings</h2><p className="mt-2 text-sm text-black/55">Update your profile and preferences.</p></div>
            <Button href="/streak/settings" variant="ghost">Account settings</Button>
          </section>
        </Container>
      </main>
    </>
  );
}
