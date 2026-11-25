// Versión del build en el menú del usuario. Los builds actuales la traen
// legible (fecha UTC + commit, "20261125-1432-abc1234", ver
// scripts/deploy-production.sh) y se muestra completa; los anteriores eran un
// UUID al azar y se mostraban sus primeros 8 caracteres.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const appVersionLabel = (version: string | undefined) =>
  !version ? "desarrollo" : UUID.test(version) ? version.slice(0, 8) : version;
