"use client";

import { useEffect, useRef, useState } from "react";
import { PrayerMusicPanel, type PrayerMusicItem } from "@/components/streak/PrayerMusicPanel";

export function PrayerTimer({ minutes = 10, musicItems = [] }: { minutes?: number; musicItems?: PrayerMusicItem[] }) {
  const duration = minutes * 60;
  const [mode, setMode] = useState<"countdown" | "elapsed">("countdown");
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [showSound, setShowSound] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(30);
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const oscillators = useRef<OscillatorNode[]>([]);
  const activeElapsed = elapsedBefore + (startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000));
  const remaining = Math.max(0, duration - activeElapsed);
  const displayedSeconds = mode === "countdown" ? remaining : activeElapsed;
  const finished = mode === "countdown" && remaining <= 0;

  useEffect(() => {
    if (startedAt === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  useEffect(() => () => {
    oscillators.current.forEach((oscillator) => { try { oscillator.stop(); } catch { /* already stopped */ } });
    void audioContext.current?.close();
  }, []);

  useEffect(() => {
    if (!gainNode.current) return;
    gainNode.current.gain.setTargetAtTime(muted || !soundOn ? 0 : volume / 100 * 0.08, audioContext.current?.currentTime || 0, 0.15);
  }, [muted, soundOn, volume]);

  async function toggleSound() {
    if (soundOn) { setSoundOn(false); return; }
    try {
      const AudioContextClass = window.AudioContext;
      const context = audioContext.current || new AudioContextClass();
      audioContext.current = context;
      if (context.state === "suspended") await context.resume();
      if (!gainNode.current) {
        const gain = context.createGain();
        gain.gain.value = volume / 100 * 0.08;
        gain.connect(context.destination);
        gainNode.current = gain;
        for (const frequency of [110, 164.81]) {
          const oscillator = context.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          oscillator.connect(gain);
          oscillator.start();
          oscillators.current.push(oscillator);
        }
      }
      setMuted(false);
      setSoundOn(true);
    } catch {
      setShowSound(true);
    }
  }

  function start() {
    if (finished) setElapsedBefore(0);
    setNow(Date.now());
    setStartedAt(Date.now());
  }

  function pause() {
    setElapsedBefore(activeElapsed);
    setStartedAt(null);
  }

  function finish() {
    if (startedAt !== null) setElapsedBefore(activeElapsed);
    setStartedAt(null);
    if (mode === "countdown") setElapsedBefore(duration);
  }

  function reset() {
    setStartedAt(null);
    setElapsedBefore(0);
    setNow(Date.now());
  }

  function stopAmbience() {
    oscillators.current.forEach((oscillator) => { try { oscillator.stop(); } catch { /* already stopped */ } });
    oscillators.current = [];
    gainNode.current = null;
    const context = audioContext.current;
    audioContext.current = null;
    if (context) void context.close();
    setSoundOn(false);
    setMuted(false);
  }

  const text = `${String(Math.floor(displayedSeconds / 60)).padStart(2, "0")}:${String(Math.floor(displayedSeconds % 60)).padStart(2, "0")}`;

  return <section className="rounded-2xl border border-white/15 bg-white/[.07] p-4 sm:p-5" aria-label="Prayer timer">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#dfcf9c]">Quiet time</p><p className="mt-1 text-xs text-white/65">A gentle companion. Your check-in is always your choice.</p></div><p className="font-display text-4xl font-semibold tabular-nums" aria-live="off">{text}</p></div>
    <div className="mt-4 flex flex-wrap gap-2">
      {startedAt === null ? <button type="button" onClick={start} className="rounded-full bg-[#dfcf9c] px-4 py-2.5 text-xs font-semibold text-[#173326]">{finished ? "Begin again" : activeElapsed > 0 ? "Resume" : "Start Prayer"}</button> : <button type="button" onClick={pause} className="rounded-full bg-[#dfcf9c] px-4 py-2.5 text-xs font-semibold text-[#173326]">Pause</button>}
      {startedAt !== null && <button type="button" onClick={finish} className="rounded-full border border-white/25 px-4 py-2.5 text-xs font-semibold text-white">Finish</button>}
      {startedAt === null && activeElapsed > 0 && !finished && <button type="button" onClick={reset} className="rounded-full border border-white/25 px-4 py-2.5 text-xs font-semibold text-white">Reset</button>}
      <button type="button" aria-expanded={showSound} onClick={() => setShowSound((value) => !value)} className="rounded-full border border-white/25 px-4 py-2.5 text-xs font-semibold text-white">Optional ambience</button>
      <button type="button" onClick={() => setMode((value) => value === "countdown" ? "elapsed" : "countdown")} className="rounded-full border border-white/25 px-4 py-2.5 text-xs font-semibold text-white">{mode === "countdown" ? "Use elapsed time" : "Use countdown"}</button>
    </div>
    {showSound && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3"><button type="button" onClick={toggleSound} className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white">{soundOn ? "Pause ambience" : "Play soft ambient tone"}</button><label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={muted} onChange={(event) => setMuted(event.target.checked)} />Mute</label><label className="flex min-w-36 flex-1 items-center gap-2 text-xs text-white/70">Volume<input aria-label="Ambient volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-full" /></label><button type="button" onClick={stopAmbience} className="text-xs text-white/60 underline">Stop</button><p className="w-full text-[10px] text-white/45">Optional sound is generated in your browser and starts only when you choose to play it.</p></div>}
    <PrayerMusicPanel items={musicItems} />
  </section>;
}
