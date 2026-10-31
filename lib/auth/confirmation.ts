import type { EmailOtpType } from "@supabase/supabase-js";

import { getSafeLocalRedirect } from "../local-redirect.ts";

const emailOtpTypes: readonly EmailOtpType[] = [
  "email",
  "signup",
  "recovery",
  "invite",
  "email_change",
  "magiclink",
];

export function getEmailOtpType(value: string | null): EmailOtpType | null {
  return value && emailOtpTypes.includes(value as EmailOtpType)
    ? (value as EmailOtpType)
    : null;
}

export function getAuthCallbackError(
  authError: string | null,
  errorCode: string | null,
): "cancelled" | "verification" | "callback" | null {
  if (!authError) return null;
  if (errorCode === "otp_expired" || errorCode === "email_not_confirmed") {
    return "verification";
  }
  if (authError === "access_denied" && !errorCode) return "cancelled";
  return "callback";
}

export function getConfirmationDestination(
  type: EmailOtpType,
  value: string | null,
  origin: string,
) {
  const fallback = type === "recovery" ? "/streak/reset-password" : "/member";
  return getSafeLocalRedirect(value, origin, fallback);
}
