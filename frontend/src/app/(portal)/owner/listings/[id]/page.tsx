import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { ListingEditor } from "../listing-editor";

export default function OwnerListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<LoadingScreen message="Đang tải tin đăng…" />}
    >
      <OwnerListingLoader params={params} />
    </Suspense>
  );
}

async function OwnerListingLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <section className="mx-auto w-full max-w-5xl px-1 py-4 sm:px-2 sm:py-6">
      <ListingEditor listingId={id} />
    </section>
  );
}
