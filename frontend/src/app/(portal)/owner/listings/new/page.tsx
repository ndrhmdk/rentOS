import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { ListingEditor } from "../listing-editor";

export default function NewOwnerListingPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  return (
    <Suspense
      fallback={<LoadingScreen message="Đang tải tin đăng…" />}
    >
      <NewOwnerListingLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function NewOwnerListingLoader({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
  return (
    <section className="mx-auto w-full max-w-5xl px-1 py-4 sm:px-2 sm:py-6">
      <ListingEditor propertyId={propertyId} />
    </section>
  );
}
