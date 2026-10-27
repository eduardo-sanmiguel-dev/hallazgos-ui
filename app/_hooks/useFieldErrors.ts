import { useState } from "react";

import { toast } from "sonner";

import { parseApiError } from "@services";

const fieldId = (field: string) => `campo-${field}`;

interface FailedState<F extends string> {
  // Campo → mensaje. Las validaciones del formulario marcan uno; las del
  // API, todos los que rechazó.
  fields: Partial<Record<F, string>>;
  // Valores del formulario cuando falló la validación.
  snapshot: unknown[];
}

/**
 * Ruta de un error del API ("evaluations.0.status") → campo del formulario.
 * Un objeto para renombrar ("type" → "secondaryType") o una función para
 * rutas con índice; `null` deja el error solo en el aviso.
 */
export type ApiFieldMap =
  | Partial<Record<string, string | null>>
  | ((path: string) => string | null | undefined);

const FOCUSABLE =
  '[role="combobox"], input:not([type="hidden"]):not([aria-hidden="true"]), textarea, button';

// Campos de texto: se enfocan por id. Selects y componentes sin id: se busca
// su mensaje de error (marcado con data-error-for) y se enfoca el control que
// está junto a él; si el mensaje vive en su propio <Grid>, en el anterior.
const focusField = (field: string) => {
  const byId = document.getElementById(fieldId(field));
  if (byId) {
    byId.focus();
    return;
  }

  const message = document.querySelector<HTMLElement>(
    `[data-error-for="${CSS.escape(field)}"]`,
  );
  if (!message) return;

  const container =
    message.closest(".MuiFormControl-root") ?? message.parentElement;
  const target =
    container?.querySelector<HTMLElement>(FOCUSABLE) ??
    container?.previousElementSibling?.querySelector<HTMLElement>(FOCUSABLE);

  target?.focus();
};

// Dos frames: el mensaje de error se pinta después de este render.
const focusAfterRender = (field: string) =>
  requestAnimationFrame(() => requestAnimationFrame(() => focusField(field)));

const sameValues = (a: unknown[], b: unknown[]) =>
  a.length === b.length &&
  a.every((value, index) => Object.is(value, b[index]));

// Un nombre que el formulario no tiene solo queda en el aviso: errorOf
// nunca lo consulta.
const resolveField = <F extends string>(
  path: string,
  map?: ApiFieldMap,
): F | null => {
  if (!map) return path as F;
  const mapped = typeof map === "function" ? map(path) : map[path];
  // Sin entrada en el mapa: mismo nombre que en el API.
  return (mapped === undefined ? path : mapped) as F | null;
};

// Errores de validación junto al campo. `fail` conserva el toast que ya
// mostraban los formularios, marca el campo y le pasa el foco (también a los
// selects, vía el atributo data-error-for de su mensaje de error). El error se
// oculta en cuanto cambia cualquiera de los valores recibidos (normalmente el
// estado `form`), sin efectos ni limpiezas manuales.
//
//   const { fail, failFromApi, fieldProps } = useFieldErrors<"name" | "email">(form);
//   if (!name) { fail("name", "El nombre es requerido"); return; }
//   Service.create(payload).then(...).catch(failFromApi);
//   <TextField {...fieldProps("name")} ... />
export function useFieldErrors<F extends string>(...values: unknown[]) {
  const [failed, setFailed] = useState<FailedState<F> | null>(null);

  const isActive = !!failed && sameValues(failed.snapshot, values);

  const fail = (field: F, message: string) => {
    toast.error(message);
    setFailed({
      fields: { [field]: message } as Partial<Record<F, string>>,
      snapshot: values,
    });
    focusAfterRender(field);
  };

  /**
   * Error de un guardado: si el API rechazó campos (VALIDATION_FAILED), los
   * marca todos y enfoca el primero. El aviso ya lo mostró el interceptor
   * (con el resumen, que incluye los campos que no están en pantalla), así
   * que aquí no se repite. Se usa directo en `.catch(failFromApi)`.
   */
  const failFromApi = (error: unknown, map?: ApiFieldMap) => {
    const { kind, fieldErrors } = parseApiError(error);
    if (kind !== "validation") return;

    const fields: Partial<Record<F, string>> = {};
    for (const [path, message] of Object.entries(fieldErrors)) {
      const field = resolveField<F>(path, map);
      if (field && !fields[field]) fields[field] = message;
    }

    const first = Object.keys(fields)[0] as F | undefined;
    if (!first) return;

    setFailed({ fields, snapshot: values });
    focusAfterRender(first);
  };

  const errorOf = (field: F) => (isActive ? failed.fields[field] : undefined);

  // Props para un TextField: id (para el foco), error y mensaje.
  const fieldProps = (field: F) => ({
    id: fieldId(field),
    error: !!errorOf(field),
    helperText: errorOf(field),
  });

  return { fail, failFromApi, errorOf, fieldProps };
}
