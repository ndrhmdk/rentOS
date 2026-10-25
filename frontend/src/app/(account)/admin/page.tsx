import Link from "next/link";
import { IdentityGate } from "@/components/identity/ui";
export default function Page() {
  return (
    <IdentityGate admin={true}>
      <h1>Quản trị</h1>
      <div className="identity-card">
        <p>Tài khoản của bạn đã sẵn sàng.</p>
        <Link href="/profile">Quản lý hồ sơ</Link>
      </div>
    </IdentityGate>
  );
}
