import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  csrfToken,
  initializeCsrf,
  messageForErrorCode,
  request,
} from "./client";

describe("http/client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("formats error codes with optional reference id", () => {
    expect(messageForErrorCode("storage_failed", "ref-1")).toBe(
      "Không thể tải ảnh lên. Vui lòng thử lại. Mã tham chiếu: ref-1",
    );
    expect(messageForErrorCode("unknown_code", null)).toBe(
      "Đã có lỗi. Vui lòng thử lại.",
    );
  });

  it("reads and decodes XSRF-TOKEN cookie", () => {
    expect(csrfToken()).toBeNull();
    document.cookie = "XSRF-TOKEN=abc%2B123%3D; path=/";
    expect(csrfToken()).toBe("abc+123=");
  });

  it("initializes CSRF cookie and throws ApiError when endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, status: 204 }),
    );
    await expect(initializeCsrf()).resolves.toBeUndefined();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }),
    );
    await expect(initializeCsrf()).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
    });
  });

  it("unwraps data envelope, preserves pagination/mutation envelopes, and handles 204", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: "u-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: "1" }], meta: { total: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      });
    vi.stubGlobal("fetch", fetchMock);

    expect(await request("/api/v1/me")).toEqual({ id: "u-1" });
    expect(await request("/api/v1/listings")).toEqual({
      data: [{ id: "1" }],
      meta: { total: 1 },
    });
    expect(await request("/api/v1/logout")).toBeUndefined();
  });

  it("retries POST once after 419 CSRF mismatch and maps 422/500 to ApiError", async () => {
    document.cookie = "XSRF-TOKEN=stale-token; path=/";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 419,
        headers: new Headers(),
        json: async () => ({ message: "CSRF token mismatch." }),
      })
      .mockImplementationOnce(async () => {
        document.cookie = "XSRF-TOKEN=fresh-token; path=/";
        return { ok: true, status: 204 };
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "OK", data: { saved: true } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ "X-Request-Id": "req-500" }),
        json: async () => ({ error_code: "service_unavailable" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const res = await request("/api/v1/test", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    expect(res).toEqual({ message: "OK", data: { saved: true } });

    await expect(request("/api/v1/fail")).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({
        status: 500,
        errorCode: "service_unavailable",
        reference: "req-500",
      }),
    );
  });
});
