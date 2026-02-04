import { Outlet } from "react-router-dom";
import { ProfessionalBottomNav } from "./ProfessionalBottomNav";

export function ProfessionalLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="flex-1">
        <Outlet />
      </main>
      <ProfessionalBottomNav />
    </div>
  );
}
