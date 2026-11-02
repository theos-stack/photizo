import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import test from "node:test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("WhatsApp preference migration preserves member records and adds an optional timestamp", async () => {
  const database = new PGlite();
  try {
    await database.exec(`
      create table public.member_profiles (
        id uuid primary key,
        display_name text not null
      );
      insert into public.member_profiles(id, display_name)
      values ('00000000-0000-0000-0000-000000000001', 'Existing member');
    `);
    const migration = await readFile(path.join(projectRoot, "supabase/migrations/202611020001_whatsapp_community_preference.sql"), "utf8");
    await database.exec(migration);

    const beforeConfirmation = await database.query("select id, display_name, whatsapp_community_joined_at from public.member_profiles");
    assert.equal(beforeConfirmation.rows.length, 1);
    assert.equal(beforeConfirmation.rows[0].display_name, "Existing member");
    assert.equal(beforeConfirmation.rows[0].whatsapp_community_joined_at, null);

    await database.exec("update public.member_profiles set whatsapp_community_joined_at = now() where id = '00000000-0000-0000-0000-000000000001'");
    const afterConfirmation = await database.query("select whatsapp_community_joined_at from public.member_profiles");
    assert.ok(afterConfirmation.rows[0].whatsapp_community_joined_at);
  } finally {
    await database.close();
  }
});
