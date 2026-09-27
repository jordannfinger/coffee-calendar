import { beforeEach, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), signInAnonymously: vi.fn() }));
vi.mock("./client", () => ({ createClient: () => ({ auth }) }));
import { ensureSession, waitForSessionInitialization } from "./ensureSession";

beforeEach(() => { vi.resetAllMocks(); });

it.each([true, false])("preserves an existing session on retryable validation failure (guest=%s)", async (isAnonymous) => {
  auth.getSession.mockResolvedValue({ data: { session: { user: { id: "existing", is_anonymous: isAnonymous } } }, error: null });
  auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Temporary auth outage") });
  await expect(ensureSession()).rejects.toThrow("Temporary auth outage");
  expect(auth.signInAnonymously).not.toHaveBeenCalled();
});

it("does not create a guest when reading the stored session fails", async () => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error("Refresh failed") });
  await expect(ensureSession()).rejects.toThrow("Refresh failed");
  expect(auth.signInAnonymously).not.toHaveBeenCalled();
});

it("shares one pending guest signup across concurrent consumers", async () => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  const signup = Promise.withResolvers<{ data: { user: { id: string } }; error: null }>();
  auth.signInAnonymously.mockReturnValue(signup.promise);
  const first = ensureSession();
  const second = ensureSession();
  expect(first).toBe(second);
  await vi.waitFor(() => expect(auth.signInAnonymously).toHaveBeenCalledTimes(1));
  signup.resolve({ data: { user: { id: "guest" } }, error: null });
  expect(await Promise.all([first, second])).toEqual([{ id: "guest" }, { id: "guest" }]);
});

it("allows a failed initialization to be retried without replacing a valid user", async () => {
  auth.getSession.mockResolvedValue({ data: { session: { user: { id: "owner" } } }, error: null });
  auth.getUser.mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce({ data: { user: { id: "owner" } }, error: null });
  await expect(ensureSession()).rejects.toThrow("Offline");
  await expect(ensureSession()).resolves.toEqual({ id: "owner" });
  expect(auth.signInAnonymously).not.toHaveBeenCalled();
});

it.each([false, true])("waits for pending startup before intentional login, including failure=%s", async (fails) => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  const signup = Promise.withResolvers<{ data: { user: { id: string } }; error: null }>();
  auth.signInAnonymously.mockReturnValue(signup.promise);
  const startup = ensureSession().catch(() => undefined);
  const login = vi.fn();
  const signingIn = waitForSessionInitialization().then(login);
  await vi.waitFor(() => expect(auth.signInAnonymously).toHaveBeenCalledTimes(1));
  expect(login).not.toHaveBeenCalled();
  if (fails) signup.reject(new Error("Offline"));
  else signup.resolve({ data: { user: { id: "guest" } }, error: null });
  await Promise.all([startup, signingIn]);
  expect(login).toHaveBeenCalledTimes(1);
});

it("does not start a new guest just to allow intentional login", async () => {
  await waitForSessionInitialization();
  expect(auth.getSession).not.toHaveBeenCalled();
  expect(auth.signInAnonymously).not.toHaveBeenCalled();
});
