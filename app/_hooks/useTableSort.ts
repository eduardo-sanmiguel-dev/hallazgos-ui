import { useState } from "react";

import {
  findSortOption,
  isSameSort,
  nextHeaderSort,
  parseSavedSort,
  sortStorageKey,
  type SortOption,
  type SortState,
} from "@shared/utils/tableSort";
import { trackSortChange } from "@shared/utils/rumActions";

/** Lo que reciben FilterBar (referencia y controles) y la tabla (encabezados). */
export interface TableSortControl<K extends string = string> {
  sort: SortState<K>;
  defaultSort: SortState<K>;
  options: readonly SortOption<K>[];
  isDefault: boolean;
  /** Elige columna y dirección (barra de filtros). */
  setSort: (next: SortState<K>) => void;
  /** Clic en el encabezado de una columna (ciclo de tres pasos). */
  toggleColumn: (key: K) => void;
  /** Vuelve al orden predeterminado del listado. */
  reset: () => void;
}

/**
 * Orden de una tabla. La API ordena (`orderBy` + `order`); aquí solo se
 * guarda la elección. Se recuerda durante la sesión del navegador por tabla:
 * al abrir un registro y volver, la lista sigue en el mismo orden.
 */
export function useTableSort<K extends string>(
  table: string,
  options: readonly SortOption<K>[],
  defaultSort: SortState<K>,
): TableSortControl<K> {
  const [sort, setSortState] = useState<SortState<K>>(() => {
    try {
      return parseSavedSort(sessionStorage.getItem(sortStorageKey(table)), options) ?? defaultSort;
    } catch {
      // Sin acceso a sessionStorage: orden predeterminado.
      return defaultSort;
    }
  });

  const setSort = (next: SortState<K>) => {
    if (!findSortOption(options, next.orderBy) || isSameSort(next, sort)) return;
    trackSortChange(table, sort, next);
    setSortState(next);
    try {
      if (isSameSort(next, defaultSort)) sessionStorage.removeItem(sortStorageKey(table));
      else sessionStorage.setItem(sortStorageKey(table), JSON.stringify(next));
    } catch {
      // Sin acceso a sessionStorage: la elección dura mientras siga la pantalla.
    }
  };

  return {
    sort,
    defaultSort,
    options,
    isDefault: isSameSort(sort, defaultSort),
    setSort,
    toggleColumn: (key: K) => {
      const option = findSortOption(options, key);
      if (option) setSort(nextHeaderSort(sort, key, option.kind, defaultSort));
    },
    reset: () => setSort(defaultSort),
  };
}
