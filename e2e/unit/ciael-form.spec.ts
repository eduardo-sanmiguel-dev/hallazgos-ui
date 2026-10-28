import { expect, test } from "@playwright/test";
import dayjs from "dayjs";

import {
  REQUIRED_FIELDS,
  changeCiaelField,
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

  test("cambiar la planta limpia lo que depende de ella y avisa qué", () => {
    const form = {
      ...initialForm,
      manufacturingPlant: "1",
      zone: "5",
      employee: "7",
      areaLeader: "9",
      bodyPart: "3",
    };

    const { form: next, notice } = changeCiaelField(
      form,
      "manufacturingPlant",
      "2",
    );

    expect(next).toMatchObject({
      manufacturingPlant: "2",
      zone: "",
      employee: "",
      accidentPosition: "",
      machine: "",
      associatedTask: "",
      areaLeader: "",
      // No depende de la planta: se conserva.
      bodyPart: "3",
    });
    expect(notice).toBe(
      "Vuelve a elegir zona, colaborador y líder de área: dependen de la planta.",
    );
  });

  test("cambiar la zona limpia solo el líder de área", () => {
    const form = {
      ...initialForm,
      manufacturingPlant: "1",
      zone: "5",
      employee: "7",
      areaLeader: "9",
    };

    const { form: next, notice } = changeCiaelField(form, "zone", "6");

    expect(next).toMatchObject({ zone: "6", employee: "7", areaLeader: "" });
    expect(notice).toBe("Vuelve a elegir líder de área: depende de la zona.");
  });

  test("sin nada elegido que dependa, o eligiendo lo mismo, no avisa", () => {
    expect(
      changeCiaelField(initialForm, "manufacturingPlant", "1").notice,
    ).toBeNull();
    const form = { ...initialForm, manufacturingPlant: "1", zone: "5" };
    expect(changeCiaelField(form, "manufacturingPlant", "1")).toEqual({
      form,
      notice: null,
    });
    // Otros selects no limpian nada.
    expect(changeCiaelField(form, "bodyPart", "3").form.zone).toBe("5");
  });

  test("detecta si hay algo capturado, también solo los opcionales", () => {
    expect(isFormDirty(initialForm)).toBe(false);
    expect(isFormDirty({ ...initialForm, daysOfDisability: "3" })).toBe(true);
    expect(isFormDirty({ ...initialForm, eventDate: dayjs() })).toBe(true);
  });
});
