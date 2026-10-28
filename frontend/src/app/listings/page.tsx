import { Suspense } from "react";
import { ListingsBrowser } from "@/features/discovery/listings-browser";

export default function ListingsPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8">Đang tìm phòng...</p>}>
      <ListingsBrowser />
    </Suspense>
  );
}
