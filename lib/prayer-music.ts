export type PrayerMusicProvider = "spotify" | "youtube" | "audio";

const licensedAudioExtensions = new Set(["mp3", "m4a", "aac", "ogg", "oga", "wav", "webm"]);

export function isSupportedLicensedAudioUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const extension = url.pathname.split(".").pop()?.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && Boolean(extension && licensedAudioExtensions.has(extension));
  } catch {
    return false;
  }
}

export function getPrayerMusicEmbed(provider: PrayerMusicProvider, rawUrl: string): string | null {
  if (provider === "audio") return null;
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== "https:") return null;

  if (provider === "spotify") {
    if (url.hostname !== "open.spotify.com") return null;
    const match = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([A-Za-z0-9]+)\/?$/i);
    return match ? `https://open.spotify.com/embed/${match[1].toLowerCase()}/${match[2]}` : null;
  }

  let videoId: string | null = null;
  let playlistId: string | null = null;
  if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || null;
  } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
    if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    else if (/^\/(?:shorts|embed)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) videoId = url.pathname.split("/")[2];
    if (url.pathname === "/playlist") playlistId = url.searchParams.get("list");
  } else return null;

  if (playlistId && /^[A-Za-z0-9_-]{10,120}$/.test(playlistId)) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`;
  if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
  return null;
}
