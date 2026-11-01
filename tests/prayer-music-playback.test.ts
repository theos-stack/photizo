import assert from "node:assert/strict";
import test from "node:test";
import { hasReachedPrayerMusicLimit, MAX_PRAYER_MUSIC_SECONDS, prayerMusicSeekLimit } from "../lib/prayer-music-playback.ts";

test("the optional music session caps long tracks at ten minutes", () => {
  assert.equal(prayerMusicSeekLimit(1800, true), MAX_PRAYER_MUSIC_SECONDS);
  assert.equal(hasReachedPrayerMusicLimit(599.9, true), false);
  assert.equal(hasReachedPrayerMusicLimit(600, true), true);
});

test("short tracks end at their own duration and uncapped playback can continue", () => {
  assert.equal(prayerMusicSeekLimit(240, true), 240);
  assert.equal(prayerMusicSeekLimit(1800, false), 1800);
  assert.equal(hasReachedPrayerMusicLimit(900, false), false);
});
