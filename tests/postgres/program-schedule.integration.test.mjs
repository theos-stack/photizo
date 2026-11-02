import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import test from "node:test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("programme end schedule migration preserves existing programme records", async () => {
  const database = new PGlite();
  try {
    await database.exec(`
      create table public.programs (
        id uuid primary key,
        title text not null,
        date date,
        time text,
        status text default 'draft'
      );
      insert into public.programs(id,title,date,time,status)
      values ('00000000-0000-0000-0000-000000000001','Past programme','2026-05-30','9:00 AM','published');
    `);

    const migration = await readFile(path.join(projectRoot, "supabase/migrations/202611020002_program_schedule_endpoints.sql"), "utf8");
    await database.exec(migration);

    const rows = await database.query("select id, title, end_date, end_time from public.programs");
    assert.equal(rows.rows.length, 1);
    assert.equal(rows.rows[0].title, "Past programme");
    assert.equal(rows.rows[0].end_date, null);
    assert.equal(rows.rows[0].end_time, null);

    await database.exec("insert into public.programs(id,title,date,time,end_date,end_time,status) values ('00000000-0000-0000-0000-000000000002','Upcoming','2026-11-03','9:00 AM','2026-11-03','11:00 AM','published')");
    await assert.rejects(database.exec("insert into public.programs(id,title,date,time,end_date,status) values ('00000000-0000-0000-0000-000000000003','Incomplete','2026-11-03','9:00 AM','2026-11-03','published')"));
  } finally {
    await database.close();
  }
});
