import { expect, test } from "@playwright/test";

import {
  stringToDateWithTime,
  updatedDateLabel,
} from "../../app/_shared/utils/dates";

// Última actualización: solo se muestra si se ve distinta a la creación.

const CREATED = "2026-10-21T14:25:10.000Z";
const plus = (ms: number) => new Date(Date.parse(CREATED) + ms).toISOString();

test.describe("Fecha de última actualización", () => {
  test("igual a la creación no se muestra", () => {
    expect(updatedDateLabel(CREATED, CREATED)).toBeNull();
  });

  test("dentro del mismo minuto tampoco (se vería igual)", () => {
    // Al crear, la API guarda ambas con milisegundos o segundos de diferencia.
    expect(updatedDateLabel(CREATED, plus(15))).toBeNull();
    expect(updatedDateLabel(CREATED, plus(40_000))).toBeNull();
  });

  test("editada en otro minuto se muestra con el formato de la tabla", () => {
    const updated = plus(5 * 60_000);
    expect(updatedDateLabel(CREATED, updated)).toBe(
      stringToDateWithTime(updated),
    );
    expect(
      updatedDateLabel(CREATED, plus(2 * 24 * 60 * 60_000)),
    ).not.toBeNull();
  });

  test("sin fecha de actualización no muestra nada", () => {
    expect(updatedDateLabel(CREATED, null)).toBeNull();
    expect(updatedDateLabel(CREATED, undefined)).toBeNull();
  });

  test("acepta Date además de texto", () => {
    expect(updatedDateLabel(new Date(CREATED), new Date(CREATED))).toBeNull();
  });
});
