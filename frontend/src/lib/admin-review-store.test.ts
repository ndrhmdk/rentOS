import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetReviewPreview,
  savePreviewDecision,
  useAdminReviewPreview,
} from "./admin-review-store";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
}

describe("admin-review-store", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const memoryStorage = createMemoryStorage();
    vi.stubGlobal("localStorage", memoryStorage);
    Object.defineProperty(window, "localStorage", {
      value: memoryStorage,
      configurable: true,
    });
    vi.stubGlobal("navigator", { locks: undefined });
  });

  it("reads preview items, saves decision, and resets storage", async () => {
    const { result } = renderHook(() => useAdminReviewPreview());
    expect(result.current.ready).toBe(true);
    expect(result.current.storageError).toBeNull();
    expect(result.current.items.length).toBeGreaterThan(0);

    const target = result.current.items.find((item) => item.status === "PENDING")!;
    await act(async () => {
      await savePreviewDecision({
        listingId: target.id,
        status: "APPROVED",
        reason: "",
        reviewer: "Admin Test",
        decidedAt: "2026-11-27T00:00:00Z",
        expectedVersion: 1,
        currentVersion: 1,
      });
    });

    const stored = window.localStorage.getItem("rentos.admin-review-preview.v1") ?? "";
    expect(stored).toContain(target.id);
    expect(stored).toContain("APPROVED");

    act(() => {
      resetReviewPreview();
    });
    expect(result.current.decisions).toEqual({});
  });

  it("reports storageError when localStorage contains malformed JSON", () => {
    window.localStorage.setItem("rentos.admin-review-preview.v1", "{bad-json");
    const { result } = renderHook(() => useAdminReviewPreview());
    expect(result.current.storageError).toContain("Không đọc được dữ liệu mẫu");
  });
});
