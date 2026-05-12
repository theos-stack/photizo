import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { programCustomFieldSchema, programSchema } from "@/lib/schemas";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const BUCKET_NAME = "program-flyers";

function revalidateProgramRoutes(slug?: string) {
  revalidatePath("/");
  revalidatePath("/programs");

  if (slug) {
    revalidatePath(`/programs/${slug}`);
  }
}

function isMissingRegistrationFormColumn(message?: string) {
  return Boolean(
    message?.includes("registration_form") &&
      message?.includes("programs"),
  );
}

async function uploadFlyer(file: File) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return {
      ok: false as const,
      error: "Supabase server credentials are missing.",
      publicUrl: null,
    };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `flyers/${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return {
      ok: false as const,
      error:
        error.message ||
        "The flyer could not be uploaded. Check that the program-flyers storage bucket exists.",
      publicUrl: null,
    };
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return {
    ok: true as const,
    error: null,
    publicUrl: data.publicUrl,
  };
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

async function patchProgramStatus(id: string, request: Request) {
  const json = await request.json();
  const status = typeof json.status === "string" ? json.status : "";

  if (!["draft", "published", "closed", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not fully configured yet. Add your server-side secret key and restart the app.",
      },
      { status: 503 },
    );
  }

  const { data: updatedProgram, error } = await supabase
    .from("programs")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Unable to update the program status right now.",
      },
      { status: 500 },
    );
  }

  revalidateProgramRoutes(updatedProgram?.slug);

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return patchProgramStatus(id, request);
  }

  const formData = await request.formData();
  const raw = Object.fromEntries(formData.entries());
  const registrationFormRaw = formData.get("registration_form");
  let registrationForm = [] as unknown[];

  if (typeof registrationFormRaw === "string" && registrationFormRaw.trim()) {
    try {
      registrationForm = JSON.parse(registrationFormRaw);
    } catch {
      return NextResponse.json(
        { error: "The registration form builder payload is not valid JSON." },
        { status: 400 },
      );
    }
  }

  const parsedRegistrationForm = programCustomFieldSchema
    .array()
    .safeParse(registrationForm);

  if (!parsedRegistrationForm.success) {
    return NextResponse.json(
      {
        error:
          parsedRegistrationForm.error.issues[0]?.message ||
          "Invalid registration form configuration.",
      },
      { status: 400 },
    );
  }

  const parsed = programSchema.safeParse({
    ...raw,
    registration_form: parsedRegistrationForm.data,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid program data." },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not fully configured yet. Add your server-side secret key and restart the app.",
      },
      { status: 503 },
    );
  }

  const flyerFile = formData.get("flyer_file");
  let flyerUrl = parsed.data.flyer_url || null;
  let needsSchemaUpgrade = false;

  if (flyerFile instanceof File && flyerFile.size > 0) {
    const upload = await uploadFlyer(flyerFile);

    if (!upload.ok) {
      return NextResponse.json({ error: upload.error }, { status: 500 });
    }

    flyerUrl = upload.publicUrl;
  }

  const payload = {
    ...parsed.data,
    flyer_url: flyerUrl,
    date: parsed.data.date || null,
    time: parsed.data.time || null,
    location: parsed.data.location || null,
    online_link: parsed.data.online_link || null,
    registration_deadline: parsed.data.registration_deadline || null,
    registration_form: parsed.data.registration_form || [],
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("programs")
    .update(payload)
    .eq("id", id);

  if (isMissingRegistrationFormColumn(error?.message)) {
    needsSchemaUpgrade = true;
    ({ error } = await supabase
      .from("programs")
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        flyer_url: flyerUrl,
        date: parsed.data.date || null,
        time: parsed.data.time || null,
        location: parsed.data.location || null,
        online_link: parsed.data.online_link || null,
        registration_deadline: parsed.data.registration_deadline || null,
        status: parsed.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id));
  }

  if (error) {
    const upgradeHint = error.message?.includes("registration_form")
      ? " Run the SQL in supabase/program-form-upgrade.sql in your Supabase SQL Editor, then refresh the dashboard."
      : "";

    return NextResponse.json(
      {
        error:
          (error.message ||
            "Unable to update this program right now. Confirm that the programs table exists in Supabase and that your admin account is set up correctly.") +
          upgradeHint,
      },
      { status: 500 },
    );
  }

  revalidateProgramRoutes(parsed.data.slug);

  return NextResponse.json({ success: true, needsSchemaUpgrade });
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const auth = await verifyAdminRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not fully configured yet. Add your server-side secret key and restart the app.",
      },
      { status: 503 },
    );
  }

  const { data: existingProgram } = await supabase
    .from("programs")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("programs").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Unable to delete this program right now. Confirm that the programs table exists in Supabase and that your admin account is set up correctly.",
      },
      { status: 500 },
    );
  }

  revalidateProgramRoutes(existingProgram?.slug);

  return NextResponse.json({ success: true });
}
