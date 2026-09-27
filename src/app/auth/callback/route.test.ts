import { beforeEach, expect, it, vi } from "vitest";

const exchange = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }) }));
import { GET } from "./route";

beforeEach(() => { exchange.mockReset().mockResolvedValue({ error: null }); });

it.each(["@evil.example", ".evil.example", "//evil.example", "https://evil.example", "/\\evil.example", "http://[", "javascript:alert(1)"])("rejects unsafe destination %s", async (next) => {
  const response = await GET(new Request(`https://coffee.example/auth/callback?code=test&next=${encodeURIComponent(next)}`));
  expect(response.headers.get("location")).toBe("https://coffee.example/today");
});

it("preserves an internal path and query", async () => {
  const response = await GET(new Request("https://coffee.example/auth/callback?code=test&next=%2Fcoffee%3Fsort%3Ddate"));
  expect(response.headers.get("location")).toBe("https://coffee.example/coffee?sort=date");
});

it("does not follow next when code exchange fails", async () => {
  exchange.mockResolvedValue({ error: new Error("Expired code") });
  const response = await GET(new Request("https://coffee.example/auth/callback?code=test&next=%2Fcoffee"));
  expect(response.headers.get("location")).toBe("https://coffee.example/login?error=auth_callback_failed");
});
