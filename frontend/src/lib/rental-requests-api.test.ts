import { describe, expect, it, vi } from "vitest";
import {
  submitRentalRequest,
  getTenantRentalRequests,
  getTenantRentalRequest,
  withdrawTenantRentalRequest,
  getOwnerRentalRequests,
  getOwnerRentalRequest,
  rejectOwnerRentalRequest,
  type OwnerRentalRequestList,
  type TenantRentalRequestDetail,
} from "./rental-requests-api";
import { request } from "@/lib/http/client";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("rental-requests-api", () => {
  it("submitRentalRequest sends POST with json payload", async () => {
    vi.mocked(request).mockResolvedValue({ id: "req-1", status: "PENDING" });

    const input = {
      listing_id: "list-1",
      contact_name: "Tenant A",
      contact_phone: "0901234567",
      desired_move_in_date: "2026-12-01",
      desired_end_date: "2027-06-01",
      preferred_unit_id: null,
      message: "Xin chào",
      client_operation_id: "op-1",
    };

    const res = await submitRentalRequest(input);

    expect(request).toHaveBeenCalledWith("/api/v1/tenant/rental-requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
    expect(res).toEqual({ id: "req-1", status: "PENDING" });
  });

  it("getTenantRentalRequests builds query params", async () => {
    vi.mocked(request).mockResolvedValue({
      items: [],
      counts: { all: 0, pending: 0, accepted: 0, closed: 0 },
      page: 1,
      last_page: 1,
    });

    await getTenantRentalRequests("pending", 2);

    expect(request).toHaveBeenCalledWith("/api/v1/tenant/rental-requests?filter=pending&page=2", {
      signal: undefined,
    });
  });

  it("getTenantRentalRequest encodes ID", async () => {
    vi.mocked(request).mockResolvedValue({ id: "req/1" } as unknown as TenantRentalRequestDetail);

    await getTenantRentalRequest("req/1");

    expect(request).toHaveBeenCalledWith("/api/v1/tenant/rental-requests/req%2F1", { signal: undefined });
  });

  it("withdrawTenantRentalRequest sends POST to withdraw endpoint", async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    const input = {
      expected_updated_at: "2026-11-20T00:00:00Z",
      client_operation_id: "op-withdraw",
      reason: "Đã tìm được phòng khác",
    };

    await withdrawTenantRentalRequest("req-1", input);

    expect(request).toHaveBeenCalledWith("/api/v1/tenant/rental-requests/req-1/withdraw", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("getOwnerRentalRequests, getOwnerRentalRequest, rejectOwnerRentalRequest call owner endpoints", async () => {
    vi.mocked(request).mockResolvedValue({} as unknown as OwnerRentalRequestList);

    await getOwnerRentalRequests("PENDING", 1);
    expect(request).toHaveBeenCalledWith("/api/v1/owner/rental-requests?status=PENDING&page=1", { signal: undefined });

    await getOwnerRentalRequest("req-2");
    expect(request).toHaveBeenCalledWith("/api/v1/owner/rental-requests/req-2", { signal: undefined });

    const rejectInput = {
      expected_updated_at: "2026-11-20T00:00:00Z",
      client_operation_id: "op-reject",
      reason: "Đã có khách khác",
    };
    await rejectOwnerRentalRequest("req-2", rejectInput);
    expect(request).toHaveBeenCalledWith("/api/v1/owner/rental-requests/req-2/reject", {
      method: "POST",
      body: JSON.stringify(rejectInput),
    });
  });
});
