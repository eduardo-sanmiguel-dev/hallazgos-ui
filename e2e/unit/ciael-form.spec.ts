import { expect, test } from "@playwright/test";
import dayjs from "dayjs";

import {
  REQUIRED_FIELDS,
  initialForm,
  isFormDirty,
  missingCiaelFields,
} from "../../app/(routes)/ciael/components/ciaelForm";

// Formulario CIAEL: al guardar se marcan todos los obligatorios que faltan,
// en el orden de las secciones, y cerrar con algo capturado pide confirmar.

test.describe("Formulario CIAEL", () => {
  test("vacío: faltan todos los obligatorios, en el orden de la pantalla", () => {
    const missing = missingCiaelFields(initialForm);

    expect(Object.keys(missing)).toEqual(
      REQUIRED_FIELDS.map(([field]) => field),
    );
    expect(Object.keys(missing).slice(0, 2)).toEqual([
      "manufacturingPlant",
      "eventDate",
    ]);
    expect(missing).not.toHaveProperty("daysOfDisability");
    expect(missing).not.toHaveProperty("manager");
  });

  test("solo quedan los que faltan; una descripción en blanco cuenta como vacía", () => {
    const missing = missingCiaelFields({
      ...initialForm,
      manufacturingPlant: "1",
      eventDate: dayjs("2026-10-01"),
      description: "   ",
    });

    expect(missing).not.toHaveProperty("manufacturingPlant");
    expect(missing).not.toHaveProperty("eventDate");
    expect(missing.description).toBe("Describe el evento.");
    expect(Object.keys(missing)[0]).toBe("typeOfEvent");
  });

  test("completo: no falta nada", () => {
    const complete = Object.fromEntries(
      REQUIRED_FIELDS.map(([field]) => [field, "1"]),
    );

    expect(
      missingCiaelFields({
        ...initialForm,
        ...complete,
        eventDate: dayjs("2026-10-01"),
      }),
    ).toEqual({});
  });

  test("detecta si hay algo capturado, también solo los opcionales", () => {
    expect(isFormDirty(initialForm)).toBe(false);
    expect(isFormDirty({ ...initialForm, daysOfDisability: "3" })).toBe(true);
    expect(isFormDirty({ ...initialForm, eventDate: dayjs() })).toBe(true);
  });
});
