import type { ReactNode } from "react";

export type StatusBadgeTone =
  | "info"
  | "review"
  | "success"
  | "danger"
  | "warning"
  | "neutral";

const toneClasses: Record<StatusBadgeTone, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-purple-50 text-purple-700 border-purple-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

/**
 * Shared pill badge. Never wraps and keeps a fixed height so badges align
 * across table rows and cards.
 */
export function StatusBadge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: StatusBadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold leading-none ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
