import { NextResponse } from "next/server";

import { programRegistrationSchema } from "@/lib/schemas";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { ProgramCustomField } from "@/lib/types";
import { isProgramRegistrationOpen } from "@/lib/utils";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

function normalizeIdentifier(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findCustomAnswer(
  customAnswers: Record<string, string>,
  fieldDefinitions: Array<{ key?: string; label?: string }>,
  candidates: string[],
) {
  for (const [key, value] of Object.entries(customAnswers)) {
    const normalizedKey = normalizeIdentifier(key);
    const definition = fieldDefinitions.find((field) => field.key === key);
    const normalizedLabel = definition?.label
      ? normalizeIdentifier(definition.label)
      : "";

    if (
      candidates.includes(normalizedKey) ||
      (normalizedLabel && candidates.includes(normalizedLabel))
    ) {
      return value;
    }
  }

  return "";
}

function isMissingCustomAnswersColumn(message?: string) {
  return Boolean(
    message?.includes("custom_answers") &&
      message?.includes("program_registrations"),
  );
}

function isValidForFieldType(type: string, answer: string) {
  if (!answer) {
    return true;
  }

  switch (type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);
    case "phone":
      return /^[+\d][\d\s\-()]{6,}$/.test(answer);
    case "number":
      return !Number.isNaN(Number(answer));
    case "date":
      return !Number.isNaN(new Date(answer).getTime());
    default:
      return true;
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const json = await request.json();
  const parsed = programRegistrationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid form submission." },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!program?.id) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  if (!isProgramRegistrationOpen(program)) {
    return NextResponse.json(
      { error: "Registration is closed for this program." },
      { status: 400 },
    );
  }

  const customFields: ProgramCustomField[] = Array.isArray(program.registration_form)
    ? program.registration_form
    : [];
  const hasCustomForm = customFields.length > 0;
  const customAnswers = Object.fromEntries(
    Object.entries(parsed.data.custom_answers || {}).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : "",
    ]),
  );

  for (const field of customFields) {
    const rawAnswer = customAnswers[field.key];
    const answer = typeof rawAnswer === "string" ? rawAnswer.trim() : "";

    if (field.required && !answer) {
      return NextResponse.json(
        { error: `${field.label} is required.` },
        { status: 400 },
      );
    }

    if (
      field.type === "select" &&
      answer &&
      Array.isArray(field.options) &&
      !field.options.includes(answer)
    ) {
      return NextResponse.json(
        { error: `${field.label} contains an invalid option.` },
        { status: 400 },
      );
    }

    if (!isValidForFieldType(field.type, answer)) {
      return NextResponse.json(
        { error: `${field.label} is not in a valid format.` },
        { status: 400 },
      );
    }
  }

  const emailFieldValue =
    customFields.find((field) => field.type === "email")?.key || "";
  const phoneFieldValue =
    customFields.find((field) => field.type === "phone")?.key || "";

  const derivedFields = hasCustomForm
    ? {
        full_name:
          findCustomAnswer(customAnswers, customFields, [
            "fullname",
            "name",
          ]) || parsed.data.full_name,
        email:
          findCustomAnswer(customAnswers, customFields, [
            "email",
            "emailaddress",
          ]) ||
          (emailFieldValue ? customAnswers[emailFieldValue] : "") ||
          parsed.data.email,
        whatsapp:
          findCustomAnswer(customAnswers, customFields, [
            "whatsapp",
            "phonenumber",
            "phone",
            "whatsappnumber",
          ]) ||
          (phoneFieldValue ? customAnswers[phoneFieldValue] : "") ||
          parsed.data.whatsapp,
        country:
          findCustomAnswer(customAnswers, customFields, ["country"]) ||
          parsed.data.country,
        city:
          findCustomAnswer(customAnswers, customFields, [
            "city",
            "stateorcity",
            "state",
          ]) || parsed.data.city,
        how_did_you_hear:
          findCustomAnswer(customAnswers, customFields, [
            "howdidyouhearaboutus",
            "howdidyouhear",
            "referral",
          ]) || parsed.data.how_did_you_hear,
        message:
          findCustomAnswer(customAnswers, customFields, [
            "message",
            "prayerrequest",
            "note",
          ]) || parsed.data.message,
      }
    : {
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        whatsapp: parsed.data.whatsapp,
        country: parsed.data.country,
        city: parsed.data.city,
        how_did_you_hear: parsed.data.how_did_you_hear,
        message: parsed.data.message,
      };

  if (!derivedFields.full_name?.trim()) {
    return NextResponse.json(
      {
        error:
          "This registration form needs a field for the participant's full name before it can accept submissions.",
      },
      { status: 400 },
    );
  }

  const payload = {
    program_id: program.id,
    full_name: derivedFields.full_name.trim(),
    email: derivedFields.email || null,
    whatsapp: derivedFields.whatsapp || null,
    country: derivedFields.country || null,
    city: derivedFields.city || null,
    how_did_you_hear: derivedFields.how_did_you_hear || null,
    message: derivedFields.message || null,
    custom_answers: customAnswers,
    status: "new",
  };

  let { error } = await supabase.from("program_registrations").insert(payload);

  if (isMissingCustomAnswersColumn(error?.message)) {
    ({ error } = await supabase.from("program_registrations").insert({
      program_id: program.id,
      full_name: derivedFields.full_name.trim(),
      email: derivedFields.email || null,
      whatsapp: derivedFields.whatsapp || null,
      country: derivedFields.country || null,
      city: derivedFields.city || null,
      how_did_you_hear: derivedFields.how_did_you_hear || null,
      message: derivedFields.message || null,
      status: "new",
    }));
  }

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "We could not save your registration right now.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
