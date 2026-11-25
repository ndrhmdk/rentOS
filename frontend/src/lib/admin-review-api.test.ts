import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  adminMediaUrl,
  decideAdminPackage,
  getAdminDashboard,
  getAdminPackage,
  getAdminQueue,
  waitingLabel,
  type AdminDashboard,
  type AdminPackageDto,
  type AdminQueueResponse,
} from "./admin-review-api";

vi.mock("@/lib/http/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/http/client")>("@/lib/http/client");
  return {
    ...actual,
    csrfToken: vi.fn(() => "xsrf-token"),
    initializeCsrf: vi.fn(),
  };
});

function mockFetchOk(payload: unknown) {
  return vi.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => payload,
  });
}

describe("admin-review-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches admin dashboard, queue, and review package", async () => {
    const dashboard = { pending_count: 3, open_reports_count: 1 } as unknown as AdminDashboard;
    const fetchDash = mockFetchOk({ data: dashboard });
    vi.stubGlobal("fetch", fetchDash);
    expect(await getAdminDashboard()).toEqual(dashboard);
    expect(fetchDash).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/dashboard"),
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );

    const queue = { items: [], meta: { total: 0 } } as unknown as AdminQueueResponse;
    const fetchQueue = mockFetchOk(queue);
    vi.stubGlobal("fetch", fetchQueue);
    await getAdminQueue("Hải Châu", 2, 10);
    expect(fetchQueue).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/listing-reviews?q=H%E1%BA%A3i+Ch%C3%A2u&page=2&per_page=10"),
      expect.objectContaining({ credentials: "include" }),
    );

    const pkg = { id: "lst-1", title: "Studio" } as unknown as AdminPackageDto;
    const fetchPkg = mockFetchOk({ data: pkg });
    vi.stubGlobal("fetch", fetchPkg);
    expect(await getAdminPackage("lst-1")).toEqual(pkg);
    expect(fetchPkg).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/listing-reviews/lst-1"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("submits approve and reject decisions with expected_snapshot and client_operation_id", async () => {
    const pkg = { id: "lst-1", moderation_status: "APPROVED" } as unknown as AdminPackageDto;
    const fetchApprove = mockFetchOk({ data: pkg });
    vi.stubGlobal("fetch", fetchApprove);

    await decideAdminPackage("lst-1", "APPROVED", "snap-1", "op-1", "");
    expect(fetchApprove).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/listing-reviews/lst-1/approve"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          expected_snapshot: "snap-1",
          client_operation_id: "op-1",
        }),
      }),
    );

    const fetchReject = mockFetchOk({ data: pkg });
    vi.stubGlobal("fetch", fetchReject);
    await decideAdminPackage("lst-1", "REJECTED", "snap-1", "op-2", "Thiếu ảnh phòng tắm");
    expect(fetchReject).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/listing-reviews/lst-1/reject"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          expected_snapshot: "snap-1",
          client_operation_id: "op-2",
          reason: "Thiếu ảnh phòng tắm",
        }),
      }),
    );
  });

  it("formats adminMediaUrl and waitingLabel safely", () => {
    expect(adminMediaUrl("https://cdn.example/img.jpg")).toBe("https://cdn.example/img.jpg");
    expect(adminMediaUrl("/api/v1/admin/listing-reviews/1/media/2")).toContain(
      "/api/v1/admin/listing-reviews/1/media/2",
    );
    expect(waitingLabel(null)).toBe("Chưa gửi duyệt");
    expect(waitingLabel(new Date().toISOString())).toBe("Dưới 1 giờ");
  });
});
