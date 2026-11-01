import { expect, test } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

declare global {
  interface Window {
    renderPrayerAchievementPng: (input: { name: string; day: number; completedDays: number; streak: number; format: "portrait" | "square" }) => Promise<Blob>;
  }
}

test("renders sharp square and story achievement PNGs for key journey days", async ({ page }, testInfo) => {
  const sourcePath = path.resolve("lib/prayer-achievements.ts");
  const source = await readFile(sourcePath, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  await page.setContent("<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head><body style='margin:0;background:#12291e;display:grid;place-items:center;min-height:100vh;padding:32px;box-sizing:border-box'><img id='artwork' alt='PHOTIZO prayer streak achievement' style='display:block;max-width:min(560px,90vw);max-height:calc(100vh - 64px);object-fit:contain;box-shadow:0 20px 70px #0008'></body></html>");
  await page.addScriptTag({ content: `var module={exports:{}};var exports=module.exports;${javascript};window.renderPrayerAchievementPng=module.exports.renderPrayerAchievementPng;` });

  const samples = [
    { name: "day-01-portrait", day: 1, completedDays: 1, streak: 1, format: "portrait" as const, expectedHeight: 1920 },
    { name: "day-15-square", day: 15, completedDays: 11, streak: 3, format: "square" as const, displayName: "A Name That Wraps Elegantly Across the Artwork", expectedHeight: 1080 },
    { name: "day-30-portrait", day: 30, completedDays: 30, streak: 22, format: "portrait" as const, expectedHeight: 1920 },
  ];

  for (const sample of samples) {
    const output = await page.evaluate(async (input) => {
      const blob = await window.renderPrayerAchievementPng({
        name: input.displayName || "Prayer Partner",
        day: input.day,
        completedDays: input.completedDays,
        streak: input.streak,
        format: input.format,
      });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read generated PNG."));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      const image = document.querySelector<HTMLImageElement>("#artwork");
      if (!image) throw new Error("Artwork preview element is missing.");
      image.src = dataUrl;
      await image.decode();
      return { dataUrl, width: image.naturalWidth, height: image.naturalHeight, size: blob.size, type: blob.type };
    }, sample);

    expect(output.type).toBe("image/png");
    expect(output.width).toBe(1080);
    expect(output.height).toBe(sample.expectedHeight);
    expect(output.size).toBeGreaterThan(20_000);

    const pngPath = testInfo.outputPath(`${sample.name}.png`);
    await mkdir(path.dirname(pngPath), { recursive: true });
    await writeFile(pngPath, Buffer.from(output.dataUrl.split(",")[1], "base64"));
    await page.locator("#artwork").screenshot({ path: testInfo.outputPath(`${sample.name}-screenshot.png`) });
  }
});
