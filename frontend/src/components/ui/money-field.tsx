"use client";

import { useState } from "react";
import { formatGroupedMoney, moneyDigits } from "@/lib/money";

type MoneyFieldProps = {
  name?: string;
  value?: string;
  defaultValue?: string | number | null;
  onValueChange?: (digits: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
};

export function MoneyField({
  name,
  value,
  defaultValue,
  onValueChange,
  className,
  required,
  id,
}: MoneyFieldProps) {
  const [digits, setDigits] = useState(() => moneyDigits(defaultValue));
  const current = value === undefined ? digits : value.replace(/\D/g, "");

  function change(next: string) {
    const cleaned = next.replace(/\D/g, "");
    if (value === undefined) setDigits(cleaned);
    onValueChange?.(cleaned);
  }

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatGroupedMoney(current)}
        onChange={(event) => change(event.target.value)}
        required={required}
        className={className}
      />
      {name ? <input type="hidden" name={name} value={current} /> : null}
    </>
  );
}
