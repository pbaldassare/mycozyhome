/** Tema dell'interfaccia: preferenza del dispositivo, salvata in locale. */
export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "mycozyhome-theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

export function getTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && media().matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Senza storage il tema vale solo per questa sessione.
  }
  apply(choice);
}

/** Da chiamare all'avvio: applica il tema e segue il sistema se scelto. */
export function initTheme() {
  apply(getTheme());
  media().addEventListener("change", () => {
    if (getTheme() === "system") apply("system");
  });
}
