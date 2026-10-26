import { AccountForm } from "@/components/account-forms";
import { AuthShell } from "@/components/auth-shell";
import { GuestGuard } from "@/components/guest-guard";

export default function SignInPage() {
  return (
    <GuestGuard>
      <AuthShell
        eyebrow="TÀI KHOẢN RENTOS"
        title="Đăng nhập"
        description="Tiếp tục hành trình của bạn cùng rentOS."
        marketingPanel
        welcomeTitle="Chào mừng bạn trở về."
        welcomeCopy="Những ngôi nhà bạn yêu thích và những kế hoạch mới luôn ở đây chờ bạn."
      >
        <AccountForm mode="login" />
      </AuthShell>
    </GuestGuard>
  );
}
