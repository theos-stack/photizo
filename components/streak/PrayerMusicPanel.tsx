"use client";

import { useState } from "react";
import { getPrayerMusicEmbed, type PrayerMusicProvider } from "@/lib/prayer-music";

export type PrayerMusicItem = { id: string; title: string; description: string; provider: PrayerMusicProvider; provider_url: string; sort_order: number };

export function PrayerMusicPanel({ items }: { items: PrayerMusicItem[] }) {
  const [selected, setSelected] = useState(items[0]?.id || "");
  const item = items.find((entry) => entry.id === selected) || items[0];
  const embed = item ? getPrayerMusicEmbed(item.provider, item.provider_url) : null;
  return <details className="mt-4 rounded-xl border border-black/10 bg-[#fbfaf6] p-4">
    <summary className="cursor-pointer text-sm font-semibold text-[var(--dark-moss-green)]">Optional prayer music{items.length > 1 ? ` · ${items.length} selections` : ""}</summary>
    <div className="mt-3 space-y-3">
      {items.length > 1 && <label className="block text-xs text-black/60">Choose a selection<select aria-label="Prayer music selection" value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-black">{items.map((entry) => <option key={entry.id} value={entry.id}>{entry.title} · {entry.provider}</option>)}</select></label>}
      {item && embed ? <><div><p className="text-sm font-semibold text-[#173326]">{item.title}</p>{item.description && <p className="mt-1 text-xs leading-5 text-black/60">{item.description}</p>}</div><iframe key={item.id} title={`${item.provider === "spotify" ? "Spotify" : "YouTube"} player: ${item.title}`} src={embed} className="w-full rounded-xl border-0" height={item.provider === "spotify" ? 152 : 220} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></> : <p className="text-xs leading-5 text-black/60">Use the optional browser-generated ambient tones above, or continue praying without music.</p>}
      <p className="text-[10px] leading-4 text-black/45">Playback follows Spotify and YouTube rules. Start playback in the player; background playback may stop when your browser or phone locks.</p>
    </div>
  </details>;
}
