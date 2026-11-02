import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { MemberBar } from "@/components/streak/MemberBar";
import { ProgramCard } from "@/components/ProgramCard";
import { requireMember } from "@/lib/server/member";
import { getPublishedPrograms } from "@/lib/data";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { getAvailablePrograms } from "@/lib/program-schedule";

export default async function MemberHomePage() {
  const { supabase, user, profile } = await requireMember("/member");
  const [{ data: enrollments }, publishedPrograms] = await Promise.all([
    supabase
      .from("prayer_enrollments")
      .select("id,challenge_id,status,enrolled_at")
      .eq("member_id", user.id)
      .order("enrolled_at", { ascending: false })
      .limit(20),
    getPublishedPrograms(),
  ]);
  const programs = getAvailablePrograms(publishedPrograms, new Date());

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
              <Button href="/programs" className="bg-[#d6c38a] text-[#173326] shadow-none hover:bg-[#e2d5ac] active:translate-y-0 active:bg-[#c8b374] focus-visible:ring-[#e3cf91] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evergreen)]">Explore programmes</Button>
              <Button
                href={hasPrayerJourney ? "/streak/dashboard" : "/streak"}
                variant="ghost"
                className="border-white/35 bg-transparent text-white hover:border-white/55 hover:bg-white/15 hover:text-white active:translate-y-0 active:bg-white/20 focus-visible:ring-[#e3cf91] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--evergreen)]"
              >
                {hasPrayerJourney ? "Open my prayer dashboard" : "Explore the Prayer Challenge"}
              </Button>
            </div>
          </section>

          {programs.length ? (
            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--dark-moss-green)]">Take part</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-[#182a1e]">Available programmes</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">{programs.map((program) => <ProgramCard key={program.id} program={program} showStatus={false} />)}</div>
            </section>
          ) : (
            <section className="mt-10 overflow-hidden rounded-[30px] border border-[#d6c38a]/30 bg-[linear-gradient(135deg,#f9f7ef_0%,#fff_55%,#edf2ec_100%)] p-6 shadow-soft sm:p-9">
              <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[var(--dark-moss-green)]">Discover PHOTIZO</p>
              <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="max-w-3xl">
                  <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-.025em] text-[#182a1e] sm:text-4xl">A Community Rooted in Faith. Growing Together in Purpose.</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-black/65">PHOTIZO Network International is a space for believers to connect, learn, pray and grow together. While we prepare for our next gathering, your journey of faith continues.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button href={hasPrayerJourney ? "/streak/dashboard" : "/streak"} variant="secondary" className="focus-visible:ring-offset-2">Continue Prayer Streak</Button>
                  <Button href="/" variant="ghost" className="border-black/15 bg-white text-[#173326] hover:bg-[#f1f2ec] hover:text-[#173326] active:translate-y-0 focus-visible:ring-offset-2">Explore PHOTIZO</Button>
                </div>
              </div>
            </section>
          )}

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
