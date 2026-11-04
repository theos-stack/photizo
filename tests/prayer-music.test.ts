import assert from "node:assert/strict";
import test from "node:test";
import { getPrayerMusicEmbed, isSupportedLicensedAudioUrl, normalizePrayerMusicSource, parseSpotifyResource } from "../lib/prayer-music.ts";

test("Spotify links become official embeds for approved media types", () => {
  assert.equal(getPrayerMusicEmbed("spotify", "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=test"), "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M");
  assert.equal(getPrayerMusicEmbed("spotify", "https://open.spotify.com/track/1abcDEF23456"), "https://open.spotify.com/embed/track/1abcDEF23456");
  assert.equal(getPrayerMusicEmbed("spotify", "https://open.spotify.com/embed/track/4fSm5o6HY3N5tNne66EPdC"), "https://open.spotify.com/embed/track/4fSm5o6HY3N5tNne66EPdC");
});

test("Spotify iframe input is reduced to a canonical source URL without storing HTML", () => {
  const iframe = '<iframe data-testid="embed-iframe" src="https://open.spotify.com/embed/track/4fSm5o6HY3N5tNne66EPdC?utm_source=generator&si=abc" width="100%" allow="autoplay; encrypted-media"></iframe>';
  assert.deepEqual(parseSpotifyResource(iframe), { type: "track", id: "4fSm5o6HY3N5tNne66EPdC" });
  assert.equal(normalizePrayerMusicSource("spotify", iframe), "https://open.spotify.com/track/4fSm5o6HY3N5tNne66EPdC");
  assert.equal(normalizePrayerMusicSource("spotify", "https://open.spotify.com/intl-ng/track/4fSm5o6HY3N5tNne66EPdC?si=abc"), "https://open.spotify.com/track/4fSm5o6HY3N5tNne66EPdC");
});

test("Spotify input rejects executable or non-Spotify iframe content", () => {
  assert.equal(parseSpotifyResource('<iframe src="https://evil.example/embed/track/4fSm5o6HY3N5tNne66EPdC"></iframe>'), null);
  assert.equal(parseSpotifyResource('<iframe src="javascript:alert(1)"></iframe>'), null);
  assert.equal(parseSpotifyResource('<iframe src="https://open.spotify.com/embed/track/4fSm5o6HY3N5tNne66EPdC" onload="alert(1)"></iframe><script>alert(2)</script>'), null);
  assert.equal(normalizePrayerMusicSource("spotify", "https://open.spotify.com/user/name"), null);
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
