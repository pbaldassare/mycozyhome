import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function ClientLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
