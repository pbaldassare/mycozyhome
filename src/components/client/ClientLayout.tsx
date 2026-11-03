import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { RoleGuard } from "@/components/RoleGuard";
import { BlockedUserGuard } from "@/components/BlockedUserGuard";

export function ClientLayout() {
  return (
    <RoleGuard allowedRole="client">
      <BlockedUserGuard userType="client">
        <div className="min-h-screen bg-background pb-28">
          <main className="flex-1">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </BlockedUserGuard>
    </RoleGuard>
  );
}
