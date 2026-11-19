"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  void error;

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold text-heading">Đã có lỗi. Vui lòng thử lại!</h1>
      <button
        type="button"
        className="rounded-md bg-action-primary px-4 py-2 text-on-dark"
        onClick={() => reset()}
      >
        Thử lại
      </button>
    </main>
  );
}
