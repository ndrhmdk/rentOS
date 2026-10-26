import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  marketingPanel = false,
  wide = false,
  welcomeTitle,
  welcomeCopy,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  marketingPanel?: boolean;
  wide?: boolean;
  welcomeTitle?: string;
  welcomeCopy?: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <section
        className={`w-full bg-white bg-surface-card border border-[#DCE5EA] border-border-default rounded-2xl shadow-sm shadow-card overflow-hidden ${
          marketingPanel
            ? "max-w-5xl flex flex-col md:flex-row min-h-[600px]"
            : wide
            ? "max-w-4xl"
            : "max-w-md"
        }`}
        aria-labelledby="auth-title"
      >
        {marketingPanel && (
          <aside
            className="relative isolate md:w-[41.4%] min-h-[280px] md:min-h-[600px] p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden text-white bg-gradient-to-br from-[#739c83] via-[#345c50] to-[#091216]"
            aria-label="Thông tin về rentOS"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] uppercase text-emerald-200">
              <span aria-hidden="true" className="text-base">⌂</span> NƠI ĐỂ Ở. CHỐN ĐỂ THUỘC VỀ.
            </div>
            <div className="my-auto py-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.04em] text-white mb-3 leading-tight">
                {welcomeTitle}
              </h2>
              <p className="text-white/85 text-sm leading-relaxed">{welcomeCopy}</p>
              <span className="block w-9 h-0.5 bg-[#75B0C6] my-4" />
              <small className="text-[#8BB4C2] text-xs">Bình yên bắt đầu từ một nơi gọi là nhà.</small>
            </div>
          </aside>
        )}
        <div className={`p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-surface-card ${marketingPanel ? "md:w-[58.6%]" : "flex-1"}`}>
          <span className="block text-muted text-[10px] font-bold tracking-[0.1em] uppercase mb-1.5">
            {eyebrow}
          </span>
          <h1 id="auth-title" className="text-2xl sm:text-3xl font-bold text-heading tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-secondary text-sm mb-6">{description}</p>
          {children}
        </div>
      </section>
    </div>
  );
}

export function FormMessage({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <p
      className={`text-sm rounded-lg p-3 my-2 ${
        error
          ? "text-rose-700 bg-rose-50 border border-rose-200"
          : "text-emerald-700 bg-emerald-50 border border-emerald-200"
      }`}
      role="status"
    >
      {message}
    </p>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  return message ? (
    <span id={id} className="block text-xs text-rose-600 font-medium mt-1">
      {message}
    </span>
  ) : null;
}

