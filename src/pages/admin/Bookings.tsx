import { useState } from "react";
import { Search, Filter, Calendar, Clock, Euro, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  service: string;
  client: string;
  professional: string;
  date: string;
  time: string;
  duration: string;
  amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

const bookings: Booking[] = [
  {
    id: "BK-001",
    service: "Pulizia Casa",
    client: "Paolo Colombo",
    professional: "Maria Rossi",
    date: "5 Feb 2026",
    time: "09:00",
    duration: "3h",
    amount: 45,
    status: "confirmed",
  },
  {
    id: "BK-002",
    service: "Babysitter",
    client: "Giulia Romano",
    professional: "Francesca Neri",
    date: "5 Feb 2026",
    time: "14:00",
    duration: "5h",
    amount: 50,
    status: "pending",
  },
  {
    id: "BK-003",
    service: "Stiratura",
    client: "Chiara Ricci",
    professional: "Anna Bianchi",
    date: "4 Feb 2026",
    time: "10:00",
    duration: "2h",
    amount: 24,
    status: "completed",
  },
  {
    id: "BK-004",
    service: "Dog Sitter",
    client: "Matteo Conti",
    professional: "Luca Marino",
    date: "4 Feb 2026",
    time: "08:00",
    duration: "4h",
    amount: 32,
    status: "completed",
  },
  {
    id: "BK-005",
    service: "Sanificazione",
    client: "Alessandro Ferrari",
    professional: "Giuseppe Verdi",
    date: "3 Feb 2026",
    time: "11:00",
    duration: "2h",
    amount: 80,
    status: "cancelled",
  },
];

const statusConfig = {
  pending: { label: "In Attesa", className: "status-pending" },
  confirmed: { label: "Confermato", className: "bg-primary/10 text-primary" },
  completed: { label: "Completato", className: "status-approved" },
  cancelled: { label: "Annullato", className: "status-rejected" },
};

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.professional.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === "all" || b.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Prenotazioni</h1>
        <p className="text-muted-foreground mt-1">
          Visualizza tutte le prenotazioni della piattaforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Oggi</p>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Questa Settimana</p>
          <p className="text-2xl font-bold">156</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Questo Mese</p>
          <p className="text-2xl font-bold">523</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Volume Totale</p>
          <p className="text-2xl font-bold">€12,450</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per ID, cliente, professionista..."
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
        <TabsList>
          <TabsTrigger value="all">Tutte ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">In Attesa ({counts.pending})</TabsTrigger>
          <TabsTrigger value="confirmed">Confermate ({counts.confirmed})</TabsTrigger>
          <TabsTrigger value="completed">Completate ({counts.completed})</TabsTrigger>
          <TabsTrigger value="cancelled">Annullate ({counts.cancelled})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Servizio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Professionista</TableHead>
                  <TableHead>Data/Ora</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const status = statusConfig[booking.status];
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{booking.service}</Badge>
                      </TableCell>
                      <TableCell>{booking.client}</TableCell>
                      <TableCell>{booking.professional}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {booking.time} ({booking.duration})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1 font-medium">
                          <Euro className="w-3.5 h-3.5" />
                          {booking.amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn("status-badge", status.className)}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
