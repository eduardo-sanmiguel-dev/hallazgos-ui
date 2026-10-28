import { expect, test } from "@playwright/test";

import { breadcrumbTrail } from "../../app/_shared/components/menu";

// Ruta de los breadcrumbs (B2) a partir del menú, sin navegador.

const labels = (pathname: string) => {
  const trail = breadcrumbTrail(pathname);
  return trail && [...trail.parents, trail.list.title].join(" › ");
};

test.describe("Breadcrumbs: ruta desde el menú", () => {
  test("formularios de Configuración, sin el subgrupo General", () => {
    expect(labels("/processes/form")).toBe("Configuración › Procesos");
    expect(labels("/zones/form")).toBe("Configuración › Lugares");
    expect(labels("/areas/form")).toBe("Configuración › Zonas");
    expect(labels("/users/form")).toBe("Configuración › Usuarios");
    expect(breadcrumbTrail("/processes/form")?.list.url).toBe("/processes");
  });

  test("el subgrupo distingue las dos Zonas y se omite si repite la lista", () => {
    expect(labels("/gemba-walk/zones/form")).toBe(
      "Configuración › Gemba Walk › Zonas",
    );
    expect(labels("/gemba-walk/calendar/form")).toBe(
      "Configuración › Gemba Walk › Calendario",
    );
    expect(labels("/main-types/form")).toBe("Configuración › Criterios");
    expect(labels("/secondary-types/form")).toBe(
      "Configuración › Criterios › Tipos de criterios",
    );
    expect(labels("/emergency-teams/form")).toBe(
      "Configuración › Equipos › Equipos de emergencia",
    );
  });

  test("sin ruta en las listas y fuera del menú", () => {
    expect(breadcrumbTrail("/processes")).toBeNull();
    expect(breadcrumbTrail("/gemba-walk/zones")).toBeNull();
    expect(breadcrumbTrail("/no-existe/form")).toBeNull();
  });
});
