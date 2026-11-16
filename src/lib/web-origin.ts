import { Capacitor } from "@capacitor/core";

// Nell'app Android l'origine è https://localhost: i link nelle email e negli
// inviti devono puntare al sito pubblico.
export const WEB_ORIGIN = Capacitor.isNativePlatform() ? "https://mycozyhome.pages.dev" : window.location.origin;
