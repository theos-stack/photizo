"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import type { PrayerMusicProvider } from "@/lib/prayer-music";

type Item = { id: string; title: string; description: string; provider: PrayerMusicProvider; provider_url: string; sort_order: number; is_published: boolean };

export function PrayerMusicAdmin({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [provider, setProvider] = useState<PrayerMusicProvider>("spotify");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/prayer-streak/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, provider, provider_url: url, license_confirmed: licenseConfirmed, sort_order: items.length, is_published: false }) });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "Could not add that selection."); return; }
      setItems((old) => [...old, { id: body.id, title, description, provider, provider_url: url, sort_order: old.length, is_published: false }]);
      setTitle(""); setDescription(""); setUrl(""); setLicenseConfirmed(false); setMessage("Saved as unpublished. Preview and publish it when ready.");
    } catch { setMessage("Could not reach the music service. Try again."); }
    finally { setBusy(false); }
  }

  async function update(id: string, changes: Partial<Pick<Item, "is_published" | "sort_order">>) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/prayer-streak/music", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...changes }) });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "Could not update that selection."); return; }
      setItems((old) => old.map((item) => item.id === id ? { ...item, ...changes } : item));
    } catch { setMessage("Could not reach the music service. Try again."); }
    finally { setBusy(false); }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length || busy) return;
    const previous = items;
    const reordered = [...previous]; [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const normalized = reordered.map((item, sort_order) => ({ ...item, sort_order }));
    setItems(normalized);
    setBusy(true); setMessage("");
    void (async () => {
      try {
        for (const item of [normalized[index], normalized[target]]) {
          const response = await fetch("/api/admin/prayer-streak/music", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, sort_order: item.sort_order }) });
          if (!response.ok) throw new Error("Could not save the new music order.");
        }
      } catch (cause) {
        for (const item of [previous[index], previous[target]]) {
          await fetch("/api/admin/prayer-streak/music", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, sort_order: item.sort_order }) }).catch(() => undefined);
        }
        setItems(previous);
        setMessage(cause instanceof Error ? cause.message : "Could not save the new music order.");
      } finally { setBusy(false); }
    })();
  }

  return <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
    <h2 className="font-display text-2xl font-bold">Prayer music</h2>
    <p className="mt-1 text-sm text-black/55">Spotify and YouTube use their official embeds. PHOTIZO audio accepts direct HTTPS audio files only when we have permission to stream them. Every selection starts unpublished.</p>
    <form onSubmit={add} className="mt-5 grid gap-3 md:grid-cols-2">
      <label className="text-sm">Provider<select value={provider} onChange={(event) => { setProvider(event.target.value as PrayerMusicProvider); setLicenseConfirmed(false); }} className="mt-1 min-h-11 w-full rounded-lg border px-3"><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="audio">PHOTIZO licensed audio</option></select></label>
      <label className="text-sm">Title<input required minLength={2} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" /></label>
      <label className="text-sm md:col-span-2">{provider === "audio" ? "Direct audio file link" : "Provider link"}<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={provider === "spotify" ? "https://open.spotify.com/playlist/..." : provider === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://your-authorized-host.example/prayer-track.mp3"} className="mt-1 min-h-11 w-full rounded-lg border px-3" /><span className="mt-1 block text-xs text-black/45">{provider === "audio" ? "MP3, M4A, AAC, OGG, WAV, or WebM over HTTPS. Host files where PHOTIZO has streaming rights." : "Use an official Spotify or YouTube URL."}</span></label>
      {provider === "audio" && <label className="flex items-start gap-3 text-sm leading-6 text-black/70 md:col-span-2"><input required type="checkbox" checked={licenseConfirmed} onChange={(event) => setLicenseConfirmed(event.target.checked)} className="mt-1" />I confirm this is an original PHOTIZO recording or a recording PHOTIZO is authorized to stream.</label>}
      <label className="text-sm md:col-span-2">Description (optional)<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border p-3" /></label>
      <Button type="submit" disabled={busy || (provider === "audio" && !licenseConfirmed)} className="md:col-span-2">{busy ? "Saving…" : "Add selection"}</Button>
    </form>
    <ol className="mt-6 space-y-3">{items.map((item, index) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 p-4"><div className="min-w-0"><p className="font-semibold">{item.title} <span className="ml-2 rounded-full bg-[#f4eddf] px-2 py-1 text-[10px] uppercase">{item.provider}</span></p><p className="mt-1 max-w-xl truncate text-xs text-black/45">{item.provider_url}</p><p className="mt-1 text-xs text-black/55">Order {index + 1} · {item.is_published ? "Published" : "Unpublished"}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="ghost" disabled={busy || index === 0} onClick={() => move(index, -1)}>Move up</Button><Button type="button" size="sm" variant="ghost" disabled={busy || index === items.length - 1} onClick={() => move(index, 1)}>Move down</Button><Button type="button" size="sm" disabled={busy} onClick={() => void update(item.id, { is_published: !item.is_published })}>{item.is_published ? "Unpublish" : "Publish"}</Button></div></li>)}</ol>
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
