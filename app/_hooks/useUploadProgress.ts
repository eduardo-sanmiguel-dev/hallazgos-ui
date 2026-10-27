import { useCallback, useState } from "react";

import type { AxiosProgressEvent } from "axios";

/**
 * Progreso de una subida con axios, listo para `PhotoCapture`:
 *   const upload = useUploadProgress();
 *   Service.create(formData, { onUploadProgress: upload.onUploadProgress })
 *     .finally(upload.reset);
 *   <PhotoCapture uploadProgress={upload.progress} ... />
 * `progress` es null cuando no se está subiendo.
 */
export function useUploadProgress() {
  const [progress, setProgress] = useState<number | null>(null);

  const onUploadProgress = useCallback((event: AxiosProgressEvent) => {
    // Sin `total` (el navegador no lo conoce) se muestra 0 % hasta terminar.
    setProgress(
      event.total ? Math.min(100, (event.loaded / event.total) * 100) : 0,
    );
  }, []);

  const reset = useCallback(() => setProgress(null), []);

  return { progress, onUploadProgress, reset };
}
