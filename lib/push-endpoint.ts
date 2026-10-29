const allowedPushHosts = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.services.mozilla.org",
  "web.push.apple.com",
  "notify.windows.com",
];

export function isTrustedPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && (!url.port || url.port === "443")
      && allowedPushHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}
