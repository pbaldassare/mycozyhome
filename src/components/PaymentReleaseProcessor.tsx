import { useEffect } from "react";
import { useProcessPendingReleases } from "@/hooks/useWallet";

/** Runs pending payment releases when the app loads (after dispute window). */
export function PaymentReleaseProcessor() {
  const processReleases = useProcessPendingReleases();

  useEffect(() => {
    processReleases.mutate();
  }, []);

  return null;
}
