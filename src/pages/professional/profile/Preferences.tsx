 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { ArrowLeft, Bell, Mail, Eye, MapPin } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { Slider } from "@/components/ui/slider";
 import { toast } from "sonner";
 import { useProfessionalProfile } from "@/hooks/useProfessionalData";
 import { supabase } from "@/integrations/supabase/client";
 
 export default function ProfessionalPreferences() {
   const navigate = useNavigate();
   const { data: professional, refetch } = useProfessionalProfile();
   
   const [pushNotifications, setPushNotifications] = useState(true);
   const [emailNotifications, setEmailNotifications] = useState(true);
   const [profileVisible, setProfileVisible] = useState(true);
   const [maxRadius, setMaxRadius] = useState(professional?.max_radius_km || 10);
 
   const handleRadiusChange = async (value: number[]) => {
     const newRadius = value[0];
     setMaxRadius(newRadius);
     
     if (!professional) return;
     
     try {
       await supabase
         .from("professionals")
         .update({ max_radius_km: newRadius })
         .eq("id", professional.id);
       
       await refetch();
       toast.success(`Raggio aggiornato a ${newRadius} km`);
     } catch (err) {
       toast.error("Errore nel salvataggio");
     }
   };
 
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
           <h1 className="font-semibold text-lg">Preferenze</h1>
           <div className="w-9" />
         </div>
       </header>
 
       {/* Content */}
       <div className="flex-1 p-4 space-y-6">
         {/* Notifications */}
         <div>
           <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
             Notifiche
           </h2>
           <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/30">
             <div className="flex items-center justify-between p-4">
               <div className="flex items-center gap-3">
                 <Bell className="w-5 h-5 text-muted-foreground" />
                 <div>
                   <Label className="font-medium">Notifiche Push</Label>
                   <p className="text-xs text-muted-foreground">Ricevi notifiche sul dispositivo</p>
                 </div>
               </div>
               <Switch
                 checked={pushNotifications}
                 onCheckedChange={(checked) => {
                   setPushNotifications(checked);
                   toast.success(checked ? "Notifiche push attivate" : "Notifiche push disattivate");
                 }}
               />
             </div>
             <div className="flex items-center justify-between p-4">
               <div className="flex items-center gap-3">
                 <Mail className="w-5 h-5 text-muted-foreground" />
                 <div>
                   <Label className="font-medium">Notifiche Email</Label>
                   <p className="text-xs text-muted-foreground">Ricevi aggiornamenti via email</p>
                 </div>
               </div>
               <Switch
                 checked={emailNotifications}
                 onCheckedChange={(checked) => {
                   setEmailNotifications(checked);
                   toast.success(checked ? "Notifiche email attivate" : "Notifiche email disattivate");
                 }}
               />
             </div>
           </div>
         </div>
 
         {/* Visibility */}
         <div>
           <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
             Visibilità
           </h2>
           <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
             <div className="flex items-center justify-between p-4">
               <div className="flex items-center gap-3">
                 <Eye className="w-5 h-5 text-muted-foreground" />
                 <div>
                   <Label className="font-medium">Profilo Visibile</Label>
                   <p className="text-xs text-muted-foreground">I clienti possono trovarti nelle ricerche</p>
                 </div>
               </div>
               <Switch
                 checked={profileVisible}
                 onCheckedChange={(checked) => {
                   setProfileVisible(checked);
                   toast.success(checked ? "Profilo visibile" : "Profilo nascosto");
                 }}
               />
             </div>
           </div>
         </div>
 
         {/* Work Radius */}
         <div>
           <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
             Raggio di Lavoro
           </h2>
           <div className="bg-card rounded-2xl border border-border/30 p-4 space-y-4">
             <div className="flex items-center gap-3">
               <MapPin className="w-5 h-5 text-muted-foreground" />
               <div className="flex-1">
                 <Label className="font-medium">Distanza massima</Label>
                 <p className="text-xs text-muted-foreground">
                   Quanto lontano sei disposto a spostarti
                 </p>
               </div>
               <span className="text-lg font-semibold text-primary">{maxRadius} km</span>
             </div>
             <Slider
               value={[maxRadius]}
               onValueCommit={handleRadiusChange}
               min={1}
               max={50}
               step={1}
               className="mt-2"
             />
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>1 km</span>
               <span>50 km</span>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }