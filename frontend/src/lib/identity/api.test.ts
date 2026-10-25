import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, onSessionFailure, readXsrfCookie } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
});
describe("browser API boundary", () => {
  it("sends credentials and only the decoded XSRF cookie as the CSRF header", async () => {
    document.cookie = "XSRF-TOKEN=encoded%3Dvalue; path=/";
    document.cookie = "irrelevant=private; path=/";
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await api("/api/v1/profile", { method: "PATCH", body: { name: "Hien" } });
    expect(readXsrfCookie()).toBe("encoded=value");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/profile",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
        headers: expect.objectContaining({ "X-XSRF-TOKEN": "encoded=value" }),
      }),
    );
    expect(fetch.mock.calls[0][1].headers.Cookie).toBeUndefined();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
  it("reports 419 without retrying or replaying a write", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ message: "CSRF mismatch" }, { status: 419 }),
      );
    vi.stubGlobal("fetch", fetch);
    const listener = vi.fn();
    const unsubscribe = onSessionFailure(listener);
    await expect(
      api("/api/v1/profile", { method: "PATCH", body: { name: "draft" } }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledWith(419);
    expect(fetch).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
  it("preserves server field errors and does not retry an ambiguous network failure", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { errors: { email: ["Invalid email"] } },
          { status: 422 },
        ),
      )
      .mockRejectedValueOnce(new TypeError("network"));
    vi.stubGlobal("fetch", fetch);
    await expect(api("/register", { method: "POST" })).rejects.toMatchObject({
      status: 422,
      errors: { email: ["Invalid email"] },
    });
    await expect(
      api("/api/v1/account/api-tokens", { method: "POST" }),
    ).rejects.toThrow("network");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
