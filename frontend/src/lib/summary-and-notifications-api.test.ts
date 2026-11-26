import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "@/lib/http/client";
import { getOwnerPropertyPreview, getOwnerSummary } from "./owner-summary-api";
import { getTenantSummary } from "./tenant-summary-api";
import { listNotifications, markNotificationRead } from "./notifications/api";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("summary and notifications APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches owner and tenant summaries", async () => {
    vi.mocked(client.request)
      .mockResolvedValueOnce({ counts: { active_properties: 2 } })
      .mockResolvedValueOnce([{ id: "prop-1" }])
      .mockResolvedValueOnce({ counts: { tenancies: 1 } });

    await getOwnerSummary();
    expect(client.request).toHaveBeenCalledWith("/api/v1/owner/summary", {
      signal: undefined,
    });

    await getOwnerPropertyPreview();
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/summary/properties",
      { signal: undefined },
    );

    await getTenantSummary();
    expect(client.request).toHaveBeenCalledWith("/api/v1/tenant/summary", {
      signal: undefined,
    });
  });

  it("lists notifications for single/multiple audiences and marks read", async () => {
    vi.mocked(client.request)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ id: "notif-1", read_at: "2026-11-27T00:00:00Z" });

    await listNotifications("TENANT", 2);
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/notifications?page=2&audience=TENANT",
    );

    await listNotifications(["OWNER", "TENANT"], 1);
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/notifications?page=1&audience%5B%5D=OWNER&audience%5B%5D=TENANT",
    );

    await markNotificationRead("notif-1");
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/notifications/notif-1/read",
      { method: "POST", body: "{}" },
    );
  });
});
