import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreHorizontal, Mail, Phone, MapPin, Calendar, Ban, MessageCircle, Loader2 } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlockUserDialog } from "@/components/admin/BlockUserDialog";
import { useBlockUser, useUnblockUser } from "@/hooks/useBlockUser";

interface ClientRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  bookingsCount: number;
  totalSpent: number;
  isBlocked: boolean;
  blockedReason: string | null;
  registeredAt: string;
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [blockDialog, setBlockDialog] = useState<ClientRow | null>(null);
  const navigate = useNavigate();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      const [{ data: profiles, error: profilesError }, { data: bookings }] = await Promise.all([
        supabase.from("client_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("client_id, total_amount, status"),
      ]);

      if (profilesError) {
        console.error("Error fetching clients:", profilesError);
        return [];
      }

      const bookingStats = new Map<string, { count: number; spent: number }>();
      (bookings || []).forEach((b) => {
        const current = bookingStats.get(b.client_id) || { count: 0, spent: 0 };
        current.count += 1;
        if (b.status === "completed") {
          current.spent += Number(b.total_amount || 0);
        }
        bookingStats.set(b.client_id, current);
      });

      return (profiles || []).map((p) => {
        const stats = bookingStats.get(p.user_id) || { count: 0, spent: 0 };
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Cliente senza nome";
        return {
          id: p.id,
          userId: p.user_id,
          name,
          email: p.email || "—",
          phone: p.phone || "—",
          city: p.city || "—",
          bookingsCount: stats.count,
          totalSpent: stats.spent,
          isBlocked: !!p.is_blocked,
          blockedReason: p.blocked_reason,
          registeredAt: new Date(p.created_at).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };
      });
    },
  });

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const blockedCount = clients.filter((c) => c.isBlocked).length;

  const handleBlockConfirm = async (reason?: string) => {
    if (!blockDialog) return;
    if (blockDialog.isBlocked) {
      await unblockUser.mutateAsync({ userType: "client", id: blockDialog.id });
    } else {
      await blockUser.mutateAsync({ userType: "client", id: blockDialog.id, reason });
    }
    setBlockDialog(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clienti</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci i clienti registrati sulla piattaforma
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border/30 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/15">
              <Search className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Totale Clienti</p>
          <p className="text-2xl font-bold text-primary">{clients.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/30 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sage/20">
              <Calendar className="w-4 h-4 text-sage-dark" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Attivi</p>
          <p className="text-2xl font-bold text-sage-dark">{clients.length - blockedCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/30 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-straw/25">
              <Calendar className="w-4 h-4 text-straw-dark" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Con prenotazioni</p>
          <p className="text-2xl font-bold text-straw-dark">
            {clients.filter((c) => c.bookingsCount > 0).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border/30 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blush/20">
              <Ban className="w-4 h-4 text-blush-dark" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Bloccati</p>
          <p className="text-2xl font-bold text-blush-dark">{blockedCount}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome, email o città..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
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
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nessun cliente trovato
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-sage-dark font-semibold">
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
                      €{client.totalSpent.toFixed(0)}
                    </TableCell>
                    <TableCell>
                      {!client.isBlocked ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sage/20 text-sage-dark border border-sage/50">
                          Attivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blush/20 text-blush-dark border border-blush/50">
                          Bloccato
                        </span>
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
                          <DropdownMenuItem onClick={() => navigate("/admin/support")}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contatta assistenza
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={client.isBlocked ? "text-sage-dark" : "text-destructive"}
                            onClick={() => setBlockDialog(client)}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {client.isBlocked ? "Sblocca" : "Blocca"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {blockDialog && (
        <BlockUserDialog
          open={!!blockDialog}
          onOpenChange={(open) => !open && setBlockDialog(null)}
          userName={blockDialog.name}
          isBlocked={blockDialog.isBlocked}
          blockedReason={blockDialog.blockedReason}
          onConfirm={handleBlockConfirm}
          isLoading={blockUser.isPending || unblockUser.isPending}
        />
      )}
    </div>
  );
}
