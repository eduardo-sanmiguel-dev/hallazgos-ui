import { useState } from "react";

import { useRouter } from "next/navigation";

import { useConfirmDialog } from "@shared/components/ConfirmDialog";

import { useBeforeUnload } from "./useBeforeUnload";

interface Options<T> {
  // En edición, la comparación es contra lo cargado (`markPristine`).
  isEditing?: boolean;
  // Campos que, al crear, no cuentan como captura (p. ej. la planta que se
  // elige sola cuando el usuario tiene una).
  ignoreOnCreate?: (keyof T)[];
}

// Confirmación al salir de un formulario con algo capturado, como en CIAEL e
// ICS. "Algo capturado": al crear, cualquier cambio respecto al formulario
// vacío; al editar, respecto a lo que se cargó. Al guardar se navega directo
// (sin pasar por aquí).
//
//   const leave = useLeaveConfirm(form, { isEditing: !!id });
//   leave.markPristine(loaded);                 // al terminar de cargar
//   <FormActions onCancel={() => leave.go("/processes")} … />
//   if (await leave.confirmDiscard()) closeDialog();  // en un diálogo
//   {leave.confirmDialog}
export function useLeaveConfirm<T extends object>(
  value: T,
  { isEditing = false, ignoreOnCreate = [] }: Options<T> = {},
) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const snapshot = (current: T) =>
    JSON.stringify(
      isEditing
        ? current
        : Object.fromEntries(
            Object.entries(current).filter(
              ([key]) => !ignoreOnCreate.includes(key as keyof T),
            ),
          ),
    );

  const [pristine, setPristine] = useState(() => snapshot(value));
  const isDirty = snapshot(value) !== pristine;
  // Recargar o cerrar la pestaña con cambios: aviso nativo del navegador.
  useBeforeUnload(isDirty);

  /** Lo cargado en edición pasa a ser el punto de comparación. */
  const markPristine = (loaded: T) => setPristine(snapshot(loaded));

  /**
   * ¿Se puede salir? Sin cambios, sí; con cambios, pregunta. Para cerrar un
   * diálogo con formulario (Equipos de protección); para navegar, `go`.
   */
  const confirmDiscard = async () =>
    !isDirty ||
    confirm({
      title: isEditing ? "¿Descartar los cambios?" : "¿Descartar el registro?",
      description: isEditing
        ? "Se perderán los cambios que hiciste."
        : "Se perderá lo que capturaste en el formulario.",
      confirmLabel: "Descartar",
      cancelLabel: "Seguir editando",
      tone: "danger",
    });

  /** Navega a `href`; con cambios, pregunta antes. */
  const go = async (href: string) => {
    if (await confirmDiscard()) router.push(href);
  };

  return { isDirty, markPristine, go, confirmDiscard, confirmDialog };
}
