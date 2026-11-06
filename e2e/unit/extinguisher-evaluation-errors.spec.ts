import { describe, expect, test } from "vite-plus/test";

import {
  evaluationApiErrors,
  inspectionApiField,
} from "../../app/features/extinguisher-inspection/form/_lib/evaluation";

// Errores del API en el formulario de inspección: los de cada evaluación
// (evaluations.N.campo), incluidas las fechas, van a su tarjeta.

describe("Errores anidados de la inspección de extintores", () => {
  test("agrupa por evaluación con la etiqueta que se ve en la tarjeta", () => {
    expect(
      evaluationApiErrors({
        "evaluations.0.capacity": "Debe ser 1 o mayor.",
        "evaluations.0.barrette": "Elige una opción válida.",
        "evaluations.2.location": "Debe tener entre 5 y 150 caracteres.",
        "evaluations.0.nextRechargeDate": "Fecha no válida.",
        "evaluations.2.maintenanceDate": "Dato obligatorio.",
        manufacturingPlantId: "Dato obligatorio.",
      }),
    ).toEqual({
      0: [
        "Capacidad: debe ser 1 o mayor.",
        "Pasador: elige una opción válida.",
        "Próxima recarga: fecha no válida.",
      ],
      2: ["Ubicación: debe tener entre 5 y 150 caracteres.", "Mantenimiento: dato obligatorio."],
    });
  });

  test("todos los campos de cada evaluación van a su tarjeta", () => {
    expect(inspectionApiField("evaluations.1.nextRechargeDate")).toBeNull();
    expect(inspectionApiField("evaluations.1.maintenanceDate")).toBeNull();
    expect(inspectionApiField("evaluations.1.capacity")).toBeNull();
    expect(inspectionApiField("evaluations")).toBe("evaluations");
    expect(inspectionApiField("manufacturingPlantId")).toBe("manufacturingPlantId");
  });
});
