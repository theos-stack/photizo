import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getSafeLocalRedirect } from "@/lib/local-redirect";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const authError = request.nextUrl.searchParams.get("error");
  const next = getSafeLocalRedirect(request.nextUrl.searchParams.get("next"), request.nextUrl.origin);
  const supabase = await getServerSupabaseClient();
  if (code && supabase && !authError) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  const target = new URL("/streak/login", request.url);
  target.searchParams.set("error", authError === "access_denied" ? "cancelled" : "callback");
  return NextResponse.redirect(target);
}
