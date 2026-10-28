import { useState } from "react";

import { toast } from "sonner";

import { parseApiError } from "@services";

const fieldId = (field: string) => `campo-${field}`;

interface FailedState<F extends string, S> {
  // Campo → mensaje. `fail` marca uno; `failAll` y las del API, varios.
  fields: Partial<Record<F, string>>;
  // Valores del formulario cuando falló la validación.
  snapshot: S;
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
  return useErrorState<F, unknown[]>(values, (snapshot) =>
    sameValues(snapshot, values),
  );
}

/**
 * Igual que `useFieldErrors`, pero para un formulario en un solo objeto: cada
 * error se quita al cambiar su propio campo y los demás siguen marcados. Para
 * formularios largos donde `failAll` marca varios campos a la vez (CIAEL).
 *
 *   const { failAll, errorOf } = useFormFieldErrors(form);
 */
export function useFormFieldErrors<T extends object>(form: T) {
  return useErrorState<Extract<keyof T, string>, T>(form, (snapshot, field) =>
    Object.is(snapshot[field], form[field]),
  );
}

function useErrorState<F extends string, S>(
  current: S,
  // ¿Sigue vigente el error de `field`? (los datos no cambiaron desde que falló)
  isFieldActive: (snapshot: S, field: F) => boolean,
) {
  const [failed, setFailed] = useState<FailedState<F, S> | null>(null);

  const mark = (fields: Partial<Record<F, string>>, first: F) => {
    setFailed({ fields, snapshot: current });
    focusAfterRender(first);
  };

  const fail = (field: F, message: string) => {
    toast.error(message);
    mark({ [field]: message } as Partial<Record<F, string>>, field);
  };

  /**
   * Marca todos los campos que faltan de una vez y enfoca el primero (el
   * orden de las llaves es el de la pantalla). Con uno solo, el aviso es su
   * mensaje; con varios, cuántos hay que completar. Devuelve si marcó algo:
   *   if (failAll(missing)) return;
   */
  const failAll = (fields: Partial<Record<F, string>>) => {
    const entries = Object.entries(fields).filter(([, message]) => message) as [
      F,
      string,
    ][];
    if (!entries.length) return false;

    const [[first, firstMessage]] = entries;
    toast.error(
      entries.length === 1
        ? firstMessage
        : `Completa los ${entries.length} campos marcados.`,
    );
    mark(Object.fromEntries(entries) as Partial<Record<F, string>>, first);
    return true;
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

    mark(fields, first);
  };

  const errorOf = (field: F) =>
    failed && isFieldActive(failed.snapshot, field)
      ? failed.fields[field]
      : undefined;

  // Props para un TextField: id (para el foco), error y mensaje.
  const fieldProps = (field: F) => ({
    id: fieldId(field),
    error: !!errorOf(field),
    helperText: errorOf(field),
  });

  return { fail, failAll, failFromApi, errorOf, fieldProps };
}
