import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PrivateBucket =
  | "mycozyhome-chat-attachments"
  | "mycozyhome-dispute-evidence"
  | "mycozyhome-professional-documents"
  | "mycozyhome-support-attachments";

/**
 * I bucket privati si leggono solo con URL firmati e brevi. Nel DB salviamo il
 * percorso del file; i record vecchi contengono un URL completo, da cui
 * ricaviamo il percorso.
 */
export function storagePath(bucket: PrivateBucket, value: string): string {
  const marker = `/${bucket}/`;
  const index = value.indexOf(marker);
  if (value.startsWith("http") && index !== -1) {
    return decodeURIComponent(value.slice(index + marker.length).split("?")[0]);
  }
  return value;
}

const SIGNED_URL_SECONDS = 60 * 60;

export function useSignedUrl(bucket: PrivateBucket, value: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", bucket, value],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath(bucket, value!), SIGNED_URL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!value,
    staleTime: (SIGNED_URL_SECONDS - 300) * 1000,
    retry: 1,
  });
}
