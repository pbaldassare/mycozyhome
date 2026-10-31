import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";

initTheme();

// Dopo un deploy i chunk della versione precedente non esistono più: si ricarica.
window.addEventListener("vite:preloadError", (event) => {
  const key = "mycozyhome-chunk-reload";
  try {
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 10_000) return; // evita un ciclo di ricariche
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // Senza storage si ricarica comunque una volta.
  }
  event.preventDefault();
  window.location.reload();
});

// Le vecchie versioni dell'app salvavano le risposte Supabase nella cache del
// service worker: vanno eliminate perché contengono dati personali.
if ("caches" in window) {
  caches.delete("supabase-cache").catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
