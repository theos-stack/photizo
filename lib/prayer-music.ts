export type PrayerMusicProvider = "spotify" | "youtube" | "audio";
export type SpotifyResource = { type: "track" | "album" | "playlist"; id: string };

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
    const match = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|album|playlist)\/([A-Za-z0-9]{10,22})\/?$/i);
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

export function parseSpotifyResource(input: string): SpotifyResource | null {
  let candidate = input.trim();
  if (candidate.startsWith("<")) {
    const iframe = candidate.match(/^<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>\s*(?:<\/iframe\s*>)?$/i);
    if (!iframe) return null;
    candidate = iframe[1] || iframe[2] || "";
  }
  const embed = getPrayerMusicEmbed("spotify", candidate);
  if (!embed) return null;
  const match = embed.match(/^https:\/\/open\.spotify\.com\/embed\/(track|album|playlist)\/([A-Za-z0-9]{10,22})$/);
  return match ? { type: match[1] as SpotifyResource["type"], id: match[2] } : null;
}

export function normalizePrayerMusicSource(provider: PrayerMusicProvider, input: string): string | null {
  if (provider === "spotify") {
    const resource = parseSpotifyResource(input);
    return resource ? "https://open.spotify.com/" + resource.type + "/" + resource.id : null;
  }
  if (provider === "audio") return isSupportedLicensedAudioUrl(input) ? new URL(input).toString() : null;
  const embed = getPrayerMusicEmbed(provider, input);
  if (!embed) return null;
  if (embed.startsWith("https://www.youtube-nocookie.com/embed/videoseries?")) {
    const playlistId = new URL(embed).searchParams.get("list");
    return playlistId ? "https://www.youtube.com/playlist?list=" + encodeURIComponent(playlistId) : null;
  }
  const videoId = embed.split("/").pop();
  return videoId ? "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId) : null;
}
