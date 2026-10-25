import Link from "next/link";
import { IdentityGate } from "@/components/identity/ui";
export default function Page() {
  return (
    <IdentityGate admin={false}>
      <h1>Trang của người thuê</h1>
      <div className="identity-card">
        <p>Tài khoản của bạn đã sẵn sàng.</p>
        <Link href="/profile">Quản lý hồ sơ</Link>
      </div>
    </IdentityGate>
  );
}
