import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { RoleGuard } from "@/components/RoleGuard";

export function AdminLayout() {
  return (
    <RoleGuard allowedRole="admin">
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
