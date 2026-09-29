import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const mockUrl = "http://127.0.0.1:45217";
const screenshots = join("test-results", "visual");
const coffeeId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const routes = ["/", "/today", "/calendar", "/coffee", "/search", "/coffee/new", `/coffee/${coffeeId}`, "/about", "/login", "/signup"];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

test.beforeEach(async ({ request }) => {
  await request.post(`${mockUrl}/__reset`);
  const { userId } = await (await request.get(`${mockUrl}/__state`)).json();
  await request.post(`${mockUrl}/rest/v1/coffees`, { data: [
    { id: coffeeId, user_id: userId, name: "Kayanza Lot 12", roaster: "Daybreak Roasters", origin: "Burundi", roast_date: daysAgo(15), process: "washed", roast_level: "light", remaining_percent: 70 },
    { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", user_id: userId, name: "Las Flores", roaster: "Neighbourhood", origin: "Colombia", roast_date: daysAgo(8), process: "natural", roast_level: "light", remaining_percent: 90 },
    { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", user_id: userId, name: "Gondo Station", roaster: "Small Batch", origin: "Kenya", roast_date: daysAgo(2), process: "washed", roast_level: "medium", remaining_percent: 100 },
  ] });
});

test("calendar date selection and month navigation work with a keyboard", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  const today = page.locator('button[aria-pressed="true"][id^="day-"]');
  await expect(today).toHaveCount(1);
  await today.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('button[aria-pressed="true"][id^="day-"]')).toHaveCount(1);
  const firstDay = page.locator('button[id^="day-"]').first();
  const firstId = await firstDay.getAttribute("id");
  await firstDay.focus();
  await page.keyboard.press("ArrowLeft");
  const previousMonthDay = page.locator('button[aria-pressed="true"][id^="day-"]');
  await expect(previousMonthDay).toBeFocused();
  expect(await previousMonthDay.getAttribute("id")).not.toBe(firstId);
  await page.getByRole("button", { name: "Next month" }).click();
  await page.getByRole("button", { name: "Next month" }).click();
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.getByRole("button", { name: "Today", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("link", { name: /Kayanza Lot 12/ })).toBeVisible();
});

test("mobile navigation opens, closes, and returns focus on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("landing film loads, the calculator stays reachable, and reduced motion stops autoplay", async ({ page }) => {
  await page.goto("/");
  const film = page.locator("video");
  await expect(film).toHaveAttribute("poster", "/film/coffee-calendar-poster.jpg");
  await expect(film).toHaveAttribute("controls", "");
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.videoWidth)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Find your window" }).click();
  await expect(page.getByRole("heading", { name: "Drinking window calculator" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
});

test("optional coffee fields can be expanded without losing entered values", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/coffee/new");
  const origin = page.locator("details").filter({ has: page.locator("summary", { hasText: "Origin detail" }) });
  await expect(origin).not.toHaveAttribute("open", "");
  await origin.locator("summary").click();
  await page.getByLabel("Variety").fill("Bourbon");
  await origin.locator("summary").click();
  await expect(page.getByLabel("Variety")).toBeHidden();
  await origin.locator("summary").click();
  await expect(page.getByLabel("Variety")).toHaveValue("Bourbon");
});

test("a shared coffee reads clearly on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/rest/v1/rpc/get_shared_coffee", (route) => route.fulfill({
    status: 200,
    headers: { "access-control-allow-origin": "*", "content-type": "application/json" },
    body: JSON.stringify({
      name: "Kayanza Lot 12", roaster: "Daybreak Roasters", origin: "Burundi", roast_date: daysAgo(15),
      process: "washed", process_subtype: null, roast_level: "light", variety: "Bourbon",
    }),
  }));
  await page.goto("/c/preview-share");
  await expect(page.getByRole("heading", { name: "Kayanza Lot 12" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Drinking window" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: join(screenshots, "390-shared-coffee.png"), fullPage: true });
});

test("major screens have no document overflow on phone, tablet, or desktop", async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  for (const width of [320, 375, 390, 430, 768, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      if (([390, 1280].includes(width)) ||
        ([320, 768].includes(width) && ["/", "/calendar"].includes(route))) {
        const name = route === "/" ? "home" : route.startsWith("/coffee/") ? route === "/coffee/new" ? "new-coffee" : "coffee-detail" : route.slice(1);
        await page.screenshot({ path: join(screenshots, `${width}-${name}.png`), fullPage: true });
      }
    }
  }
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("core routes pass automated WCAG A and AA checks", async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      if (scheme === "dark" && ["/", "/calendar"].includes(route)) {
        await page.screenshot({ path: join(screenshots, `dark-${width}-${route === "/" ? "home" : "calendar"}.png`), fullPage: true });
      }
      await page.addScriptTag({ path: join(process.cwd(), "node_modules", "axe-core", "axe.min.js") });
      const violations = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (element: Element, options: unknown) => Promise<{ violations: Array<{ id: string; nodes: Array<{ target: string[] }> }> }> } }).axe;
        const result = await axe.run(document.documentElement, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
        return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target.join(" ")) }));
      });
      expect(violations, `${route} at ${width}px in ${scheme} mode`).toEqual([]);
      }
    }
  }
});
