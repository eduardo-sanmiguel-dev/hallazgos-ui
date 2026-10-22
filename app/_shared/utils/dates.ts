import dayjs from "@shared/libs/dayjs";

// Format 05/01/2024 3:07 pm
export const stringToDateWithTime = (date: string | Date) =>
  dayjs(date).format("DD/MM/YYYY h:mm a");

/**
 * Última actualización para mostrar, o null si se ve igual que la creación
 * (mismo minuto): el registro no se ha editado y repetirla no aporta nada.
 * Se compara lo que se muestra y no el instante exacto, porque al crear un
 * registro ambas fechas pueden diferir por milisegundos.
 */
export const updatedDateLabel = (
  createdAt: string | Date,
  updatedAt: string | Date | null | undefined,
): string | null => {
  if (!updatedAt) return null;
  const updated = stringToDateWithTime(updatedAt);
  return updated === stringToDateWithTime(createdAt) ? null : updated;
};
