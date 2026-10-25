import { Suspense } from "react";
import { AuthForm } from "@/components/identity/auth-form";
export const metadata = {
  title: "Đặt lại mật khẩu · rentOS",
  referrer: "no-referrer",
};
type ResetPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
async function ResetFields({ searchParams }: ResetPageProps) {
  const query = await searchParams;
  return (
    <AuthForm
      mode="reset"
      token={typeof query.token === "string" ? query.token : ""}
      initialEmail={typeof query.email === "string" ? query.email : ""}
    />
  );
}
export default function Page(props: ResetPageProps) {
  return (
    <Suspense
      fallback={<p role="status">Đang tải biểu mẫu đặt lại mật khẩu…</p>}
    >
      <ResetFields {...props} />
    </Suspense>
  );
}
