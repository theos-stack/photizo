import test from "node:test";
import assert from "node:assert/strict";
import { calendarDayNumber, journeyMetrics, streakMetrics } from "../lib/prayer-streak-core.ts";
import { isTrustedPushEndpoint } from "../lib/push-endpoint.ts";
import { getSafeLocalRedirect } from "../lib/local-redirect.ts";

test("journey day is a local calendar-day difference, including across DST dates", () => {
  assert.equal(calendarDayNumber("2026-03-07", "2026-03-09"), 3);
});

test("journey accepts a new member as Day 1 on their actual enrollment date", () => {
  assert.deepEqual(journeyMetrics("2026-10-29", [], "2026-10-29"), {
    currentDay: 1, elapsedDay: 1, totalCompleted: 0, currentStreak: 0,
    longestStreak: 0, missedDays: 0, completed: false,
  });
});

test("an incomplete current day is not counted as missed until its local day ends", () => {
  const result = journeyMetrics("2026-10-29", [], "2026-10-29");
  assert.equal(result.missedDays, 0);
  assert.equal(journeyMetrics("2026-10-29", [], "2026-10-30").missedDays, 1);
});

test("a complete 30-calendar-day run finishes with a 30-day streak", () => {
  const dates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date("2026-01-01T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  assert.deepEqual(journeyMetrics(dates[0], dates, dates[29]), {
    currentDay: 30, elapsedDay: 30, totalCompleted: 30, currentStreak: 30,
    longestStreak: 30, missedDays: 0, completed: true,
  });
});

test("missed days preserve total progress, break streaks, and complete on day 31", () => {
  const result = journeyMetrics("2026-10-01", ["2026-10-01", "2026-10-02", "2026-10-04"], "2026-10-31");
  assert.deepEqual(result, {
    currentDay: 30, elapsedDay: 31, totalCompleted: 3, currentStreak: 0,
    longestStreak: 2, missedDays: 27, completed: true,
  });
});

test("calendar day calculation rejects impossible dates", () => {
  assert.throws(() => calendarDayNumber("2026-02-30", "2026-03-01"), /valid ISO calendar dates/);
});

test("push subscriptions accept supported HTTPS providers and reject arbitrary endpoints", () => {
  assert.equal(isTrustedPushEndpoint("https://fcm.googleapis.com/fcm/send/test"), true);
  assert.equal(isTrustedPushEndpoint("https://web.push.apple.com/abc"), true);
  assert.equal(isTrustedPushEndpoint("http://fcm.googleapis.com/fcm/send/test"), false);
  assert.equal(isTrustedPushEndpoint("https://user:pass@fcm.googleapis.com/fcm/send/test"), false);
  assert.equal(isTrustedPushEndpoint("https://fcm.googleapis.com:8080/fcm/send/test"), false);
  assert.equal(isTrustedPushEndpoint("https://127.0.0.1/admin"), false);
  assert.equal(isTrustedPushEndpoint("https://attacker.example/collect"), false);
});

test("auth redirects stay on the app origin, including backslash edge cases", () => {
  assert.equal(getSafeLocalRedirect("/streak/settings?tab=account", "https://photizo.example"), "/streak/settings?tab=account");
  assert.equal(getSafeLocalRedirect("//attacker.example/path", "https://photizo.example"), "/streak");
  assert.equal(getSafeLocalRedirect("/\\attacker.example/path", "https://photizo.example"), "/streak");
  assert.equal(getSafeLocalRedirect("https://attacker.example/path", "https://photizo.example"), "/streak");
});

test("check-in days remain totalled while a missed date breaks the current streak", () => {
  const result = streakMetrics(["2026-10-25", "2026-10-26", "2026-10-28", "2026-10-29"], "2026-10-29");
  assert.deepEqual(result, { totalCompleted: 4, currentStreak: 2, longestStreak: 2 });
});

test("today can remain incomplete while yesterday's streak is still current", () => {
  const result = streakMetrics(["2026-10-27", "2026-10-28"], "2026-10-29");
  assert.equal(result.currentStreak, 2);
});

test("duplicate check-in dates do not inflate totals", () => {
  const result = streakMetrics(["2026-10-29", "2026-10-29"], "2026-10-29");
  assert.deepEqual(result, { totalCompleted: 1, currentStreak: 1, longestStreak: 1 });
});
