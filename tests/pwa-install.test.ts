import assert from "node:assert/strict";
import test from "node:test";
import { hasActivePrayerSession, shouldShowInstallPrompt } from "../lib/pwa-install.ts";

function storage(entries: Record<string, string>) {
  const values = Object.entries(entries);
  return {
    get length() { return values.length; },
    key(index: number) { return values[index]?.[0] ?? null; },
    getItem(key: string) { return values.find(([name]) => name === key)?.[1] ?? null; },
  } as Storage;
}

test("install prompt appears only after engagement and stays snoozed for seven days", () => {
  assert.equal(shouldShowInstallPrompt({ engaged: false, installed: false, dismissedAt: 0, now: 10_000 }), false);
  assert.equal(shouldShowInstallPrompt({ engaged: true, installed: true, dismissedAt: 0, now: 10_000 }), false);
  assert.equal(shouldShowInstallPrompt({ engaged: true, installed: false, dismissedAt: 5_000, now: 10_000 }), false);
  assert.equal(shouldShowInstallPrompt({ engaged: true, installed: false, dismissedAt: 1, now: 7 * 24 * 60 * 60 * 1000 + 1 }), true);
});

test("install prompt is deferred while a prayer timer is running", () => {
  const active = storage({ "photizo:prayer-timer:enrollment-1": JSON.stringify({ status: "running", endsAt: 2_000, remainingMs: 1000 }) });
  assert.equal(hasActivePrayerSession(active, 1_000), true);
  assert.equal(hasActivePrayerSession(active, 2_000), false);
  assert.equal(hasActivePrayerSession(storage({ "photizo:prayer-timer:enrollment-1": "invalid" }), 1_000), false);
});
