import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
const BUCKET = "prayer-music-library";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, { ext: string; mime: string }> = {
  "audio/mpeg": { ext: "mp3", mime: "audio/mpeg" },
  "audio/mp4": { ext: "m4a", mime: "audio/mp4" },
  "audio/aac": { ext: "aac", mime: "audio/aac" },
  "audio/ogg": { ext: "ogg", mime: "audio/ogg" },
  "audio/wav": { ext: "wav", mime: "audio/wav" },
  "audio/x-wav": { ext: "wav", mime: "audio/wav" },
  "audio/webm": { ext: "webm", mime: "audio/webm" },
};

export async function POST(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok || !auth.user?.email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Choose an audio file and try again." }, { status: 400 }); }
  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  if (form.get("license_confirmed") !== "true") return NextResponse.json({ error: "Confirm PHOTIZO has the right to stream this recording." }, { status: 400 });
  if (title.length < 2 || title.length > 120 || description.length > 500) return NextResponse.json({ error: "Enter a title (2–120 characters) and an optional attribution (up to 500 characters)." }, { status: 400 });
  if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Choose an audio file up to 4 MB." }, { status: 400 });
  const type = TYPES[file.type.toLowerCase()];
  if (!type) return NextResponse.json({ error: "Use an MP3, M4A, AAC, OGG, WAV, or WebM audio file." }, { status: 400 });

  const bucket = await db.storage.getBucket(BUCKET);
  if (!bucket.error && bucket.data.public) return NextResponse.json({ error: "The prayer audio bucket must be private. Ask an administrator to secure the music storage bucket." }, { status: 503 });
  if (bucket.error) {
    const created = await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_FILE_BYTES, allowedMimeTypes: Object.keys(TYPES) });
    if (created.error && !/already exists/i.test(created.error.message)) return NextResponse.json({ error: "Private music storage is not ready. Ask an administrator to check Supabase Storage." }, { status: 503 });
  }

  const { count } = await db.from("prayer_music_items").select("id", { count: "exact", head: true });
  const id = crypto.randomUUID();
  const objectPath = `${id}/audio.${type.ext}`;
  const uploaded = await db.storage.from(BUCKET).upload(objectPath, file, { contentType: type.mime, cacheControl: "3600", upsert: false });
  if (uploaded.error) return NextResponse.json({ error: "Could not upload this audio file to private storage." }, { status: 500 });
  const providerUrl = `${siteConfig.siteUrl.replace(/\/$/, "")}/api/prayer-music/${id}?ext=${type.ext}`;
  const { error } = await db.from("prayer_music_items").insert({ id, title, description, provider: "audio", provider_url: providerUrl, sort_order: count || 0, is_published: false, updated_by: auth.user.email });
  if (error) {
    await db.storage.from(BUCKET).remove([objectPath]);
    if (error.code === "23514") return NextResponse.json({ error: "The existing database has not enabled licensed audio tracks yet. The upload was removed; apply the reviewed audio-provider migration before adding tracks." }, { status: 409 });
    return NextResponse.json({ error: "Could not save this track. The uploaded file was removed." }, { status: 500 });
  }
  return NextResponse.json({ success: true, item: { id, title, description, provider: "audio", provider_url: providerUrl, sort_order: count || 0, is_published: false } });
}
