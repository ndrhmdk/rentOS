import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createOwnerUnitBatch,
  getOwnerProperty,
  type OwnerPropertyDetail,
} from "@/lib/auth-api";
import AddUnitsPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "property-1" }),
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/auth-api", () => ({
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
  createOwnerUnitBatch: vi.fn(),
  getOwnerProperty: vi.fn(),
}));

function property(revision: number): OwnerPropertyDetail {
  return {
    id: "property-1",
    owner_id: "owner-1",
    client_operation_id: "operation-1",
    name: "Nhà mẫu",
    property_type: "APARTMENT",
    rental_arrangement: "SEPARATE_UNITS",
    city: "Đà Nẵng",
    archived_at: null,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
    address_line: null,
    ward: null,
    description: null,
    content_revision: revision,
    shared_amenities: { schema_version: 1, standard: {}, custom: [] },
    policies: {
      schema_version: 1,
      pets: "NOT_ALLOWED",
      smoking: "NOT_ALLOWED",
      shared_rules: [],
    },
    units: [],
  };
}

describe("AddUnitsPage stale revision recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getOwnerProperty)
      .mockResolvedValueOnce(property(1))
      .mockResolvedValueOnce(property(2));
  });

  afterEach(cleanup);

  it("refreshes the revision while keeping the room plan and edited room", async () => {
    const user = userEvent.setup();
    vi.mocked(createOwnerUnitBatch).mockRejectedValueOnce(
      new ApiError(409, "Stale revision"),
    );

    render(<AddUnitsPage />);
    const roomName = await screen.findByLabelText("Tên phòng");
    await user.clear(roomName);
    await user.type(roomName, "Phòng thử nghiệm");
    await user.click(screen.getByRole("button", { name: "Thêm 1 phòng" }));

    await waitFor(() => expect(getOwnerProperty).toHaveBeenCalledTimes(2));
    expect((roomName as HTMLInputElement).value).toBe("Phòng thử nghiệm");

    await user.click(screen.getByRole("button", { name: "Thêm 1 phòng" }));
    await waitFor(() => expect(createOwnerUnitBatch).toHaveBeenCalledTimes(2));
    expect(vi.mocked(createOwnerUnitBatch).mock.calls[1][1]).toMatchObject({
      expected_content_revision: 2,
      units: [{ label: "Phòng thử nghiệm" }],
    });
  });
});
