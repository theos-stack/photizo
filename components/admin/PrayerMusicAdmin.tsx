"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { getPrayerMusicEmbed, normalizePrayerMusicSource, type PrayerMusicProvider } from "@/lib/prayer-music";

type Item = { id: string; title: string; description: string; provider: PrayerMusicProvider; provider_url: string; sort_order: number; is_published: boolean };

export function PrayerMusicAdmin({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [provider, setProvider] = useState<PrayerMusicProvider>("spotify");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState(() => initial.some((item) => item.provider === "spotify" && item.provider_url.includes("4fSm5o6HY3N5tNne66EPdC")) ? "" : "https://open.spotify.com/track/4fSm5o6HY3N5tNne66EPdC");
  const [file, setFile] = useState<File | null>(null);
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSource, setEditSource] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [previewNew, setPreviewNew] = useState(false);
  const spotifySlots = items.filter((item) => item.provider === "spotify" && item.is_published).sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)).slice(0, 4);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      let response: Response;
      if (provider === "audio") {
        if (!file) { setMessage("Choose an audio file to upload."); return; }
        const form = new FormData();
        form.set("file", file); form.set("title", title); form.set("description", description); form.set("license_confirmed", String(licenseConfirmed));
        response = await fetch("/api/admin/prayer-streak/music/upload", { method: "POST", body: form });
      } else {
        response = await fetch("/api/admin/prayer-streak/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, provider, provider_url: url, license_confirmed: licenseConfirmed, sort_order: items.length, is_published: false }) });
      }
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "Could not add that selection."); return; }
      const item: Item = body.item || { id: body.id, title, description, provider, provider_url: url, sort_order: items.length, is_published: false };
      setItems((old) => [...old, item]);
      setTitle(""); setDescription(""); setUrl(""); setFile(null); setLicenseConfirmed(false); setMessage("Saved as unpublished. Preview it, then publish when ready.");
    } catch { setMessage("Could not reach the music service. Try again."); }
    finally { setBusy(false); }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Remove “${item.title}” from the prayer music library?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/prayer-streak/music", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "Could not remove that selection."); return; }
      setItems((old) => old.filter((entry) => entry.id !== item.id));
      setMessage(body.warning || "Music selection removed.");
    } catch { setMessage("Could not reach the music service. Try again."); }
    finally { setBusy(false); }
  }

  async function update(id: string, changes: Partial<Pick<Item, "is_published" | "sort_order" | "title" | "description" | "provider_url">>) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/prayer-streak/music", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...changes }) });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error || "Could not update that selection."); return; }
      const normalizedChanges = changes.provider_url ? { ...changes, provider_url: normalizePrayerMusicSource("spotify", changes.provider_url) || changes.provider_url } : changes;
      setItems((old) => old.map((item) => item.id === id ? { ...item, ...normalizedChanges } : item));
      if (changes.title) setEditingId("");
    } catch { setMessage("Could not reach the music service. Try again."); }
    finally { setBusy(false); }
  }

  function edit(item: Item) {
    setEditingId(item.id); setEditTitle(item.title); setEditDescription(item.description); setEditSource(item.provider_url); setPreviewId("");
  }

  async function moveSpotify(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= spotifySlots.length || busy) return;
    const reordered = [...spotifySlots];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const start = Math.min(...spotifySlots.map((item) => item.sort_order));
    const updates = reordered.map((item, slot) => ({ ...item, sort_order: start + slot }));
    setBusy(true); setMessage("");
    try {
      for (const item of updates) {
        const response = await fetch("/api/admin/prayer-streak/music", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, sort_order: item.sort_order }) });
        if (!response.ok) throw new Error("Could not save the Spotify slot order.");
      }
      setItems((old) => old.map((item) => updates.find((updateItem) => updateItem.id === item.id) || item));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save the Spotify slot order."); }
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
    <section className="mt-4 rounded-2xl border border-[#d9c79d]/60 bg-[#fbfaf6] p-4 sm:p-5">
      <h3 className="font-display text-xl font-semibold">Prayer Music: Spotify</h3>
      <p className="mt-1 text-sm text-black/55">Manage the four Spotify songs available to Prayer Streak participants. Only published selections occupy these slots; unpublishing keeps a track in the library.</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => {
        const item = spotifySlots[index];
        return <li key={item?.id || "empty-" + index} className="min-w-0 rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8a7448]">Slot {index + 1}</p>
          {item ? <><p className="mt-1 truncate font-semibold text-[#173326]">{item.title}</p>{item.description && <p className="mt-1 truncate text-xs text-black/55">{item.description}</p>}<p className="mt-1 truncate text-[10px] text-black/45">{item.provider_url}</p>
            {editingId === item.id ? <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium">Displayed song title<input value={editTitle} maxLength={120} onChange={(event) => setEditTitle(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border px-3 text-sm" /></label>
              <label className="block text-xs font-medium">Artist or description<input value={editDescription} maxLength={500} onChange={(event) => setEditDescription(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border px-3 text-sm" /></label>
              <label className="block text-xs font-medium">Replace with Spotify link or official embed code<textarea value={editSource} onChange={(event) => setEditSource(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border p-2 text-xs" /></label>
              <div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={busy} onClick={() => void update(item.id, { title: editTitle, description: editDescription, provider_url: editSource })}>Save changes</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditingId("")}>Cancel</Button></div>
            </div> : <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="ghost" disabled={busy || index === 0} onClick={() => void moveSpotify(index, -1)}>Move up</Button><Button type="button" size="sm" variant="ghost" disabled={busy || index === spotifySlots.length - 1} onClick={() => void moveSpotify(index, 1)}>Move down</Button><Button type="button" size="sm" variant="ghost" onClick={() => edit(item)}>Edit / replace</Button><Button type="button" size="sm" onClick={() => void update(item.id, { is_published: false })}>Remove from slot</Button><Button type="button" size="sm" variant="ghost" onClick={() => setPreviewId(previewId === item.id ? "" : item.id)}>{previewId === item.id ? "Close preview" : "Preview"}</Button></div>}
            {previewId === item.id && <iframe title={"Spotify preview: " + item.title} src={getPrayerMusicEmbed("spotify", item.provider_url) || undefined} className="mt-3 w-full rounded-xl border-0" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />}
          </> : <p className="mt-2 text-sm text-black/50">Empty · add a Spotify song below or publish one from the saved library.</p>}
        </li>;
      })}</ol>
    </section>
    <p className="mt-3 text-sm text-black/55">YouTube uses its official embed. PHOTIZO audio accepts direct HTTPS audio files only when we have permission to stream them. Spotify playback may be limited by Spotify or the member&apos;s account.</p>
    <form onSubmit={add} className="mt-5 grid gap-3 md:grid-cols-2">
      <label className="text-sm">Provider<select value={provider} onChange={(event) => { setProvider(event.target.value as PrayerMusicProvider); setUrl(""); setPreviewNew(false); setLicenseConfirmed(false); }} className="mt-1 min-h-11 w-full rounded-lg border px-3"><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="audio">PHOTIZO licensed audio</option></select></label>
      <label className="text-sm">Title<input required minLength={2} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" /></label>
      {provider === "audio" ? <label className="text-sm md:col-span-2">Authorized audio file<input required type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/x-wav,audio/webm,.mp3,.m4a,.aac,.ogg,.wav,.webm" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 block min-h-11 w-full rounded-lg border px-3 py-2" /><span className="mt-1 block text-xs text-black/45">MP3, M4A, AAC, OGG, WAV or WebM · up to 4 MB · stored privately and streamed through a short-lived signed link.</span></label> : <label className="text-sm md:col-span-2">{provider === "spotify" ? "Spotify song link or official iframe code" : "Provider link"}<textarea required value={url} onChange={(event) => setUrl(event.target.value)} placeholder={provider === "spotify" ? "https://open.spotify.com/track/… or paste Spotify's iframe code" : "https://www.youtube.com/watch?v=..."} className="mt-1 min-h-16 w-full rounded-lg border p-3 text-sm" /><span className="mt-1 block text-xs text-black/45">{provider === "spotify" ? "The supplied fourth track is prefilled. Enter its verified display title and artist, then save; the track is checked against the existing library to prevent duplicates." : "Use an official YouTube URL."}</span></label>}
      {provider === "spotify" && <div className="md:col-span-2"><Button type="button" size="sm" variant="ghost" disabled={!getPrayerMusicEmbed("spotify", normalizePrayerMusicSource("spotify", url) || "")} onClick={() => setPreviewNew(!previewNew)}>{previewNew ? "Close preview" : "Preview Spotify track"}</Button>{previewNew && getPrayerMusicEmbed("spotify", normalizePrayerMusicSource("spotify", url) || "") && <iframe title="Preview the new Spotify track" src={getPrayerMusicEmbed("spotify", normalizePrayerMusicSource("spotify", url) || "") || undefined} className="mt-3 block w-full max-w-md rounded-xl border-0" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />}</div>}
      {provider === "audio" && <label className="flex items-start gap-3 text-sm leading-6 text-black/70 md:col-span-2"><input required type="checkbox" checked={licenseConfirmed} onChange={(event) => setLicenseConfirmed(event.target.checked)} className="mt-1" />I confirm this is an original PHOTIZO recording or a recording PHOTIZO is authorized to stream.</label>}
      <label className="text-sm md:col-span-2">{provider === "audio" ? "Artist or attribution (optional)" : "Description (optional)"}<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border p-3" /></label>
      <Button type="submit" disabled={busy || (provider === "audio" && !licenseConfirmed)} className="md:col-span-2">{busy ? "Saving…" : "Add selection"}</Button>
    </form>
    <ol className="mt-6 space-y-3">{items.map((item, index) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 p-4"><div className="min-w-0 flex-1"><p className="font-semibold">{item.title} <span className="ml-2 rounded-full bg-[#f4eddf] px-2 py-1 text-[10px] uppercase">{item.provider}</span></p>{item.description&&<p className="mt-1 text-xs text-black/55">{item.description}</p>}{item.provider === "audio" ? <audio className="mt-2 h-9 max-w-md" controls preload="none" src={item.provider_url}>Audio preview</audio> : <p className="mt-1 max-w-xl truncate text-xs text-black/45">{item.provider_url}</p>}<p className="mt-1 text-xs text-black/55">Order {index + 1} · {item.is_published ? "Published" : "Unpublished"}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="ghost" disabled={busy || index === 0} onClick={() => move(index, -1)}>Move up</Button><Button type="button" size="sm" variant="ghost" disabled={busy || index === items.length - 1} onClick={() => move(index, 1)}>Move down</Button><Button type="button" size="sm" disabled={busy} onClick={() => void update(item.id, { is_published: !item.is_published })}>{item.is_published ? "Unpublish" : "Publish"}</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void remove(item)}>Remove</Button></div></li>)}</ol>
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
