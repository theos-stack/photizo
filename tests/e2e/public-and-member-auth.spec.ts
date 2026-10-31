import { expect, test } from "@playwright/test";

test("public prayer landing page is accessible without authentication", async ({ page }) => {
  const response = await page.goto("/streak");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /30 Days\./i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Create your PHOTIZO account/i })).toHaveAttribute("href", "/streak/register?next=%2Fstreak%2Fjoin");
  await expect(page.getByRole("link", { name: /Already a member\? Sign in/i })).toHaveAttribute("href", "/streak/login?next=%2Fstreak%2Fjoin");
  await expect(page.getByText(/Campaign starts:|Campaign start time is being confirmed/i)).toBeVisible();
  await expect(page.getByText(/reserve your place|confirming the campaign schedule/i).first()).toBeVisible();

  await page.goto("/prayer-streak");
  await expect(page).toHaveURL(/\/streak$/);
});

test("homepage links to the public challenge", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A Deeper Prayer Life Begins With One Day/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Join the Prayer Challenge/i }).first()).toHaveAttribute("href", "/streak");
  await expect(page.getByRole("link", { name: "Prayer Challenge" }).first()).toHaveAttribute("href", "/streak");
});

test("mobile navigation exposes the challenge", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.locator("#mobile-navigation");
  await expect(mobileNavigation.getByRole("link", { name: "Prayer Challenge" })).toHaveAttribute("href", "/streak");
  await expect(mobileNavigation.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("challenge and unified auth screenshots are captured for visual review", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/streak");
  await page.screenshot({ path: "test-results/photizo-challenge-desktop.png", fullPage: true });
  await page.goto("/streak/login?next=%2Fstreak%2Fjoin");
  await page.screenshot({ path: "test-results/photizo-auth-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/streak");
  await page.screenshot({ path: "test-results/photizo-challenge-mobile.png", fullPage: true });
  await page.goto("/streak/login?next=%2Fstreak%2Fjoin");
  await page.screenshot({ path: "test-results/photizo-auth-mobile.png", fullPage: true });
});

test("unified email authentication and password recovery render safely", async ({ page }) => {
  await page.goto("/streak/login?next=%2Fstreak%2Fjoin");
  await expect(page.getByRole("heading", { name: "Sign in to PHOTIZO" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue with Email" }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Password/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();

  await page.goto("/streak/register?next=%2Fstreak%2Fjoin");
  await expect(page.getByRole("heading", { name: "Sign in to PHOTIZO" })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();

  await page.goto("/streak/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
});

test("protected member routes redirect while public challenge stays open", async ({ page }) => {
  await page.goto("/streak");
  await expect(page).toHaveURL(/\/streak$/);
  await page.goto("/streak/dashboard");
  await expect(page).toHaveURL(/\/streak\/login\?next=/);
  await page.goto("/member");
  await expect(page).toHaveURL(/\/streak\/login\?next=%2Fmember/);
});

test("auth callback rejects missing and unsupported email tokens safely", async ({ request }) => {
  const missing = await request.get("/auth/callback", { maxRedirects: 0 });
  expect(missing.status()).toBe(307);
  expect(missing.headers().location).toContain("/streak/login?error=callback");
  expect(missing.headers().location).toContain("next=%2Fmember");

  const unsupported = await request.get("/auth/callback?token_hash=not-a-valid-token&type=google&next=https%3A%2F%2Fevil.example", { maxRedirects: 0 });
  expect(unsupported.status()).toBe(307);
  expect(unsupported.headers().location).toContain("error=verification");
  expect(unsupported.headers().location).toContain("next=%2Fmember");
});

test("PWA manifest is served as valid JSON", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toContain("PHOTIZO");
  expect(manifest.start_url).toBe("/");
});
