import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  useProfessionalProfile,
  useProfessionalServices,
  useToggleServiceActive,
  useUpdateService,
  useAddService,
  useDeleteService,
} from "@/hooks/useProfessionalData";
import { ServiceFormDialog } from "@/components/professional/ServiceFormDialog";
import serviceCleaningImg from "@/assets/service-cleaning.png";
import serviceIroningImg from "@/assets/service-ironing.png";
import servicePetsitterImg from "@/assets/service-petsitter.png";

const serviceImages: Record<string, string> = {
  cleaning: serviceCleaningImg,
  office_cleaning: serviceCleaningImg,
  ironing: serviceIroningImg,
  sanitization: serviceCleaningImg,
  dog_sitter: servicePetsitterImg,
};

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

interface ServiceData {
  id: string;
  service_type: string;
  hourly_rate: number;
  description: string | null;
  min_hours: number | null;
  years_experience: number | null;
  is_active: boolean | null;
}

export default function ProfessionalServices() {
  const { data: professional } = useProfessionalProfile();
  const { data: services, isLoading } = useProfessionalServices(professional?.id);
  const toggleActive = useToggleServiceActive();
  const updateService = useUpdateService();
  const addService = useAddService();
  const deleteService = useDeleteService();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceData | null>(null);

  const handleToggle = (serviceId: string, currentState: boolean) => {
    toggleActive.mutate({ serviceId, isActive: !currentState });
  };

  const handleEdit = (service: ServiceData) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: {
    service_type: string;
    hourly_rate: number;
    description: string | null;
    min_hours: number;
    years_experience: number;
  }) => {
    if (editingService) {
      updateService.mutate(
        {
          serviceId: editingService.id,
          data: {
            hourly_rate: data.hourly_rate,
            description: data.description,
            min_hours: data.min_hours,
            years_experience: data.years_experience,
          },
        },
        {
          onSuccess: () => setIsFormOpen(false),
        }
      );
    } else if (professional?.id) {
      addService.mutate(
        {
          professionalId: professional.id,
          data,
        },
        {
          onSuccess: () => setIsFormOpen(false),
        }
      );
    }
  };

  const handleDeleteClick = (service: ServiceData) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (serviceToDelete) {
      deleteService.mutate(serviceToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setServiceToDelete(null);
        },
      });
    }
  };

  const activeServices = services?.filter((s) => s.is_active) || [];
  const existingServiceTypes = services?.map((s) => s.service_type) || [];
  const isPending = updateService.isPending || addService.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold">I Miei Servizi</h1>
          <Button size="sm" className="gap-1" onClick={handleAdd}>
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
              <Button onClick={handleAdd}>
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
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={serviceImages[service.service_type] || serviceCleaningImg}
                            alt={serviceTypeLabels[service.service_type]}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
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
                          {(service.years_experience ?? 0) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {service.years_experience} anni di esperienza
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={service.is_active ?? false}
                          onCheckedChange={() =>
                            handleToggle(service.id, service.is_active ?? false)
                          }
                          disabled={toggleActive.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(service)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Service Form Dialog */}
      <ServiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        service={editingService}
        existingServiceTypes={existingServiceTypes}
        onSubmit={handleFormSubmit}
        isPending={isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo servizio?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il servizio "
              {serviceToDelete && serviceTypeLabels[serviceToDelete.service_type]}
              ". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
