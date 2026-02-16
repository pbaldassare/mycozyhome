import { useState } from "react";
import { Search, Filter, Calendar, Clock, Euro, Eye, Navigation, MapPin, LogIn, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "In Attesa", className: "status-pending" },
  confirmed: { label: "Confermato", className: "bg-primary/10 text-primary" },
  completed: { label: "Completato", className: "status-approved" },
  cancelled: { label: "Annullato", className: "status-rejected" },
};

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, professionals(first_name, last_name)")
        .order("scheduled_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const bookingIds = bookings.map((b) => b.id);

  const { data: trackingData = [] } = useQuery({
    queryKey: ["admin-tracking", bookingIds],
    queryFn: async () => {
      if (!bookingIds.length) return [];
      const { data, error } = await supabase
        .from("booking_tracking")
        .select("*")
        .in("booking_id", bookingIds);
      if (error) throw error;
      return data || [];
    },
    enabled: bookingIds.length > 0,
  });

  const trackingMap = new Map(trackingData.map((t) => [t.booking_id, t]));

  const filteredBookings = bookings.filter((b) => {
    const prof = b.professionals as any;
    const profName = prof ? `${prof.first_name} ${prof.last_name}` : "";
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service_type.toLowerCase().includes(searchQuery.toLowerCase());
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

  const selectedTracking = selectedBookingId ? trackingMap.get(selectedBookingId) : null;
  const selectedBooking = selectedBookingId ? bookings.find((b) => b.id === selectedBookingId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prenotazioni</h1>
        <p className="text-muted-foreground mt-1">
          Visualizza tutte le prenotazioni della piattaforma
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Totali</p>
          <p className="text-2xl font-bold">{counts.all}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">In Attesa</p>
          <p className="text-2xl font-bold">{counts.pending}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Confermate</p>
          <p className="text-2xl font-bold">{counts.confirmed}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Completate</p>
          <p className="text-2xl font-bold">{counts.completed}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per ID, professionista, servizio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Caricamento...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servizio</TableHead>
                    <TableHead>Professionista</TableHead>
                    <TableHead>Data/Ora</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const status = statusConfig[booking.status] || statusConfig.pending;
                    const prof = booking.professionals as any;
                    const profName = prof ? `${prof.first_name} ${prof.last_name}` : "—";
                    const tracking = trackingMap.get(booking.id);

                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Badge variant="secondary">{booking.service_type}</Badge>
                        </TableCell>
                        <TableCell>{profName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {format(new Date(booking.scheduled_date), "d MMM yyyy", { locale: it })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {booking.scheduled_time_start?.slice(0, 5)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1 font-medium">
                            <Euro className="w-3.5 h-3.5" />
                            {booking.total_amount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("status-badge", status.className)}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {tracking ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className={cn(
                                    tracking.status === "completed" && "bg-green-100 text-green-700",
                                    tracking.status === "checked_in" && "bg-blue-100 text-blue-700",
                                    tracking.check_in_in_range === false && "bg-orange-100 text-orange-700",
                                  )}>
                                    <Navigation className="h-3 w-3 mr-1" />
                                    {tracking.status === "completed" ? "Completato" : "In corso"}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {tracking.actual_hours != null
                                    ? `Ore effettive: ${Number(tracking.actual_hours).toFixed(1)}h`
                                    : "Check-in effettuato"}
                                  {tracking.check_in_in_range === false && " ⚠️ Fuori zona"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedBookingId(booking.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nessuna prenotazione trovata
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog with Tracking */}
      <Dialog open={!!selectedBookingId} onOpenChange={(open) => !open && setSelectedBookingId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Prenotazione</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Servizio</p>
                  <p className="font-medium">{selectedBooking.service_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{format(new Date(selectedBooking.scheduled_date), "d MMM yyyy", { locale: it })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Orario previsto</p>
                  <p className="font-medium">{selectedBooking.scheduled_time_start?.slice(0, 5)} - {selectedBooking.scheduled_time_end?.slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ore / Importo</p>
                  <p className="font-medium">{selectedBooking.total_hours}h — €{selectedBooking.total_amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Indirizzo</p>
                  <p className="font-medium">{selectedBooking.address}</p>
                  {selectedBooking.latitude && selectedBooking.longitude && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <MapPin className="inline w-3 h-3 mr-0.5" />
                      {Number(selectedBooking.latitude).toFixed(5)}, {Number(selectedBooking.longitude).toFixed(5)}
                    </p>
                  )}
                </div>
              </div>

              {/* Tracking Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4" /> Tracking Geolocalizzato
                </h4>
                {selectedTracking ? (
                  <div className="space-y-3">
                    {/* Check-in */}
                    <div className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <LogIn className="w-4 h-4 text-green-600" />
                        Check-in
                        {selectedTracking.check_in_in_range === false && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs ml-auto">⚠️ Fuori zona</Badge>
                        )}
                        {selectedTracking.check_in_in_range === true && (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs ml-auto">✅ In zona</Badge>
                        )}
                      </div>
                      {selectedTracking.check_in_at && (
                        <p className="text-sm">
                          <Clock className="inline w-3 h-3 mr-1 text-muted-foreground" />
                          {format(new Date(selectedTracking.check_in_at), "d MMM yyyy HH:mm:ss", { locale: it })}
                        </p>
                      )}
                      {selectedTracking.check_in_latitude != null && (
                        <p className="text-xs text-muted-foreground">
                          <MapPin className="inline w-3 h-3 mr-0.5" />
                          {Number(selectedTracking.check_in_latitude).toFixed(5)}, {Number(selectedTracking.check_in_longitude).toFixed(5)}
                          {selectedTracking.check_in_distance_m != null && (
                            <span className="ml-2">({selectedTracking.check_in_distance_m}m dall'indirizzo)</span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Check-out */}
                    {selectedTracking.check_out_at ? (
                      <div className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <LogOut className="w-4 h-4 text-red-600" />
                          Check-out
                          {selectedTracking.check_out_in_range === false && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs ml-auto">⚠️ Fuori zona</Badge>
                          )}
                          {selectedTracking.check_out_in_range === true && (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-xs ml-auto">✅ In zona</Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          <Clock className="inline w-3 h-3 mr-1 text-muted-foreground" />
                          {format(new Date(selectedTracking.check_out_at), "d MMM yyyy HH:mm:ss", { locale: it })}
                        </p>
                        {selectedTracking.check_out_latitude != null && (
                          <p className="text-xs text-muted-foreground">
                            <MapPin className="inline w-3 h-3 mr-0.5" />
                            {Number(selectedTracking.check_out_latitude).toFixed(5)}, {Number(selectedTracking.check_out_longitude).toFixed(5)}
                            {selectedTracking.check_out_distance_m != null && (
                              <span className="ml-2">({selectedTracking.check_out_distance_m}m dall'indirizzo)</span>
                            )}
                          </p>
                        )}
                        {selectedTracking.actual_hours != null && (
                          <p className="text-sm font-medium mt-1">
                            ⏱️ Ore effettive: {Number(selectedTracking.actual_hours).toFixed(1)}h
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Check-out non ancora effettuato</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nessun dato di tracking disponibile per questa prenotazione</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
