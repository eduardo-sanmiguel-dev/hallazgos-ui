# Migración de Next.js a React + Vite+

Rama: `refactor/vite-plus-react-compiler`. Cambio local; no se ejecutó ningún despliegue.

## Alcance y conservación

Las 43 páginas de funcionalidades se mantienen en `app/features`, con sus URLs originales.
Se conservan los servicios HTTP, formularios, tablas, filtros, paginación, borradores,
permisos, exportaciones, firmas, cámara, calendario, mapas, gráficos, tema y experiencia móvil.
El acceso directo y la recarga de una URL funcionan mediante fallback del servidor estático.
React Router sustituye la navegación y el loader restaura la sesión antes de montar la página.
NestJS conserva la autenticación con cookies HttpOnly y la autorización.

Se sustituyeron las dependencias de Next (router, Link, Image, dynamic, proxy y metadata).
Las imágenes conservan la URL original, incluyendo blobs, data y recursos autenticados.
El arranque de OpenObserve ahora se importa explícitamente antes de montar React.
El manifest, favicon, privacidad, metadatos y actualización por WebSocket siguen presentes.
Se publica `deployment-version.json` y se mantiene el endpoint anterior para pestañas abiertas.

## Herramientas

Vite+ 1.4.0 incluye Vite 8.3.5, Rolldown 1.2.15 y Oxc 0.155.0.
React Compiler 1.0.0 usa su implementación estable en Babel mediante el plugin oficial de React.
No se habilita la implementación experimental en Rust del compilador de React.
Oxc procesa TypeScript/JSX y Rolldown empaqueta; Babel aplica React Compiler.
La configuración de build, formato, lint y pruebas se concentra en `vite.config.ts`.

El despachador nativo `vp` se bloqueó en esta máquina Windows/Node 26. Los comandos pnpm
usan un ejecutor Node que llama los binarios de las mismas dependencias incluidas en Vite+.
No se utiliza su caché de tareas. Este ejecutor también permite mantener comandos comunes en CI.

## Compatibilidad corregida

- Firma EPP: se reemplazó el recorte transitivo incompatible de trim-canvas por un recorte
  propio del canvas, conservando transparencia, margen y dimensiones máximas.
- Highcharts: se unificó la entrada del núcleo para evitar dos instancias y un fallo al
  inicializar las series bajo Rolldown. Se conservó la versión instalada en la línea base.
- Las pruebas esperan el montaje de la página después del loader de sesión; la sesión
  puede estar restaurada antes de terminar la carga diferida de la ruta.

## Producción y rollback

`pnpm build` valida dependencias y tipos antes de generar `dist` con ID de versión único.
Configurar `.env.production`: las variables públicas se insertan durante el build.
Los nombres NEXT_PUBLIC anteriores siguen aceptados como respaldo; no se incluyen variables
fuera de la lista pública. La clave pública del navegador no sustituye la autorización del API.

PM2 puede mantener `ui-comp` y el puerto 3000 usando `scripts/serve.mjs`.
Como alternativa, `deploy/nginx.conf.example` sirve el sitio estático directamente.
Antes del primer deploy hay que adaptar la invocación del script del VPS y verificar
que PM2 ejecute el servidor nuevo. Esta tarea no modificó el VPS ni la API.
El nuevo deploy construye `dist.next` antes de intercambiar los directorios.
Para revertir a Next se restaura el commit anterior, su lockfile, dependencias, build
`.next` y configuración PM2 anterior; no basta con renombrar un directorio `dist`.

## Verificación

La línea base anterior a la migración pasó sus 557 pruebas de Playwright.
Las pruebas unitarias originales mantienen sus aserciones y ahora corren con Vitest.
Se agregaron pruebas del servidor estático, recorte de firma y navegación SPA.
Las pruebas de navegador usan autenticación y lecturas reales de la API local de desarrollo;
las escrituras habituales están interceptadas para evitar modificar registros de negocio.

Resultados finales en esta máquina:

- 119 pruebas unitarias en 20 archivos: pasan.
- 449 pruebas de navegador sobre el build estático con API de desarrollo: pasan (4.2 min).
- Cobertura del código propio: 91.79% de sentencias, 86.18% de ramas,
  83.51% de funciones y 89.04% de líneas. No implica cubrir todos los casos posibles.
- Firma y entrega EPP real en móvil: POST 201, una entrega persistida, cierre y reapertura
  sin errores. El registro temporal se retiró del historial activo al terminar.
- Tipos con TypeScript 6 y TypeScript Go: pasan.
- Formato y Oxlint con tipos: sin errores, 86 advertencias de las reglas nuevas sobre
  efectos, promesas y accesibilidad. Se mantienen visibles como deuda; no se desactivaron
  reglas para ocultarlas ni se reescribió lógica de negocio solo para silenciarlas.
- Instalación offline con lockfile congelado: pasa sin modificar dependencias.
- Build final: 6.73 s de empaquetado (aproximadamente 9.5 s incluyendo los pasos previos).
  Es una medición local, no una promesa de tiempos en CI/VPS ni un benchmark comparativo.
- Comparación de los 164 archivos de módulos con main tras normalizar imports y formato:
  ninguno falta; solo DialogSignatureEpp y signatureImage cambian lógica, por el recorte.

Se conserva una advertencia de peers ya presente en la línea base: @highcharts/react 5.4.0
pide Highcharts >=13 y el lockfile usa Highcharts 12.6.2. No se mezcló una actualización
mayor de gráficos con esta migración; los escenarios de gráficos pasaron en Chrome.

El primer intento de navegador se usó para detectar carreras de sincronización e
incompatibilidades de integración. La ejecución final completa sobre el artefacto fue verde.
El build de prueba usó el entorno de desarrollo (API localhost:4000) y el mismo empaquetado
estático de producción. No se realizaron pruebas contra datos productivos.
