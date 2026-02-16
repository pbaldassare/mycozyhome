import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { RoleGuard } from "@/components/RoleGuard";

export function ClientLayout() {
  return (
    <RoleGuard allowedRole="client">
      <div className="min-h-screen bg-background pb-20">
        <main className="flex-1">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </RoleGuard>
  );
}
