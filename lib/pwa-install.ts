const PRAYER_TIMER_PREFIX = "photizo:prayer-timer:";

export type InstallPlatform = "ios" | "android" | "desktop" | "unsupported";

export function getInstallPlatform(userAgent: string, standalone = false): InstallPlatform {
  if (standalone) return "unsupported";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/chrome|chromium|edg\//i.test(userAgent)) return "desktop";
  return "unsupported";
}

export function isPrayerStreakPath(pathname: string) {
  return pathname === "/streak" || pathname.startsWith("/streak/");
}

export function shouldShowInstallPrompt({
  eligiblePath,
  platform,
  installed,
  dismissedThisSession,
  alreadyShownThisSession,
  invitationActive,
  prayerActive,
  celebrationActive,
  manual = false,
}: {
  eligiblePath: boolean;
  platform: InstallPlatform;
  installed: boolean;
  dismissedThisSession: boolean;
  alreadyShownThisSession: boolean;
  invitationActive: boolean;
  prayerActive: boolean;
  celebrationActive: boolean;
  manual?: boolean;
}) {
  if (manual) return platform !== "unsupported" && !installed;
  return eligiblePath && platform !== "unsupported" && !installed && !dismissedThisSession
    && !alreadyShownThisSession && !invitationActive && !prayerActive && !celebrationActive;
}

export function hasActivePrayerSession(storage: Pick<Storage, "length" | "key" | "getItem">, now = Date.now()) {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(PRAYER_TIMER_PREFIX)) continue;
    try {
      const timer = JSON.parse(storage.getItem(key) || "null") as { status?: unknown; endsAt?: unknown } | null;
      if (timer?.status === "running" && typeof timer.endsAt === "number" && timer.endsAt > now) return true;
    } catch {
      // Malformed local timer data cannot prove that prayer is active.
    }
  }
  return false;
}
