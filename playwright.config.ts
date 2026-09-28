import { defineConfig, devices } from "@playwright/test";

const mockUrl = "http://127.0.0.1:45217";
const appUrl = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: appUrl,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node e2e/mock-supabase.mjs",
      url: `${mockUrl}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run build && npm run start -- -p 3100",
      url: appUrl,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: mockUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-placeholder-key",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
