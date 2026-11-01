import test from "node:test";
import assert from "node:assert/strict";
import { completePrayerTimer, initialPrayerTimerState, parsePrayerTimerState, pausePrayerTimer, remainingPrayerTime, startPrayerTimer } from "../lib/prayer-timer.ts";

test("elapsed timer catches up after the page is suspended or refreshed", () => {
  const started = startPrayerTimer(initialPrayerTimerState(10), 1_000);
  assert.equal(started.endsAt, 601_000);
  assert.equal(remainingPrayerTime(started, 241_000), 360_000);
  const restored = parsePrayerTimerState(JSON.stringify(started), 10);
  assert.equal(remainingPrayerTime(restored, 421_000), 180_000);
});

test("explicit pause stores remaining time and resume starts a fresh deadline", () => {
  const started = startPrayerTimer(initialPrayerTimerState(10), 10_000);
  const paused = pausePrayerTimer(started, 130_000);
  assert.equal(paused.status, "paused");
  assert.equal(paused.remainingMs, 480_000);
  const resumed = startPrayerTimer(paused, 900_000);
  assert.equal(resumed.endsAt, 1_380_000);
  assert.equal(remainingPrayerTime(resumed, 1_020_000), 360_000);
});

test("completion and reset are stable; saved state is scoped to the configured duration", () => {
  const started = startPrayerTimer(initialPrayerTimerState(1), 5_000);
  assert.equal(completePrayerTimer(started).status, "complete");
  assert.equal(parsePrayerTimerState(JSON.stringify(started), 10).status, "paused");
  assert.equal(parsePrayerTimerState("invalid", 10).remainingMs, 600_000);
});
