import { expect, test } from "vitest";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi } from "../src/index.js";

test("Instanciate with plugin", () => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

  const drupalkit = new EnhancedDrupalkit({
    baseUrl: "https://example.com",
  });

  expect(drupalkit.hasOwnProperty("jsonApi")).toBeTruthy();
});
