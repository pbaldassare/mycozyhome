import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Calendar,
  MessageSquareWarning,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: UserCheck, label: "Professionisti", path: "/admin/professionals" },
  { icon: Users, label: "Clienti", path: "/admin/clients" },
  { icon: Briefcase, label: "Servizi", path: "/admin/services" },
  { icon: Calendar, label: "Prenotazioni", path: "/admin/bookings" },
  { icon: MessageSquareWarning, label: "Segnalazioni", path: "/admin/disputes" },
  { icon: HelpCircle, label: "Assistenza", path: "/admin/support" },
  { icon: CreditCard, label: "Pagamenti", path: "/admin/payments" },
  { icon: Settings, label: "Impostazioni", path: "/admin/settings" },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-primary rounded-xl text-primary-foreground shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Blue Dark Style like screenshots */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen flex flex-col transition-all duration-300 z-50",
          "bg-[hsl(222,47%,11%)]", // Dark blue like screenshot
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-white">
                  HomeServ
                </h1>
                <p className="text-xs text-white/50">Admin Panel</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 lg:hidden" />
            ) : collapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200",
                isActive(item.path) && "bg-primary text-white hover:bg-primary",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all",
              collapsed && "justify-center px-3"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">Esci</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
