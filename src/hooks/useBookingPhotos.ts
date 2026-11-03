import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BOOKING_PHOTOS_BUCKET = "mycozyhome-booking-photos";
const SIGNED_URL_SECONDS = 60 * 60;

export interface SignedPhoto {
  path: string;
  url: string;
  kind?: string;
}

/** URL firmati per un elenco di percorsi del bucket delle foto. */
async function signPaths(paths: string[]): Promise<Map<string, string>> {
  if (!paths.length) return new Map();
  const { data, error } = await supabase.storage
    .from(BOOKING_PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;
  return new Map(data.filter((d) => d.signedUrl).map((d) => [d.path ?? "", d.signedUrl]));
}

/** Foto di una prenotazione (prima/dopo del professionista, foto della recensione). */
export function useBookingPhotos(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking-photos", bookingId],
    queryFn: async (): Promise<SignedPhoto[]> => {
      const { data, error } = await supabase
        .from("booking_photos")
        .select("path, kind")
        .eq("booking_id", bookingId!)
        .order("created_at");
      if (error) throw error;
      const urls = await signPaths(data.map((p) => p.path));
      return data.flatMap((p) => (urls.has(p.path) ? [{ path: p.path, kind: p.kind, url: urls.get(p.path)! }] : []));
    },
    enabled: !!bookingId,
    staleTime: (SIGNED_URL_SECONDS - 300) * 1000,
    retry: false,
  });
}

/** Foto collegate alle recensioni visibili di un professionista. */
export function useReviewPhotos(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["review-photos", professionalId],
    queryFn: async (): Promise<SignedPhoto[]> => {
      const { data, error } = await supabase.rpc("review_photos", { p_professional_id: professionalId! });
      if (error) throw error;
      const urls = await signPaths(data.map((p) => p.path));
      return data.flatMap((p) => (urls.has(p.path) ? [{ path: p.path, url: urls.get(p.path)! }] : []));
    },
    enabled: !!professionalId,
    staleTime: (SIGNED_URL_SECONDS - 300) * 1000,
    retry: false,
  });
}

/** Carica le foto della recensione nella cartella della prenotazione. */
export async function uploadReviewPhotos(bookingId: string, files: File[]): Promise<void> {
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${bookingId}/review-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BOOKING_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw uploadError;
    const { error } = await supabase.from("booking_photos").insert({ booking_id: bookingId, kind: "review", path });
    if (error) throw error;
  }
}
