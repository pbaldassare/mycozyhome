import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { JoinMyCozyHome } from "@/components/JoinMyCozyHome";

interface RoleGuardProps {
  allowedRole: "admin" | "professional" | "client";
  children: React.ReactNode;
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Account dell'autenticazione condivisa senza ruolo su MyCozyHome.
  if (role === null) {
    return <JoinMyCozyHome />;
  }

  // Wrong role — redirect to the correct panel
  if (role !== allowedRole) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "professional") return <Navigate to="/professional" replace />;
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
}
