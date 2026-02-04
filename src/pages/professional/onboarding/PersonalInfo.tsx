import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, MapPin, Phone, Calendar, CreditCard } from "lucide-react";
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
  bio: z.string().optional(),
});

export default function PersonalInfo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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
    bio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      setUserId(session.user.id);

      // Get user metadata for initial values
      const metadata = session.user.user_metadata;
      
      // Check if professional profile exists
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
          bio: prof.bio || "",
        });
      } else {
        // Use metadata from signup
        setFormData((prev) => ({
          ...prev,
          firstName: metadata?.first_name || "",
          lastName: metadata?.last_name || "",
        }));
      }
    };

    loadData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        bio: validated.bio || null,
        profile_completed: true,
      };

      if (professionalId) {
        // Update existing
        const { error } = await supabase
          .from("professionals")
          .update(professionalData)
          .eq("id", professionalId);

        if (error) throw error;
      } else {
        // Insert new
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/professional/dashboard")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">Dati Personali</h1>
            <p className="text-sm text-white/70">Step 1 di 4</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary w-1/4" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-auto">
        {/* Name Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Informazioni Base</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Mario"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Rossi"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+39 333 1234567"
                className="pl-9"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data di Nascita</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalCode">Codice Fiscale</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fiscalCode"
                  name="fiscalCode"
                  value={formData.fiscalCode}
                  onChange={handleChange}
                  placeholder="RSSMRA80A01H501U"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Indirizzo</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Via e Numero</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Via Roma 123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Città *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Milano"
              />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="MI"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">CAP</Label>
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="20100"
              maxLength={5}
            />
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-2">
          <Label htmlFor="bio">Presentazione</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Raccontaci qualcosa di te e della tua esperienza..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Questa descrizione sarà visibile ai clienti
          </p>
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 bg-background pt-4 pb-6 -mx-4 px-4 border-t border-border">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Salvataggio..." : "Continua"}
          </Button>
        </div>
      </form>
    </div>
  );
}
