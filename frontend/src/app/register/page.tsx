import { AccountForm } from "@/components/account-forms";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell eyebrow="BẮT ĐẦU CÙNG RENTOS" title="Tạo tài khoản" description="Bắt đầu với một tài khoản rentOS miễn phí." marketingPanel welcomeTitle="Một tài khoản. Nhiều khởi đầu mới." welcomeCopy="Tìm nơi ở phù hợp hoặc chia sẻ không gian của bạn — tất cả trên rentOS.">
      <AccountForm mode="register" />
    </AuthShell>
  );
}
