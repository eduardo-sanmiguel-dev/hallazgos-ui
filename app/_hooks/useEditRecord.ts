import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { parseApiError } from "@services";

export type EditRecordStatus =
  "idle" | "loading" | "ready" | "notFound" | "error";

// Registro que se edita (`?id=N`). Antes la carga no tenía estados: mientras
// llegaba se veía el formulario vacío (lo que se escribiera se pisaba) y, si
// fallaba o no existía, quedaba vacío sin aviso. Sin id ("Nuevo …"), idle.
//
//   const record = useEditRecord("areas", id, Service.findOne, (data) => setForm(…));
//   if (isEditRecordPending(record.status)) return <EditRecordState … />;
//
// `key` nombra el módulo en la caché: ["edit-record", key, id].
export function useEditRecord<T>(
  key: string,
  id: number,
  load: (id: number) => Promise<T>,
  onLoad: (data: T) => void,
) {
  const query = useQuery({
    queryKey: ["edit-record", key, id],
    queryFn: () => load(id),
    enabled: !!id,
    // Siempre lo último al abrir el formulario, y sin volver a pedirlo
    // mientras se edita: una recarga pisaría lo que el usuario escribió.
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Lo último, sin volver a llenar el formulario en cada render.
  const onLoadRef = useRef(onLoad);
  useLayoutEffect(() => {
    onLoadRef.current = onLoad;
  });

  // El formulario se llena una vez por respuesta (no en cada render); hasta
  // entonces sigue "loading" para no mostrarlo vacío.
  const [filledAt, setFilledAt] = useState(0);
  useEffect(() => {
    if (!query.data || query.dataUpdatedAt === filledAt) return;
    onLoadRef.current(query.data);
    setFilledAt(query.dataUpdatedAt);
  }, [query.data, query.dataUpdatedAt, filledAt]);

  const status: EditRecordStatus = !id
    ? "idle"
    : query.isError
      ? // El aviso lo muestra el interceptor.
        parseApiError(query.error).kind === "notFound"
        ? "notFound"
        : "error"
      : query.isSuccess && filledAt === query.dataUpdatedAt
        ? "ready"
        : "loading";

  return { status, retry: () => void query.refetch() };
}

/** Todavía no se puede mostrar el formulario (cargando, no existe o falló). */
export const isEditRecordPending = (status: EditRecordStatus) =>
  status === "loading" || status === "notFound" || status === "error";
