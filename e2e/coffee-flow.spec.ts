import { expect, test } from "@playwright/test";

const mockUrl = "http://127.0.0.1:45217";

test.beforeEach(async ({ request }) => {
  await request.post(`${mockUrl}/__reset`);
});

test("calculator responds to coffee choices in the browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Know when your coffee is ready/i })).toBeVisible();

  await page.getByLabel("Roast date").fill("2026-09-01");
  const timeline = page.getByRole("img", { name: /Not ready/i });
  const washedWindow = await timeline.getAttribute("aria-label");
  await page.getByLabel("Process", { exact: true }).selectOption("natural");
  await expect.poll(() => timeline.getAttribute("aria-label")).not.toBe(washedWindow);

  await page.getByRole("link", { name: /Plan a date/i }).click();
  await expect(page).toHaveURL(/\/search$/);
});

test("a guest can save a coffee and start claiming the same data", async ({ page, request }) => {
  await page.goto("/coffee/new");
  await expect(page.getByRole("heading", { name: "Add a coffee" })).toBeVisible();

  await page.getByLabel("Coffee name").fill("CI Test Coffee");
  await page.getByLabel("Roaster").fill("Test Roaster");
  await page.getByLabel("Origin").fill("Ethiopia");
  await page.getByLabel("Roast date").fill("2026-09-01");
  await page.getByRole("button", { name: "Save coffee" }).click();
  await expect(page).toHaveURL(/\/coffee\/[0-9a-f-]{36}$/);
  await expect(page.getByText("CI Test Coffee")).toBeVisible();

  await page.goto("/coffee");
  const guestReminder = page.getByRole("region", { name: "Keep your coffees if you change devices" });
  await expect(guestReminder).toBeVisible();
  await expect(guestReminder.getByRole("link", { name: "Save my data" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await guestReminder.getByRole("button", { name: "Download JSON" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.json$/);

  await page.goto("/signup");
  await page.getByLabel("Email").fill("coffee-test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("A-strong-test-password-123");
  await page.getByLabel("Confirm password").fill("A-strong-test-password-123");
  await page.getByRole("button", { name: "Save my data" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  const state = await (await request.get(`${mockUrl}/__state`)).json();
  expect(state.pendingEmail).toBe("coffee-test@example.com");
  expect(state.coffees).toHaveLength(1);
  await page.goto("/coffee");
  await expect(page.getByText("CI Test Coffee")).toBeVisible();
});
