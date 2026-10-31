import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toUserMessage } from "@/lib/errors";

/** Impostazioni reali della piattaforma, salvate nel DB. */
export default function Settings() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [description, setDescription] = useState("");

  const topUp = useQuery({
    queryKey: ["app-setting", "demo_top_up_enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "demo_top_up_enabled")
        .maybeSingle();
      if (error) throw error;
      return data?.value === true;
    },
  });

  const setTopUp = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "demo_top_up_enabled", value: enabled, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      toast.success(enabled ? "Ricarica simulata attivata" : "Ricarica simulata disattivata");
      queryClient.invalidateQueries({ queryKey: ["app-setting"] });
    },
    onError: (error) => toast.error(toUserMessage(error)),
  });

  const promos = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, percent_off, description, active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const savePromo = useMutation({
    mutationFn: async (row: { code: string; percent_off: number; description: string | null; active: boolean }) => {
      const { error } = await supabase.from("promo_codes").insert(row);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promo-codes"] }),
    onError: (error) => toast.error(toUserMessage(error)),
  });

  const togglePromo = useMutation({
    mutationFn: async ({ code: promoCode, active }: { code: string; active: boolean }) => {
      const { error } = await supabase.from("promo_codes").update({ active }).eq("code", promoCode);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promo-codes"] }),
    onError: (error) => toast.error(toUserMessage(error)),
  });

  const deletePromo = useMutation({
    mutationFn: async (promoCode: string) => {
      const { error } = await supabase.from("promo_codes").delete().eq("code", promoCode);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promo-codes"] }),
    onError: (error) => toast.error(toUserMessage(error)),
  });

  const addPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(percent);
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(normalized) || !(value >= 1 && value <= 90)) {
      toast.error("Codice di 3-20 lettere o numeri e sconto tra 1 e 90%.");
      return;
    }
    savePromo.mutate(
      { code: normalized, percent_off: value, description: description.trim() || null, active: true },
      {
        onSuccess: () => {
          setCode("");
          setDescription("");
          toast.success("Codice aggiunto");
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Impostazioni della piattaforma salvate nel database.</p>
      </div>

      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-primary-dark" />
          <h2 className="text-lg font-semibold">Crediti</h2>
        </div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <Label htmlFor="demo-top-up" className="font-medium">Ricarica simulata dei crediti</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Finché non ci sono pagamenti online, i clienti possono ricaricare crediti finti (massimo 500 € per
              volta e 1.000 € al giorno). Tienila spenta se l'app è aperta al pubblico.
            </p>
          </div>
          {topUp.isLoading ? (
            <Skeleton className="h-6 w-11" />
          ) : (
            <Switch
              id="demo-top-up"
              checked={!!topUp.data}
              disabled={setTopUp.isPending}
              onCheckedChange={(checked) => setTopUp.mutate(checked)}
            />
          )}
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-primary-dark" />
          <h2 className="text-lg font-semibold">Codici promozionali</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ogni cliente può usare ogni codice una sola volta. Lo sconto lo calcola il database al momento della
          prenotazione.
        </p>

        {promos.isLoading ? (
          <Skeleton className="h-24" />
        ) : promos.isError ? (
          <p>Impossibile caricare i codici.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg">
            {promos.data?.map((p) => (
              <li key={p.code} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <p className="font-mono font-semibold">{p.code} · {p.percent_off}%</p>
                  {p.description && <p className="text-sm text-muted-foreground truncate">{p.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    aria-label={`Codice ${p.code} attivo`}
                    checked={p.active}
                    onCheckedChange={(checked) => togglePromo.mutate({ code: p.code, active: checked })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Elimina ${p.code}`}
                    onClick={() => deletePromo.mutate(p.code)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
            {promos.data?.length === 0 && <li className="p-3 text-muted-foreground">Nessun codice.</li>}
          </ul>
        )}

        <form onSubmit={addPromo} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_2fr_auto] gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="promo-code">Codice</Label>
            <Input id="promo-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ESTATE10" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="promo-percent">Sconto %</Label>
            <Input id="promo-percent" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="promo-description">Descrizione</Label>
            <Input id="promo-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" disabled={savePromo.isPending}>Aggiungi</Button>
        </form>
      </section>
    </div>
  );
}
