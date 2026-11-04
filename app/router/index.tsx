import type { ComponentType } from "react";
import { useEffect } from "react";
import { createBrowserRouter, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import MainLayout from "../features/layout";
import LoadingLinear from "@shared/components/LoadingLinear";
import { sessionLoader } from "./sessionLoader";
import RouteError from "./RouteError";

const pages = import.meta.glob<{ default: ComponentType }>("../features/**/page.tsx");
// Every existing feature URL is preserved, with one lazy module per page.
export const featureRoutes = Object.entries(pages).map(([file, load]) => ({
  path: file.replace("../features/", "").replace("/page.tsx", ""),
  lazy: async () => ({ Component: (await load()).default }),
}));

function RootRoute() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pathname === "/privacy" ? "Politica de privacidad | HADA" : "HADA";
  }, [pathname]);
  return (
    <>
      <Outlet />
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
      { index: true, lazy: async () => ({ Component: (await import("../page")).default }) },
      {
        path: "privacy",
        lazy: async () => ({ Component: (await import("../privacy/page")).default }),
      },
      {
        element: (
          <MainLayout>
            <Outlet />
          </MainLayout>
        ),
        children: featureRoutes,
      },
      { path: "*", lazy: async () => ({ Component: (await import("../not-found")).default }) },
    ],
  },
]);
