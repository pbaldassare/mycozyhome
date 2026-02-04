import { useState } from "react";
import { Search, Filter, UserCheck, Clock, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfessionalCard, Professional } from "@/components/admin/ProfessionalCard";

// Mock data
const allProfessionals: Professional[] = [
  {
    id: "1",
    name: "Maria Rossi",
    email: "maria.rossi@email.com",
    services: ["cleaning", "ironing"],
    city: "Milano",
    status: "pending",
    documentsCount: 3,
    submittedAt: "3 Feb 2026",
  },
  {
    id: "2",
    name: "Giuseppe Verdi",
    email: "giuseppe.v@email.com",
    services: ["babysitter"],
    city: "Roma",
    status: "pending",
    documentsCount: 5,
    submittedAt: "2 Feb 2026",
  },
  {
    id: "3",
    name: "Anna Bianchi",
    email: "anna.bianchi@email.com",
    services: ["dog_sitter"],
    city: "Napoli",
    status: "pending",
    documentsCount: 4,
    submittedAt: "1 Feb 2026",
  },
  {
    id: "4",
    name: "Luca Marino",
    email: "luca.marino@email.com",
    services: ["cleaning", "office_cleaning", "sanitization"],
    city: "Torino",
    status: "approved",
    documentsCount: 4,
    rating: 4.9,
    reviewsCount: 47,
    submittedAt: "15 Gen 2026",
  },
  {
    id: "5",
    name: "Francesca Neri",
    email: "f.neri@email.com",
    services: ["babysitter"],
    city: "Firenze",
    status: "approved",
    documentsCount: 6,
    rating: 4.7,
    reviewsCount: 32,
    submittedAt: "10 Gen 2026",
  },
  {
    id: "6",
    name: "Marco Esposito",
    email: "m.esposito@email.com",
    services: ["dog_sitter"],
    city: "Bologna",
    status: "rejected",
    documentsCount: 2,
    submittedAt: "28 Dic 2025",
  },
];

export default function Professionals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const filteredProfessionals = allProfessionals.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = p.status === activeTab || activeTab === "all";
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: allProfessionals.length,
    pending: allProfessionals.filter((p) => p.status === "pending").length,
    approved: allProfessionals.filter((p) => p.status === "approved").length,
    rejected: allProfessionals.filter((p) => p.status === "rejected").length,
  };

  const handleApprove = (id: string) => {
    console.log("Approved:", id);
  };

  const handleReject = (id: string) => {
    console.log("Rejected:", id);
  };

  const handleView = (id: string) => {
    console.log("View:", id);
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
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
