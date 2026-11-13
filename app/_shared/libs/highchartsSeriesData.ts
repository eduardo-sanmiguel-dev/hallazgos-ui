// Parche para un bug de Highcharts (12.6 y 13.x): `Series.setData` borra
// `series.options.data` y, cuando logra actualizar los puntos existentes en
// sitio (mismo número de puntos, p. ej. al cambiar filtros), nunca lo vuelve a
// asignar. Después `Point.select` / `PiePoint.slice` escriben
// `series.options.data[i] = point.options` y truenan con
// "Cannot set properties of undefined (setting '0')" al hacer clic en un
// segmento de una dona con `allowPointSelect` (error de RUM en /dashboard).
// Aquí se reconstruye `options.data` con las opciones vigentes de los puntos.

interface PointLike {
  options?: unknown;
}

export interface SeriesLike {
  options: { data?: unknown[] };
  userOptions?: { data?: unknown[] };
  data?: Array<PointLike | null | undefined>;
}

interface HighchartsLike {
  Series: { prototype: object };
  wrap: (
    obj: object,
    method: string,
    func: (
      this: SeriesLike,
      proceed: (...args: unknown[]) => unknown,
      ...args: unknown[]
    ) => unknown,
  ) => void;
}

export const restoreSeriesDataOptions = (series: SeriesLike) => {
  if (series.options.data) return;

  const data = (series.data ?? []).map((point) => point?.options);
  series.options.data = data;
  if (series.userOptions) series.userOptions.data = data;
};

const PATCHED = Symbol.for("hallazgos.highcharts.seriesDataPatched");

export const patchSeriesSetData = (highcharts: HighchartsLike) => {
  const proto = highcharts.Series.prototype as Record<symbol, boolean>;
  if (proto[PATCHED]) return;
  proto[PATCHED] = true;

  highcharts.wrap(proto, "setData", function (proceed, ...args) {
    const result = proceed.apply(this, args);
    restoreSeriesDataOptions(this);
    return result;
  });
};
