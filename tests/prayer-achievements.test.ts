import test from "node:test";
import assert from "node:assert/strict";
import { consecutiveStreakAt, prayerAchievementMessage, PRAYER_ACHIEVEMENT_MESSAGES, verifiedPrayerAchievement } from "../lib/prayer-achievements.ts";

test("each of the thirty days has a unique encouragement", () => {
  assert.equal(PRAYER_ACHIEVEMENT_MESSAGES.length, 30);
  assert.equal(new Set(PRAYER_ACHIEVEMENT_MESSAGES).size, 30);
  assert.equal(prayerAchievementMessage(1), PRAYER_ACHIEVEMENT_MESSAGES[0]);
  assert.equal(prayerAchievementMessage(30), PRAYER_ACHIEVEMENT_MESSAGES[29]);
});

test("historic achievement streak is derived from consecutive saved local dates", () => {
  const dates = ["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05"];
  assert.equal(consecutiveStreakAt("2026-11-02", dates), 2);
  assert.equal(consecutiveStreakAt("2026-11-05", dates), 2);
  assert.equal(consecutiveStreakAt("2026-11-03", dates), 0);
});

test("new achievement requires a successful backend result and ignores duplicate check-ins", () => {
  assert.deepEqual(verifiedPrayerAchievement({ journey_day: 7, current_streak: 4, already_checked_in: false }), { day: 7, streak: 4 });
  assert.equal(verifiedPrayerAchievement(null), null);
  assert.equal(verifiedPrayerAchievement({ journey_day: 7, current_streak: 4, already_checked_in: true }), null);
  assert.equal(verifiedPrayerAchievement({ journey_day: 31, current_streak: 4 }), null);
});
