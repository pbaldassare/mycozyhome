import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  phone: z.string().min(10, "Numero di telefono non valido"),
  birthDate: z.string().optional(),
  fiscalCode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2, "Inserisci la città"),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

export default function PersonalInfo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    fiscalCode: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      const metadata = session.user.user_metadata;
      
      const { data: prof } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (prof) {
        setProfessionalId(prof.id);
        setFormData({
          firstName: prof.first_name || "",
          lastName: prof.last_name || "",
          phone: prof.phone || "",
          birthDate: prof.birth_date || "",
          fiscalCode: prof.fiscal_code || "",
          address: prof.address || "",
          city: prof.city || "",
          province: prof.province || "",
          postalCode: prof.postal_code || "",
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          firstName: metadata?.first_name || "",
          lastName: metadata?.last_name || "",
        }));
      }
    };

    loadData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = personalInfoSchema.parse(formData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      const professionalData = {
        user_id: session.user.id,
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: session.user.email!,
        phone: validated.phone,
        birth_date: validated.birthDate || null,
        fiscal_code: validated.fiscalCode || null,
        address: validated.address || null,
        city: validated.city,
        province: validated.province || null,
        postal_code: validated.postalCode || null,
        profile_completed: true,
      };

      if (professionalId) {
        const { error } = await supabase
          .from("professionals")
          .update(professionalData)
          .eq("id", professionalId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("professionals")
          .insert(professionalData);

        if (error) throw error;
      }

      toast.success("Dati personali salvati!");
      navigate("/professional/onboarding/services");
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error("Errore nel salvataggio dei dati");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Progress: step 1 of 4 = 25%
  const progress = 25;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/professional/dashboard")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Dati personali</h1>
          <div className="w-9" />
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-[hsl(var(--sage-light))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--sage))] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-4 py-6 space-y-6 pb-32">
        {/* Nome e Cognome */}
        <section>
          <label className="block text-base font-semibold mb-2">Nome *</label>
          <Input
            name="firstName"
            placeholder="Es. Mario"
            value={formData.firstName}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
          {errors.firstName && (
            <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
          )}
        </section>

        <section>
          <label className="block text-base font-semibold mb-2">Cognome *</label>
          <Input
            name="lastName"
            placeholder="Es. Rossi"
            value={formData.lastName}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
          )}
        </section>

        <section>
          <label className="block text-base font-semibold mb-2">Telefono *</label>
          <Input
            name="phone"
            type="tel"
            placeholder="Es. +39 333 1234567"
            value={formData.phone}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1">{errors.phone}</p>
          )}
        </section>

        <section>
          <label className="block text-base font-semibold mb-2">Data di nascita</label>
          <Input
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
        </section>

        <section>
          <label className="block text-base font-semibold mb-2">Codice Fiscale</label>
          <Input
            name="fiscalCode"
            placeholder="Es. RSSMRA80A01H501U"
            value={formData.fiscalCode}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
        </section>

        <section>
          <label className="block text-base font-semibold mb-2">Città *</label>
          <Input
            name="city"
            placeholder="Es. Milano"
            value={formData.city}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
          {errors.city && (
            <p className="text-xs text-destructive mt-1">{errors.city}</p>
          )}
        </section>

        <section>
          <label className="block text-base font-semibold mb-2">Indirizzo</label>
          <Input
            name="address"
            placeholder="Es. Via Roma 123"
            value={formData.address}
            onChange={handleChange}
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
          />
        </section>

        <div className="grid grid-cols-2 gap-4">
          <section>
            <label className="block text-base font-semibold mb-2">Provincia</label>
            <Input
              name="province"
              placeholder="MI"
              value={formData.province}
              onChange={handleChange}
              maxLength={2}
              className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
            />
          </section>
          <section>
            <label className="block text-base font-semibold mb-2">CAP</label>
            <Input
              name="postalCode"
              placeholder="20100"
              value={formData.postalCode}
              onChange={handleChange}
              maxLength={5}
              className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base"
            />
          </section>
        </div>
      </form>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 space-y-3">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-base rounded-2xl bg-[hsl(var(--sage))] hover:bg-[hsl(var(--sage-dark))]"
          size="lg"
          disabled={loading}
        >
          {loading ? "Salvataggio..." : "Continua"}
        </Button>
        <button
          type="button"
          onClick={() => navigate("/professional/dashboard")}
          className="w-full text-center text-[hsl(var(--sage-dark))] font-medium py-2"
        >
          Indietro
        </button>
      </div>
    </div>
  );
}
