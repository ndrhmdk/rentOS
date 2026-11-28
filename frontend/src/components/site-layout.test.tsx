import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteFrame } from "./site-frame";
import { SiteFooter } from "./site-footer";
import { PortalComingSoon } from "./portal-coming-soon";
import { ListingAreaMap } from "./listings/listing-area-map";

const mockUsePathname = vi.fn(() => "/listings");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/components/site-header", () => ({
  SiteHeader: () => <header data-testid="site-header">Header</header>,
}));

const mockMapRemove = vi.fn();
const mockInvalidateSize = vi.fn();
vi.mock("leaflet", () => ({
  default: {
    icon: vi.fn(() => ({})),
    map: vi.fn(() => ({
      invalidateSize: mockInvalidateSize,
      remove: mockMapRemove,
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => ({
      addTo: vi.fn(() => ({ bindPopup: vi.fn() })),
    })),
  },
}));

describe("SiteFrame, SiteFooter, PortalComingSoon & ListingAreaMap", () => {
  afterEach(cleanup);

  it("renders header and footer on public routes, and hides frame on /admin", () => {
    mockUsePathname.mockReturnValue("/listings");
    const { rerender } = render(
      <SiteFrame>
        <div>Nội dung công khai</div>
      </SiteFrame>,
    );
    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByText(/© 2026 rentOS/)).toBeTruthy();

    mockUsePathname.mockReturnValue("/admin/reports");
    rerender(
      <SiteFrame>
        <div>Nội dung admin</div>
      </SiteFrame>,
    );
    expect(screen.queryByTestId("site-header")).toBeNull();
    expect(screen.getByText("Nội dung admin")).toBeTruthy();
  });

  it("hides SiteFooter on portal routes", () => {
    mockUsePathname.mockReturnValue("/owner/properties");
    const { container } = render(<SiteFooter />);
    expect(container.firstChild).toBeNull();
  });

  it("renders PortalComingSoon with back link and ListingAreaMap", () => {
    const { unmount } = render(
      <div>
        <PortalComingSoon
          portalName="Cổng chủ nhà"
          pageTitle="Báo cáo doanh thu"
          backHref="/owner"
          backLabel="Về tổng quan"
        />
        <ListingAreaMap latitude={16.0544} longitude={108.2022} />
      </div>,
    );

    expect(screen.getAllByText("Báo cáo doanh thu").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Về tổng quan/ }).getAttribute("href")).toBe("/owner");
    unmount();
    expect(mockMapRemove).toHaveBeenCalled();
  });
});
