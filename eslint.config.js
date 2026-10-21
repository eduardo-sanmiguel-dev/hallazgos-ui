const nextConfig = require("eslint-config-next");

// El parser de Babel que eslint-config-next usa para .js no es compatible con
// ESLint 10 (scopeManager.addGlobals); esos archivos se analizan con espree,
// el parser por defecto de ESLint.
const espree = require(
  require.resolve("espree", { paths: [require.resolve("eslint")] }),
);

module.exports = [
  ...nextConfig,
  {
    // Reportes que generan las pruebas e2e (traen JS minificado).
    ignores: ["coverage/**", "playwright-report/**", "test-results/**"],
  },
  {
    // eslint-plugin-react 7 no puede autodetectar la versión de React con
    // ESLint 10 (usa context.getFilename, que ya no existe); se fija aquí.
    settings: {
      react: { version: "19.3" },
    },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parser: espree,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];
