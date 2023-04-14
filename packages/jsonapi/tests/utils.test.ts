import test from "ava";

import { isJsonApiRequest } from "../src/utils.js";

test("Check if JSON:API request", (t) => {
  t.falsy(
    isJsonApiRequest({
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }),
  );

  t.truthy(
    isJsonApiRequest({
      method: "GET",
      headers: {
        "Content-type": "application/vnd.api+json",
      },
    }),
  );
});
