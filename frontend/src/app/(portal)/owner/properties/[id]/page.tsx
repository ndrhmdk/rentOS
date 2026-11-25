"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/http/client";
import {
  getAmenityCatalog,
  getOwnerProperty,
  getOwnerPropertyRental,
} from "@/lib/owner/api";
import type {
  OwnerPropertyDetail,
  OwnerPropertyRental,
} from "@/lib/owner/types";
import { PropertyRental } from "./property-rental";

export default function OwnerPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [rental, setRental] = useState<OwnerPropertyRental | null>(null);
  const [detail, setDetail] = useState<OwnerPropertyDetail | null>(null);
  const [amenityLabels, setAmenityLabels] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    let active = true;
    void params.then((value) => {
      if (active) setPropertyId(value.id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!propertyId) return;
    const id = propertyId;
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [nextRental, nextDetail, catalog] = await Promise.all([
          getOwnerPropertyRental(id),
          getOwnerProperty(id),
          getAmenityCatalog(),
        ]);
        if (!active) return;
        setRental(nextRental);
        setDetail(nextDetail);
        setAmenityLabels(
          Object.fromEntries(
            catalog.map((item) => [item.key, item.label_vi ?? item.label]),
          ),
        );
      } catch (caught) {
        if (!active) return;
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace("/login");
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          setError("Không tìm thấy bất động sản.");
          return;
        }
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Không thể tải bất động sản.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [propertyId, retry, router]);

  if (loading || !propertyId) {
    return (
      <p className="px-1 py-6 text-sm text-slate-500">
        Đang tải bất động sản…
      </p>
    );
  }

  if (error || !rental || !detail) {
    return (
      <div
        role="alert"
        className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      >
        {error ?? "Không thể tải bất động sản."}
        <button
          type="button"
          className="ml-3 font-semibold underline"
          onClick={() => setRetry((value) => value + 1)}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <PropertyRental
      property={rental}
      detail={detail}
      amenityLabels={amenityLabels}
    />
  );
}
