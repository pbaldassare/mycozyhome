import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";

initTheme();

// Le vecchie versioni dell'app salvavano le risposte Supabase nella cache del
// service worker: vanno eliminate perché contengono dati personali.
if ("caches" in window) {
  caches.delete("supabase-cache").catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
