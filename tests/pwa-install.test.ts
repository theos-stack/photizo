import assert from "node:assert/strict";
import test from "node:test";
import { getInstallPlatform, hasActivePrayerSession, isPrayerStreakPath, shouldShowInstallPrompt } from "../lib/pwa-install.ts";

function storage(entries: Record<string, string>) {
  const values = Object.entries(entries);
  return {
    get length() { return values.length; },
    key(index: number) { return values[index]?.[0] ?? null; },
    getItem(key: string) { return values.find(([name]) => name === key)?.[1] ?? null; },
  } as Storage;
}

const eligible = {
  eligiblePath: true,
  platform: "desktop" as const,
  installed: false,
  dismissedThisSession: false,
  alreadyShownThisSession: false,
  invitationActive: false,
  prayerActive: false,
  celebrationActive: false,
};

test("install prompt is eligible on the prayer journey and appears only once per session", () => {
  assert.equal(shouldShowInstallPrompt(eligible), true);
  assert.equal(shouldShowInstallPrompt({ ...eligible, alreadyShownThisSession: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...eligible, dismissedThisSession: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...eligible, eligiblePath: false }), false);
});

test("install invitation waits until no other active experience is visible", () => {
  assert.equal(shouldShowInstallPrompt({ ...eligible, invitationActive: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...eligible, prayerActive: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...eligible, celebrationActive: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...eligible, installed: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...eligible, platform: "unsupported" }), false);
});

test("install platform detection covers iOS, Android, desktop and installed mode", () => {
  assert.equal(getInstallPlatform("Mozilla iPhone"), "ios");
  assert.equal(getInstallPlatform("Mozilla Android"), "android");
  assert.equal(getInstallPlatform("Mozilla Chrome/130"), "desktop");
  assert.equal(getInstallPlatform("Mozilla Firefox"), "unsupported");
  assert.equal(getInstallPlatform("Mozilla Chrome/130", true), "unsupported");
});

test("install prompt is limited to the streak experience and subroutes", () => {
  assert.equal(isPrayerStreakPath("/streak"), true);
  assert.equal(isPrayerStreakPath("/streak/settings"), true);
  assert.equal(isPrayerStreakPath("/"), false);
  assert.equal(isPrayerStreakPath("/streaking"), false);
});

test("install prompt is deferred while a prayer timer is running", () => {
  const active = storage({ "photizo:prayer-timer:enrollment-1": JSON.stringify({ status: "running", endsAt: 2_000, remainingMs: 1000 }) });
  assert.equal(hasActivePrayerSession(active, 1_000), true);
  assert.equal(hasActivePrayerSession(active, 2_000), false);
  assert.equal(hasActivePrayerSession(storage({ "photizo:prayer-timer:enrollment-1": "invalid" }), 1_000), false);
});
