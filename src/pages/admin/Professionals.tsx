import { useState, useEffect } from "react";
import { Search, Filter, UserCheck, Clock, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfessionalCard, Professional } from "@/components/admin/ProfessionalCard";
import { ProfessionalReviewPanel } from "@/components/admin/ProfessionalReviewPanel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProfessionalWithDocs extends Professional {
  documents: {
    id: string;
    type: string;
    name: string;
    url: string;
    status: string;
    uploadedAt: string;
  }[];
  firstName: string;
  lastName: string;
  phone: string;
}

export default function Professionals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch professionals from database
  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["admin-professionals"],
    queryFn: async () => {
      // Fetch all professionals (admin has access to all via service role or specific policy)
      const { data: profs, error: profsError } = await supabase
        .from("professionals")
        .select("*")
        .order("created_at", { ascending: false });

      if (profsError) {
        console.error("Error fetching professionals:", profsError);
        return [];
      }

      // Fetch documents for each professional
      const professionalsWithDocs = await Promise.all(
        (profs || []).map(async (prof) => {
          const { data: docs } = await supabase
            .from("professional_documents")
            .select("*")
            .eq("professional_id", prof.id);

          const { data: services } = await supabase
            .from("professional_services")
            .select("service_type")
            .eq("professional_id", prof.id);

          return {
            id: prof.id,
            name: `${prof.first_name} ${prof.last_name}`,
            firstName: prof.first_name,
            lastName: prof.last_name,
            email: prof.email,
            phone: prof.phone,
            services: services?.map((s) => s.service_type) || [],
            city: prof.city,
            status: prof.status as Professional["status"],
            documentsCount: docs?.length || 0,
            rating: prof.average_rating || undefined,
            reviewsCount: prof.review_count || undefined,
            submittedAt: new Date(prof.created_at).toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            documents: (docs || []).map((doc) => ({
              id: doc.id,
              type: doc.document_type,
              name: doc.document_name,
              url: doc.file_url,
              status: doc.status,
              uploadedAt: doc.uploaded_at,
            })),
          };
        })
      );

      return professionalsWithDocs;
    },
  });

  // Mutation to update professional status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("professionals")
        .update({
          status,
          admin_notes: notes || null,
          approved_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
    },
  });

  const filteredProfessionals = professionals.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      activeTab === "all" ||
      p.status === activeTab ||
      (activeTab === "pending" && p.status === "in_review");
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: professionals.length,
    pending: professionals.filter(
      (p) => p.status === "pending" || p.status === "in_review"
    ).length,
    approved: professionals.filter((p) => p.status === "approved").length,
    rejected: professionals.filter((p) => p.status === "rejected").length,
  };

  const handleApprove = async (id: string, notes?: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: "approved", notes });
      toast({
        title: "Professionista approvato",
        description: "Il professionista è ora visibile ai clienti.",
      });
      setSelectedProfessional(null);
    } catch (error) {
      console.error("Error approving professional:", error);
      toast({
        title: "Errore",
        description: "Impossibile approvare il professionista.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, notes?: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: "rejected", notes });
      toast({
        title: "Professionista rifiutato",
        description: "La richiesta è stata rifiutata.",
      });
      setSelectedProfessional(null);
    } catch (error) {
      console.error("Error rejecting professional:", error);
      toast({
        title: "Errore",
        description: "Impossibile rifiutare il professionista.",
        variant: "destructive",
      });
    }
  };

  const handleCardApprove = (id: string) => handleApprove(id);
  const handleCardReject = (id: string) => handleReject(id);

  const handleView = (id: string) => {
    const prof = professionals.find((p) => p.id === id);
    if (prof) {
      setSelectedProfessional({
        id: prof.id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        email: prof.email,
        phone: prof.phone,
        city: prof.city,
        status: prof.status,
        services: prof.services,
        documents: prof.documents || [],
        createdAt: prof.submittedAt,
        rating: prof.rating,
        reviewCount: prof.reviewsCount,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Professionisti</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci e valida i professionisti della piattaforma
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, email o città..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-border/30"
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 h-12 px-6 rounded-xl border-border/30"
        >
          <Filter className="w-5 h-5" />
          Filtri
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-muted/50 p-1 rounded-xl">
          <TabsTrigger
            value="pending"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">In Attesa</span>
            <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full font-medium">
              {counts.pending}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Approvati</span>
            <span className="bg-success/20 text-success text-xs px-2 py-0.5 rounded-full font-medium">
              {counts.approved}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Rifiutati</span>
            <span className="bg-destructive/20 text-destructive text-xs px-2 py-0.5 rounded-full font-medium">
              {counts.rejected}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Tutti ({counts.all})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/30">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Nessun professionista trovato
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {professionals.length === 0
                  ? "Non ci sono ancora professionisti registrati"
                  : "Prova a modificare i filtri di ricerca"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProfessionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onApprove={handleCardApprove}
                  onReject={handleCardReject}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Panel Sheet */}
      <Sheet
        open={!!selectedProfessional}
        onOpenChange={() => setSelectedProfessional(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Revisione professionista</SheetTitle>
          </SheetHeader>
          {selectedProfessional && (
            <ProfessionalReviewPanel
              professional={selectedProfessional}
              onApprove={handleApprove}
              onReject={handleReject}
              onClose={() => setSelectedProfessional(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
