import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";
import { registerSW } from "virtual:pwa-register";

initTheme();

// iPhone riprende l'app installata senza ricaricarla, quindi non vede mai la
// versione nuova: si controlla al ritorno nell'app e ogni 10 minuti.
// Con autoUpdate, quando arriva una versione nuova la pagina si ricarica da sola.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => reg.update().catch(() => undefined);
    setInterval(check, 10 * 60_000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  },
});

// Dopo un deploy i chunk della versione precedente non esistono più.
// Si svuota la cache del service worker (che altrimenti ripropone la versione
// vecchia) e si ricarica: al riavvio arriva per forza quella nuova.
window.addEventListener("vite:preloadError", (event) => {
  const key = "mycozyhome-chunk-reload";
  try {
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 30_000) return; // evita un ciclo di ricariche
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // Senza storage si ricarica comunque una volta.
  }
  event.preventDefault();
  const reset = async () => {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  };
  reset().catch(() => undefined).finally(() => window.location.reload());
});

// Le vecchie versioni dell'app salvavano le risposte Supabase nella cache del
// service worker: vanno eliminate perché contengono dati personali.
if ("caches" in window) {
  caches.delete("supabase-cache").catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
