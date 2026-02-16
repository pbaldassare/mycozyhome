import { Outlet } from "react-router-dom";
import { ProfessionalBottomNav } from "./ProfessionalBottomNav";
import { RoleGuard } from "@/components/RoleGuard";

export function ProfessionalLayout() {
  return (
    <RoleGuard allowedRole="professional">
      <div className="min-h-screen bg-background pb-20">
        <main className="flex-1">
          <Outlet />
        </main>
        <ProfessionalBottomNav />
      </div>
    </RoleGuard>
  );
}
