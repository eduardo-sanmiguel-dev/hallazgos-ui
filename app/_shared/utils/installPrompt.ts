// Instalación de la app (PWA). Chrome y Edge disparan `beforeinstallprompt`
// una sola vez, poco después de cargar la página: se escucha desde
// instrumentation-client.ts (antes de que la app sea interactiva) y se guarda
// aquí para que el botón "Instalar app" lo use cuando el usuario quiera.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * - "prompt": el navegador puede instalarla con su diálogo nativo.
 * - "ios": Safari de iPhone/iPad no tiene diálogo; hay que explicar los pasos.
 * - null: ya está instalada o el navegador no lo permite (sin botón).
 */
export type InstallMode = "prompt" | "ios" | null;

/** Decide qué ofrecer según el navegador (lógica pura, sin `window`). */
export const getInstallMode = ({
  hasPrompt,
  isStandalone,
  userAgent,
  maxTouchPoints = 0,
}: {
  hasPrompt: boolean;
  isStandalone: boolean;
  userAgent: string;
  maxTouchPoints?: number;
}): InstallMode => {
  if (isStandalone) return null;
  if (hasPrompt) return "prompt";

  // iPadOS se presenta como Mac de escritorio, pero con pantalla táctil.
  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  // En iOS solo Safari puede agregar a inicio (Chrome/Firefox/Edge de iOS no).
  const isIOSSafari = isIOS && !/CriOS|FxiOS|EdgiOS/i.test(userAgent);

  return isIOSSafari ? "ios" : null;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const isStandalone = () =>
  installed ||
  window.matchMedia("(display-mode: standalone)").matches ||
  // Safari de iOS
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Empieza a escuchar el evento del navegador; llamar una vez al cargar. */
export const listenInstallPrompt = () => {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Sin esto Chrome puede mostrar su propio aviso; el botón lo reemplaza.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    emit();
  });
};

export const subscribeInstallMode = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getCurrentInstallMode = (): InstallMode =>
  getInstallMode({
    hasPrompt: !!deferredPrompt,
    isStandalone: isStandalone(),
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  });

/** Abre el diálogo nativo de instalación. Devuelve si el usuario aceptó. */
export const promptInstall = async () => {
  const event = deferredPrompt;
  if (!event) return false;

  // El evento solo se puede usar una vez.
  deferredPrompt = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome === "accepted";
};
