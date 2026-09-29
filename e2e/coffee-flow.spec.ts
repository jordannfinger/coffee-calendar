import { expect, test } from "@playwright/test";

const mockUrl = "http://127.0.0.1:45217";

test.beforeEach(async ({ request }) => {
  await request.post(`${mockUrl}/__reset`);
});

test("calculator responds to coffee choices in the browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your best cup has its day/i })).toBeVisible();

  await page.getByLabel("Roast date").fill("2026-09-01");
  const timeline = page.getByRole("img", { name: /Not ready/i });
  const washedWindow = await timeline.getAttribute("aria-label");
  await page.getByLabel("Process", { exact: true }).selectOption("natural");
  await expect.poll(() => timeline.getAttribute("aria-label")).not.toBe(washedWindow);

  await page.getByRole("link", { name: /Plan a date/i }).click();
  await expect(page).toHaveURL(/\/search$/);
});

test("a guest can claim an account without losing the saved coffee", async ({ page, request }) => {
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
  await guestReminder.getByRole("button", { name: "Download backup" }).click();
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
  expect(state.coffees[0].user_id).toBe(state.userId);
  expect(state.verificationUrl).toBeTruthy();
  await page.goto("/coffee");
  await expect(page.getByText("CI Test Coffee")).toBeVisible();

  await page.goto(state.verificationUrl);
  await expect(page).toHaveURL(/\/today$/);
  await page.goto("/coffee");
  await expect(page.getByText("CI Test Coffee")).toBeVisible();
  await expect(guestReminder).not.toBeVisible();
  const claimed = await (await request.get(`${mockUrl}/__state`)).json();
  expect(claimed.userId).toBe(state.userId);
  expect(claimed.email).toBe("coffee-test@example.com");
  expect(claimed.anonymous).toBe(false);
  expect(claimed.pendingEmail).toBeNull();
  expect(claimed.coffees[0].user_id).toBe(state.userId);
});

test("a guest can restore a JSON export without duplicating it on retry", async ({ page, request }) => {
  const { userId } = await (await request.get(`${mockUrl}/__state`)).json();
  const exportRow = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", user_id: userId,
    name: "Restored Coffee", roaster: "Test Roaster", origin: "Ethiopia",
    roast_date: "2026-09-01", process: "washed", roast_level: "light",
    share_token: "never-reuse-this-link", notes: "A private note",
  };
  await page.goto("/coffee");
  const file = { name: "coffee-calendar-export.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify([exportRow])) };
  await page.getByLabel("JSON backup or export").setInputFiles(file);
  await expect(page.getByText("Ready to add from coffee-calendar-export.json")).toBeVisible();
  expect((await (await request.get(`${mockUrl}/__state`)).json()).coffees).toHaveLength(0);
  await page.getByRole("button", { name: "Import 1 coffee and 0 brews" }).click();
  await expect(page.getByRole("status")).toContainText("1 coffee and 0 brews imported; 0 coffees and 0 brews already present");
  await expect(page.getByText("Restored Coffee")).toBeVisible();
  await page.getByLabel("JSON backup or export").setInputFiles(file);
  await page.getByRole("button", { name: "Import 1 coffee and 0 brews" }).click();
  await expect(page.getByRole("status")).toContainText("0 coffees and 0 brews imported; 1 coffee and 0 brews already present");
  expect((await (await request.get(`${mockUrl}/__state`)).json()).coffees).toHaveLength(1);
});

test("a full backup restores brew history to its coffee and is safe to retry", async ({ page, request }) => {
  await page.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      (window as Window & { lastBackupBlobUrl?: string }).lastBackupBlobUrl = url;
      return url;
    };
  });
  const { userId } = await (await request.get(`${mockUrl}/__state`)).json();
  const coffeeId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const brewId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await request.post(`${mockUrl}/rest/v1/coffees`, { data: {
    id: coffeeId, user_id: userId, name: "History Coffee", roaster: "Test Roaster", origin: "Kenya",
    roast_date: "2026-09-01", process: "washed", roast_level: "light", remaining_percent: 50,
  } });
  await request.post(`${mockUrl}/rest/v1/brew_logs`, { data: {
    id: brewId, coffee_id: coffeeId, user_id: userId, brewed_at: "2026-09-03",
    brew_method: "V60", dose_g: 18, water_g: 300, notes: "Sweet cup", locked: true,
  } });
  await page.goto("/coffee");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).first().click();
  const downloaded = await download;
  expect(downloaded.suggestedFilename()).toMatch(/\.json$/);
  // Inspect the same Blob that backs the browser download. Chromium on this
  // Windows runner can emit the download event without resolving download.path().
  const backup = Buffer.from(await page.evaluate(async () => {
    const url = (window as Window & { lastBackupBlobUrl?: string }).lastBackupBlobUrl;
    if (!url) throw new Error("No backup Blob URL was created");
    return await (await fetch(url)).text();
  }));
  const contents = JSON.parse(backup.toString());
  expect(contents.version).toBe(2);
  expect(contents.coffees).toHaveLength(1);
  expect(contents.brew_logs).toHaveLength(1);
  expect(contents.coffees[0]).not.toHaveProperty("share_token");

  await request.post(`${mockUrl}/__reset`);
  await page.goto("/coffee");
  const file = { name: "coffee-calendar-backup.json", mimeType: "application/json", buffer: backup };
  await page.getByLabel("JSON backup or export").setInputFiles(file);
  await page.getByRole("button", { name: "Import 1 coffee and 1 brew" }).click();
  await expect(page.getByRole("status")).toContainText("1 coffee and 1 brew imported");
  const restored = await (await request.get(`${mockUrl}/__state`)).json();
  expect(restored.coffees).toHaveLength(1);
  expect(restored.brewLogs).toHaveLength(1);
  expect(restored.brewLogs[0].coffee_id).toBe(restored.coffees[0].id);
  expect(restored.brewLogs[0].notes).toBe("Sweet cup");

  await page.getByLabel("JSON backup or export").setInputFiles(file);
  await page.getByRole("button", { name: "Import 1 coffee and 1 brew" }).click();
  await expect(page.getByRole("status")).toContainText("0 coffees and 0 brews imported");
  const again = await (await request.get(`${mockUrl}/__state`)).json();
  expect(again.coffees).toHaveLength(1);
  expect(again.brewLogs).toHaveLength(1);
});
