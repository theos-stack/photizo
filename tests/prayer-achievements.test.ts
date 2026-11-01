import test from "node:test";
import assert from "node:assert/strict";
import { consecutiveStreakAt, prayerAchievementMessage, PRAYER_ACHIEVEMENT_MESSAGES, verifiedPrayerAchievement } from "../lib/prayer-achievements.ts";

test("each of the thirty days has a unique encouragement", () => {
  assert.equal(PRAYER_ACHIEVEMENT_MESSAGES.length, 30);
  assert.equal(new Set(PRAYER_ACHIEVEMENT_MESSAGES).size, 30);
  assert.equal(prayerAchievementMessage(1), "A journey of transformation begins here.");
  assert.equal(prayerAchievementMessage(15), "Halfway through. Keep pressing on.");
  assert.equal(prayerAchievementMessage(30), "Thirty days complete. Let the journey continue.");
});

test("historic achievement streak is derived from consecutive saved local dates", () => {
  const dates = ["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05"];
  assert.equal(consecutiveStreakAt("2026-11-02", dates), 2);
  assert.equal(consecutiveStreakAt("2026-11-05", dates), 2);
  assert.equal(consecutiveStreakAt("2026-11-03", dates), 0);
});

test("new achievement requires a successful backend result and ignores duplicate check-ins", () => {
  assert.deepEqual(verifiedPrayerAchievement({ journey_day: 7, total_completed: 5, current_streak: 4, already_checked_in: false }), { day: 7, completedDays: 5, streak: 4 });
  assert.equal(verifiedPrayerAchievement(null), null);
  assert.equal(verifiedPrayerAchievement({ journey_day: 7, total_completed: 5, current_streak: 4, already_checked_in: true }), null);
  assert.equal(verifiedPrayerAchievement({ journey_day: 31, total_completed: 31, current_streak: 4 }), null);
  assert.deepEqual(verifiedPrayerAchievement({ journey_day: 8, total_completed: 3, current_streak: 3 }), { day: 8, completedDays: 3, streak: 3 });
  assert.equal(verifiedPrayerAchievement({ journey_day: 7, total_completed: 4, current_streak: 5 }), null);
});
