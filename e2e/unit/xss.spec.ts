import { describe, expect, test } from "vite-plus/test";

import { qrPrintItem } from "../../app/features/emergency-teams/_components/qrPrint";
import { escapeHtml, safeExternalUrl } from "../../app/_shared/utils/escapeHtml";
import { buildCsp, securityHeaders } from "../../scripts/csp.mjs";

// Protección contra XSS: lo que la app arma como HTML en un string se
// escapa, los enlaces externos solo son http(s), y la CSP impide ejecutar
// cualquier script que no sea de la app.

const ATTACK = `<img src=x onerror="alert(document.cookie)">'`;

describe("escapeHtml", () => {
  test("neutraliza etiquetas, atributos y comillas", () => {
    expect(escapeHtml(ATTACK)).toBe(
      "&lt;img src=x onerror=&quot;alert(document.cookie)&quot;&gt;&#39;",
    );
  });

  test("acepta números y vacíos", () => {
    expect(escapeHtml(6)).toBe("6");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });
});

describe("safeExternalUrl", () => {
  test.each([
    ["https://maps.google.com/?q=1,2", "https://maps.google.com/?q=1,2"],
    ["http://example.com", "http://example.com/"],
    ["maps.google.com/?q=1,2", "https://maps.google.com/?q=1,2"],
  ])("%s → %s", (input, expected) => {
    expect(safeExternalUrl(input)).toBe(expected);
  });

  test.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "",
    null,
  ])("rechaza %s", (input) => {
    expect(safeExternalUrl(input)).toBeNull();
  });
});

describe("Hoja de impresión de QR (document.write)", () => {
  const row = {
    id: 7,
    extinguisherNumber: ATTACK,
    location: `</div><script>alert(1)</script>`,
    typeOfExtinguisher: ATTACK as never,
    capacity: 6,
    generatedQrCode: "data:image/png;base64,iVBORw0KGgo=",
  };

  test("lo capturado por usuarios no puede crear etiquetas ni atributos", () => {
    const html = qrPrintItem(row);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toMatch(/onerror="/);
    expect(html).toContain("&lt;/div&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    // Solo un <img>: el del QR.
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).toContain('<img src="data:image/png;base64,iVBORw0KGgo="');
  });

  test("el QR solo se acepta como data URL PNG", () => {
    const html = qrPrintItem({ ...row, generatedQrCode: 'x" onerror="alert(1)' });
    expect(html).toContain('<img src=""');
  });

  test("los campos vacíos se ven como guion", () => {
    const html = qrPrintItem({ ...row, extinguisherNumber: "", location: "" });
    expect(html).toContain("<strong>Ubicación:</strong> -");
    expect(html).toContain("<strong>No. Extintor:</strong> -");
  });
});

describe("Política de seguridad de contenido (CSP)", () => {
  const csp = buildCsp({
    apiUrl: "https://api.comportarte.com/api/v1",
    apiOrigin: "https://api.comportarte.com",
    openObserveSite: "logs.comportarte.com",
  });
  const directive = (name: string) =>
    csp
      .split("; ")
      .find((part) => part.startsWith(`${name} `))
      ?.slice(name.length + 1)
      .split(" ");

  test("solo ejecuta scripts de la app: nada en línea, eval ni terceros", () => {
    expect(directive("script-src")).toEqual(["'self'"]);
    expect(directive("object-src")).toEqual(["'none'"]);
    expect(directive("base-uri")).toEqual(["'none'"]);
  });

  test("no se puede incrustar en otro sitio", () => {
    expect(directive("frame-ancestors")).toEqual(["'none'"]);
    expect(securityHeaders({})["X-Frame-Options"]).toBe("DENY");
  });

  test("las URL con token no se envían completas a otros sitios", () => {
    expect(securityHeaders({})["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("solo la cámara está disponible; micrófono, ubicación y demás, bloqueados", () => {
    const policy = securityHeaders({})["Permissions-Policy"];
    expect(policy).toContain("camera=(self)");
    for (const blocked of ["microphone=()", "geolocation=()", "payment=()", "usb=()"])
      expect(policy).toContain(blocked);
  });

  test("HSTS: solo HTTPS durante un año, sin obligar a los subdominios", () => {
    expect(securityHeaders({})["Strict-Transport-Security"]).toBe("max-age=31536000");
  });

  test("permite la API (HTTP y WebSocket), sus imágenes y el monitoreo", () => {
    expect(directive("connect-src")).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://api.comportarte.com",
      "wss://api.comportarte.com",
      "https://logs.comportarte.com",
    ]);
    expect(directive("img-src")).toContain("https://api.comportarte.com");
  });

  test("en desarrollo usa la API local y sin monitoreo", () => {
    const dev = buildCsp({
      apiUrl: "http://localhost:4000/api/v1",
      apiOrigin: "http://localhost:4000",
    });
    expect(dev).toContain(
      "connect-src 'self' data: blob: http://localhost:4000 ws://localhost:4000;",
    );
  });

  test("ignora valores que no son URL http(s)", () => {
    const odd = buildCsp({ apiUrl: "javascript:alert(1)", apiOrigin: "no es url" });
    expect(odd).toContain("connect-src 'self' data: blob:;");
  });
});
