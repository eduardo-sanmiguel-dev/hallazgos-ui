This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Recarga automática por despliegues de UI y API

El layout recibe los eventos WebSocket `ui-version` y `api-version`.
Los cambios de UI se comparan contra el ID incorporado en su build. Los de
API se comparan contra la última versión recibida por cada pestaña, guardada
en `sessionStorage`. La primera conexión establece esa referencia; un nuevo
ID provoca una recarga completa, también tras recuperar una conexión perdida.
No hay consultas periódicas de versiones.

Antes de recargar se comprueba que `/api/deployment-version` responde. Para
un aviso de UI también debe coincidir con el build publicado. Si la UI aún
no está disponible, la referencia de API se conserva para reintentar al
reconectar. Sin almacenamiento disponible, se compara en memoria.

La API genera su ID automáticamente al ejecutar `pnpm build` y lo conserva
en `dist/deployment-version.json`. Reiniciar PM2 con el mismo build no cambia
ese ID. No se requieren cambios en los workflows ni en el script del VPS,
que ya ejecuta `pnpm build` antes de recargar PM2.

Para activar esta ampliación, desplegar primero la API y después la UI.
Las pestañas deben cargar esta nueva UI para empezar a detectar deploys de API.
Se conserva el aviso de UI existente para actualizar las pestañas anteriores.

Pruebas aisladas, sin API ni BD:
`pnpm exec playwright test -c playwright.deployment.config.ts`.
