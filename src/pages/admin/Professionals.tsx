import { useState } from "react";
import { Search, Filter, UserCheck, Clock, XCircle, Eye } from "lucide-react";
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

// Mock data with documents
const allProfessionals: (Professional & { documents?: any[] })[] = [
  {
    id: "1",
    name: "Maria Rossi",
    email: "maria.rossi@email.com",
    services: ["cleaning", "ironing"],
    city: "Milano",
    status: "pending",
    documentsCount: 1,
    submittedAt: "3 Feb 2026",
    documents: [
      {
        id: "doc1",
        type: "id_card",
        name: "Carta_identita_fronte.jpg",
        url: "",
        status: "pending",
        uploadedAt: "2026-02-03T10:00:00Z",
      },
    ],
  },
  {
    id: "2",
    name: "Giuseppe Verdi",
    email: "giuseppe.v@email.com",
    services: ["babysitter"],
    city: "Roma",
    status: "pending",
    documentsCount: 1,
    submittedAt: "2 Feb 2026",
    documents: [
      {
        id: "doc2",
        type: "id_card",
        name: "CI_Giuseppe.pdf",
        url: "",
        status: "pending",
        uploadedAt: "2026-02-02T14:30:00Z",
      },
    ],
  },
  {
    id: "3",
    name: "Anna Bianchi",
    email: "anna.bianchi@email.com",
    services: ["dog_sitter"],
    city: "Napoli",
    status: "in_review",
    documentsCount: 1,
    submittedAt: "1 Feb 2026",
    documents: [
      {
        id: "doc3",
        type: "id_card",
        name: "Documento_Anna.jpg",
        url: "",
        status: "approved",
        uploadedAt: "2026-02-01T09:00:00Z",
      },
    ],
  },
  {
    id: "4",
    name: "Luca Marino",
    email: "luca.marino@email.com",
    services: ["cleaning", "office_cleaning", "sanitization"],
    city: "Torino",
    status: "approved",
    documentsCount: 1,
    rating: 4.9,
    reviewsCount: 47,
    submittedAt: "15 Gen 2026",
    documents: [
      {
        id: "doc4",
        type: "id_card",
        name: "ID_Luca.jpg",
        url: "",
        status: "approved",
        uploadedAt: "2026-01-15T11:00:00Z",
      },
    ],
  },
  {
    id: "5",
    name: "Francesca Neri",
    email: "f.neri@email.com",
    services: ["babysitter"],
    city: "Firenze",
    status: "approved",
    documentsCount: 1,
    rating: 4.7,
    reviewsCount: 32,
    submittedAt: "10 Gen 2026",
    documents: [
      {
        id: "doc5",
        type: "id_card",
        name: "CartaID_Francesca.pdf",
        url: "",
        status: "approved",
        uploadedAt: "2026-01-10T16:00:00Z",
      },
    ],
  },
  {
    id: "6",
    name: "Marco Esposito",
    email: "m.esposito@email.com",
    services: ["dog_sitter"],
    city: "Bologna",
    status: "rejected",
    documentsCount: 1,
    submittedAt: "28 Dic 2025",
    documents: [
      {
        id: "doc6",
        type: "id_card",
        name: "Doc_Marco.jpg",
        url: "",
        status: "rejected",
        uploadedAt: "2025-12-28T12:00:00Z",
      },
    ],
  },
];

export default function Professionals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);
  const { toast } = useToast();

  const filteredProfessionals = allProfessionals.filter((p) => {
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
    all: allProfessionals.length,
    pending: allProfessionals.filter((p) => p.status === "pending" || p.status === "in_review").length,
    approved: allProfessionals.filter((p) => p.status === "approved").length,
    rejected: allProfessionals.filter((p) => p.status === "rejected").length,
  };

  const handleApprove = (id: string, notes?: string) => {
    console.log("Approved:", id, "Notes:", notes);
    toast({
      title: "Professionista approvato",
      description: "Il professionista è ora visibile ai clienti.",
    });
  };

  const handleReject = (id: string, notes?: string) => {
    console.log("Rejected:", id, "Notes:", notes);
    toast({
      title: "Professionista rifiutato",
      description: "La richiesta è stata rifiutata.",
    });
  };

  const handleCardApprove = (id: string) => handleApprove(id);
  const handleCardReject = (id: string) => handleReject(id);

  const handleView = (id: string) => {
    const prof = allProfessionals.find((p) => p.id === id);
    if (prof) {
      const [firstName, ...lastNameParts] = prof.name.split(" ");
      setSelectedProfessional({
        id: prof.id,
        firstName,
        lastName: lastNameParts.join(" "),
        email: prof.email,
        phone: "+39 333 1234567",
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, email o città..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtri
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">In Attesa</span>
            <span className="bg-warning/20 text-warning text-xs px-1.5 py-0.5 rounded-full">
              {counts.pending}
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Approvati</span>
            <span className="bg-success/20 text-success text-xs px-1.5 py-0.5 rounded-full">
              {counts.approved}
            </span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Rifiutati</span>
            <span className="bg-destructive/20 text-destructive text-xs px-1.5 py-0.5 rounded-full">
              {counts.rejected}
            </span>
          </TabsTrigger>
          <TabsTrigger value="all">
            Tutti ({counts.all})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredProfessionals.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">
                Nessun professionista trovato
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
      <Sheet open={!!selectedProfessional} onOpenChange={() => setSelectedProfessional(null)}>
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
