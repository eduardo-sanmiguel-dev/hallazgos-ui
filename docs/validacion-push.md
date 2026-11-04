# Validación de push y advertencias

E2E y cobertura usan el mismo build con entorno de desarrollo (`dist.e2e`) y un
servidor estático propio. El arranque de Vite, HMR y la terminal de desarrollo no
participan en las pruebas. La API local debe estar activa y el puerto 3000 libre.
El hook avisa si hay que detener `pnpm dev`; conserva todas sus validaciones.

El helper de login rellena el formulario antes de esperar la respuesta de la API.
Así el timeout de red no incluye cargar la UI. Una prueba unitaria verifica que el
listener se registra después de llenar los campos y antes de hacer clic.

Las advertencias se resolvieron con estado derivado para catálogos, parámetros de URL
y etiquetas; preferencias inicializadas una sola vez; reconciliación condicionada de
estado local al cambiar props; foco explícito y mensajes de estado nativos. Las promesas
se esperan o se marcan como segundo plano cuando su función ya gestiona los errores.

Se conservan tres excepciones locales de set-state-in-effect, cada una comentada y
limitada a su efecto: aplicar la respuesta del API al formulario padre sin sobrescribir
ediciones, adquirir/liberar object URLs de fotos y coordinar la carga cancelable de
Gemba Walk con su borrador. Mover esas operaciones a render produciría efectos laterales.
Las reglas permanecen activas para el resto del proyecto.

No se eliminaron pruebas de funcionalidades ni se relajaron sus aserciones.

## Verificación

- `pnpm lint --max-warnings=0`: sin advertencias ni errores.
- `pnpm check`: formato, lint y tipos aprobados.
- `pnpm test`: 123 pruebas unitarias aprobadas.
- `pnpm test:e2e`: 449 pruebas aprobadas.
- `pnpm test:e2e:coverage`: 449 pruebas aprobadas; 91.75% de sentencias y 86.06% de ramas.
- Tipos con TypeScript 6 y TypeScript Go aprobados; build de producción aprobado.

La ejecución E2E se realiza contra la API/base de desarrollo. No se modificaron datos productivos.

## Paralelismo local

El valor predeterminado es 15 workers, tanto para E2E como para cobertura.
`E2E_WORKERS` permite cambiarlo. Se prioriza el tiempo del push sobre el consumo
que afecta a otras aplicaciones, según la preferencia del usuario.

Medición local del 4 de noviembre de 2026, con API de desarrollo y 449 pruebas:

| Workers                             | Tiempo total | Resultado     |
| ----------------------------------- | ------------ | ------------- |
| 6 (medición previa)                 | 152.2 s      | 449 aprobadas |
| 15, servidor corregido, ejecución 1 | 109.6 s      | 449 aprobadas |
| 15, servidor corregido, ejecución 2 | 110.9 s      | 449 aprobadas |

Estas mediciones incluyen el arranque y build de E2E. Las dos ejecuciones con 15
workers redujeron el tiempo aproximadamente un 28% respecto a la medición previa;
no son una comparación controlada de consumo de recursos. No se modificaron
reintentos, timeouts ni aserciones. La captura del Administrador de tareas mostró
83% de RAM total del equipo; ese valor no corresponde exclusivamente a Playwright.

La primera ejecución con 15 expuso un error del servidor estático: al cancelarse
una descarga podía intentar enviar cabeceras por segunda vez y terminar el proceso.
Se corrigió el manejo de respuestas cerradas/iniciadas y se espera el pipeline.
Una prueba de regresión cancela 48 descargas concurrentes (gzip y sin comprimir)
y verifica que el servidor siga atendiendo. La prueba falla con el código anterior
y pasa con la corrección. La suite unitaria tiene ahora 124 pruebas.
