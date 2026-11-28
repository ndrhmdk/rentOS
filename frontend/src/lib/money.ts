export function moneyDigits(
  value: string | number | null | undefined,
): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  const whole = text.split(/[.,]/)[0] ?? "";
  return whole.replace(/\D/g, "");
}

export function formatGroupedMoney(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
