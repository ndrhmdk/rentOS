"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = `${(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "")}/api/v1/locations`;

type AdministrativeUnit = {
  code: string;
  name: string;
};

type ApiResponse = {
  success: boolean;
  data: AdministrativeUnit[] | { data?: AdministrativeUnit[] };
};

async function loadUnits(url: string): Promise<AdministrativeUnit[]> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Could not load locations");
  }
  const result = (await response.json()) as ApiResponse;
  if (!result.success) {
    throw new Error("Could not load locations");
  }
  const data = Array.isArray(result.data) ? result.data : result.data.data;
  return (data ?? []).map((unit) => ({ code: unit.code, name: unit.name }));
}

const DEFAULT_CITY = "Đà Nẵng";

export function DiscoveryWardPicker({
  value,
  onChange,
  className,
  id = "discovery-ward",
  required = false,
  cityName = DEFAULT_CITY,
}: {
  value: string;
  onChange: (ward: string) => void;
  className?: string;
  id?: string;
  required?: boolean;
  cityName?: string;
}) {
  const [retry, setRetry] = useState(0);
  const requestKey = `${cityName}\u0000${retry}`;
  const [loadState, setLoadState] = useState<{
    key: string;
    status: "loading" | "ready" | "error";
    wards: AdministrativeUnit[];
  }>({ key: requestKey, status: "loading", wards: [] });
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  const isCurrentRequest = loadState.key === requestKey;
  const loading = !isCurrentRequest || loadState.status === "loading";
  const error = isCurrentRequest && loadState.status === "error";
  const wards =
    isCurrentRequest && loadState.status === "ready" ? loadState.wards : [];

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [onChange, value]);

  useEffect(() => {
    let active = true;

    loadUnits(`${API_BASE}/provinces`)
      .then(async (cities) => {
        const city =
          cities.find((unit) => unit.name === cityName) ?? cities[0];
        if (!city) {
          throw new Error("No provinces");
        }
        const nextWards = await loadUnits(
          `${API_BASE}/provinces/${encodeURIComponent(city.code)}/wards`,
        );
        if (!active) return;
        setLoadState({ key: requestKey, status: "ready", wards: nextWards });
        const current = valueRef.current;
        if (
          current &&
          !nextWards.some((ward) => ward.name === current)
        ) {
          onChangeRef.current("");
        }
      })
      .catch(() => {
        if (active) {
          setLoadState({ key: requestKey, status: "error", wards: [] });
        }
      });

    return () => {
      active = false;
    };
  }, [cityName, requestKey, retry]);

  return (
    <div className="min-w-0 w-full">
      <select
        id={id}
        aria-label="Phường/Xã"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading}
        required={required}
        className={className}
      >
        <option value="">
          {loading ? "Đang tải phường…" : "Chọn phường"}
        </option>
        {wards.map((ward) => (
          <option key={ward.code} value={ward.name}>
            {ward.name}
          </option>
        ))}
      </select>
      {error ? (
        <p
          className="mt-1 flex items-center gap-2 text-xs text-rose-700"
          role="alert"
        >
          <span>Không tải được danh sách phường.</span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setRetry((current) => current + 1)}
          >
            Thử lại
          </button>
        </p>
      ) : null}
    </div>
  );
}

export function SearchIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="9"
        cy="9"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m13.5 13.5 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
