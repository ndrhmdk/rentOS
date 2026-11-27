import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, messageForErrorCode, request } from "./http/client";

describe("messageForErrorCode", () => {
  it("maps known codes and appends the reference", () => {
    expect(messageForErrorCode("storage_failed", "ref-1")).toBe(
      "Không thể tải ảnh lên. Vui lòng thử lại. Mã tham chiếu: ref-1",
    );
    expect(messageForErrorCode("unknown", "ref-2")).toContain(
      "Đã có lỗi. Vui lòng thử lại.",
    );
    expect(messageForErrorCode("unknown", "ref-2")).toContain("ref-2");
  });
});

describe("request 5xx parsing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds ApiError from error_code and reference", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Đã có lỗi. Vui lòng thử lại. Mã tham chiếu: ref-9",
            error_code: "storage_failed",
            reference: "ref-9",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "X-Request-Id": "ref-9",
            },
          },
        ),
      ),
    );

    await expect(request("/api/v1/example")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 500 &&
        error.errorCode === "storage_failed" &&
        error.reference === "ref-9" &&
        error.message.includes("Không thể tải ảnh lên") &&
        error.message.includes("ref-9"),
    );
  });

  it("does not attach reference fields on 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "The given data was invalid.",
            errors: { email: ["The email field is required."] },
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(request("/api/v1/example")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 422 &&
        error.errorCode === null &&
        error.reference === null &&
        !error.message.includes("Mã tham chiếu"),
    );
  });
});
