import { expect, test } from "@playwright/test";

import {
  EVIDENCE_STATUS_COLOR,
  evidenceStatusColor,
} from "../../app/_shared/constants/semanticTones";

// Colores de estatus de un hallazgo: los mismos en chips, filtros, gráficas,
// seguimiento y correos.

test.describe("Colores de estatus", () => {
  test("ámbar, azul, verde y gris; Cancelado no es rojo", () => {
    expect(EVIDENCE_STATUS_COLOR["Abierto"].main).toBe("#B45309");
    expect(EVIDENCE_STATUS_COLOR["En progreso"].main).toBe("#1D4ED8");
    expect(EVIDENCE_STATUS_COLOR["Cerrado"].main).toBe("#15803D");
    expect(EVIDENCE_STATUS_COLOR["Cancelado"].main).toBe("#6B7280");
  });

  test("en tema oscuro, el tono claro (se lee como texto o ícono)", () => {
    expect(evidenceStatusColor("En progreso", "light")).toBe("#1D4ED8");
    expect(evidenceStatusColor("En progreso", "dark")).toBe("#93C5FD");
    expect(evidenceStatusColor("Desconocido")).toBeUndefined();
  });
});
