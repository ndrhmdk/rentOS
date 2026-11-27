import { describe, it, expect, vi, beforeEach } from "vitest";
import * as client from "@/lib/http/client";
import {
  dismissAdminReport,
  getAdminListingReport,
  getAdminListingReports,
  getTenantReport,
  getTenantReports,
  resolveAdminReport,
  restoreAdminListing,
  startAdminReportReview,
  submitListingReport,
  suspendAdminListing,
  type AdminListingReport,
  type PaginatedResponse,
  type ReporterListingReport,
} from "./reports-api";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("reports-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits and reads tenant reports", async () => {
    const report = { id: "rep-1", status: "OPEN" } as unknown as ReporterListingReport;
    vi.mocked(client.request).mockResolvedValueOnce(report);
    await submitListingReport("lst-1", { reason_code: "FRAUD", description: "Lừa đảo tiền cọc" });
    expect(client.request).toHaveBeenCalledWith("/api/v1/listings/lst-1/reports", {
      method: "POST",
      body: JSON.stringify({ reason_code: "FRAUD", description: "Lừa đảo tiền cọc" }),
    });

    const page = { data: [report], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } } as unknown as PaginatedResponse<ReporterListingReport>;
    vi.mocked(client.request).mockResolvedValueOnce(page);
    expect(await getTenantReports(2, 10)).toEqual(page);
    expect(client.request).toHaveBeenCalledWith("/api/v1/tenant/reports?page=2&per_page=10");

    vi.mocked(client.request).mockResolvedValueOnce(report);
    expect(await getTenantReport("rep-1")).toEqual(report);
    expect(client.request).toHaveBeenCalledWith("/api/v1/tenant/reports/rep-1");
  });

  it("handles admin report queue, start-review, resolve, dismiss, suspend, and restore", async () => {
    const adminReport = { id: "rep-1", status: "REVIEWING" } as unknown as AdminListingReport;
    const page = { data: [adminReport], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } } as unknown as PaginatedResponse<AdminListingReport>;

    vi.mocked(client.request).mockResolvedValueOnce(page);
    await getAdminListingReports({ status: "OPEN", reason_code: "FRAUD", search: "Hai Chau", page: 1, per_page: 15 });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/admin/listing-reports?status=OPEN&reason_code=FRAUD&search=Hai+Chau&page=1&per_page=15",
    );

    vi.mocked(client.request).mockResolvedValueOnce(adminReport);
    await getAdminListingReport("rep-1");
    expect(client.request).toHaveBeenCalledWith("/api/v1/admin/listing-reports/rep-1");

    vi.mocked(client.request).mockResolvedValueOnce({ message: "OK", data: adminReport });
    await startAdminReportReview("rep-1");
    expect(client.request).toHaveBeenCalledWith("/api/v1/admin/listing-reports/rep-1/start-review", {
      method: "POST",
      body: "{}",
    });

    vi.mocked(client.request).mockResolvedValueOnce({ message: "Resolved", data: adminReport });
    await resolveAdminReport("rep-1", {
      resolution_summary: "Đã đình chỉ",
      internal_notes: "IP trùng",
      suspend_listing: true,
      suspension_reason: "Gian lận",
    });
    expect(client.request).toHaveBeenCalledWith("/api/v1/admin/listing-reports/rep-1/resolve", {
      method: "POST",
      body: JSON.stringify({
        resolution_summary: "Đã đình chỉ",
        internal_notes: "IP trùng",
        suspend_listing: true,
        suspension_reason: "Gian lận",
      }),
    });

    vi.mocked(client.request).mockResolvedValueOnce({ message: "Dismissed", data: adminReport });
    await dismissAdminReport("rep-1", { resolution_summary: "Hợp lệ" });
    expect(client.request).toHaveBeenCalledWith("/api/v1/admin/listing-reports/rep-1/dismiss", {
      method: "POST",
      body: JSON.stringify({ resolution_summary: "Hợp lệ" }),
    });

    vi.mocked(client.request).mockResolvedValueOnce({ message: "Suspended", data: {} });
    await suspendAdminListing("lst-1", "Vi phạm");
    expect(client.request).toHaveBeenCalledWith("/api/v1/admin/listings/lst-1/suspend", {
      method: "POST",
      body: JSON.stringify({ reason: "Vi phạm" }),
    });

    vi.mocked(client.request).mockResolvedValueOnce({ message: "Restored", data: {} });
    await restoreAdminListing("lst-1", "Đã sửa");
    expect(client.request).toHaveBeenCalledWith("/api/v1/admin/listings/lst-1/restore", {
      method: "POST",
      body: JSON.stringify({ reason: "Đã sửa" }),
    });
  });
});
