import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { useProfessionalRevenue, REVENUE_LIMIT } from "@/hooks/useProfessionalRevenue";
import { useQueryClient } from "@tanstack/react-query";

// P.IVA italiana: 11 cifre numeriche
const vatSchema = z.object({
  vatNumber: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "La Partita IVA deve essere composta da 11 cifre numeriche"),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "Devi confermare la veridicità dei dati" }),
  }),
});

export default function FiscalData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalProfile();
  const { data: revenue } = useProfessionalRevenue(professional?.id);

  const [vatNumber, setVatNumber] = useState("");
  const [hasVat, setHasVat] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (professional) {
      setHasVat(!!professional.has_vat_number);
      setVatNumber(professional.vat_number ?? "");
    }
  }, [professional]);

  const handleSave = async () => {
    if (!professional) return;

    const parsed = vatSchema.safeParse({ vatNumber, confirm: confirmed });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("professionals")
      .update({
        has_vat_number: true,
        vat_number: parsed.data.vatNumber,
        vat_registered_at: new Date().toISOString(),
        revenue_blocked: false,
      })
      .eq("id", professional.id);
    setSaving(false);

    if (error) {
      toast.error("Errore nel salvataggio: " + error.message);
      return;
    }

    toast.success("Partita IVA registrata. Account sbloccato!");
    queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    queryClient.invalidateQueries({ queryKey: ["professional-revenue"] });
    navigate("/professional/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Dati fiscali</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-sm">Limite annuo senza P.IVA</h2>
            <p className="text-sm text-muted-foreground">
              Senza Partita IVA puoi fatturare al massimo{" "}
              <strong>€{REVENUE_LIMIT.toLocaleString("it-IT")}</strong> all'anno
              tramite la piattaforma. Al superamento il tuo account viene bloccato
              fino alla registrazione della P.IVA.
            </p>
            {revenue && (
              <p className="text-sm mt-2">
                Fatturato anno corrente:{" "}
                <strong>
                  €
                  {revenue.annualRevenue.toLocaleString("it-IT", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </strong>{" "}
                ({revenue.percentage}%)
              </p>
            )}
          </CardContent>
        </Card>

        {hasVat ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-success">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-semibold">Partita IVA registrata</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Numero P.IVA:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {professional?.vat_number}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Per modificare la P.IVA contatta il supporto.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vat">Partita IVA</Label>
                <Input
                  id="vat"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="es. 12345678901"
                  value={vatNumber}
                  onChange={(e) =>
                    setVatNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  11 cifre numeriche, senza prefisso IT.
                </p>
              </div>

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(v) => setConfirmed(v === true)}
                  className="mt-0.5"
                />
                <span>
                  Confermo che i dati inseriti sono veritieri e che sono titolare
                  della Partita IVA indicata.
                </span>
              </label>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Salvataggio..." : "Registra Partita IVA"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
