import { Save, Bell, Shield, Palette, Globe, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">
          Configura le impostazioni della piattaforma
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Impostazioni Generali</h2>
            <p className="text-sm text-muted-foreground">
              Configurazioni base della piattaforma
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="platform-name">Nome Piattaforma</Label>
            <Input id="platform-name" defaultValue="HomeServ" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="support-email">Email Supporto</Label>
            <Input id="support-email" type="email" defaultValue="support@homeserv.it" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">Lingua Predefinita</Label>
            <Select defaultValue="it">
              <SelectTrigger id="language">
                <SelectValue placeholder="Seleziona lingua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Commissioni</h2>
            <p className="text-sm text-muted-foreground">
              Gestisci le commissioni della piattaforma
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="commission">Commissione Piattaforma (%)</Label>
            <Input id="commission" type="number" defaultValue="10" />
            <p className="text-xs text-muted-foreground">
              Percentuale applicata su ogni transazione completata
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-day">Giorno Payout Settimanale</Label>
            <Select defaultValue="monday">
              <SelectTrigger id="payout-day">
                <SelectValue placeholder="Seleziona giorno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Lunedì</SelectItem>
                <SelectItem value="wednesday">Mercoledì</SelectItem>
                <SelectItem value="friday">Venerdì</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Notifiche</h2>
            <p className="text-sm text-muted-foreground">
              Configura le notifiche email
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nuova registrazione professionista</p>
              <p className="text-sm text-muted-foreground">
                Ricevi una notifica quando un professionista si registra
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nuova segnalazione</p>
              <p className="text-sm text-muted-foreground">
                Ricevi una notifica per nuove segnalazioni urgenti
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Report giornaliero</p>
              <p className="text-sm text-muted-foreground">
                Ricevi un riepilogo giornaliero delle attività
              </p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Sicurezza</h2>
            <p className="text-sm text-muted-foreground">
              Impostazioni di sicurezza della piattaforma
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Verifica documenti obbligatoria</p>
              <p className="text-sm text-muted-foreground">
                I professionisti devono caricare documenti per la verifica
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Approvazione manuale</p>
              <p className="text-sm text-muted-foreground">
                Ogni professionista deve essere approvato manualmente
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Requisiti extra per babysitter/dog sitter</p>
              <p className="text-sm text-muted-foreground">
                Richiedi documenti aggiuntivi per servizi sensibili
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Salva Impostazioni
        </Button>
      </div>
    </div>
  );
}
