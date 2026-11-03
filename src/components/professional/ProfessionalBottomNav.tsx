import { Home, Calendar, Briefcase, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/professional" },
  { icon: Briefcase, label: "Bacheca", path: "/professional/service-board" },
  { icon: Calendar, label: "Prenotazioni", path: "/professional/bookings" },
  { icon: MessageSquare, label: "Messaggi", path: "/professional/messages" },
  { icon: User, label: "Profilo", path: "/professional/profile" },
];

export function ProfessionalBottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/professional" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("bottom-nav-item", isActive && "bottom-nav-item-active")}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
