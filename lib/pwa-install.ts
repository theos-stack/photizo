export const INSTALL_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const PRAYER_TIMER_PREFIX = "photizo:prayer-timer:";

export function shouldShowInstallPrompt({ engaged, installed, dismissedAt, now = Date.now() }: {
  engaged: boolean;
  installed: boolean;
  dismissedAt: number;
  now?: number;
}) {
  return engaged && !installed && (!dismissedAt || now - dismissedAt >= INSTALL_PROMPT_SNOOZE_MS);
}

export function hasActivePrayerSession(storage: Pick<Storage, "length" | "key" | "getItem">, now = Date.now()) {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(PRAYER_TIMER_PREFIX)) continue;
    try {
      const timer = JSON.parse(storage.getItem(key) || "null") as { status?: unknown; endsAt?: unknown } | null;
      if (timer?.status === "running" && typeof timer.endsAt === "number" && timer.endsAt > now) return true;
    } catch {
      // Ignore malformed local timer data; it cannot prove an active session.
    }
  }
  return false;
}
