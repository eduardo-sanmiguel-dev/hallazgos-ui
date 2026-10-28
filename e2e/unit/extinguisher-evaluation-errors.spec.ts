import { expect, test } from "@playwright/test";

import {
  evaluationApiErrors,
  inspectionApiField,
} from "../../app/(routes)/extinguisher-inspection/form/_lib/evaluation";

// Errores del API en el formulario de inspección: los de cada evaluación
// (evaluations.N.campo) van a su tarjeta con la etiqueta del campo; la fecha
// de recarga, que es una sola, va al campo de arriba.

test.describe("Errores anidados de la inspección de extintores", () => {
  test("agrupa por evaluación con la etiqueta que se ve en la tarjeta", () => {
    expect(
      evaluationApiErrors({
        "evaluations.0.capacity": "Debe ser 1 o mayor.",
        "evaluations.0.barrette": "Elige una opción válida.",
        "evaluations.2.location": "Debe tener entre 5 y 150 caracteres.",
        "evaluations.0.nextRechargeDate": "Fecha no válida.",
        manufacturingPlantId: "Dato obligatorio.",
      }),
    ).toEqual({
      0: [
        "Capacidad: debe ser 1 o mayor.",
        "Pasador: elige una opción válida.",
      ],
      2: ["Ubicación: debe tener entre 5 y 150 caracteres."],
    });
  });

  test("la fecha de cada evaluación va al campo compartido; lo demás de la evaluación, a su tarjeta", () => {
    expect(inspectionApiField("evaluations.1.nextRechargeDate")).toBe(
      "sharedNextRechargeDate",
    );
    expect(inspectionApiField("evaluations.1.maintenanceDate")).toBe(
      "sharedNextRechargeDate",
    );
    expect(inspectionApiField("evaluations.1.capacity")).toBeNull();
    expect(inspectionApiField("evaluations")).toBe("evaluations");
    expect(inspectionApiField("manufacturingPlantId")).toBe(
      "manufacturingPlantId",
    );
  });
});
