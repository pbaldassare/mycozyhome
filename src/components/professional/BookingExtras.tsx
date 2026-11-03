import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/errors";

const PHOTO_BUCKET = "mycozyhome-booking-photos";
const LOCATION_EVERY_MS = 20_000;

/** "Sono in viaggio": segna la partenza e condivide la posizione col cliente fino al check-in. */
export function EnRouteButton({
  bookingId,
  enRouteAt,
  checkedIn,
}: {
  bookingId: string;
  enRouteAt: string | null;
  checkedIn: boolean;
}) {
  const queryClient = useQueryClient();
  const [started, setStarted] = useState(!!enRouteAt);
  const [starting, setStarting] = useState(false);
  const lastSent = useRef(0);
  const sharing = started && !checkedIn;

  useEffect(() => {
    if (!sharing || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < LOCATION_EVERY_MS) return;
        lastSent.current = now;
        supabase
          .rpc("professional_update_location", {
            p_booking_id: bookingId,
            p_latitude: pos.coords.latitude,
            p_longitude: pos.coords.longitude,
          })
          .then(({ error }) => error && console.error(error));
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [sharing, bookingId]);

  if (checkedIn) return null;

  if (sharing) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-primary-light p-3 text-sm text-primary">
        <Navigation className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Stai condividendo la posizione con il cliente</span>
      </div>
    );
  }

  const start = async () => {
    setStarting(true);
    const { error } = await supabase.rpc("professional_set_en_route", { p_booking_id: bookingId });
    setStarting(false);
    if (error) {
      toast.error(toUserMessage(error));
      return;
    }
    setStarted(true);
    queryClient.invalidateQueries({ queryKey: ["professional-all-bookings"] });
    toast.success("Il cliente vede che stai arrivando");
  };

  return (
    <Button size="sm" className="mt-3 w-full" onClick={start} disabled={starting}>
      {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
      Sono in viaggio
    </Button>
  );
}

/** Foto prima/dopo del lavoro, visibili al cliente. */
export function BookingPhotos({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const queryKey = ["booking-photos", bookingId];

  const { data: photos } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_photos")
        .select("id, kind, path")
        .eq("booking_id", bookingId)
        .in("kind", ["before", "after"])
        .order("created_at");
      if (error) throw error;
      if (!data.length) return [];
      const { data: signed } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(data.map((p) => p.path), 3600);
      return data.map((p, i) => ({ ...p, url: signed?.[i]?.signedUrl ?? null }));
    },
    retry: false,
  });

  const upload = async (kind: "before" | "after", file: File | undefined) => {
    if (!file) return;
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${bookingId}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("booking_photos").insert({ booking_id: bookingId, kind, path });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
      toast.success(kind === "before" ? "Foto \"prima\" caricata" : "Foto \"dopo\" caricata");
    } catch (e) {
      toast.error(toUserMessage(e, "Caricamento non riuscito. Riprova."));
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {(["before", "after"] as const).map((kind) => (
          <label
            key={kind}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 p-3 text-sm font-medium text-primary hover:bg-primary-light"
          >
            {uploading === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Foto {kind === "before" ? "prima" : "dopo"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={!!uploading}
              onChange={(e) => {
                upload(kind, e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        ))}
      </div>
      {!!photos?.length && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((p) =>
            p.url ? (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="relative shrink-0">
                <img src={p.url} alt={p.kind === "before" ? "Prima" : "Dopo"} className="h-16 w-16 rounded-xl object-cover" />
                <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1 text-[10px] text-white">
                  {p.kind === "before" ? "Prima" : "Dopo"}
                </span>
              </a>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
