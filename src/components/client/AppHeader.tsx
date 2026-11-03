import { useState } from "react";
import { ChevronLeft, ChevronDown, Bell, MapPin, LocateFixed, Wallet } from "lucide-react";
import { useClientWallet } from "@/hooks/useWallet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClientNotifications } from "@/hooks/useClientNotifications";
import { useClientAddress } from "@/hooks/useClientAddress";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";


interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showAddress?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
  onBack?: () => void;
}

export function AppHeader({
  title,
  showBack = false,
  showNotifications = false,
  showAddress = false,
  rightAction,
  className,
  onBack,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { unreadCount } = useClientNotifications();
  const unread = showNotifications && unreadCount > 0;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className={cn("app-header", className)}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl -ml-2"
              onClick={handleBack} aria-label="Indietro">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {showAddress && <AddressPicker />}
          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightAction}
          {showAddress && <WalletChip />}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl relative"
              onClick={() => navigate("/client/notifications")}
              aria-label="Notifiche"
            >
              <Bell className="h-5 w-5" />
              {unread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Indirizzo sempre visibile in alto, come nelle app di delivery. */
function AddressPicker() {
  const { address, save } = useClientAddress();
  const [open, setOpen] = useState(false);

  const pick = async (a: { text: string; lat: number; lng: number }) => {
    try {
      await save.mutateAsync(a);
      setOpen(false);
      toast.success("Indirizzo aggiornato");
    } catch {
      toast.error("Impossibile salvare l'indirizzo");
    }
  };

  const useMyPosition = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => pick({ text: "La mia posizione", lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error("Posizione non disponibile"),
    );

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2.5 min-w-0 text-left">
        <span className="h-9 w-9 shrink-0 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-rose-500" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-muted-foreground leading-none">Il tuo indirizzo</span>
          <span className="flex items-center gap-1 font-semibold text-sm text-foreground">
            <span className="truncate max-w-[150px]">{address?.text ?? "Imposta il tuo indirizzo"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
          </span>
        </span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Dove ti serve aiuto?</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <AddressAutocomplete
              value={address?.text}
              placeholder="Via, numero civico, città"
              onSelect={(r) => pick({ text: r.formatted_address, lat: r.latitude, lng: r.longitude })}
            />
            <button onClick={useMyPosition} className="flex items-center gap-2 text-sm font-medium text-primary">
              <LocateFixed className="h-4 w-4" /> Usa la mia posizione
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Saldo sempre visibile: un tocco apre il wallet. */
function WalletChip() {
  const navigate = useNavigate();
  const { data: wallet } = useClientWallet();
  return (
    <button
      onClick={() => navigate("/client/profile/payments")}
      className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-sm font-bold text-emerald-700"
      aria-label="Saldo wallet"
    >
      <Wallet className="h-4 w-4" />
      €{Number(wallet?.balance ?? 0).toFixed(0)}
    </button>
  );
}
