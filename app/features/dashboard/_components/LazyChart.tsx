import { useEffect, useRef, useState, type ReactNode } from "react";

import { Skeleton } from "@mui/material";

/** Atributo del marcador: el PDF espera a que no quede ninguno (ver page.tsx). */
export const LAZY_CHART_PENDING = "[data-lazy-chart='pending']";

interface Props {
  children: ReactNode;
  /** Alto reservado mientras no se monta: evita que la página salte. */
  height: number;
  /** Montar ya (p. ej. para exportar el PDF con todas las gráficas). */
  force?: boolean;
}

/**
 * Monta la gráfica cuando se acerca a la pantalla (300 px antes) y ya no la
 * desmonta. Antes el dashboard dibujaba sus once gráficas de Highcharts a la
 * vez al cargar y con cada filtro: bloqueos de más de 1 s en celulares
 * (RUM). Los datos se siguen precargando todos juntos
 * (usePrefetchDashboardCharts), así que al llegar a la gráfica ya están.
 */
export default function LazyChart({ children, height, force = false }: Props) {
  const placeholder = useRef<HTMLSpanElement>(null);
  // Sin IntersectionObserver (navegadores muy viejos): se monta de una vez.
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  const mounted = near || force;

  useEffect(() => {
    const element = placeholder.current;
    if (mounted || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [mounted]);

  if (mounted) return children;

  return (
    <Skeleton
      ref={placeholder}
      variant="rounded"
      height={height}
      data-lazy-chart="pending"
      aria-label="Cargando gráfica…"
    />
  );
}
