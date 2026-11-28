import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { SavedListingsScreen } from "@/features/discovery/saved-listings-screen";

export default function SavedListingsPage() {
  return (
    <Suspense
      fallback={<LoadingScreen message="Đang tải Yêu thích…" />}
    >
      <SavedListingsScreen />
    </Suspense>
  );
}
