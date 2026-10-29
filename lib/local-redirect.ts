export function getSafeLocalRedirect(value: string | null | undefined, origin: string, fallback = "/streak") {
  try {
    const base = new URL(origin);
    const destination = new URL(value || fallback, base);
    if (destination.origin !== base.origin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
