"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingIcon } from "@/components/listings/listing-icon";
import {
  toListingSearchParams,
  type ListingSearchState,
} from "./listing-search-params";

const emptyState: ListingSearchState = {
  location: "",
  moveInDate: "",
  minRent: "",
  maxRent: "",
  unitKind: "",
  bedrooms: "",
  bathrooms: "",
  occupants: "",
  amenities: [],
  pets: "",
  page: 1,
};

const rentOptions = [
  { value: "", label: "Tất cả mức giá", min: "", max: "" },
  { value: "under-5", label: "Dưới 5 triệu vnđ", min: "", max: "5000000" },
  { value: "5-10", label: "5 – 10 triệu vnđ", min: "5000000", max: "10000000" },
  { value: "10-15", label: "10 – 15 triệu vnđ", min: "10000000", max: "15000000" },
  { value: "over-15", label: "Trên 15 triệu vnđ", min: "15000000", max: "" },
];

export function ListingSearchForm({ locations = [] }: { locations?: string[] }) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [rent, setRent] = useState("");
  const selectedRent = rentOptions.find((option) => option.value === rent) ?? rentOptions[0];

  return (
    <form
      className="min-w-0 rounded-[20px] bg-white/90 p-5 text-[#091216] shadow-[0_0_15px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:bg-white/85 sm:p-8"
      aria-label="Tìm nhà"
      onSubmit={(event) => {
        event.preventDefault();
        const query = toListingSearchParams({
          ...emptyState,
          location,
          minRent: selectedRent.min,
          maxRent: selectedRent.max,
        }).toString();
        router.push(query ? `/listings?${query}` : "/listings");
      }}
    >
      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.8px] sm:text-[30px] sm:tracking-[-1.2px]">
        Tìm nơi gọi là nhà
      </h2>
      <p className="mt-2 text-sm leading-6 tracking-[-0.4px] sm:text-xl">
        Khám phá nơi ở phù hợp với bạn.
      </p>
      <label className="mt-5 grid gap-2 text-sm sm:mt-8">
        <span className="flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/listings/pin.svg" alt="" width={14} height={18} />
          </span>
          Bạn muốn sống ở đâu?
        </span>
        <span className="relative">
          <input
            aria-label="Địa điểm"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            list="home-location-options"
            className="min-h-11 w-full min-w-0 rounded-none border-b border-[#8fbcd0] bg-transparent pr-7 text-base outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#3368a0] focus:shadow-[0_1px_0_0_#3368a0] sm:text-sm"
            placeholder="Thành phố, phường hoặc đường"
            autoComplete="off"
          />
          <span aria-hidden="true" className="pointer-events-none absolute right-2 top-3 text-[#66a3bf]">⌄</span>
        </span>
      </label>
      <datalist id="home-location-options">
        {[...new Set(["Đà Nẵng", ...locations])].map((name) => <option key={name} value={name} />)}
      </datalist>
      <label className="mt-5 grid gap-2 text-sm sm:mt-6">
        <span className="flex items-center gap-2"><span className="text-[#66a3bf]"><ListingIcon name="building" size={18} /></span>Mức giá hằng tháng</span>
        <span className="relative">
          <select aria-label="Mức giá hằng tháng" value={rent} onChange={(event) => setRent(event.target.value)} className="min-h-11 w-full min-w-0 appearance-none rounded-none border-b border-[#8fbcd0] bg-transparent pr-7 text-base outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#3368a0] focus:shadow-[0_1px_0_0_#3368a0] sm:text-sm">
            {rentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute right-2 top-3 text-[#66a3bf]">⌄</span>
        </span>
      </label>
      <button
        type="submit"
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-[#3368a0] px-4 text-base font-medium text-white transition-colors hover:bg-[#254e7a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3368a0] sm:mt-8 sm:h-[50px]"
      >
        Tìm nhà ngay!
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
