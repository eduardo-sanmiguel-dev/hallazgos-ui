import type { BiEppOutOfRangeRow } from "@interfaces";

export interface EmployeeRanking {
  employeeId: number;
  name: string;
  code: string | null;
  area: string | null;
  position: string | null;
  outOfRange: number;
  deliveries: number;
  // Porcentaje de sus entregas que fueron fuera de rango.
  percent: number;
  // Equipos que pide fuera de rango, de más a menos.
  equipments: { name: string; count: number }[];
  // Días promedio antes de tiempo (ponderado por entregas); null si no se
  // conoce (p. ej. sin entrega anterior registrada).
  averageDaysEarly: number | null;
  lastDelivery: string;
}

/**
 * Ranking de colaboradores por entregas fuera de rango. Con `equipmentId`
 * solo cuenta ese equipo (¿a quién se le entrega fuera de rango?).
 */
export const rankEmployees = (
  rows: BiEppOutOfRangeRow[],
  equipmentId: number | null = null,
): EmployeeRanking[] => {
  const byEmployee = new Map<number, BiEppOutOfRangeRow[]>();
  for (const row of rows) {
    if (equipmentId !== null && row.equipmentId !== equipmentId) continue;
    byEmployee.set(row.employeeId, [
      ...(byEmployee.get(row.employeeId) ?? []),
      row,
    ]);
  }

  const ranking: EmployeeRanking[] = [];
  for (const [employeeId, items] of byEmployee) {
    const outOfRange = items.reduce((total, row) => total + row.outOfRange, 0);
    if (!outOfRange) continue;

    const deliveries = items.reduce((total, row) => total + row.deliveries, 0);
    const known = items.filter(
      (row) => row.outOfRange && row.averageDaysEarly !== null,
    );
    const knownWeight = known.reduce((total, row) => total + row.outOfRange, 0);
    const [first] = items;

    ranking.push({
      employeeId,
      name: first.name,
      code: first.code,
      area: first.area,
      position: first.position,
      outOfRange,
      deliveries,
      percent: (outOfRange * 100) / deliveries,
      equipments: items
        .filter((row) => row.outOfRange)
        .map((row) => ({ name: row.equipmentName, count: row.outOfRange }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      averageDaysEarly: knownWeight
        ? Math.round(
            known.reduce(
              (total, row) => total + row.averageDaysEarly! * row.outOfRange,
              0,
            ) / knownWeight,
          )
        : null,
      lastDelivery: items
        .map((row) => row.lastDelivery)
        .sort()
        .at(-1)!,
    });
  }

  return ranking.sort(
    (a, b) =>
      b.outOfRange - a.outOfRange ||
      b.percent - a.percent ||
      a.name.localeCompare(b.name),
  );
};

/** Búsqueda por nombre o cédula, sin acentos ni mayúsculas. */
export const matchesEmployee = (employee: EmployeeRanking, search: string) => {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const term = normalize(search.trim());
  return (
    !term ||
    normalize(employee.name).includes(term) ||
    (employee.code ?? "").includes(term)
  );
};
