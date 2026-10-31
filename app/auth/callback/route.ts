import { NextResponse, type NextRequest } from "next/server";
import { getAuthCallbackError, getConfirmationDestination, getEmailOtpType } from "@/lib/auth/confirmation";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getSafeLocalRedirect } from "@/lib/local-redirect";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(request.nextUrl.searchParams.get("type"));
  const authError = request.nextUrl.searchParams.get("error");
  const callbackError = getAuthCallbackError(authError, request.nextUrl.searchParams.get("error_code"));
  const next = type
    ? getConfirmationDestination(type, request.nextUrl.searchParams.get("next"), request.nextUrl.origin)
    : getSafeLocalRedirect(request.nextUrl.searchParams.get("next"), request.nextUrl.origin, "/member");

  if (callbackError) {
    const target = new URL("/streak/login", request.url);
    target.searchParams.set("error", callbackError);
    target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  }

  const supabase = await getServerSupabaseClient();
  if (supabase && tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.session) return NextResponse.redirect(new URL(next, request.url));
  } else if (supabase && code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) return NextResponse.redirect(new URL(next, request.url));
  }

  const target = new URL("/streak/login", request.url);
  target.searchParams.set("error", tokenHash || type ? "verification" : "callback");
  target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}
