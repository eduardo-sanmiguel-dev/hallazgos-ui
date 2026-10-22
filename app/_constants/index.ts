export const constants = {
  environments: {
    development: "development",
    production: "production",
  },
  rum: {
    // Nombre de acción (data-dd-action-name) de los clics que RUM descarta:
    // trazar una firma son muchos clics seguidos y contaban como rage click.
    ignoredClickName: "firma-trazo",
  },
  pagination: {
    defaultRowsPerPage: 10,
    rowsPerPageOptions: [10, 25, 50],
    // "Todos" (-1): solo en catálogos chicos; en listas de miles de
    // registros la consulta puede tardar mucho.
    allRows: -1,
  },
};
