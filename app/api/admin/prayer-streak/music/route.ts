import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrayerMusicEmbed, isSupportedLicensedAudioUrl, type PrayerMusicProvider } from "@/lib/prayer-music";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  provider: z.enum(["spotify", "youtube", "audio"]),
  provider_url: z.string().url().max(500),
  license_confirmed: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(10000).default(0),
  is_published: z.boolean().default(false),
}).refine((value) => value.provider !== "audio" || value.license_confirmed, { message: "Confirm PHOTIZO has permission to stream this original or licensed recording." });

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  provider: z.enum(["spotify", "youtube", "audio"]).optional(),
  provider_url: z.string().url().max(500).optional(),
  license_confirmed: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  is_published: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 1, "Provide at least one field to update.");

export async function POST(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok || !auth.user?.email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid music item." }, { status: 400 });
  const validSource = parsed.data.provider === "audio"
    ? isSupportedLicensedAudioUrl(parsed.data.provider_url)
    : Boolean(getPrayerMusicEmbed(parsed.data.provider, parsed.data.provider_url));
  if (!validSource) return NextResponse.json({ error: parsed.data.provider === "audio" ? "Use an HTTPS link to a direct MP3, M4A, AAC, OGG, WAV, or WebM audio file." : "Use a supported Spotify track, album, playlist, YouTube video, or playlist URL." }, { status: 400 });
  const db = getServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  const { title, description, provider, provider_url, sort_order, is_published } = parsed.data;
  const item = { title, description, provider, provider_url, sort_order, is_published };
  const { data, error } = await db.from("prayer_music_items").insert({ ...item, updated_by: auth.user.email }).select("id").single();
  if (error) return musicWriteError(error.code);
  return NextResponse.json({ success: true, id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminRequest();
  if (!auth.ok || !auth.user?.email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid music update." }, { status: 400 });
  const db = getServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  const { id, ...changes } = parsed.data;
  if (changes.provider_url || changes.provider) {
    let current: { provider: string; provider_url: string } | null = null;
    if (!changes.provider || !changes.provider_url) {
      const { data: currentItem, error } = await db.from("prayer_music_items").select("provider,provider_url").eq("id", id).maybeSingle();
      if (error || !currentItem) return NextResponse.json({ error: "Music selection not found." }, { status: 404 });
      current = currentItem;
    }
    const provider = changes.provider || current?.provider as PrayerMusicProvider;
    const url = changes.provider_url || current?.provider_url || "";
    if (provider === "audio") {
      if (changes.license_confirmed !== true) return NextResponse.json({ error: "Confirm PHOTIZO has permission to stream this original or licensed recording." }, { status: 400 });
      if (url && !isSupportedLicensedAudioUrl(url)) return NextResponse.json({ error: "Use an HTTPS link to a direct MP3, M4A, AAC, OGG, WAV, or WebM audio file." }, { status: 400 });
    } else if (url && !getPrayerMusicEmbed(provider, url)) {
      return NextResponse.json({ error: "Use a supported Spotify track, album, playlist, YouTube video, or playlist URL." }, { status: 400 });
    }
  }
  const { license_confirmed, ...updates } = changes;
  void license_confirmed;
  const { error } = await db.from("prayer_music_items").update({ ...updates, updated_by: auth.user.email, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return musicWriteError(error.code);
  return NextResponse.json({ success: true });
}

function musicWriteError(code?: string) {
  if (code === "23514") return NextResponse.json({ error: "This database has not been enabled for PHOTIZO-licensed audio yet. Existing Spotify and YouTube selections are unaffected." }, { status: 409 });
  return NextResponse.json({ error: "Could not save this music selection." }, { status: 500 });
}
