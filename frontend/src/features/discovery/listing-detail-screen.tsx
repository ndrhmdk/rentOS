"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ListingDetailView } from "@/components/listings/listing-detail";
import { fetchListing, ListingUnavailableError, type ListingDetail } from "./listings-api";
import { UnavailableListing } from "./unavailable-listing";

export function ListingDetailScreen({ id }: { id: string }) {
  const { status } = useAuth();
  const [loaded, setLoaded] = useState<{ id: string; listing: ListingDetail | null; unavailable: boolean } | null>(null);
  const listing = loaded?.id === id ? loaded.listing : null;
  const unavailable = loaded?.id === id ? loaded.unavailable : false;

  useEffect(() => {
    const controller = new AbortController();
    fetchListing(id, controller.signal)
      .then((body) => {
        if (!controller.signal.aborted) setLoaded({ id, listing: body.data, unavailable: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ListingUnavailableError || error instanceof Error) {
          setLoaded({ id, listing: null, unavailable: true });
        }
      });
    return () => controller.abort();
  }, [id]);

  if (unavailable) return <UnavailableListing />;
  if (!listing) return <p className="px-4 py-8">Đang tải tin đăng...</p>;

  return <ListingDetailView listing={listing} isSignedIn={status === "authenticated"} />;
}
