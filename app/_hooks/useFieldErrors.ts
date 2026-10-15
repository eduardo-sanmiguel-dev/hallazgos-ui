import { useState } from "react";

import { toast } from "sonner";

const fieldId = (field: string) => `campo-${field}`;

interface FailedState<F extends string> {
  field: F;
  message: string;
  // Valores del formulario cuando falló la validación.
  snapshot: unknown[];
}

const sameValues = (a: unknown[], b: unknown[]) =>
  a.length === b.length && a.every((value, index) => Object.is(value, b[index]));

// Errores de validación junto al campo. `fail` conserva el toast que ya
// mostraban los formularios, marca el campo y le pasa el foco. El error se
// oculta en cuanto cambia cualquiera de los valores recibidos (normalmente el
// estado `form`), sin efectos ni limpiezas manuales.
//
//   const { fail, fieldProps } = useFieldErrors<"name" | "email">(form);
//   if (!name) { fail("name", "El nombre es requerido"); return; }
//   <TextField {...fieldProps("name")} ... />
export function useFieldErrors<F extends string>(...values: unknown[]) {
  const [failed, setFailed] = useState<FailedState<F> | null>(null);

  const isActive = !!failed && sameValues(failed.snapshot, values);

  const fail = (field: F, message: string) => {
    toast.error(message);
    setFailed({ field, message, snapshot: values });
    requestAnimationFrame(() => document.getElementById(fieldId(field))?.focus());
  };

  const errorOf = (field: F) =>
    isActive && failed.field === field ? failed.message : undefined;

  // Props para un TextField: id (para el foco), error y mensaje.
  const fieldProps = (field: F) => ({
    id: fieldId(field),
    error: !!errorOf(field),
    helperText: errorOf(field),
  });

  return { fail, errorOf, fieldProps };
}
