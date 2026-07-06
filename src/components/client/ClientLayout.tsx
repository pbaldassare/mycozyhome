import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { RoleGuard } from "@/components/RoleGuard";
import { BlockedUserGuard } from "@/components/BlockedUserGuard";
import { PaymentReleaseProcessor } from "@/components/PaymentReleaseProcessor";

export function ClientLayout() {
  return (
    <RoleGuard allowedRole="client">
      <BlockedUserGuard userType="client">
        <PaymentReleaseProcessor />
        <div className="min-h-screen bg-background pb-20">
          <main className="flex-1">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </BlockedUserGuard>
    </RoleGuard>
  );
}
