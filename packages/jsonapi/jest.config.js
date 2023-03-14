/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Node modules that are ECMA-Modules need to be transformed to work with ts-jest.
  transformIgnorePatterns: [
    ".*/node_modules/.pnpm/(?!(before-after-hook|data-uri-to-buffer|node-fetch|fetch-blob|formdata-polyfill|ts-results))",
  ],
  transform: {
    "^.+\\.m?[tj]sx?$": ["ts-jest"],
  },
};
