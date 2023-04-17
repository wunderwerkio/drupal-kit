/** @type {import("prettier").Config} */
module.exports = {
  arrowParens: "always",
  printWidth: 80,
  singleQuote: false,
  jsxSingleQuote: false,
  semi: true,
  trailingComma: "all",
  tabWidth: 2,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
  ],
  "pluginSearchDirs": false,
  importOrder: [
    "^(jest-fetch-mock)$",
    "<THIRD_PARTY_MODULES>",
    "^@drupal-kit/(.*)$",
    "",
    "^~/utils/(.*)$",
    "^~/(.*)$",
    "^[./]",
  ],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  importOrderBuiltinModulesToTop: true,
  importOrderParserPlugins: ["decorators-legacy", "importAssertions", "typescript"],
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,
};
