import type { ReactNode } from "react";

const colors: Record<string, string> = {
  OCCUPIED: "bg-emerald-100 text-emerald-800",
  READY: "bg-emerald-100 text-emerald-800",
  success: "bg-emerald-100 text-emerald-800",
  VACANT: "bg-amber-100 text-amber-900",
  MAINTENANCE: "bg-amber-100 text-amber-900",
  warning: "bg-amber-100 text-amber-900",
  PENDING_CONFIRMATION: "bg-sky-100 text-sky-950",
  AWAITING_MOVE_IN: "bg-sky-100 text-sky-950",
  info: "bg-sky-100 text-sky-950",
  RETIRED: "bg-slate-100 text-slate-700",
  EMPTY: "bg-slate-100 text-slate-700",
  neutral: "bg-slate-100 text-slate-700",
};

export const outlineButtonClass = [
  "inline-flex min-h-10 items-center justify-center",
  "rounded-xl border border-slate-200 bg-white px-4",
  "text-sm font-semibold text-slate-800 hover:bg-slate-50",
].join(" ");

export const textLinkClass = [
  "font-semibold whitespace-nowrap",
  "text-[#3368a0] hover:underline",
].join(" ");

export function StatusPill({
  tone,
  children,
}: {
  tone: string;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1",
        "text-xs font-semibold whitespace-nowrap",
        colors[tone] ?? colors.neutral,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
