import test from "ava";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi } from "../src/index.js";

test("Instanciate with plugin", (t) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

  const drupalkit = new EnhancedDrupalkit({
    baseUrl: "https://example.com",
  });

  t.assert(drupalkit.hasOwnProperty("jsonApi"));
});
