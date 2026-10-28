import { Suspense } from "react";
import { ListingDetailScreen } from "@/features/discovery/listing-detail-screen";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-8">Đang tải tin đăng...</p>}>
      <ListingDetailLoader params={params} />
    </Suspense>
  );
}

async function ListingDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetailScreen id={id} />;
}
