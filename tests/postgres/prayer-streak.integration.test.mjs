import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import test from "node:test";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function findBinary(name) {
  const binaryName = process.platform === "win32" && !name.toLowerCase().endsWith(".exe") ? `${name}.exe` : name;
  const found = (process.env.PATH || "").split(path.delimiter).filter(Boolean)
    .map((entry) => path.join(entry, binaryName)).find(existsSync);
  if (found) return found;
  try { return execFileSync(process.platform === "win32" ? "where.exe" : "which", [binaryName], { encoding: "utf8" }).split(/\r?\n/).find(Boolean); }
  catch { return null; }
}

function run(binary, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, ...options });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => code === 0
      ? resolve({ stdout, stderr })
      : reject(new Error(`${path.basename(binary)} exited ${code}: ${stderr || stdout}`)));
  });
}

function executableSql(source) {
  return source.split(/\r?\n/).filter((line) => !line.trimStart().startsWith("\\set ")).join("\n");
}

test("prayer streak migration, RLS, lifecycle, correction audit, and concurrent check-ins on disposable PostgreSQL", async (t) => {
  const psql = findBinary("psql");
  const database = new PGlite({ extensions: { pgcrypto } });
  const socket = new PGLiteSocketServer({ db: database, port: 0, host: "127.0.0.1", maxConnections: 4 });
  let socketStarted = false;

  try {
    await database.waitReady;
    const bootstrap = await readFile(path.join(projectRoot, "tests/postgres/bootstrap.sql"), "utf8");
    const migration = await readFile(path.join(projectRoot, "supabase/migrations/202610290001_prayer_streak.sql"), "utf8");
    const rpcHardening = await readFile(path.join(projectRoot, "supabase/migrations/202610290002_harden_prayer_rpc_grants.sql"), "utf8");
    const campaignSchedule = await readFile(path.join(projectRoot, "supabase/migrations/202610310001_campaign_schedule.sql"), "utf8");
    const grants = await readFile(path.join(projectRoot, "tests/postgres/grant-test-access.sql"), "utf8");
    const integration = await readFile(path.join(projectRoot, "tests/postgres/prayer-streak.integration.sql"), "utf8");
    const campaignIntegration = await readFile(path.join(projectRoot, "tests/postgres/prayer-campaign.integration.sql"), "utf8");
    await database.exec(executableSql(bootstrap));
    await database.exec(migration);
    await database.exec(rpcHardening);
    await database.exec(campaignSchedule);
    await database.exec(grants);
    // Keep the existing lifecycle fixtures on the legacy per-enrollment clock.
    await database.exec("update public.prayer_challenges set starts_at=null where slug='30-day-prayer-streak';");
    const rpcAccess = await database.query(`
      select
        has_function_privilege('anon', 'public.enroll_prayer_member(uuid)', 'execute') as anon_enroll,
        has_function_privilege('anon', 'public.checkin_prayer(uuid)', 'execute') as anon_checkin,
        has_function_privilege('authenticated', 'public.enroll_prayer_member(uuid)', 'execute') as member_enroll,
        has_function_privilege('authenticated', 'public.checkin_prayer(uuid)', 'execute') as member_checkin,
        has_function_privilege('authenticated', 'public.admin_correct_prayer_checkin(uuid,date,text,text)', 'execute') as member_admin_correction,
        has_function_privilege('service_role', 'public.admin_correct_prayer_checkin(uuid,date,text,text)', 'execute') as service_admin_correction
    `);
    assert.deepEqual(rpcAccess.rows[0], {
      anon_enroll: false,
      anon_checkin: false,
      member_enroll: true,
      member_checkin: true,
      member_admin_correction: false,
      service_admin_correction: true,
    });
    await database.exec(executableSql(integration));
    await database.exec(executableSql(campaignIntegration));

    if (!psql) {
      t.diagnostic("Database migration and RLS integration passed. Concurrent socket checks skipped because the psql client is unavailable.");
      return;
    }

    await socket.start();
    socketStarted = true;
    const [host, port] = socket.getServerConn().split(":");
    const concurrentCheckin = (memberId, email) => {
      const sql = `begin;
set local role authenticated;
set local request.jwt.claim.sub='${memberId}';
set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"sub":"${memberId}","email":"${email}","role":"authenticated"}';
select public.checkin_prayer((select id from public.prayer_enrollments where member_id='${memberId}'));
commit;`;
      return run(psql, ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-h", host, "-p", port, "-U", "postgres", "-d", "postgres", "-c", sql], {
        cwd: projectRoot,
        env: { ...process.env, PGSSLMODE: "disable" },
      });
    };
    const concurrent = await Promise.all([
      concurrentCheckin("00000000-0000-0000-0000-000000000002", "member-b@test.invalid"),
      concurrentCheckin("00000000-0000-0000-0000-000000000002", "member-b@test.invalid"),
    ]);
    const results = concurrent.map(({ stdout }) => {
      const jsonLine = stdout.split(/\r?\n/).find((line) => line.trim().startsWith("{"));
      assert.ok(jsonLine, `Expected JSON check-in result, received: ${stdout}`);
      return JSON.parse(jsonLine);
    });
    assert.deepEqual(results.map((result) => result.already_checked_in).sort(), [false, true]);

    await database.exec(`do $$
declare v_enrollment public.prayer_enrollments;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002';
  if (select count(*) from public.prayer_checkins where enrollment_id=v_enrollment.id and local_date=(now() at time zone v_enrollment.enrollment_timezone)::date)<>1 then raise exception 'Concurrent check-ins created more than one row'; end if;
  if v_enrollment.total_completed_days<>1 or v_enrollment.current_streak<>1 or v_enrollment.missed_days<>5 then raise exception 'Concurrent check-in statistics are incorrect'; end if;
end $$;`);

    await database.exec(`begin;
set local role service_role;
set local request.jwt.claim.role='service_role';
set local request.jwt.claims='{"role":"service_role"}';
select public.admin_correct_prayer_checkin((select id from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002'),(select start_local_date+3 from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002'),'missed day correction test','admin@test.invalid');
commit;`);
    await database.exec(`begin;
set local role service_role;
set local request.jwt.claim.role='service_role';
set local request.jwt.claims='{"role":"service_role"}';
do $$
declare v_enrollment public.prayer_enrollments; v_audit_count integer;
begin
  select * into v_enrollment from public.prayer_enrollments where member_id='00000000-0000-0000-0000-000000000002';
  if v_enrollment.total_completed_days<>2 or v_enrollment.current_streak<>1 or v_enrollment.longest_streak<>1 or v_enrollment.missed_days<>4 then raise exception 'Missed-day streak and progress metrics are incorrect'; end if;
  select count(*) into v_audit_count from public.prayer_admin_audit where enrollment_id=v_enrollment.id;
  begin
    perform public.admin_correct_prayer_checkin(v_enrollment.id,v_enrollment.start_local_date+3,'duplicate correction test','admin@test.invalid');
    raise exception 'Duplicate correction unexpectedly succeeded';
  exception when unique_violation then null;
  end;
  if (select count(*) from public.prayer_admin_audit where enrollment_id=v_enrollment.id)<>v_audit_count then raise exception 'Duplicate correction produced an audit row'; end if;
end $$;
commit;`);
  } finally {
    if (socketStarted) await socket.stop().catch(() => {});
    await database.close().catch(() => {});
  }
});
