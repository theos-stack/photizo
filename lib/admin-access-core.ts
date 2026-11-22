import type { AdminRole } from "./types";

export type AdminLookupResult<T> = {
  data: T | null;
  error?: unknown;
};

export type AdminLookup = () => Promise<AdminLookupResult<unknown>>;

/** Tries the configured service client first, then the session-scoped client. */
export async function findAdminRecord<T>(lookups: readonly AdminLookup[]) {
  for (const lookup of lookups) {
    try {
      const result = await lookup();
      if (result.data) {
        return result.data as T;
      }
    } catch {
      // A failed service lookup must not prevent the RLS-scoped lookup.
    }
  }

  return null;
}

export function resolveAdminRole(recordRole: unknown, isBootstrapSuperAdmin: boolean): AdminRole | null {
  if (isBootstrapSuperAdmin) {
    return "super_admin";
  }

  if (recordRole === "super_admin") {
    return "super_admin";
  }

  return recordRole === "admin" ? "admin" : null;
}
