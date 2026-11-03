import { Outlet } from "react-router-dom";
import { ProfessionalBottomNav } from "./ProfessionalBottomNav";
import { RoleGuard } from "@/components/RoleGuard";
import { BlockedUserGuard } from "@/components/BlockedUserGuard";
import { useNewJobAlerts } from "@/hooks/useNewJobAlerts";

function NewJobAlerts() {
  useNewJobAlerts();
  return null;
}

export function ProfessionalLayout() {
  return (
    <RoleGuard allowedRole="professional">
      <BlockedUserGuard userType="professional">
        <NewJobAlerts />
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
