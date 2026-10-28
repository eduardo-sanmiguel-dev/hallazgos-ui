import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { parseApiError } from "@services";

export type EditRecordStatus =
  "idle" | "loading" | "ready" | "notFound" | "error";

// Registro que se edita (`?id=N`). Antes la carga no tenía estados: mientras
// llegaba se veía el formulario vacío (lo que se escribiera se pisaba) y, si
// fallaba o no existía, quedaba vacío sin aviso. Sin id ("Nuevo …"), idle.
//
//   const record = useEditRecord(id, Service.findOne, (data) => setForm(…));
//   if (isEditRecordPending(record.status)) return <EditRecordState … />;
export function useEditRecord<T>(
  id: number,
  load: (id: number) => Promise<T>,
  onLoad: (data: T) => void,
) {
  const [status, setStatus] = useState<EditRecordStatus>(
    id ? "loading" : "idle",
  );
  const [attempt, setAttempt] = useState(0);

  // Lo último, sin volver a pedir el registro en cada render.
  const loadRef = useRef(load);
  const onLoadRef = useRef(onLoad);
  useLayoutEffect(() => {
    loadRef.current = load;
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    if (!id) {
      setStatus("idle");
      return;
    }

    let ignore = false;
    setStatus("loading");
    loadRef
      .current(id)
      .then((data) => {
        if (ignore) return;
        onLoadRef.current(data);
        setStatus("ready");
      })
      // El aviso lo muestra el interceptor.
      .catch((error) => {
        if (ignore) return;
        setStatus(
          parseApiError(error).kind === "notFound" ? "notFound" : "error",
        );
      });
    return () => {
      ignore = true;
    };
  }, [id, attempt]);

  return { status, retry: () => setAttempt((count) => count + 1) };
}

/** Todavía no se puede mostrar el formulario (cargando, no existe o falló). */
export const isEditRecordPending = (status: EditRecordStatus) =>
  status === "loading" || status === "notFound" || status === "error";
