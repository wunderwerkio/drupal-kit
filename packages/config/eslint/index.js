module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["@wunderwerk/eslint-config/typescript"],
  rules: {
    "new-cap": "off",
    "jsdoc/tag-lines": [
      "error" | "warn",
      "never",
      { tags: { param: { lines: "always" } } },
    ],
  },
};
