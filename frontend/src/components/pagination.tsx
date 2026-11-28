"use client";

function paginationItems(current: number, lastPage: number) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }
  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(lastPage - 1, current + 1);
  if (start > 2) items.push("gap");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < lastPage - 1) items.push("gap");
  items.push(lastPage);
  return items;
}

export function Pagination({
  current,
  lastPage,
  onSelect,
}: {
  current: number;
  lastPage: number;
  onSelect: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Phân trang"
      className="flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2 py-1.5"
    >
      <button
        type="button"
        aria-label="Trang trước"
        disabled={current <= 1}
        className="inline-flex size-9 items-center justify-center rounded-full text-slate-800 disabled:text-slate-400"
        onClick={() => onSelect(current - 1)}
      >
        ‹
      </button>
      {paginationItems(current, lastPage).map((item, index) => {
        if (item === "gap") {
          return (
            <span
              key={`gap-${index}`}
              className="px-1 text-sm text-slate-400"
              aria-hidden="true"
            >
              …
            </span>
          );
        }
        const selected = item === current;
        return (
          <button
            key={item}
            type="button"
            aria-current={selected ? "page" : undefined}
            className={`inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold ${selected ? "bg-[#3368a0] text-white" : "text-slate-800 hover:bg-white"}`}
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Trang sau"
        disabled={current >= lastPage}
        className="inline-flex size-9 items-center justify-center rounded-full text-slate-800 disabled:text-slate-400"
        onClick={() => onSelect(current + 1)}
      >
        ›
      </button>
    </nav>
  );
}
