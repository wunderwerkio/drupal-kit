import { defineConfig } from "vitest/config";

export function createVitestConfig() {
  return defineConfig({
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
      sequence: {
        concurrent: false,
      },
      snapshotFormat: {
        printBasicPrototype: false,
      },
    },
  });
}
