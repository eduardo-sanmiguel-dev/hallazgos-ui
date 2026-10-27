import { useCallback, useRef } from "react";

import { v4 as uuidv4 } from "uuid";

import { keepsIdempotencyKey } from "@services";

// Clave de idempotencia de un envío (header Idempotency-Key). Dura lo que
// dura el formulario abierto: la reutilizan "Reintentar" y un segundo toque
// de "Guardar" después de un corte de red o un tiempo agotado, así que el API
// no duplica el registro ni los correos. Se cambia tras guardar bien, tras un
// error definitivo (datos, permisos, estado) o al cambiar `scope` (p. ej. el
// id del hallazgo en un diálogo que se reutiliza): una clave nunca pasa de un
// envío a otro distinto.
//
//   const submission = useIdempotencyKey(idRow);
//   Service.create(formData, { idempotencyKey: submission.key() })
//     .then(() => submission.settle())
//     .catch(submission.settle);
export function useIdempotencyKey(scope?: unknown) {
  const current = useRef<{ scope: unknown; key: string } | null>(null);

  const key = useCallback(() => {
    if (!current.current || !Object.is(current.current.scope, scope)) {
      current.current = { scope, key: uuidv4() };
    }
    return current.current.key;
  }, [scope]);

  /**
   * Sin error (guardado), con un error definitivo o al descartar lo
   * capturado: el próximo envío lleva otra clave.
   */
  const settle = useCallback((error?: unknown) => {
    if (error === undefined || !keepsIdempotencyKey(error)) {
      current.current = null;
    }
  }, []);

  return { key, settle };
}
