import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickOption, toast, trackPageErrors } from "./support/ui";

// Acciones sobre hallazgos de la tabla: detalle, comentarios, en progreso,
// cierre, reasignación y cancelación. La lista viene de GraphQL con datos
// fijos (un hallazgo por estado); las escrituras se interceptan.

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const SUPERVISOR = { id: 7001, name: "E2E Supervisor" };
const OTHER = { id: 7002, name: "E2E Responsable" };
const PLANT = { id: 1, name: "Planta E2E" };

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();

const evidence = (id: number, overrides: Record<string, unknown>) => ({
  __typename: "Evidence",
  id,
  status: "Abierto",
  priorityDays: 3,
  createdAt: daysAgo(10),
  updatedAt: daysAgo(1),
  solutionDate: null,
  startProcessDate: null,
  imgEvidence: "e2e-evidence.png",
  imgProcess: "",
  imgSolution: "",
  description: "E2E descripción del hallazgo",
  descriptionSolution: "",
  manufacturingPlant: { __typename: "ManufacturingPlant", ...PLANT },
  user: { __typename: "User", name: "E2E Autor" },
  mainType: {
    __typename: "MainType",
    name: "Condición insegura",
    requiresEvidence: true,
  },
  secondaryType: { __typename: "SecondaryType", name: "E2E Tipo" },
  supervisors: [{ __typename: "User", ...SUPERVISOR }],
  responsibles: [],
  zone: {
    __typename: "Zone",
    name: "E2E Lugar",
    area: { __typename: "Area", name: "E2E Zona" },
  },
  process: { __typename: "Process", name: "E2E Proceso" },
  comments: [
    {
      __typename: "Comment",
      id: 1,
      comment: "E2E comentario previo",
      user: { __typename: "User", name: "E2E Autor" },
      createdAt: daysAgo(2),
    },
  ],
  ...overrides,
});

const EVIDENCES = [
  // Abierto, vencido, comportamiento inseguro, sin responsables asignados.
  evidence(9001, {
    mainType: {
      __typename: "MainType",
      name: "Comportamiento inseguro",
      requiresEvidence: false,
    },
  }),
  // En progreso, a tiempo, con responsable.
  evidence(9002, {
    status: "En progreso",
    priorityDays: 30,
    createdAt: daysAgo(2),
    startProcessDate: daysAgo(1),
    imgProcess: "e2e-process.png",
    responsibles: [{ __typename: "User", ...OTHER }],
    process: null,
  }),
  // Cerrado a tiempo, con imágenes de las tres etapas.
  evidence(9003, {
    status: "Cerrado",
    priorityDays: 7,
    createdAt: daysAgo(6),
    startProcessDate: daysAgo(5),
    solutionDate: daysAgo(3),
    imgProcess: "e2e-process.png",
    imgSolution: "e2e-solution.png",
    zone: { __typename: "Zone", name: "E2E Lugar", area: null },
  }),
  // Cancelado, sin prioridad ni imágenes.
  evidence(9004, {
    status: "Cancelado",
    priorityDays: null,
    imgEvidence: "",
    comments: [],
  }),
];

/**
 * Abre /hallazgos con la tabla de datos fijos; `asSupervisor` cambia el rol y
 * `data` reemplaza los hallazgos de la tabla.
 */
const openList = async (
  page: Page,
  { asSupervisor = false, data = EVIDENCES } = {},
) => {
  await page.route("**/graphql", (route) =>
    route.fulfill({
      json: {
        data: {
          evidences: { __typename: "Evidences", count: 12, data },
        },
      },
    }),
  );
  // Las imágenes del API no existen para estos datos: se sirve un PNG.
  await page.route("**/static/images/**", (route) =>
    route.fulfill({ contentType: "image/png", body: PNG_1X1 }),
  );
  if (asSupervisor) {
    await mockGet(page, "/users/get-information-current-user", {
      ...SUPERVISOR,
      email: "e2e-supervisor@example.com",
      role: "Supervisor",
      isActive: true,
      manufacturingPlants: [PLANT],
      zones: [],
    });
  }
  await mockGet(page, "/users", [SUPERVISOR, OTHER]);
  await page.goto("/hallazgos");
  await expect(page.getByText("E2E Lugar").first()).toBeVisible();
};

const openActions = async (page: Page, id: number) => {
  await page
    .getByRole("button", { name: `Acciones del hallazgo ${id}` })
    .click();
  return page.getByRole("menu");
};

/** Botón de la confirmación que aparece antes de cerrar un hallazgo. */
const confirmClose = (page: Page, id: number) =>
  page
    .getByRole("dialog", { name: `¿Cerrar el hallazgo #${id}?` })
    .getByRole("button", { name: "Cerrar hallazgo" });

/** Cerrado y Cancelado no tienen acciones: un ojo abre el detalle. */
const viewDetails = (page: Page, id: number) =>
  page.getByRole("button", { name: `Ver detalles del hallazgo ${id}` }).click();

/** Fila de la tabla por el id del hallazgo (primera columna). */
const rowOf = (page: Page, id: number) =>
  page.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: String(id), exact: true }),
  });

test.describe("Hallazgos: acciones", () => {
  test("muestra el detalle de cada estado y agrega un comentario (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page, {
      respond: ({ path }) =>
        path.startsWith("/evidences/add/comment")
          ? {
              comments: [
                ...EVIDENCES[0].comments,
                {
                  id: 2,
                  comment: "E2E comentario nuevo",
                  user: { name: "Usuario pruebas e2e" },
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : {},
    });
    await openList(page);

    // Abierto (comportamiento inseguro, vencido).
    await (
      await openActions(page, 9001)
    )
      .getByRole("menuitem", { name: "Ver detalles" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("E2E descripción del hallazgo").first(),
    ).toBeVisible();
    await dialog.getByRole("img").first().click();
    await page.getByRole("button", { name: "Cerrar imagen" }).click();

    await dialog.getByRole("tab", { name: /Comentarios/ }).click();
    await expect(dialog.getByText("E2E comentario previo")).toBeVisible();
    await dialog.getByLabel("Agregar comentario").fill("E2E comentario nuevo");
    await dialog
      .getByRole("button", { name: /Agregar|Comentar|Enviar/ })
      .click();
    await expect(
      toast(page, "Comentario agregado correctamente"),
    ).toBeVisible();
    await expect(dialog.getByText("E2E comentario nuevo")).toBeVisible();
    expect(writes).toEqual([
      {
        method: "POST",
        path: "/evidences/add/comment/9001",
        body: { comment: "E2E comentario nuevo" },
      },
    ]);
    await dialog.getByRole("button", { name: "Cerrar" }).click();

    // En progreso desde el menú; Cerrado y Cancelado desde el ojo.
    await (
      await openActions(page, 9002)
    )
      .getByRole("menuitem", { name: "Ver detalles" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cerrar" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    for (const id of [9003, 9004]) {
      await viewDetails(page, id);
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Cerrar" })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }

    // El chip de estado también abre el detalle.
    await page.getByRole("button", { name: "Cancelado" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("pasa un hallazgo a En progreso con imagen (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page);

    await (
      await openActions(page, 9001)
    )
      .getByRole("menuitem", { name: "En progreso" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: /^Iniciar hallazgo #\d+/,
    });
    const save = dialog.getByRole("button", { name: "Guardar imagen" });
    await expect(save).toBeDisabled();
    await dialog.getByLabel("Tomar foto").setInputFiles({
      name: "proceso.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(
      dialog.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
    await save.click();
    await expect(
      toast(page, "Estatus actualizado a En progreso"),
    ).toBeVisible();

    expect(writes).toHaveLength(1);
    expect(writes[0].path).toBe("/evidences/process/9001");
    expect(String(writes[0].body)).toMatch(
      /filename="[0-9a-f-]{36}-process\.png"/,
    );
  });

  test("un supervisor cierra un hallazgo de comportamiento inseguro (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page, { asSupervisor: true });

    await (
      await openActions(page, 9001)
    )
      .getByRole("menuitem", { name: "Cerrar hallazgo" })
      .click();
    const dialog = page.getByRole("dialog", { name: /^Cerrar hallazgo #\d+/ });
    await expect(dialog.getByText("Lo que se observó:")).toBeVisible();
    const save = dialog.getByRole("button", { name: "Guardar imagen" });
    await expect(save).toBeDisabled();
    await dialog
      .locator("#description-multiline-solution")
      .fill("E2E se habló con el equipo");
    await save.click();
    // Cerrar es irreversible: primero se confirma.
    expect(writes).toEqual([]);
    await confirmClose(page, 9001).click();
    await expect(toast(page, "Hallazgo cerrado correctamente")).toBeVisible();

    expect(writes).toHaveLength(1);
    expect(writes[0].path).toBe("/evidences/solution/9001");
    expect(String(writes[0].body)).toContain("E2E se habló con el equipo");
  });

  test("un supervisor cierra una condición con imagen (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page, { asSupervisor: true });

    await (
      await openActions(page, 9002)
    )
      .getByRole("menuitem", { name: "Cerrar hallazgo" })
      .click();
    const dialog = page.getByRole("dialog", { name: /^Cerrar hallazgo #\d+/ });
    // Clasificación con foto obligatoria: sin imagen no se puede guardar.
    await expect(
      dialog.getByRole("button", { name: "Guardar imagen" }),
    ).toBeDisabled();
    await dialog.getByLabel("Tomar foto").setInputFiles({
      name: "solucion.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(
      dialog.getByAltText("Vista previa de la evidencia"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Guardar imagen" }).click();
    await confirmClose(page, 9002).click();
    await expect(toast(page, "Hallazgo cerrado correctamente")).toBeVisible();
    expect(String(writes[0].body)).toMatch(
      /filename="[0-9a-f-]{36}-solution\.png"/,
    );
  });

  // La bandera del catálogo decide, no el nombre: un "comportamiento inseguro"
  // con la bandera en true (o sin ella en la respuesta) exige la foto.
  for (const [label, mainType] of [
    ["bandera en true", { requiresEvidence: true }],
    ["sin bandera", {}],
  ] as const) {
    test(`al cerrar exige la foto según la bandera (${label})`, async ({
      page,
    }) => {
      await openList(page, {
        asSupervisor: true,
        data: [
          evidence(9001, {
            mainType: {
              __typename: "MainType",
              name: "Comportamiento inseguro",
              ...mainType,
            },
          }),
        ],
      });

      await (
        await openActions(page, 9001)
      )
        .getByRole("menuitem", { name: "Cerrar hallazgo" })
        .click();
      const dialog = page.getByRole("dialog", {
        name: /^Cerrar hallazgo #\d+/,
      });
      await expect(
        dialog.locator("#description-multiline-solution"),
      ).toHaveCount(0);
      await expect(
        dialog.getByRole("button", { name: "Guardar imagen" }),
      ).toBeDisabled();
    });
  }

  test("al cerrar, 'Revisar' no envía nada y conserva lo capturado", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page, { asSupervisor: true });

    await (
      await openActions(page, 9001)
    )
      .getByRole("menuitem", { name: "Cerrar hallazgo" })
      .click();
    const dialog = page.getByRole("dialog", { name: /^Cerrar hallazgo #\d+/ });
    await dialog
      .locator("#description-multiline-solution")
      .fill("E2E todavía no");
    await dialog.getByRole("button", { name: "Guardar imagen" }).click();

    const confirm = page.getByRole("dialog", {
      name: "¿Cerrar el hallazgo #9001?",
    });
    await expect(
      confirm.getByText(
        "Ya no se podrá modificar y se enviará un aviso por correo.",
      ),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Revisar" }).click();

    await expect(confirm).toHaveCount(0);
    await expect(dialog.locator("#description-multiline-solution")).toHaveValue(
      "E2E todavía no",
    );
    expect(writes).toEqual([]);
  });

  test("reasigna responsables (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);
    await openList(page);

    await (
      await openActions(page, 9001)
    )
      .getByRole("menuitem", { name: "Reasignar" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Reasignar responsables" });
    // Sin responsables asignados, parte de los supervisores.
    await dialog
      .getByRole("button", { name: `Quitar a ${SUPERVISOR.name}` })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Guardar" }),
    ).toBeDisabled();

    await pickOption(page, "Responsable", OTHER.name);
    await pickOption(page, "Responsable", OTHER.name);
    await expect(
      dialog.getByRole("button", { name: `Quitar a ${OTHER.name}` }),
    ).toHaveCount(1);
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(
      toast(page, "Responsables reasignados correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: "/evidences/reassign/9001",
        body: expect.objectContaining({ responsibleIds: [OTHER.id] }),
      },
    ]);
  });

  test("cancela un hallazgo tras confirmar (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);
    await openList(page);

    await (
      await openActions(page, 9002)
    )
      .getByRole("menuitem", { name: "Cancelar" })
      .click();
    const confirm = page.getByRole("dialog", { name: "Confirmar cancelación" });
    await expect(confirm).toContainText("#9002");
    await confirm.getByRole("button", { name: "Volver" }).click();
    expect(writes).toEqual([]);

    await (
      await openActions(page, 9002)
    )
      .getByRole("menuitem", { name: "Cancelar" })
      .click();
    await confirm.getByRole("button", { name: "Cancelar hallazgo" }).click();
    await expect(toast(page, "Hallazgo eliminado correctamente")).toBeVisible();
    expect(writes[0]).toMatchObject({
      method: "DELETE",
      path: "/evidences/9002",
    });
  });

  test("pagina la tabla", async ({ page }) => {
    await openList(page);
    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/graphql") && r.postDataJSON()?.variables?.page === 2,
    );
    await page.getByRole("button", { name: "Página siguiente" }).click();
    await request;
    await page.getByLabel(/Filas por página|Rows per page/).click();
    await page.getByRole("option", { name: "10" }).click();
  });

  test("un usuario con permisos especiales puede cerrar y cancelar", async ({
    page,
  }) => {
    const email = "e2e-especial@example.com";
    await mockGet(page, "/users/get-information-current-user", {
      id: 7301,
      name: "E2E Especial",
      email,
      role: "General",
      isActive: true,
      manufacturingPlants: [PLANT],
      zones: [],
    });
    await mockGet(page, "/evidences/permissions/config", {
      supervisorOverrideEmails: [email],
      cancelEvidenceEmails: [email],
    });
    await openList(page);

    const menu = await openActions(page, 9002);
    await expect(
      menu.getByRole("menuitem", { name: "Cerrar hallazgo" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Reasignar" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Cancelar" }),
    ).toBeVisible();
  });

  test("amplía las imágenes de cada etapa de un hallazgo cerrado", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await openList(page);
    await viewDetails(page, 9003);
    const dialog = page.getByRole("dialog");
    for (const alt of [
      "Hallazgo imagen",
      "Imagen en progreso",
      "Imagen Solución",
    ]) {
      await dialog.getByAltText(alt).click();
      await page.getByRole("button", { name: "Cerrar imagen" }).click();
      await expect(
        page.getByRole("button", { name: "Cerrar imagen" }),
      ).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
  test("cerrados y cancelados muestran un ojo en lugar del menú de acciones", async ({
    page,
  }) => {
    await openList(page);

    for (const id of [9001, 9002]) {
      await expect(
        page.getByRole("button", { name: `Acciones del hallazgo ${id}` }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: `Ver detalles del hallazgo ${id}` }),
      ).toHaveCount(0);
    }
    for (const id of [9003, 9004]) {
      await expect(
        page.getByRole("button", { name: `Ver detalles del hallazgo ${id}` }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: `Acciones del hallazgo ${id}` }),
      ).toHaveCount(0);
    }
  });

  test("un hallazgo cerrado muestra la duración exacta junto a la resolución", async ({
    page,
  }) => {
    await openList(page);

    // Creado hace 6 días y cerrado hace 3: duración exacta de 3 días.
    const closed = rowOf(page, 9003);
    await expect(closed).toContainText("Resuelto en:");
    await expect(
      closed.getByText("Duración: 3d", { exact: true }),
    ).toBeVisible();
    await expect(closed.getByText("En tiempo")).toBeVisible();

    // Los que no están cerrados no tienen duración.
    for (const id of [9001, 9002, 9004]) {
      await expect(rowOf(page, id)).not.toContainText("Duración:");
    }
  });

  test("clic en la fila abre el detalle; el menú de acciones no", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await openList(page);

    await rowOf(page, 9001).getByText("E2E Lugar").click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("E2E descripción del hallazgo").first(),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await expect(dialog).toHaveCount(0);

    // El botón de acciones abre su menú, sin abrir también el detalle.
    const menu = await openActions(page, 9001);
    await expect(menu).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Elegir una opción del menú (en un portal) tampoco dispara la fila.
    await menu.getByRole("menuitem", { name: "Reasignar" }).click();
    await expect(
      page.getByRole("dialog", { name: "Reasignar responsables" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
  test("sin editar no repite la fecha de actualización (tabla y detalle)", async ({
    page,
  }) => {
    // Al inicio de un minuto: +1 s no cruza al siguiente.
    const created = new Date(
      Math.floor(Date.parse(daysAgo(3)) / 60_000) * 60_000,
    ).toISOString();
    const sameMinute = new Date(Date.parse(created) + 1_000).toISOString();
    await openList(page, {
      data: [
        // Recién creado: actualización 1 s después (se ve igual).
        evidence(9101, { createdAt: created, updatedAt: sameMinute }),
        // Editado después.
        evidence(9102, { createdAt: created, updatedAt: daysAgo(1) }),
      ],
    });

    await expect(rowOf(page, 9101)).toContainText("FR:");
    await expect(rowOf(page, 9101)).not.toContainText("FA:");
    await expect(rowOf(page, 9102)).toContainText("FA:");

    await (
      await openActions(page, 9101)
    )
      .getByRole("menuitem", { name: "Ver detalles" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Fecha de registro")).toBeVisible();
    await expect(dialog.getByText("Última actualización")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Cerrar" }).click();

    await (
      await openActions(page, 9102)
    )
      .getByRole("menuitem", { name: "Ver detalles" })
      .click();
    await expect(
      page.getByRole("dialog").getByText("Última actualización"),
    ).toBeVisible();
  });
});

// Celular (C1, C4): tarjetas en lugar de la tabla, con el estatus, el plazo y
// la acción principal a la vista; diálogos de iniciar y cerrar a pantalla
// completa.
test.describe("Hallazgos en celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const card = (page: Page, id: number) =>
    page.getByRole("listitem", { name: `Hallazgo ${id}` });

  test("muestra tarjetas con estatus, lugar, tipo, responsable y plazo", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await openList(page);

    await expect(page.getByRole("table")).toHaveCount(0);

    // Abierto y vencido: el administrador lo puede iniciar.
    const open = card(page, 9001);
    await expect(open.getByText("Hallazgo #9001")).toBeVisible();
    await expect(open.getByText("Abierto")).toBeVisible();
    await expect(open).toContainText("E2E Tipo");
    await expect(open).toContainText("E2E Lugar (E2E Zona)");
    await expect(open).toContainText("E2E Supervisor");
    await expect(open.getByText("Vencido")).toBeVisible();
    await expect(open).toContainText("hace 7 días");
    await expect(open.getByRole("button", { name: "Iniciar" })).toBeVisible();

    // En progreso, a tiempo, con responsable. El administrador no cierra.
    const inProgress = card(page, 9002);
    await expect(inProgress).toContainText("Quedan 28 días");
    await expect(inProgress).toContainText("E2E Responsable");
    await expect(
      inProgress.getByRole("button", { name: /^(Iniciar|Cerrar)$/ }),
    ).toHaveCount(0);

    // Cerrado: en cuántos días se resolvió. Cancelado: sin plazo.
    await expect(card(page, 9003)).toContainText("Resuelto en 3 días");
    await expect(card(page, 9003).getByText("En tiempo")).toBeVisible();
    await expect(card(page, 9004)).not.toContainText("Plazo");

    // Tocar la tarjeta abre el detalle, con los mismos chips.
    await open.getByText("E2E Tipo").click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("E2E descripción del hallazgo").first(),
    ).toBeVisible();
    await expect(dialog.getByText("Vencido")).toBeVisible();
    await expect(dialog.getByText("Abierto").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("la acción principal abre su diálogo a pantalla completa (Iniciar y Cerrar)", async ({
    page,
  }) => {
    await openList(page, { asSupervisor: true });

    // Abierto: la principal es Iniciar; Cerrar queda en "Más acciones".
    await card(page, 9001).getByRole("button", { name: "Iniciar" }).click();
    const start = page.getByRole("dialog", { name: "Iniciar hallazgo #9001" });
    await expect(start).toBeVisible();
    expect((await start.boundingBox())?.width).toBe(390);
    await start.getByRole("button", { name: "Cerrar" }).click();
    await expect(start).toHaveCount(0);

    await card(page, 9001)
      .getByRole("button", { name: "Más acciones del hallazgo 9001" })
      .click();
    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "Cerrar hallazgo" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Reasignar" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // En progreso: la principal es Cerrar.
    await card(page, 9002).getByRole("button", { name: "Cerrar" }).click();
    const close = page.getByRole("dialog", { name: "Cerrar hallazgo #9002" });
    await expect(close).toBeVisible();
    expect((await close.boundingBox())?.width).toBe(390);
  });

  test("al cerrar con foto muestra el progreso de subida", async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    // Con la red interceptada el navegador no emite progreso de subida: se
    // simula un 40 % en cada envío con cuerpo (como lo reportaría la red).
    await page.addInitScript(() => {
      const send = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function (body) {
        send.call(this, body);
        if (body instanceof FormData) {
          setTimeout(() =>
            this.upload.dispatchEvent(
              new ProgressEvent("progress", {
                lengthComputable: true,
                loaded: 40,
                total: 100,
              }),
            ),
          );
        }
      };
    });
    await page.route("**/api/v1/evidences/solution/9002", async (route) => {
      await held;
      await route.fulfill({ status: 201, json: { id: 9002 } });
    });
    await openList(page, { asSupervisor: true });

    await card(page, 9002).getByRole("button", { name: "Cerrar" }).click();
    const dialog = page.getByRole("dialog", { name: "Cerrar hallazgo #9002" });
    await dialog.getByLabel("Tomar foto").setInputFiles({
      name: "solucion.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await dialog.getByRole("button", { name: "Guardar imagen" }).click();
    await confirmClose(page, 9002).click();

    await expect(dialog.getByText(/Subiendo foto… 40%/)).toBeVisible();
    release();
    await expect(toast(page, "Hallazgo cerrado correctamente")).toBeVisible();
  });
});
