import assert from "node:assert/strict";
import test from "node:test";
import { getPrayerMusicEmbed, isSupportedLicensedAudioUrl } from "../lib/prayer-music.ts";

test("Spotify links become official embeds for approved media types", () => {
  assert.equal(getPrayerMusicEmbed("spotify", "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=test"), "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M");
  assert.equal(getPrayerMusicEmbed("spotify", "https://open.spotify.com/track/1abcDEF23456"), "https://open.spotify.com/embed/track/1abcDEF23456");
});

test("YouTube video and playlist links use official privacy-enhanced embeds", () => {
  assert.equal(getPrayerMusicEmbed("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(getPrayerMusicEmbed("youtube", "https://www.youtube.com/playlist?list=PL1234567890"), "https://www.youtube-nocookie.com/embed/videoseries?list=PL1234567890");
});

test("unsupported hosts and malformed provider URLs cannot become iframe sources", () => {
  assert.equal(getPrayerMusicEmbed("spotify", "https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M"), null);
  assert.equal(getPrayerMusicEmbed("youtube", "javascript:alert(1)"), null);
  assert.equal(getPrayerMusicEmbed("youtube", "https://www.youtube.com/watch?v=short"), null);
});

test("PHOTIZO licensed audio accepts only direct secure audio-file URLs", () => {
  assert.equal(isSupportedLicensedAudioUrl("https://media.photizo.example/prayer/quiet-morning.mp3"), true);
  assert.equal(isSupportedLicensedAudioUrl("https://cdn.example/audio/quiet-morning.m4a?signature=abc"), true);
  assert.equal(isSupportedLicensedAudioUrl("http://media.example/track.mp3"), false);
  assert.equal(isSupportedLicensedAudioUrl("https://media.example/track.exe"), false);
  assert.equal(isSupportedLicensedAudioUrl("https://user:password@media.example/track.mp3"), false);
  assert.equal(getPrayerMusicEmbed("audio", "https://media.example/track.mp3"), null);
});
