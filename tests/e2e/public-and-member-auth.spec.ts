import { expect, test } from "@playwright/test";

test("public pages and prayer challenge render without backend credentials", async ({ page }) => {
  for (const route of ["/", "/about", "/teachings", "/programs", "/prayer-streak"]) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} response`).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  }

  await page.goto("/prayer-streak");
  await expect(page.getByRole("heading", { name: /A Deeper Prayer Life Begins With One Day/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Join the Prayer Challenge/i }).first()).toHaveAttribute("href", "/streak/register");
  await expect(page.getByRole("heading", { name: "A simple rhythm. Your own pace." })).toBeVisible();
});

test("homepage promotes the public challenge and desktop navigation exposes it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A Deeper Prayer Life Begins With One Day/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "30-Day Prayer Challenge" })).toHaveAttribute("href", "/prayer-streak");
  await expect(page.getByRole("link", { name: "Prayer Challenge" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Join the Prayer Challenge" }).first()).toHaveAttribute("href", "/prayer-streak");
  await expect(page.getByRole("link", { name: "Join Challenge" }).first()).toBeVisible();
});

test("mobile navigation opens with sign-in and challenge actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.locator("#mobile-navigation");
  await expect(mobileNavigation.getByRole("link", { name: "Prayer Challenge" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Join Challenge" })).toBeVisible();
});

test("desktop and mobile challenge and authentication layouts are captured for visual review", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/photizo-home-desktop-viewport.png" });
  await page.screenshot({ path: "test-results/photizo-home-desktop-1440.png", fullPage: true });
  await page.goto("/prayer-streak");
  await page.screenshot({ path: "test-results/photizo-challenge-desktop-viewport.png" });
  await page.screenshot({ path: "test-results/photizo-challenge-desktop-1440.png", fullPage: true });
  await page.goto("/streak/register");
  await page.screenshot({ path: "test-results/photizo-register-desktop-viewport.png" });
  await page.screenshot({ path: "test-results/photizo-register-desktop-1440.png", fullPage: true });
  await page.goto("/streak/login");
  await page.screenshot({ path: "test-results/photizo-login-desktop-1440.png" });
  await page.goto("/streak/forgot-password");
  await page.screenshot({ path: "test-results/photizo-forgot-password-desktop-1440.png" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/photizo-home-mobile-viewport.png" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.screenshot({ path: "test-results/photizo-navigation-mobile-390.png" });
  await page.getByRole("button", { name: "Close navigation" }).click();
  await page.screenshot({ path: "test-results/photizo-home-mobile-390.png", fullPage: true });
  await page.goto("/prayer-streak");
  await page.screenshot({ path: "test-results/photizo-challenge-mobile-viewport.png" });
  await page.screenshot({ path: "test-results/photizo-challenge-mobile-390.png", fullPage: true });
  await page.goto("/streak/register");
  await page.screenshot({ path: "test-results/photizo-register-mobile-viewport.png" });
  await page.screenshot({ path: "test-results/photizo-register-mobile-390.png", fullPage: true });
  await page.goto("/streak/login");
  await page.screenshot({ path: "test-results/photizo-login-mobile-390.png" });
  await page.goto("/streak/forgot-password");
  await page.screenshot({ path: "test-results/photizo-forgot-password-mobile-390.png" });
});

test("member auth forms render and report missing configuration without exposing a session", async ({ page }) => {
  await page.goto("/streak/login?next=%2Fstreak%2Fsettings");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show password" })).toBeVisible();

  await page.goto("/streak/register");
  await expect(page.getByRole("heading", { name: "Create your prayer account" })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();

  await page.goto("/streak/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
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
