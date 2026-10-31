import { spawn } from "node:child_process";

export default async function globalSetup() {
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100" },
    stdio: "ignore",
    windowsHide: true,
  });

  try {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw new Error(`Production test server exited with code ${server.exitCode}.`);
      try {
        const response = await fetch("http://127.0.0.1:3100/");
        if (response.ok || response.status < 500) break;
      } catch { /* server is still starting */ }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    if (Date.now() >= deadline) throw new Error("Production test server did not become ready within 45 seconds.");
  } catch (error) {
    await stopServer(server);
    throw error;
  }

  return async () => stopServer(server);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill();
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
}
