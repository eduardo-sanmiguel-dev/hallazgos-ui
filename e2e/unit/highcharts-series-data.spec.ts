import { describe, expect, test } from "vite-plus/test";

import {
  patchSeriesSetData,
  restoreSeriesDataOptions,
  type SeriesLike,
} from "../../app/_shared/libs/highchartsSeriesData";

// Bug de Highcharts: `setData` borra `options.data` y, si actualiza los puntos
// en sitio, no lo reasigna; al seleccionar un segmento de la dona
// (`options.data[i] = point.options`) truena "Cannot set properties of
// undefined (setting '0')" en /dashboard.

// Reproduce lo que hace Highcharts 12.6 al actualizar en sitio.
class FakeSeries implements SeriesLike {
  options: { data?: unknown[] } = {};
  userOptions: { data?: unknown[] } = {};
  data: Array<{ options: unknown }> = [];

  constructor(initial: unknown[]) {
    this.options.data = this.userOptions.data = initial;
    this.data = initial.map((options) => ({ options }));
  }

  setData(data: unknown[]) {
    delete this.options.data;
    delete this.userOptions.data;
    if (data.length === this.data.length) {
      data.forEach((options, i) => (this.data[i] = { options }));
      return;
    }
    this.data = data.map((options) => ({ options }));
    this.options.data = this.userOptions.data = data;
  }

  select(i: number) {
    (this.options.data as unknown[])[i] = this.data[i].options;
  }
}

// Cada instancia usa su propia subclase para que el parche no se comparta.
const fakeHighcharts = () => ({
  Series: class extends FakeSeries {},
  wrap: (
    obj: object,
    method: string,
    func: (this: SeriesLike, proceed: (...a: unknown[]) => unknown, ...a: unknown[]) => unknown,
  ) => {
    const target = obj as Record<string, (...a: unknown[]) => unknown>;
    const proceed = target[method];
    target[method] = function (this: SeriesLike, ...args: unknown[]) {
      return func.call(this, proceed, ...args);
    };
  },
});

describe("restoreSeriesDataOptions", () => {
  test("reconstruye options.data con las opciones de los puntos", () => {
    const series: SeriesLike = {
      options: {},
      userOptions: {},
      data: [{ options: { name: "Abierto", y: 3 } }, null],
    };

    restoreSeriesDataOptions(series);

    expect(series.options.data).toEqual([{ name: "Abierto", y: 3 }, undefined]);
    expect(series.userOptions?.data).toBe(series.options.data);
  });

  test("no toca options.data si ya existe", () => {
    const data = [{ y: 1 }];
    const series: SeriesLike = { options: { data }, data: [{ options: { y: 9 } }] };

    restoreSeriesDataOptions(series);

    expect(series.options.data).toBe(data);
  });
});

describe("patchSeriesSetData", () => {
  test("sin parche, seleccionar tras actualizar en sitio truena", () => {
    const series = new FakeSeries([{ y: 1 }, { y: 2 }]);
    series.setData([{ y: 3 }, { y: 4 }]);

    expect(() => series.select(0)).toThrow(TypeError);
  });

  test("con parche, seleccionar tras actualizar en sitio funciona", () => {
    const hc = fakeHighcharts();
    patchSeriesSetData(hc);
    const series = new hc.Series([{ y: 1 }, { y: 2 }]);

    series.setData([{ y: 3 }, { y: 4 }]);

    expect(() => series.select(1)).not.toThrow();
    expect(series.options.data).toEqual([{ y: 3 }, { y: 4 }]);
  });

  test("se aplica una sola vez aunque se llame varias veces", () => {
    const base = fakeHighcharts();
    let wraps = 0;
    const hc = {
      ...base,
      wrap: (...args: Parameters<typeof base.wrap>) => {
        wraps++;
        base.wrap(...args);
      },
    };

    patchSeriesSetData(hc);
    patchSeriesSetData(hc);

    expect(wraps).toBe(1);
  });
});
