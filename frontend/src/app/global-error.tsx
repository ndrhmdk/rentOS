"use client";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  void error;

  return (
    <html lang="vi">
      <body className="min-h-screen bg-surface-app px-4 py-16 text-primary antialiased">
        <main className="mx-auto flex w-full max-w-xl flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold">Đã có lỗi. Vui lòng thử lại!</h1>
          <button
            type="button"
            className="rounded-md bg-[#3368A0] px-4 py-2 text-white"
            onClick={() => reset()}
          >
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
