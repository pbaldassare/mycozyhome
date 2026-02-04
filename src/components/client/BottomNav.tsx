import { Home, Search, Calendar, MessageCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/client", icon: Home, label: "Home" },
  { to: "/client/search", icon: Search, label: "Cerca" },
  { to: "/client/bookings", icon: Calendar, label: "Prenotazioni" },
  { to: "/client/messages", icon: MessageCircle, label: "Chat" },
  { to: "/client/profile", icon: User, label: "Profilo" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "bottom-nav-item",
              isActive && "bottom-nav-item-active"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
