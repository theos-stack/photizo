export const MAX_PRAYER_MUSIC_SECONDS = 10 * 60;

export function prayerMusicSeekLimit(durationSeconds: number, limitEnabled: boolean) {
  const trackDuration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : MAX_PRAYER_MUSIC_SECONDS;
  return limitEnabled ? Math.min(trackDuration, MAX_PRAYER_MUSIC_SECONDS) : trackDuration;
}

export function hasReachedPrayerMusicLimit(currentTimeSeconds: number, limitEnabled: boolean) {
  return limitEnabled && currentTimeSeconds >= MAX_PRAYER_MUSIC_SECONDS;
}
