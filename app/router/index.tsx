import type { ComponentType } from "react";
import { useEffect } from "react";
import { createBrowserRouter, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import MainLayout from "../features/layout";
import LoadingLinear from "@shared/components/LoadingLinear";
import CookieNotice from "@shared/components/CookieNotice";
import SlowNavigationNotice from "@shared/components/SlowNavigationNotice";
import { sessionLoader } from "./sessionLoader";
import RouteError from "./RouteError";
import { importWithRetry } from "@shared/utils/moduleRetry";

// Con señal débil una descarga puede fallar: se reintenta antes de mostrar
// el error (ver moduleRetry).
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await importWithRetry(load)).default,
});

const pages = import.meta.glob<{ default: ComponentType }>("../features/**/page.tsx");
// Every existing feature URL is preserved, with one lazy module per page.
export const featureRoutes = Object.entries(pages).map(([file, load]) => ({
  path: file.replace("../features/", "").replace("/page.tsx", ""),
  lazy: lazyPage(load),
}));

// Páginas públicas con título propio en la pestaña.
const publicPageTitles: Record<string, string> = {
  "/privacy": "Política de privacidad | HADA",
  "/terms": "Términos y condiciones | HADA",
  "/unsubscribe": "Avisos por correo | HADA",
};

function RootRoute() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = publicPageTitles[pathname] ?? "HADA";
  }, [pathname]);
  return (
    <>
      <Outlet />
      <CookieNotice />
      <SlowNavigationNotice />
      <ScrollRestoration />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRoute,
    loader: sessionLoader,
    shouldRevalidate: ({ currentUrl, nextUrl }) =>
      currentUrl.pathname !== nextUrl.pathname ||
      currentUrl.searchParams.get("token") !== nextUrl.searchParams.get("token"),
    errorElement: <RouteError />,
    hydrateFallbackElement: <LoadingLinear />,
    children: [
      { index: true, lazy: lazyPage(() => import("../page")) },
      {
        path: "privacy",
        lazy: lazyPage(() => import("../privacy/page")),
      },
      {
        path: "terms",
        lazy: lazyPage(() => import("../terms/page")),
      },
      {
        // Enlace de baja de los correos: público, el token identifica al usuario.
        path: "unsubscribe",
        lazy: lazyPage(() => import("../unsubscribe/page")),
      },
      {
        element: (
          <MainLayout>
            <Outlet />
          </MainLayout>
        ),
        children: featureRoutes,
      },
      { path: "*", lazy: lazyPage(() => import("../not-found")) },
    ],
  },
]);
