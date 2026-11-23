import type { EmergencyTeam } from "@interfaces";
import { escapeHtml } from "@shared/utils/escapeHtml";

/**
 * Texto alternativo del QR en la hoja de impresión: de qué extintor es y
 * dónde está (antes "QR equipo 9801", con el id interno).
 */
export const qrAlt = (row: Pick<EmergencyTeam, "id" | "extinguisherNumber" | "location">) => {
  const what = row.extinguisherNumber
    ? `Código QR del extintor ${row.extinguisherNumber}`
    : `Código QR del equipo de emergencia ${row.id}`;
  return row.location?.trim() ? `${what}, en ${row.location.trim()}` : what;
};

type PrintRow = Pick<
  EmergencyTeam,
  "id" | "extinguisherNumber" | "location" | "typeOfExtinguisher" | "capacity"
> & { generatedQrCode: string };

/**
 * Una etiqueta de la hoja de impresión. La hoja se escribe con
 * `document.write` en una ventana del mismo origen que la app: todo lo que
 * captura el usuario va escapado (antes una ubicación como
 * `<img src=x onerror=…>` se ejecutaba con la sesión de quien imprimía). El
 * QR es un data URL que genera la app; se acepta solo como imagen.
 */
export const qrPrintItem = (row: PrintRow) => {
  const qr = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(row.generatedQrCode)
    ? row.generatedQrCode
    : "";
  const field = (label: string, value: string | number | null | undefined) =>
    `<div><strong>${label}:</strong> ${escapeHtml(value === null || value === undefined || value === "" ? "-" : value)}</div>`;
  return `
    <div class="item">
      <div class="qr-box">
        <img src="${qr}" alt="${escapeHtml(qrAlt(row))}" />
      </div>
      <div class="qr-meta">
        ${field("Ubicación", row.location)}
        ${field("No. Extintor", row.extinguisherNumber)}
        ${field("Tipo", row.typeOfExtinguisher)}
        ${field("Capacidad", row.capacity)}
      </div>
    </div>
  `;
};
