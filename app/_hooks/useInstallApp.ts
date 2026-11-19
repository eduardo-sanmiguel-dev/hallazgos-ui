import { useSyncExternalStore } from "react";

import {
  getCurrentInstallMode,
  promptInstall,
  subscribeInstallMode,
} from "@shared/utils/installPrompt";

/**
 * Si la app se puede instalar y cómo ("prompt" o "ios"); null oculta el
 * botón.
 */
export function useInstallApp() {
  const mode = useSyncExternalStore(subscribeInstallMode, getCurrentInstallMode);

  return { mode, promptInstall };
}
