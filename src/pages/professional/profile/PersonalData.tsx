 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { ArrowLeft, User, Mail, Phone, MapPin, Save, FileText, Calendar } from "lucide-react";
 import { toast } from "sonner";
 import { useProfessionalProfile } from "@/hooks/useProfessionalData";
 
 export default function ProfessionalPersonalData() {
   const navigate = useNavigate();
   const { data: professional, isLoading, refetch } = useProfessionalProfile();
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
     firstName: "",
     lastName: "",
     email: "",
     phone: "",
     fiscalCode: "",
     birthDate: "",
     address: "",
     city: "",
     province: "",
     postalCode: "",
     bio: "",
   });
 
   useEffect(() => {
     if (professional) {
       setFormData({
         firstName: professional.first_name || "",
         lastName: professional.last_name || "",
         email: professional.email || "",
         phone: professional.phone || "",
         fiscalCode: professional.fiscal_code || "",
         birthDate: professional.birth_date || "",
         address: professional.address || "",
         city: professional.city || "",
         province: professional.province || "",
         postalCode: professional.postal_code || "",
         bio: professional.bio || "",
       });
     }
   }, [professional]);
 
   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!professional) return;
     
     setLoading(true);
 
     try {
       const { error } = await supabase
         .from("professionals")
         .update({
           first_name: formData.firstName,
           last_name: formData.lastName,
           phone: formData.phone,
           fiscal_code: formData.fiscalCode,
           birth_date: formData.birthDate || null,
           address: formData.address,
           city: formData.city,
           province: formData.province,
           postal_code: formData.postalCode,
           bio: formData.bio,
         })
         .eq("id", professional.id);
 
       if (error) throw error;
 
       await refetch();
       toast.success("Dati aggiornati con successo!");
     } catch (err) {
       toast.error("Errore nel salvataggio");
       console.error(err);
     } finally {
       setLoading(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
         <div className="flex items-center justify-between">
           <button
             onClick={() => navigate("/professional/profile")}
             className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
           >
             <ArrowLeft className="w-5 h-5 text-foreground" />
           </button>
           <h1 className="font-semibold text-lg">Dati Personali</h1>
           <div className="w-9" />
         </div>
       </header>
 
       {/* Content */}
       <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4 pb-24">
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label htmlFor="firstName">Nome</Label>
             <div className="relative">
               <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 id="firstName"
                 name="firstName"
                 placeholder="Mario"
                 value={formData.firstName}
                 onChange={handleChange}
                 className="pl-9"
               />
             </div>
           </div>
           <div className="space-y-2">
             <Label htmlFor="lastName">Cognome</Label>
             <Input
               id="lastName"
               name="lastName"
               placeholder="Rossi"
               value={formData.lastName}
               onChange={handleChange}
             />
           </div>
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="email">Email</Label>
           <div className="relative">
             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               id="email"
               name="email"
               type="email"
               value={formData.email}
               disabled
               className="pl-9 bg-muted"
             />
           </div>
           <p className="text-xs text-muted-foreground">L'email non può essere modificata</p>
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="phone">Telefono</Label>
           <div className="relative">
             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               id="phone"
               name="phone"
               type="tel"
               placeholder="+39 333 1234567"
               value={formData.phone}
               onChange={handleChange}
               className="pl-9"
             />
           </div>
         </div>
 
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label htmlFor="fiscalCode">Codice Fiscale</Label>
             <div className="relative">
               <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 id="fiscalCode"
                 name="fiscalCode"
                 placeholder="RSSMRA80A01H501Z"
                 value={formData.fiscalCode}
                 onChange={handleChange}
                 className="pl-9"
               />
             </div>
           </div>
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
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="address">Indirizzo</Label>
           <div className="relative">
             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               id="address"
               name="address"
               placeholder="Via Roma 1"
               value={formData.address}
               onChange={handleChange}
               className="pl-9"
             />
           </div>
         </div>
 
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label htmlFor="city">Città</Label>
             <Input
               id="city"
               name="city"
               placeholder="Milano"
               value={formData.city}
               onChange={handleChange}
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="province">Provincia</Label>
             <Input
               id="province"
               name="province"
               placeholder="MI"
               value={formData.province}
               onChange={handleChange}
             />
           </div>
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="postalCode">CAP</Label>
           <Input
             id="postalCode"
             name="postalCode"
             placeholder="20100"
             value={formData.postalCode}
             onChange={handleChange}
           />
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="bio">Descrizione</Label>
           <Textarea
             id="bio"
             name="bio"
             placeholder="Descrivi la tua esperienza e i tuoi servizi..."
             value={formData.bio}
             onChange={handleChange}
             rows={4}
           />
         </div>
 
         <div className="pt-4">
           <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
             <Save className="w-4 h-4" />
             {loading ? "Salvataggio..." : "Salva Modifiche"}
           </Button>
         </div>
       </form>
     </div>
   );
 }