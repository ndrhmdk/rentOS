import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "@/lib/http/client";
import * as api from "./api";

vi.mock("@/lib/http/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/http/client")>();
  return { ...actual, request: vi.fn() };
});

const mocked = vi.mocked(request);

function lastCall() {
  const [path, init] = mocked.mock.calls.at(-1) ?? [];
  return {
    path,
    method: init?.method ?? "GET",
    body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body,
  };
}

beforeEach(() => {
  mocked.mockReset();
  mocked.mockResolvedValue({});
});

describe("owner api", () => {
  it.each([
    ["getOwnerRentalRequests", () => api.getOwnerRentalRequests(), "/api/v1/owner/rental-requests", "GET", undefined],
    ["getOwnerRentalRequest", () => api.getOwnerRentalRequest("a/b"), "/api/v1/owner/rental-requests/a%2Fb/proposal-context", "GET", undefined],
    ["getAmenityCatalog", () => api.getAmenityCatalog(), "/api/v1/owner/amenities", "GET", undefined],
    ["getOwnerPropertyMedia", () => api.getOwnerPropertyMedia("p1"), "/api/v1/owner/properties/p1/media", "GET", undefined],
    ["getOwnerListingById", () => api.getOwnerListingById("l1"), "/api/v1/owner/listings/l1", "GET", undefined],
    ["createOwnerListing", () => api.createOwnerListing("p1", { client_operation_id: "op", title: "T", description: "D", cover_media_id: null }), "/api/v1/owner/properties/p1/listing", "POST", { client_operation_id: "op", title: "T", description: "D", cover_media_id: null }],
    ["updateOwnerListing", () => api.updateOwnerListing("p1", { expected_content_revision: 3, title: "T", description: "D", cover_media_id: "m1" }), "/api/v1/owner/properties/p1/listing", "PATCH", { expected_content_revision: 3, title: "T", description: "D", cover_media_id: "m1" }],
    ["submitOwnerListing", () => api.submitOwnerListing("p1", 4), "/api/v1/owner/properties/p1/listing/submit", "POST", { expected_content_revision: 4 }],
    ["publishOwnerListing", () => api.publishOwnerListing("p1", 4), "/api/v1/owner/properties/p1/listing/publish", "POST", { expected_content_revision: 4 }],
    ["hideOwnerListing", () => api.hideOwnerListing("p1", 4), "/api/v1/owner/properties/p1/listing/hide", "POST", { expected_content_revision: 4 }],
    ["archiveOwnerListing", () => api.archiveOwnerListing("p1", 4), "/api/v1/owner/properties/p1/listing/archive", "POST", { expected_content_revision: 4 }],
    ["createOwnerProperty", () => api.createOwnerProperty({ name: "Nhà A" }), "/api/v1/owner/properties", "POST", { name: "Nhà A" }],
    ["updateOwnerProperty", () => api.updateOwnerProperty("p1", { name: "Nhà B" }), "/api/v1/owner/properties/p1", "PATCH", { name: "Nhà B" }],
    ["archiveOwnerProperty", () => api.archiveOwnerProperty("p1", 5), "/api/v1/owner/properties/p1/archive", "PATCH", { expected_content_revision: 5 }],
    ["createOwnerUnit", () => api.createOwnerUnit("p1", { label: "101" }), "/api/v1/owner/properties/p1/units", "POST", { label: "101" }],
    ["updateOwnerUnit", () => api.updateOwnerUnit("p1", "u1", { label: "102" }), "/api/v1/owner/properties/p1/units/u1", "PATCH", { label: "102" }],
    ["archiveOwnerUnit", () => api.archiveOwnerUnit("p1", "u1", 6), "/api/v1/owner/properties/p1/units/u1/archive", "PATCH", { expected_content_revision: 6 }],
    ["createOwnerUnitBatch", () => api.createOwnerUnitBatch("p1", { units: [] }), "/api/v1/owner/properties/p1/units/bulk", "POST", { units: [] }],
    ["updateOwnerGallery", () => api.updateOwnerGallery("p1", { expected_content_revision: 2, items: [] }), "/api/v1/owner/properties/p1/gallery", "PUT", { expected_content_revision: 2, items: [] }],
    ["saveOwnerUnitSharedMedia", () => api.saveOwnerUnitSharedMedia("p1", "u1", { expected_content_revision: 2, media_ids: ["m1"] }), "/api/v1/owner/properties/p1/units/u1/shared-media", "PUT", { expected_content_revision: 2, media_ids: ["m1"] }],
    ["updateOwnerUnitGallery", () => api.updateOwnerUnitGallery("p1", "u1", { expected_content_revision: 2, items: [] }), "/api/v1/owner/properties/p1/units/u1/gallery", "PUT", { expected_content_revision: 2, items: [] }],
    ["removeOwnerMedia", () => api.removeOwnerMedia("p1", "m1", 7, 2), "/api/v1/owner/properties/p1/media/m1", "DELETE", { expected_content_revision: 7, revision: 2 }],
  ])("%s calls the right endpoint", async (_name, call, path, method, body) => {
    await call();

    expect(lastCall()).toEqual({ path, method, body });
  });

  it("returns owner properties whether or not the API wraps them in data", async () => {
    mocked.mockResolvedValueOnce([{ id: "p1" }]).mockResolvedValueOnce({ data: [{ id: "p2" }] });

    expect(await api.getOwnerProperties()).toEqual([{ id: "p1" }]);
    expect(lastCall().path).toBe("/api/v1/owner/properties");
    expect(await api.getOwnerProperties(true)).toEqual([{ id: "p2" }]);
    expect(lastCall().path).toBe("/api/v1/owner/properties?include_archived=1");
  });

  it("always gives a property a units array", async () => {
    mocked.mockResolvedValueOnce({ id: "p1", units: null }).mockResolvedValueOnce({ id: "p1", units: [{ id: "u1" }] });

    expect((await api.getOwnerProperty("p1")).units).toEqual([]);
    expect((await api.getOwnerProperty("p1")).units).toEqual([{ id: "u1" }]);
  });

  it("treats a missing listing as no listing but rethrows other errors", async () => {
    mocked
      .mockRejectedValueOnce(new ApiError(404, "Not found"))
      .mockRejectedValueOnce(new ApiError(500, "Server error"));

    expect(await api.getOwnerListing("p1")).toBeNull();
    await expect(api.getOwnerListing("p1")).rejects.toMatchObject({ status: 500 });
  });

  it("uploads a photo as multipart form data with optional fields", async () => {
    const file = new File(["x"], "room.jpg", { type: "image/jpeg" });
    await api.uploadOwnerMedia("p1", { file, client_operation_id: "op-1", expected_content_revision: 3, unit_id: "u1", caption: "Phòng khách" });

    const { path, method, body } = lastCall();
    expect([path, method]).toEqual(["/api/v1/owner/properties/p1/media", "POST"]);
    const form = body as FormData;
    expect(form.get("photo")).toBe(file);
    expect(form.get("client_operation_id")).toBe("op-1");
    expect(form.get("expected_content_revision")).toBe("3");
    expect(form.get("unit_id")).toBe("u1");
    expect(form.get("caption")).toBe("Phòng khách");

    await api.uploadOwnerMedia("p1", { file, client_operation_id: "op-2", expected_content_revision: 4 });
    const plain = lastCall().body as FormData;
    expect(plain.has("unit_id")).toBe(false);
    expect(plain.has("caption")).toBe(false);
  });
});
