import { AuthShell } from "@/components/auth-shell";
import { ProfilePanel } from "@/components/profile-panel";

export default function ProfilePage() {
  return (
    <AuthShell wide eyebrow="TÀI KHOẢN CỦA BẠN" title="Hồ sơ và bảo mật" description="Quản lý thông tin liên hệ và mật khẩu của bạn.">
      <ProfilePanel />
    </AuthShell>
  );
}
