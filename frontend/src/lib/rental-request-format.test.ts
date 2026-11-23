import { describe, expect, it } from "vitest";
import { formatOutcomeReason, isAutoRejection } from "./rental-request-format";

describe("rental-request-format outcome reason", () => {
  it("formats NO_AVAILABLE_UNIT to Vietnamese auto-rejection explanation", () => {
    expect(formatOutcomeReason("NO_AVAILABLE_UNIT")).toBe(
      "Tự động từ chối do không còn căn trống phù hợp sau 15 ngày",
    );
    expect(isAutoRejection("NO_AVAILABLE_UNIT")).toBe(true);
  });

  it("preserves custom rejection reason string", () => {
    const custom = "Chủ nhà đã nhận khách khác trước.";
    expect(formatOutcomeReason(custom)).toBe(custom);
    expect(isAutoRejection(custom)).toBe(false);
  });

  it("handles null or empty values gracefully", () => {
    expect(formatOutcomeReason(null)).toBeNull();
    expect(formatOutcomeReason(undefined)).toBeNull();
    expect(formatOutcomeReason("")).toBeNull();
    expect(isAutoRejection(null)).toBe(false);
  });
});
