import { useSyncExternalStore } from "react";

import {
  getCurrentInstallMode,
  promptInstall,
  subscribeInstallMode,
} from "@shared/utils/installPrompt";

/**
 * Si la app se puede instalar y cómo ("prompt" o "ios"); null oculta el
 * botón. En el servidor no hay navegador: también null.
 */
export function useInstallApp() {
  const mode = useSyncExternalStore(
    subscribeInstallMode,
    getCurrentInstallMode,
    () => null,
  );

  return { mode, promptInstall };
}
