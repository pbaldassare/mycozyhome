import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2 } from "lucide-react";
import { useProfessionalProfile, useProfessionalServices, useToggleServiceActive } from "@/hooks/useProfessionalData";
import serviceCleaningImg from "@/assets/service-cleaning.png";
import serviceIroningImg from "@/assets/service-ironing.png";
import servicePetsitterImg from "@/assets/service-petsitter.png";

const serviceImages: Record<string, string> = {
  cleaning: serviceCleaningImg,
  office_cleaning: serviceCleaningImg,
  ironing: serviceIroningImg,
  sanitization: serviceCleaningImg,
  babysitter: servicePetsitterImg,
  dog_sitter: servicePetsitterImg,
};

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

export default function ProfessionalServices() {
  const { data: professional } = useProfessionalProfile();
  const { data: services, isLoading } = useProfessionalServices(professional?.id);
  const toggleActive = useToggleServiceActive();

  const handleToggle = (serviceId: string, currentState: boolean) => {
    toggleActive.mutate({ serviceId, isActive: !currentState });
  };

  const activeServices = services?.filter((s) => s.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold">I Miei Servizi</h1>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !services || services.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Nessun servizio configurato</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aggiungi i servizi che offri per ricevere prenotazioni
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi servizio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top Services */}
            {activeServices.length > 0 && (
              <section>
                <h2 className="text-base font-semibold mb-3">Servizi Attivi</h2>
                <div className="grid grid-cols-3 gap-3">
                  {activeServices.slice(0, 3).map((service) => (
                    <div
                      key={service.id}
                      className="rounded-xl overflow-hidden bg-card border"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={serviceImages[service.service_type] || serviceCleaningImg}
                          alt={serviceTypeLabels[service.service_type]}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-xs font-medium truncate">
                          {serviceTypeLabels[service.service_type]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All Services */}
            <section>
              <h2 className="text-base font-semibold mb-3">Tutti i Servizi</h2>
              <Card>
                <CardContent className="p-0 divide-y">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img
                            src={serviceImages[service.service_type] || serviceCleaningImg}
                            alt={serviceTypeLabels[service.service_type]}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {serviceTypeLabels[service.service_type]}
                          </p>
                          <p className="text-sm text-primary font-semibold">
                            €{Number(service.hourly_rate).toFixed(0)}/ora
                          </p>
                          {service.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.is_active ?? false}
                          onCheckedChange={() =>
                            handleToggle(service.id, service.is_active ?? false)
                          }
                          disabled={toggleActive.isPending}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* Pricing Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">💡 Consiglio</h3>
            <p className="text-sm text-muted-foreground">
              I professionisti con prezzi competitivi ricevono il 40% in più di
              prenotazioni. Controlla i prezzi medi della tua zona per restare
              competitivo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
