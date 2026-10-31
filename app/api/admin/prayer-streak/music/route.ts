import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrayerMusicEmbed, type PrayerMusicProvider } from "@/lib/prayer-music";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  provider: z.enum(["spotify", "youtube"]),
  provider_url: z.string().url().max(500),
  sort_order: z.number().int().min(0).max(10000).default(0),
  is_published: z.boolean().default(false),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  provider: z.enum(["spotify", "youtube"]).optional(),
  provider_url: z.string().url().max(500).optional(),
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
  if (!getPrayerMusicEmbed(parsed.data.provider, parsed.data.provider_url)) return NextResponse.json({ error: "Use a supported Spotify track, album, playlist, YouTube video, or playlist URL." }, { status: 400 });
  const db = getServiceSupabaseClient();
  if (!db) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  const { data, error } = await db.from("prayer_music_items").insert({ ...parsed.data, updated_by: auth.user.email }).select("id").single();
  if (error) return NextResponse.json({ error: "Could not save this music selection." }, { status: 500 });
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
  if (changes.provider_url) {
    let provider = changes.provider;
    if (!provider) {
      const { data: current, error } = await db.from("prayer_music_items").select("provider").eq("id", id).maybeSingle();
      if (error || !current) return NextResponse.json({ error: "Music selection not found." }, { status: 404 });
      provider = current.provider as PrayerMusicProvider;
    }
    if (!getPrayerMusicEmbed(provider, changes.provider_url)) return NextResponse.json({ error: "Use a supported Spotify track, album, playlist, YouTube video, or playlist URL." }, { status: 400 });
  }
  const { error } = await db.from("prayer_music_items").update({ ...changes, updated_by: auth.user.email, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update this music selection." }, { status: 500 });
  return NextResponse.json({ success: true });
}
