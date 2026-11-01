"use client";

import { ExternalLink, Pause, Play, Square } from "lucide-react";
import { useRef, useState } from "react";
import { getPrayerMusicEmbed, type PrayerMusicProvider } from "@/lib/prayer-music";

export type PrayerMusicItem = { id: string; title: string; description: string; provider: PrayerMusicProvider; provider_url: string; sort_order: number };

export function PrayerMusicPanel({ items }: { items: PrayerMusicItem[] }) {
  const [selected, setSelected] = useState(items[0]?.id || "");
  const item = items.find((entry) => entry.id === selected) || items[0];
  const embed = item && item.provider !== "audio" ? getPrayerMusicEmbed(item.provider, item.provider_url) : null;
  return <details className="mt-4 rounded-xl border border-black/10 bg-[#fbfaf6] p-4">
    <summary className="cursor-pointer text-sm font-semibold text-[var(--dark-moss-green)]">Optional prayer music{items.length > 1 ? ` · ${items.length} selections` : ""}</summary>
    <div className="mt-3 space-y-3">
      {items.length > 1 && <label className="block text-xs text-black/60">Choose a selection<select aria-label="Prayer music selection" value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-black">{items.map((entry) => <option key={entry.id} value={entry.id}>{entry.title} · {entry.provider === "audio" ? "PHOTIZO audio" : entry.provider}</option>)}</select></label>}
      {item?.provider === "audio" ? <LicensedAudioPlayer key={item.id} item={item} /> : item && embed ? <>
        <div><p className="text-sm font-semibold text-[#173326]">{item.title}</p>{item.description && <p className="mt-1 text-xs leading-5 text-black/60">{item.description}</p>}</div>
        <iframe key={item.id} title={`${item.provider === "spotify" ? "Spotify" : "YouTube"} player: ${item.title}`} src={embed} className="w-full rounded-xl border-0" height={item.provider === "spotify" ? 352 : 220} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        <a href={item.provider_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[var(--dark-moss-green)] underline-offset-4 hover:underline">Listen on {item.provider === "spotify" ? "Spotify" : "YouTube"}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
        {item.provider === "spotify" && <p className="text-[10px] leading-4 text-black/45">Spotify controls full playback and previews. Sign in to Spotify or open the track in Spotify if this embed offers only a preview.</p>}
      </> : <p className="text-xs leading-5 text-black/60">Use the optional browser-generated ambient tones above, or continue praying without music.</p>}
      <p className="text-[10px] leading-4 text-black/45">Music is optional and separate from your prayer timer. Playback never records a check-in. Background playback may stop when the browser or phone locks.</p>
    </div>
  </details>;
}

function LicensedAudioPlayer({ item }: { item: PrayerMusicItem }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [limitEnabled, setLimitEnabled] = useState(true);
  const [error, setError] = useState("");
  const ceiling = limitEnabled ? Math.min(duration || 600, 600) : duration || 600;

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    try { await audio.play(); setPlaying(true); }
    catch { setError("This audio link could not be played. Check the hosted file and try again."); }
  }

  function stop() {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setCurrentTime(0); setPlaying(false); setError("");
  }

  function updateTime(audio: HTMLAudioElement) {
    const capped = limitEnabled && audio.currentTime >= 600;
    if (capped) { audio.currentTime = 600; audio.pause(); setPlaying(false); setError("Your optional 10-minute music session is complete."); }
    setCurrentTime(Math.min(audio.currentTime, limitEnabled ? 600 : Number.MAX_SAFE_INTEGER));
  }

  return <div className="rounded-xl border border-[#dfd4b8] bg-white p-4">
    <audio ref={audioRef} src={item.provider_url} preload="none" onLoadedMetadata={(event) => { event.currentTarget.volume = volume; setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0); }} onTimeUpdate={(event) => updateTime(event.currentTarget)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError("This audio link could not be loaded. Check that the hosted file is available over HTTPS."); }} />
    <div><p className="text-sm font-semibold text-[#173326]">{item.title}</p>{item.description && <p className="mt-1 text-xs leading-5 text-black/60">{item.description}</p>}<p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--dark-moss-green)]">PHOTIZO authorized audio</p></div>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => playing ? audioRef.current?.pause() : void play()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--evergreen)] px-4 text-xs font-semibold text-white">{playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}{playing ? "Pause" : currentTime > 0 ? "Resume" : "Play"}</button>
      <button type="button" onClick={stop} disabled={!playing && currentTime === 0} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-xs font-semibold text-black/60 disabled:opacity-40"><Square className="h-3 w-3" aria-hidden="true" />Stop</button>
    </div>
    <label className="mt-4 flex items-center gap-2 text-xs text-black/65"><input type="checkbox" checked={limitEnabled} onChange={(event) => setLimitEnabled(event.target.checked)} />Stop after 10 minutes</label>
    <label className="mt-3 block text-xs text-black/60">Session progress <input aria-label="Prayer music progress" type="range" min="0" max={ceiling} step="1" value={Math.min(currentTime, ceiling)} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setCurrentTime(next); }} className="mt-1 block w-full accent-[var(--dark-moss-green)]" /><span className="mt-1 flex justify-between tabular-nums"><span>{formatTime(currentTime)}</span><span>{limitEnabled && duration > 600 ? "10:00 limit" : formatTime(duration)}</span></span></label>
    <label className="mt-3 flex items-center gap-3 text-xs text-black/60">Volume <input aria-label="Music volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (audioRef.current) audioRef.current.volume = next; }} className="flex-1 accent-[var(--dark-moss-green)]" /></label>
    {error && <p role="status" className="mt-3 text-xs leading-5 text-[var(--dark-moss-green)]">{error}</p>}
  </div>;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
