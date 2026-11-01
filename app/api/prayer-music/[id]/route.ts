import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/server/admin-api";
import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "prayer-music-library";

export async function GET(request: Request, context: RouteContext<"/api/prayer-music/[id]">) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const extension = new URL(request.url).searchParams.get("ext") || "";
  if (!/^(mp3|m4a|aac|ogg|wav|webm)$/.test(extension)) return new Response("Not found", { status: 404 });
  const member = await getServerSupabaseClient();
  const { data: { user } } = await member?.auth.getUser() ?? { data: { user: null } };
  if (!member || !user) return new Response("Sign in required", { status: 401 });
  const db = getServiceSupabaseClient();
  if (!db) return new Response("Music storage is unavailable", { status: 503 });
  const { data: track } = await db.from("prayer_music_items").select("id,provider,provider_url,is_published").eq("id", id).maybeSingle();
  if (!track || track.provider !== "audio" || !track.provider_url.endsWith(`/api/prayer-music/${id}?ext=${extension}`)) return new Response("Not found", { status: 404 });
  if (!track.is_published) {
    const admin = await verifyAdminRequest();
    if (!admin.ok) return new Response("Not found", { status: 404 });
  }
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(`${id}/audio.${extension}`, 300);
  if (error || !data?.signedUrl) return new Response("Audio is unavailable", { status: 503 });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
