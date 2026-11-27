import { describe, expect, it } from "vitest";
import {
  applyPreviewDecision,
  parsePreviewDecisions,
  ReviewDecisionError,
  type ReviewDecisionInput,
} from "./admin-review-decision";
import { getReviewQueue, type ReviewQueueItem } from "./admin-review-queue";

const approval: ReviewDecisionInput = {
  listingId: "listing-1",
  status: "APPROVED",
  reviewer: "Trần Minh",
  decidedAt: "2026-10-29T10:00:00Z",
  expectedVersion: 1,
  currentVersion: 1,
};

function expectDecisionError(
  fn: () => unknown,
  code: ReviewDecisionError["code"],
): void {
  try {
    fn();
    expect.fail("expected ReviewDecisionError");
  } catch (error) {
    expect(error).toBeInstanceOf(ReviewDecisionError);
    expect((error as ReviewDecisionError).code).toBe(code);
  }
}

describe("admin review decisions", () => {
  it("approval records reviewer and time without publishing the listing", () => {
    const result = applyPreviewDecision({}, approval)["listing-1"];
    expect(result.status).toBe("APPROVED");
    expect(result.reviewer).toBe("Trần Minh");
    expect(result.decidedAt).toBe(approval.decidedAt);
    expect(result.published).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("rejection requires a nonblank reason and preserves the pending state on failure", () => {
    const original = {};
    for (const reason of [undefined, "", "   ", "\n\t", "x".repeat(1001)]) {
      expectDecisionError(
        () =>
          applyPreviewDecision(original, {
            ...approval,
            status: "REJECTED",
            reason,
          }),
        "reason",
      );
    }
    expect(original).toEqual({});
  });

  it("valid rejection saves the trimmed reason and survives serialization", () => {
    const result = applyPreviewDecision(
      {},
      { ...approval, status: "REJECTED", reason: "  Cần sửa địa chỉ.  " },
    );
    expect(result["listing-1"].reason).toBe("Cần sửa địa chỉ.");
    expect(result["listing-1"].published).toBe(false);
    expect(parsePreviewDecisions(JSON.stringify(result))).toEqual(result);
  });

  it("duplicate or opposite decisions cannot overwrite an existing outcome", () => {
    const first = applyPreviewDecision({}, approval);
    for (const status of ["APPROVED", "REJECTED"] as const) {
      expectDecisionError(
        () =>
          applyPreviewDecision(first, {
            ...approval,
            status,
            reason: "Nội dung sai",
          }),
        "conflict",
      );
    }
    expect(first["listing-1"].status).toBe("APPROVED");
  });

  it("stale versions fail before a decision is created", () => {
    expectDecisionError(
      () => applyPreviewDecision({}, { ...approval, currentVersion: 2 }),
      "stale",
    );
  });

  it("saved decisions are removed from the pending queue", () => {
    const decisions = applyPreviewDecision({}, approval);
    const base: Omit<
      ReviewQueueItem,
      "id" | "title" | "owner" | "status" | "initialApprovedAt"
    > = {
      property: "Nhà trọ",
      units: 1,
      photos: 1,
      submittedAt: approval.decidedAt,
      waiting: "0 giờ",
    };
    const result = getReviewQueue([
      {
        ...base,
        id: "listing-1",
        title: "Tin đã duyệt",
        owner: "Linh",
        initialApprovedAt: approval.decidedAt,
        status: decisions["listing-1"].status,
      },
      {
        ...base,
        id: "listing-2",
        title: "Tin đang chờ",
        owner: "Hòa",
        initialApprovedAt: null,
        status: "PENDING",
      },
    ]);
    expect(result.map((item) => item.id)).toEqual(["listing-2"]);
  });

  it("invalid local records do not masquerade as valid review outcomes", () => {
    for (const raw of ["broken", "null", "[]", '{"listing-1":{}}']) {
      expect(() => parsePreviewDecisions(raw)).toThrow();
    }
    const valid = applyPreviewDecision({}, approval);
    expect(() =>
      parsePreviewDecisions(
        JSON.stringify({
          "listing-1": { ...valid["listing-1"], published: true },
        }),
      ),
    ).toThrow();
    expect(parsePreviewDecisions(null)).toEqual({});
  });
});
