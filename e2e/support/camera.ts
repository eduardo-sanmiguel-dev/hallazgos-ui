import type { Page } from "@playwright/test";
import QRCode from "qrcode";

/**
 * Sustituye la cámara del navegador: `qr` la hace "ver" ese QR (dibujado en
 * un canvas, lo lee jsQR como en un equipo real); `error` hace que
 * getUserMedia falle con ese nombre de DOMException; "unsupported" simula un
 * navegador sin getUserMedia. Debe llamarse antes de page.goto.
 */
export const fakeCamera = async (
  page: Page,
  options: { qr: string } | { error: string },
) => {
  const qr =
    "qr" in options
      ? (() => {
          const { modules } = QRCode.create(options.qr, {
            errorCorrectionLevel: "M",
          });
          return { size: modules.size, data: Array.from(modules.data) };
        })()
      : null;
  const error = "error" in options ? options.error : null;

  await page.addInitScript(
    ({ qr, error }) => {
      if (error === "unsupported") {
        Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
          value: undefined,
        });
        return;
      }

      navigator.mediaDevices.getUserMedia = async () => {
        if (error) throw new DOMException("Cámara simulada", error);
        if (!qr) throw new Error("Sin QR");

        const scale = 8;
        const margin = 4;
        const side = (qr.size + margin * 2) * scale;
        const canvas = document.createElement("canvas");
        canvas.width = side;
        canvas.height = side;
        const context = canvas.getContext("2d")!;
        const draw = () => {
          context.fillStyle = "#fff";
          context.fillRect(0, 0, side, side);
          context.fillStyle = "#000";
          qr.data.forEach((dark, index) => {
            if (!dark) return;
            const x = (margin + (index % qr.size)) * scale;
            const y = (margin + Math.floor(index / qr.size)) * scale;
            context.fillRect(x, y, scale, scale);
          });
        };
        draw();
        // captureStream solo emite cuadros cuando el canvas cambia.
        setInterval(draw, 100);
        return canvas.captureStream(10);
      };
    },
    { qr, error },
  );
};
