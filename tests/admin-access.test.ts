import assert from "node:assert/strict";
import test from "node:test";

import { findAdminRecord, resolveAdminRole } from "../lib/admin-access-core.ts";

test("admin lookup falls back to the user's RLS-scoped client after service lookup errors", async () => {
  const expected = { email: "sam@photizonetwork.com", role: "admin" };
  let fallbackCalled = false;

  const record = await findAdminRecord<typeof expected>([
    async () => ({ data: null, error: { code: "INVALID_SERVICE_KEY" } }),
    async () => {
      fallbackCalled = true;
      return { data: expected };
    },
  ]);

  assert.equal(fallbackCalled, true);
  assert.deepEqual(record, expected);
});

test("a missing row remains denied after both lookups return no record", async () => {
  const record = await findAdminRecord([
    async () => ({ data: null }),
    async () => ({ data: null }),
  ]);

  assert.equal(record, null);
});

test("only existing admin roles pass; bootstrap access remains explicitly configured", () => {
  assert.equal(resolveAdminRole("admin", false), "admin");
  assert.equal(resolveAdminRole("super_admin", false), "super_admin");
  assert.equal(resolveAdminRole("viewer", false), null);
  assert.equal(resolveAdminRole(null, false), null);
  assert.equal(resolveAdminRole("viewer", true), "super_admin");
});
