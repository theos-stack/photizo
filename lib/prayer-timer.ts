export type PrayerTimerState = {
  status: "running" | "paused" | "complete";
  durationMs: number;
  remainingMs: number;
  endsAt: number | null;
};

export function initialPrayerTimerState(minutes: number): PrayerTimerState {
  const durationMs = Math.max(1, minutes) * 60_000;
  return { status: "paused", durationMs, remainingMs: durationMs, endsAt: null };
}

export function remainingPrayerTime(state: PrayerTimerState, now: number) {
  if (state.status !== "running" || state.endsAt === null) return Math.max(0, state.remainingMs);
  return Math.max(0, state.endsAt - now);
}

export function startPrayerTimer(state: PrayerTimerState, now: number): PrayerTimerState {
  const remainingMs = remainingPrayerTime(state, now);
  if (remainingMs <= 0) return { ...state, status: "complete", remainingMs: 0, endsAt: null };
  return { ...state, status: "running", remainingMs, endsAt: now + remainingMs };
}

export function pausePrayerTimer(state: PrayerTimerState, now: number): PrayerTimerState {
  const remainingMs = remainingPrayerTime(state, now);
  return { ...state, status: remainingMs <= 0 ? "complete" : "paused", remainingMs, endsAt: null };
}

export function completePrayerTimer(state: PrayerTimerState): PrayerTimerState {
  return { ...state, status: "complete", remainingMs: 0, endsAt: null };
}

export function parsePrayerTimerState(value: string | null, minutes: number): PrayerTimerState {
  const initial = initialPrayerTimerState(minutes);
  if (!value) return initial;
  try {
    const parsed = JSON.parse(value) as Partial<PrayerTimerState>;
    if (parsed.durationMs !== initial.durationMs || !["running", "paused", "complete"].includes(parsed.status || "") || typeof parsed.remainingMs !== "number") return initial;
    const state = parsed as PrayerTimerState;
    if (state.status === "running" && typeof state.endsAt !== "number") return initial;
    if (!Number.isFinite(state.remainingMs) || state.remainingMs < 0 || state.remainingMs > state.durationMs) return initial;
    if (state.status === "complete") return completePrayerTimer(state);
    return state;
  } catch {
    return initial;
  }
}

const timerListeners = new Map<string, Set<() => void>>();
const timerMemory = new Map<string, string | null>();
const TIMER_EVENT = "photizo:prayer-timer-storage";

export function subscribePrayerTimer(key: string, callback: () => void) {
  const listeners = timerListeners.get(key) || new Set<() => void>();
  listeners.add(callback);
  timerListeners.set(key, listeners);
  const onStorage = (event: StorageEvent) => { if (event.key === key) callback(); };
  const onTimerEvent = (event: Event) => { if ((event as CustomEvent<string>).detail === key) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(TIMER_EVENT, onTimerEvent);
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) timerListeners.delete(key);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(TIMER_EVENT, onTimerEvent);
  };
}

export function getPrayerTimerSnapshot(key: string) {
  try {
    const value = window.localStorage.getItem(key);
    if (value !== null) timerMemory.set(key, value);
    return value ?? timerMemory.get(key) ?? null;
  } catch { return timerMemory.get(key) ?? null; }
}

export function savePrayerTimerSnapshot(key: string, state: PrayerTimerState | null) {
  const serialized = state ? JSON.stringify(state) : null;
  timerMemory.set(key, serialized);
  try {
    if (serialized) window.localStorage.setItem(key, serialized);
    else window.localStorage.removeItem(key);
  } catch { /* The in-memory interface remains usable without browser storage. */ }
  timerListeners.get(key)?.forEach((callback) => callback());
  window.dispatchEvent(new CustomEvent(TIMER_EVENT, { detail: key }));
}
