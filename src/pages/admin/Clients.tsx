import { useState } from "react";
import { Search, MoreHorizontal, Mail, Phone, MapPin, Calendar, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  bookingsCount: number;
  totalSpent: number;
  status: "active" | "blocked";
  registeredAt: string;
}

const clients: Client[] = [
  {
    id: "1",
    name: "Paolo Colombo",
    email: "paolo.colombo@email.com",
    phone: "+39 333 1234567",
    city: "Milano",
    bookingsCount: 12,
    totalSpent: 580,
    status: "active",
    registeredAt: "15 Gen 2026",
  },
  {
    id: "2",
    name: "Giulia Romano",
    email: "g.romano@email.com",
    phone: "+39 347 9876543",
    city: "Roma",
    bookingsCount: 8,
    totalSpent: 320,
    status: "active",
    registeredAt: "20 Gen 2026",
  },
  {
    id: "3",
    name: "Alessandro Ferrari",
    email: "a.ferrari@email.com",
    phone: "+39 320 5551234",
    city: "Torino",
    bookingsCount: 3,
    totalSpent: 120,
    status: "blocked",
    registeredAt: "5 Feb 2026",
  },
  {
    id: "4",
    name: "Chiara Ricci",
    email: "chiara.ricci@email.com",
    phone: "+39 338 7778899",
    city: "Napoli",
    bookingsCount: 15,
    totalSpent: 890,
    status: "active",
    registeredAt: "1 Dic 2025",
  },
  {
    id: "5",
    name: "Matteo Conti",
    email: "m.conti@email.com",
    phone: "+39 349 2223344",
    city: "Bologna",
    bookingsCount: 6,
    totalSpent: 240,
    status: "active",
    registeredAt: "28 Gen 2026",
  },
];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Clienti</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci i clienti registrati sulla piattaforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Totale Clienti</p>
          <p className="text-2xl font-bold">2,847</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Attivi Questo Mese</p>
          <p className="text-2xl font-bold">1,234</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Nuovi Questa Settimana</p>
          <p className="text-2xl font-bold">89</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Bloccati</p>
          <p className="text-2xl font-bold text-destructive">12</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome, email o città..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contatti</TableHead>
              <TableHead>Città</TableHead>
              <TableHead className="text-center">Prenotazioni</TableHead>
              <TableHead className="text-right">Speso</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {client.registeredAt}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {client.email}
                    </p>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {client.phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {client.city}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{client.bookingsCount}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  €{client.totalSpent}
                </TableCell>
                <TableCell>
                  {client.status === "active" ? (
                    <span className="status-badge status-approved">Attivo</span>
                  ) : (
                    <span className="status-badge status-rejected">Bloccato</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Visualizza Profilo</DropdownMenuItem>
                      <DropdownMenuItem>Storico Prenotazioni</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Ban className="w-4 h-4 mr-2" />
                        {client.status === "active" ? "Blocca" : "Sblocca"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
