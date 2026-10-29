import { expect, test } from "@playwright/test";

test("public pages and prayer challenge render without backend credentials", async ({ page }) => {
  for (const route of ["/", "/about", "/teachings", "/programs", "/prayer-streak"]) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} response`).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  }

  await page.goto("/prayer-streak");
  await expect(page.getByRole("heading", { name: /30 days\. 10 minutes/i })).toBeVisible();
});

test("member auth forms render and report missing configuration without exposing a session", async ({ page }) => {
  await page.goto("/streak/login?next=%2Fstreak%2Fsettings");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);

  await page.goto("/streak/register");
  await expect(page.getByRole("heading", { name: "Create your member account" })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();

  await page.goto("/streak/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
});

test("protected member dashboard redirects unauthenticated visitors to member login", async ({ page }) => {
  await page.goto("/streak");
  await expect(page).toHaveURL(/\/streak\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("PWA manifest is served as valid JSON", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toContain("PHOTIZO");
  expect(manifest.start_url).toBe("/");
});
