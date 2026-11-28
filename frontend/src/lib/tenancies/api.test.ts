import { describe, it, expect, vi, beforeEach } from "vitest";
import * as client from "@/lib/http/client";
import {
  getTenantTenancies,
  getOwnerTenancies,
  getOwnerTenancyTimeline,
  getTenantTenancyTimeline,
  requestTenantTenancyRenewal,
  withdrawTenantTenancyRenewal,
  proposeOwnerTenancyRenewal,
  correctOwnerTenancyRenewal,
  rejectOwnerTenancyRenewal,
  confirmTenantTenancyContract,
  declineTenantTenancyContract,
  markOwnerTenancyMoveIn,
  cancelOwnerTenancy,
  endOwnerTenancy,
  proposeOwnerTenancy,
  correctOwnerTenancyProposal,
} from "./api";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("tenancies API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches tenant and owner tenancies lists", async () => {
    const tenantPage = {
      data: [{ id: "ten-1" }],
      meta: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
    };
    vi.mocked(client.request).mockResolvedValueOnce(tenantPage);
    const tenantRes = await getTenantTenancies();
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/tenant/tenancies?page=1&per_page=20",
    );
    expect(tenantRes).toEqual(tenantPage);

    const ownerPage = {
      data: [{ id: "ten-2" }],
      meta: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
    };
    vi.mocked(client.request).mockResolvedValueOnce(ownerPage);
    const ownerRes = await getOwnerTenancies();
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies?page=1&per_page=20",
    );
    expect(ownerRes).toEqual(ownerPage);
  });

  it("fetches owner and tenant tenancy timelines", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ id: "ten-123" });
    const ownerTimeline = await getOwnerTenancyTimeline("ten-123");
    expect(client.request).toHaveBeenCalledWith("/api/v1/owner/tenancies/ten-123");
    expect(ownerTimeline).toEqual({ id: "ten-123" });

    vi.mocked(client.request).mockResolvedValueOnce({ id: "ten-456" });
    const tenantTimeline = await getTenantTenancyTimeline("ten-456");
    expect(client.request).toHaveBeenCalledWith("/api/v1/tenant/tenancies/ten-456");
    expect(tenantTimeline).toEqual({ id: "ten-456" });
  });

  it("manages tenant renewal requests (request & withdraw)", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ id: "ren-1" });
    const renRes = await requestTenantTenancyRenewal("ten-1", {
      client_operation_id: "op-1",
      requested_end_date: "2027-01-01",
      proposed_monthly_rent: 15000000,
      message: "Please renew",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/tenant/tenancies/ten-1/renewal-requests",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-1",
          requested_end_date: "2027-01-01",
          proposed_monthly_rent: 15000000,
          message: "Please renew",
        }),
      },
    );
    expect(renRes).toEqual({ id: "ren-1" });

    vi.mocked(client.request).mockResolvedValueOnce({ success: true });
    const withdrawRes = await withdrawTenantTenancyRenewal("ten-1", "ren-1", {
      client_operation_id: "op-2",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/tenant/tenancies/ten-1/renewal-requests/ren-1/withdraw",
      {
        method: "POST",
        body: JSON.stringify({ client_operation_id: "op-2" }),
      },
    );
    expect(withdrawRes).toEqual({ success: true });
  });

  it("manages owner renewal proposals, corrections, and rejections", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ success: true });
    await proposeOwnerTenancyRenewal("ten-1", "ren-1", {
      client_operation_id: "op-3",
      end_date: "2027-01-01",
      monthly_rent: 16000000,
      deposit_amount: 16000000,
      policies_snapshot: { pet: true },
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-1/renewal-requests/ren-1/proposal",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-3",
          end_date: "2027-01-01",
          monthly_rent: 16000000,
          deposit_amount: 16000000,
          policies_snapshot: { pet: true },
        }),
      },
    );

    vi.mocked(client.request).mockResolvedValueOnce({ success: true });
    await correctOwnerTenancyRenewal("ten-1", "ren-1", {
      client_operation_id: "op-4",
      supersedes_contract_id: "con-1",
      end_date: "2027-01-01",
      monthly_rent: 16500000,
      deposit_amount: 16500000,
      policies_snapshot: { pet: false },
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-1/renewal-requests/ren-1/corrections",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-4",
          supersedes_contract_id: "con-1",
          end_date: "2027-01-01",
          monthly_rent: 16500000,
          deposit_amount: 16500000,
          policies_snapshot: { pet: false },
        }),
      },
    );

    vi.mocked(client.request).mockResolvedValueOnce({ success: true });
    await rejectOwnerTenancyRenewal("ten-1", "ren-1", {
      client_operation_id: "op-5",
      reason: "Not extending",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-1/renewal-requests/ren-1/reject",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-5",
          reason: "Not extending",
        }),
      },
    );
  });

  it("handles tenant contract confirmation and decline", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ status: "active" });
    const confirmRes = await confirmTenantTenancyContract("ten-1", "con-1", {
      client_operation_id: "op-6",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/tenant/tenancies/ten-1/contracts/con-1/confirm",
      {
        method: "POST",
        body: JSON.stringify({ client_operation_id: "op-6" }),
      },
    );
    expect(confirmRes).toEqual({ status: "active" });

    vi.mocked(client.request).mockResolvedValueOnce({ status: "declined" });
    const declineRes = await declineTenantTenancyContract("ten-1", "con-1", {
      client_operation_id: "op-7",
      reason: "Price too high",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/tenant/tenancies/ten-1/contracts/con-1/decline",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-7",
          reason: "Price too high",
        }),
      },
    );
    expect(declineRes).toEqual({ status: "declined" });
  });

  it("handles owner tenancy lifecycle actions (move-in, cancel, end)", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ status: "in_progress" });
    await markOwnerTenancyMoveIn("ten-1", { client_operation_id: "op-8" });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-1/move-in",
      {
        method: "POST",
        body: JSON.stringify({ client_operation_id: "op-8" }),
      },
    );

    vi.mocked(client.request).mockResolvedValueOnce({ status: "cancelled" });
    await cancelOwnerTenancy("ten-1", {
      client_operation_id: "op-9",
      reason: "Tenant requested cancellation",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-1/cancel",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-9",
          reason: "Tenant requested cancellation",
        }),
      },
    );

    vi.mocked(client.request).mockResolvedValueOnce({ status: "ended" });
    await endOwnerTenancy("ten-1", {
      client_operation_id: "op-10",
      reason: "Early termination agreed",
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-1/end",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-10",
          reason: "Early termination agreed",
        }),
      },
    );
  });

  it("handles owner tenancy proposals and corrections", async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ tenancy_id: "ten-9" });
    await proposeOwnerTenancy("req-1", {
      client_operation_id: "op-11",
      unit_id: "u-1",
      start_date: "2026-12-01",
      end_date: "2027-12-01",
      monthly_rent: 10000000,
      deposit_amount: 10000000,
      policies_snapshot: {},
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/rental-requests/req-1/proposal",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-11",
          unit_id: "u-1",
          start_date: "2026-12-01",
          end_date: "2027-12-01",
          monthly_rent: 10000000,
          deposit_amount: 10000000,
          policies_snapshot: {},
        }),
      },
    );

    vi.mocked(client.request).mockResolvedValueOnce({ tenancy_id: "ten-9" });
    await correctOwnerTenancyProposal("ten-9", {
      client_operation_id: "op-12",
      supersedes_contract_id: "con-1",
      start_date: "2026-12-01",
      end_date: "2027-12-01",
      monthly_rent: 10500000,
      deposit_amount: 10500000,
      policies_snapshot: {},
    });
    expect(client.request).toHaveBeenCalledWith(
      "/api/v1/owner/tenancies/ten-9/correction",
      {
        method: "POST",
        body: JSON.stringify({
          client_operation_id: "op-12",
          supersedes_contract_id: "con-1",
          start_date: "2026-12-01",
          end_date: "2027-12-01",
          monthly_rent: 10500000,
          deposit_amount: 10500000,
          policies_snapshot: {},
        }),
      },
    );
  });
});
