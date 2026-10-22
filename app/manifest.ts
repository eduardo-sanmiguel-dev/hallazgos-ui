import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Barras del sistema al abrir la app (antes de cargar el tema elegido):
    // blanco como el splash y el login. Con verde, Android ponía los botones
    // de navegación en claro y se perdían sobre el fondo blanco. Después lo
    // ajusta al tema el <meta name="theme-color"> de app/(routes)/layout.tsx.
    theme_color: "#ffffff",
    // Fondo del splash de Android: blanco como los íconos y el login, para
    // que la transición al abrir la app no muestre recuadros ni saltos.
    background_color: "#ffffff",
    display: "standalone",
    scope: "/",
    start_url: "/",
    name: "ComportArte",
    // Texto bajo el ícono en la pantalla de inicio (cabe completo).
    short_name: "ComportArte",
    description:
      "Registro y seguimiento de hallazgos de seguridad, EPP, Gemba Walk e inspecciones de Hada International.",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      // Con más margen: Android los recorta en círculo u otras formas sin
      // cortar el logo.
      {
        src: "/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
