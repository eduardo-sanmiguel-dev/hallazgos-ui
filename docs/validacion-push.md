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
