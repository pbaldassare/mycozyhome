import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { Ban, MessageCircle, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface BlockedUserGuardProps {
  userType: "client" | "professional";
  children: ReactNode;
}

const allowedPaths: Record<"client" | "professional", string[]> = {
  client: [
    "/client/messages",
    "/client/chat",
    "/client/support",
    "/client/profile",
  ],
  professional: [
    "/professional/messages",
    "/professional/chat",
    "/professional/support",
    "/professional/profile",
  ],
};

function isAllowedPath(pathname: string, userType: "client" | "professional") {
  return allowedPaths[userType].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function BlockedUserGuard({ userType, children }: BlockedUserGuardProps) {
  const { isBlocked, blockedReason } = useAuth();
  const location = useLocation();

  if (!isBlocked) {
    return <>{children}</>;
  }

  const messagesPath = userType === "client" ? "/client/messages" : "/professional/messages";
  const supportPath = userType === "client" ? "/client/support" : "/professional/support";

  return (
    <>
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-start gap-3">
          <Ban className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-destructive">Account bloccato</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {blockedReason ||
                "Il tuo account è stato bloccato per violazione delle regole della piattaforma."}{" "}
              Puoi ancora contattare l'assistenza tramite chat o ticket.
            </p>
          </div>
        </div>
      </div>

      {isAllowedPath(location.pathname, userType) ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Ban className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Accesso limitato</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Il tuo account è bloccato e non puoi utilizzare questa sezione. Contatta
            l'assistenza per maggiori informazioni o per richiedere lo sblocco.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="default">
              <Link to={messagesPath}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Vai alla chat
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={supportPath}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Assistenza
              </Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
