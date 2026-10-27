import { PortalComingSoon } from "@/components/portal-coming-soon";

export default function OwnerListingsPage() {
  return (
    <PortalComingSoon
      portalName="CỔNG CHỦ NHÀ"
      pageTitle="Tin đăng"
      description="Tạo tin đăng cho thuê phòng, quản lý hình ảnh, giá thuê và đăng tải lên mạng lưới rentOS."
      backHref="/owner"
      backLabel="Về Tổng quan"
    />
  );
}

