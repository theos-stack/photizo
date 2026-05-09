import "server-only";

import { cache } from "react";

import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  BiblicalQuestion,
  ContactMessage,
  FollowUpLog,
  Program,
  ProgramRegistration,
  SalvationResponse,
  SiteSettings,
} from "@/lib/types";

const defaultSettings: SiteSettings = {
  email: "hello@photizonetwork.org",
  whatsapp: "+234 000 000 0000",
  instagram: "https://instagram.com/photizonetwork",
  facebook: "https://facebook.com/photizonetwork",
  youtube: "https://youtube.com/@photizonetwork",
  telegram: "https://t.me/photizonetwork",
};

async function selectRegistrationsWithProgramDetails() {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return { data: [], error: null } as const;
  }

  const withCustomForm = await supabase
    .from("program_registrations")
    .select("*, programs(id, title, slug, registration_form)")
    .order("created_at", { ascending: false });

  if (!withCustomForm.error) {
    return withCustomForm;
  }

  if (!withCustomForm.error.message?.includes("registration_form")) {
    return withCustomForm;
  }

  const fallback = await supabase
    .from("program_registrations")
    .select("*, programs(id, title, slug)")
    .order("created_at", { ascending: false });

  return fallback;
}

export const getPublishedPrograms = cache(async () => {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as Program[];
  }

  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true });

  return (data ?? []) as Program[];
});

export async function getProgramBySlug(slug: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data as Program | null;
}

export async function getProgramById(id: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data as Program | null;
}

export async function getSiteSettings() {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return defaultSettings;
  }

  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { ...defaultSettings, ...(data ?? {}) } as SiteSettings;
}

export async function getAdminStats() {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return {
      salvationResponses: 0,
      biblicalQuestions: 0,
      programRegistrations: 0,
      contactMessages: 0,
      activePrograms: 0,
      pendingFollowUps: 0,
      answeredQuestions: 0,
      completedFollowUps: 0,
    };
  }

  const [
    salvationResponses,
    biblicalQuestions,
    programRegistrations,
    contactMessages,
    activePrograms,
    pendingFollowUps,
    answeredQuestions,
    completedFollowUps,
  ] = await Promise.all([
    supabase.from("salvation_responses").select("*", { count: "exact", head: true }),
    supabase.from("biblical_questions").select("*", { count: "exact", head: true }),
    supabase
      .from("program_registrations")
      .select("*", { count: "exact", head: true }),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }),
    supabase
      .from("programs")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("salvation_responses")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "needs_attention", "in_follow_up"]),
    supabase
      .from("biblical_questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "answered"),
    supabase
      .from("salvation_responses")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  return {
    salvationResponses: salvationResponses.count ?? 0,
    biblicalQuestions: biblicalQuestions.count ?? 0,
    programRegistrations: programRegistrations.count ?? 0,
    contactMessages: contactMessages.count ?? 0,
    activePrograms: activePrograms.count ?? 0,
    pendingFollowUps: pendingFollowUps.count ?? 0,
    answeredQuestions: answeredQuestions.count ?? 0,
    completedFollowUps: completedFollowUps.count ?? 0,
  };
}

export async function getAdminPrograms() {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as Program[];
  }

  const { data } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as Program[];
}

export async function getProgramRegistrations(filters?: {
  search?: string;
  status?: string;
  program?: string;
}) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as ProgramRegistration[];
  }

  const baseQuery = await selectRegistrationsWithProgramDetails();

  if (baseQuery.error) {
    return [] as ProgramRegistration[];
  }

  let data = (baseQuery.data ?? []) as ProgramRegistration[];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    data = data.filter((registration) =>
      [registration.full_name, registration.email, registration.whatsapp]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search)),
    );
  }

  if (filters?.status) {
    data = data.filter((registration) => registration.status === filters.status);
  }

  if (filters?.program) {
    if (filters.program === "interest") {
      data = data.filter((registration) => !registration.program_id);
    } else {
      data = data.filter((registration) => registration.program_id === filters.program);
    }
  }

  return data;
}

export async function getProgramRegistrationById(id: string) {
  const registrations = await getProgramRegistrations();
  return registrations.find((registration) => registration.id === id) || null;
}

export async function getSalvationResponses(filters?: {
  search?: string;
  status?: string;
}) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as SalvationResponse[];
  }

  let query = supabase
    .from("salvation_responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,whatsapp.ilike.%${filters.search}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as SalvationResponse[];
}

export async function getSalvationResponseById(id: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("salvation_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data as SalvationResponse | null;
}

export async function getBiblicalQuestions(filters?: {
  search?: string;
  status?: string;
}) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as BiblicalQuestion[];
  }

  let query = supabase
    .from("biblical_questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,question.ilike.%${filters.search}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as BiblicalQuestion[];
}

export async function getBiblicalQuestionById(id: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("biblical_questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data as BiblicalQuestion | null;
}

export async function getContactMessages(filters?: {
  search?: string;
  status?: string;
}) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as ContactMessage[];
  }

  let query = supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as ContactMessage[];
}

export async function getFollowUpLogs(recordType: string, recordId: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return [] as FollowUpLog[];
  }

  const { data } = await supabase
    .from("follow_up_logs")
    .select("*")
    .eq("record_type", recordType)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });

  return (data ?? []) as FollowUpLog[];
}

export async function getRegistrationInsights() {
  const [programs, registrations] = await Promise.all([
    getAdminPrograms(),
    getProgramRegistrations(),
  ]);

  const uniqueEmails = new Set<string>();
  const uniqueWhatsapp = new Set<string>();
  const statusCounts = new Map<string, number>();
  const programCounts = new Map<string, { title: string; count: number }>();

  registrations.forEach((registration) => {
    if (registration.email) {
      uniqueEmails.add(registration.email.toLowerCase());
    }

    if (registration.whatsapp) {
      uniqueWhatsapp.add(registration.whatsapp);
    }

    statusCounts.set(
      registration.status,
      (statusCounts.get(registration.status) || 0) + 1,
    );

    const title = registration.programs?.title || "Interest registration";
    const existing = programCounts.get(title);

    if (existing) {
      existing.count += 1;
    } else {
      programCounts.set(title, { title, count: 1 });
    }
  });

  const topPrograms = Array.from(programCounts.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  return {
    totalPrograms: programs.length,
    totalRegistrations: registrations.length,
    uniqueEmailContacts: uniqueEmails.size,
    uniqueWhatsappContacts: uniqueWhatsapp.size,
    statusBreakdown: Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    topPrograms,
    recentRegistrations: registrations.slice(0, 6),
  };
}
