import { Outlet } from "react-router-dom";
import { ProfessionalBottomNav } from "./ProfessionalBottomNav";
import { RoleGuard } from "@/components/RoleGuard";
import { BlockedUserGuard } from "@/components/BlockedUserGuard";

export function ProfessionalLayout() {
  return (
    <RoleGuard allowedRole="professional">
      <BlockedUserGuard userType="professional">
        <div className="min-h-screen bg-background pb-20">
          <main className="flex-1">
            <Outlet />
          </main>
          <ProfessionalBottomNav />
        </div>
      </BlockedUserGuard>
    </RoleGuard>
  );
}
