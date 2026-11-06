# Acciones de UI y RUM

Se revisaron los listados, formularios y diálogos de las 43 rutas de módulos,
además del acceso, navegación, tablas, filtros, fotos y borradores compartidos.

| Flujo                                   | Ambigüedad encontrada                                       | Resultado                                                                                               |
| --------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| EPP                                     | Dos botones Guardar: firma y entrega                        | Guardar firma / Guardar entrega; Agregar equipo / Firmar entrega                                        |
| Listados                                | Crear y Crear registro sin entidad                          | Crear hallazgo, Crear ICS, Crear colaborador, Registrar entrega, etc.                                   |
| Formularios de catálogos y negocio      | Guardar genérico                                            | Guardar en catálogos; Guardar reporte / Guardar inspección en flujos de negocio. Nombre completo en RUM |
| Hallazgos                               | Guardar imagen para inicio y cierre; Guardar para reasignar | Guardar inicio / Guardar cierre / Guardar responsables. Detalle completo en RUM                         |
| Gemba Walk                              | Agregar, Aplicar y Quitar en programación                   | Agregar recorrido / Aplicar cambios / Quitar recorrido. Detalle completo en RUM                         |
| Borradores                              | Recuperar y Descartar sin distinguir envío pendiente        | Recuperar borrador / Descartar borrador / Descartar envío pendiente                                     |
| Filtros                                 | Nombre de acción mezclado con contadores y valores          | Mostrar filtros / Ocultar filtros / Quitar filtro: campo / Restablecer todos los filtros                |
| Confirmaciones                          | Confirmar y Cancelar sin la operación                       | Confirmar: operación / Cancelar confirmación: operación                                                 |
| Tablas, navegación, dashboard, BI y HDS | Nombres de controles válidos pero sin módulo                | Se conserva la acción y se añade su módulo de origen                                                    |

## Convención

Las interacciones automáticas usan `Módulo · Contexto opcional · Acción`:

- `EPP · Firma de entrega · Guardar firma`
- `EPP · Entrega de equipos · Guardar entrega de EPP`
- `Hallazgos · Cierre de hallazgo · Guardar cierre del hallazgo`
- `Colaboradores · Crear colaborador`

El módulo se obtiene de la URL de la vista del evento, no de la página que
esté abierta cuando termina de enviarse. Los diálogos con varios pasos declaran
`data-rum-scope`; los botones cuyo nombre debe ser estable usan
`data-dd-action-name`. `FormActions` exige un `saveActionName` específico para
RUM. Su `saveLabel` visible es independiente y por defecto dice Guardar:
en un formulario de catálogo el encabezado ya identifica la entidad.

Los textos visibles se mantienen breves: Guardar firma / Guardar entrega,
Crear hallazgo, Crear ICS, Crear concepto y Aplicar cambios. El nombre de RUM
conserva la operación completa, incluso si el botón omite contexto repetido.

Las filas, tarjetas y planos interactivos declaran `data-rum-action`. Se
nombra el clic sobre esa zona sin reemplazar la acción de sus botones internos.

Los clics sobre espacios sin controles se descartan. Los clics muertos o
repetidos sobre controles se conservan para diagnosticar frustración; los
trazos de firma siguen excluidos. No se desactiva el seguimiento de errores,
recursos ni rendimiento. La instrumentación sigue deshabilitada en local.

## Resultado del sistema

Las respuestas a escrituras generan una acción independiente del clic:
`Módulo · Operación · Confirmado por servidor` o `Intento fallido`.
Incluyen `ui_module`, `operation`, `result`, `http_status` si hay respuesta y
`replayed` para respuestas idempotentes. Un timeout indica intento fallido,
sin afirmar que el servidor no guardó; un reintento puede confirmar después.
Las respuestas "envío en proceso" y cancelaciones de peticiones no generan
fallos adicionales. Las consultas GET siguen siendo recursos de RUM.

Estos eventos no copian cuerpos de peticiones, fotos, firmas, contraseñas ni
valores de formularios. Sus nombres se construyen con módulos y operaciones
fijos. Un fallo de telemetría no interrumpe la acción del usuario.

La firma se prepara en el formulario: Guardar firma no equivale a persistir
la entrega. Solo la respuesta de la API confirma el registro de EPP.

Los nuevos nombres se verán después de desplegar esta UI; las sesiones ya
registradas conservan sus etiquetas anteriores.
