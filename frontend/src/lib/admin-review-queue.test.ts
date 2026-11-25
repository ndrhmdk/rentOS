import { describe, expect, it } from "vitest";
import { getReviewQueue, type ReviewQueueItem } from "./admin-review-queue";

const pending: ReviewQueueItem = {
  id: "first",
  title: "Studio gần biển Mỹ Khê",
  owner: "Hòa",
  property: "Nhà trọ",
  units: 1,
  photos: 2,
  submittedAt: "2026-10-19T04:20:00+07:00",
  waiting: "18 giờ",
  status: "PENDING",
  initialApprovedAt: null,
};

describe("getReviewQueue", () => {
  it("only pending packages without prior initial approval enter the queue", () => {
    const items: ReviewQueueItem[] = [
      pending,
      { ...pending, id: "approved", status: "APPROVED" },
      { ...pending, id: "rejected", status: "REJECTED" },
      {
        ...pending,
        id: "already-reviewed",
        initialApprovedAt: "2026-10-18T00:00:00Z",
      },
    ];
    expect(getReviewQueue(items).map((item) => item.id)).toEqual(["first"]);
  });

  it("search supports accents, case and extra surrounding spaces", () => {
    expect(getReviewQueue([pending], "  MY KHE  ")).toHaveLength(1);
    expect(getReviewQueue([pending], "Mỹ Khê")).toHaveLength(1);
    expect(getReviewQueue([pending], "HOA")).toHaveLength(1);
  });

  it("search matches Vietnamese đ in titles and owner names", () => {
    expect(
      getReviewQueue([{ ...pending, title: "Gần ĐH Bách khoa" }], "dh bach khoa"),
    ).toHaveLength(1);
    expect(getReviewQueue([{ ...pending, owner: "Đức" }], "duc")).toHaveLength(
      1,
    );
  });

  it("search uses title or owner, not private or unrelated fields", () => {
    expect(getReviewQueue([pending], "xyz123")).toHaveLength(0);
    expect(getReviewQueue([pending], "Nhà trọ")).toHaveLength(0);
    expect(getReviewQueue([pending], "   ")).toHaveLength(1);
  });

  it("queue sorts oldest first without mutating the input", () => {
    const older: ReviewQueueItem = {
      ...pending,
      id: "older",
      submittedAt: "2026-10-18T16:20:00+07:00",
    };
    const items = [pending, older];
    expect(getReviewQueue(items).map((item) => item.id)).toEqual([
      "older",
      "first",
    ]);
    expect(items.map((item) => item.id)).toEqual(["first", "older"]);
  });

  it("an empty queue returns no rows", () => {
    expect(getReviewQueue([])).toEqual([]);
  });
});
